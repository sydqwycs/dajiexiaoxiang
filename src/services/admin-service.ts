import { Database } from '../db';
import { Poll, CreatePollRequest, UpdatePollRequest, PollRow } from '../types';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export class AdminService {
  constructor(private db: Database) {}

  async authenticateAdmin(password: string): Promise<string> {
    // 使用 SHA-256 哈希密码
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const storedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!storedHash) {
      throw new Error('Admin password hash not configured');
    }

    if (hash !== storedHash) {
      throw new Error('Invalid password');
    }

    // 生成 JWT 令牌（24小时有效期）
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const token = jwt.sign(
      { role: 'admin' },
      secret,
      { expiresIn: '24h' }
    );

    return token;
  }

  async createPoll(data: CreatePollRequest): Promise<Poll> {
    // 验证输入
    this.validatePollData(data);

    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      // 创建投票
      const pollResult = await client.query<PollRow>(
        `INSERT INTO polls (title, deadline, status) 
         VALUES ($1, $2, 'active') 
         RETURNING *`,
        [data.title, data.deadline]
      );

      const poll = pollResult.rows[0];

      // 创建选项
      for (let i = 0; i < data.options.length; i++) {
        await client.query(
          `INSERT INTO vote_options (poll_id, option_text, display_order) 
           VALUES ($1, $2, $3)`,
          [poll.id, data.options[i], i + 1]
        );
      }

      await client.query('COMMIT');

      return {
        id: poll.id,
        title: poll.title,
        deadline: new Date(poll.deadline),
        status: poll.status as 'active' | 'closed',
        createdAt: new Date(poll.created_at),
        updatedAt: new Date(poll.updated_at)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePoll(pollId: string, data: UpdatePollRequest): Promise<Poll> {
    // 验证输入（使用与创建相同的规则）
    if (data.title !== undefined || data.deadline !== undefined || data.options !== undefined) {
      const fullData = {
        title: data.title || '',
        deadline: data.deadline || new Date().toISOString(),
        options: data.options?.map(o => o.text) || []
      };
      this.validatePollData(fullData);
    }

    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      // 更新投票基本信息
      if (data.title || data.deadline) {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.title) {
          updates.push(`title = $${paramIndex++}`);
          values.push(data.title);
        }

        if (data.deadline) {
          updates.push(`deadline = $${paramIndex++}`);
          values.push(data.deadline);
        }

        updates.push(`updated_at = NOW()`);
        values.push(pollId);

        await client.query(
          `UPDATE polls SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      // 更新选项（如果提供）
      if (data.options && data.options.length > 0) {
        // 删除旧选项
        await client.query('DELETE FROM vote_options WHERE poll_id = $1', [pollId]);

        // 插入新选项
        for (const option of data.options) {
          await client.query(
            `INSERT INTO vote_options (poll_id, option_text, display_order) 
             VALUES ($1, $2, $3)`,
            [pollId, option.text, option.order]
          );
        }
      }

      await client.query('COMMIT');

      // 获取更新后的投票
      const result = await this.db.query<PollRow>(
        'SELECT * FROM polls WHERE id = $1',
        [pollId]
      );

      const poll = result.rows[0];
      return {
        id: poll.id,
        title: poll.title,
        deadline: new Date(poll.deadline),
        status: poll.status as 'active' | 'closed',
        createdAt: new Date(poll.created_at),
        updatedAt: new Date(poll.updated_at)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deletePoll(pollId: string): Promise<void> {
    // CASCADE 会自动删除相关的 options 和 votes
    await this.db.query('DELETE FROM polls WHERE id = $1', [pollId]);
  }

  async getAllPolls(): Promise<Poll[]> {
    const result = await this.db.query<PollRow>(
      'SELECT * FROM polls ORDER BY created_at DESC'
    );

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      deadline: new Date(row.deadline),
      status: row.status as 'active' | 'closed',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private validatePollData(data: CreatePollRequest): void {
    // 标题不能为空
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    // 至少需要 2 个选项
    if (!data.options || data.options.length < 2) {
      throw new Error('At least 2 options are required');
    }

    // 所有选项文本不能为空
    for (const option of data.options) {
      if (!option || option.trim().length === 0) {
        throw new Error('Option text cannot be empty');
      }
    }

    // 截止时间必须在未来
    const deadline = new Date(data.deadline);
    if (deadline <= new Date()) {
      throw new Error('Deadline must be in the future');
    }
  }
}
