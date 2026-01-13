import { Database } from '../db';
import { Poll, Option, PollResults, PollRow, OptionRow } from '../types';

export class VotingService {
  constructor(private db: Database) {}

  async getActivePoll(): Promise<Poll | null> {
    const result = await this.db.query<PollRow>(
      `SELECT * FROM polls 
       WHERE status = 'active' AND deadline > NOW() 
       ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    const pollRow = result.rows[0];
    const options = await this.getPollOptions(pollRow.id);

    return this.mapPollRowToPoll(pollRow, options);
  }

  async getPollResults(pollId: string): Promise<PollResults> {
    const pollResult = await this.db.query<PollRow>(
      'SELECT * FROM polls WHERE id = $1',
      [pollId]
    );

    if (pollResult.rows.length === 0) {
      throw new Error('Poll not found');
    }

    const poll = this.mapPollRowToPoll(pollResult.rows[0]);
    const options = await this.getPollOptionsWithVotes(pollId);
    const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

    // 计算百分比
    options.forEach(opt => {
      opt.percentage = totalVotes > 0 ? Math.round((opt.voteCount || 0) / totalVotes * 100) : 0;
    });

    return { poll, options, totalVotes };
  }

  async getHistoricalPolls(): Promise<Poll[]> {
    const result = await this.db.query<PollRow>(
      `SELECT * FROM polls 
       WHERE status = 'closed' OR deadline < NOW()
       ORDER BY created_at DESC`
    );

    const polls: Poll[] = [];
    for (const row of result.rows) {
      const options = await this.getPollOptionsWithVotes(row.id);
      polls.push(this.mapPollRowToPoll(row, options));
    }

    return polls;
  }

  async submitVote(pollId: string, optionId: string, ipAddress: string): Promise<void> {
    // 检查投票是否存在且活跃
    const pollResult = await this.db.query<PollRow>(
      'SELECT * FROM polls WHERE id = $1',
      [pollId]
    );

    if (pollResult.rows.length === 0) {
      throw new Error('Poll not found');
    }

    const poll = pollResult.rows[0];

    // 检查状态
    if (poll.status !== 'active') {
      throw new Error('Poll is not active');
    }

    // 检查截止时间
    if (new Date(poll.deadline) < new Date()) {
      throw new Error('Poll has expired');
    }

    // 检查 IP 是否已投票
    const hasVoted = await this.hasUserVoted(pollId, ipAddress);
    if (hasVoted) {
      throw new Error('IP address has already voted');
    }

    // 记录投票
    await this.db.query(
      'INSERT INTO votes (poll_id, option_id, ip_address) VALUES ($1, $2, $3)',
      [pollId, optionId, ipAddress]
    );
  }

  async hasUserVoted(pollId: string, ipAddress: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT id FROM votes WHERE poll_id = $1 AND ip_address = $2',
      [pollId, ipAddress]
    );

    return result.rows.length > 0;
  }

  private async getPollOptions(pollId: string): Promise<Option[]> {
    const result = await this.db.query<OptionRow>(
      'SELECT * FROM vote_options WHERE poll_id = $1 ORDER BY display_order',
      [pollId]
    );

    return result.rows.map(row => ({
      id: row.id,
      pollId: row.poll_id,
      optionText: row.option_text,
      displayOrder: row.display_order
    }));
  }

  private async getPollOptionsWithVotes(pollId: string): Promise<Option[]> {
    const result = await this.db.query<OptionRow & { vote_count: string }>(
      `SELECT vo.*, COUNT(v.id)::text as vote_count
       FROM vote_options vo
       LEFT JOIN votes v ON vo.id = v.option_id
       WHERE vo.poll_id = $1
       GROUP BY vo.id
       ORDER BY vo.display_order`,
      [pollId]
    );

    return result.rows.map(row => ({
      id: row.id,
      pollId: row.poll_id,
      optionText: row.option_text,
      displayOrder: row.display_order,
      voteCount: parseInt(row.vote_count || '0', 10)
    }));
  }

  private mapPollRowToPoll(row: PollRow, options?: Option[]): Poll {
    return {
      id: row.id,
      title: row.title,
      deadline: new Date(row.deadline),
      status: row.status as 'active' | 'closed',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      options
    };
  }
}
