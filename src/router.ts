import { Express, Request, Response } from 'express';
import { VotingService } from './services/voting-service';
import { AdminService } from './services/admin-service';
import { verifyToken } from './middleware/auth';
import { extractIP } from './utils/ip-extractor';
import { getUserPageHTML, getUserPageJS, getAdminPageHTML, getAdminPageJS } from './static-content';

export function setupRoutes(
  app: Express,
  votingService: VotingService,
  adminService: AdminService
): void {
  // ============ 用户端路由 ============
  
  // 首页
  app.get('/', (_req: Request, res: Response) => {
    res.send(getUserPageHTML());
  });

  // 用户端 JavaScript
  app.get('/app.js', (_req: Request, res: Response) => {
    res.type('application/javascript').send(getUserPageJS());
  });

  // 获取当前活跃选择
  app.get('/api/polls/active', async (_req: Request, res: Response) => {
    try {
      const poll = await votingService.getActivePoll();
      res.json(poll);
    } catch (error) {
      console.error('Error getting active poll:', error);
      res.status(500).json({ error: 'ServerError', message: '获取选择失败' });
    }
  });

  // 提交投票
  app.post('/api/votes', async (req: Request, res: Response) => {
    try {
      const { pollId, optionId } = req.body;
      const ipAddress = extractIP(req);

      await votingService.submitVote(pollId, optionId, ipAddress);
      res.json({ success: true, message: '投票成功' });
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      
      if (error.message.includes('already voted')) {
        res.status(403).json({ error: 'AlreadyVoted', message: '您已经投过票了' });
      } else if (error.message.includes('expired')) {
        res.status(403).json({ error: 'PollExpired', message: '投票已截止' });
      } else if (error.message.includes('not active')) {
        res.status(403).json({ error: 'PollNotActive', message: '投票未激活' });
      } else {
        res.status(500).json({ error: 'ServerError', message: '投票失败' });
      }
    }
  });

  // 获取选择结果
  app.get('/api/polls/:pollId/results', async (req: Request, res: Response) => {
    try {
      const results = await votingService.getPollResults(req.params.pollId);
      res.json(results);
    } catch (error: any) {
      console.error('Error getting poll results:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: '选择不存在' });
      } else {
        res.status(500).json({ error: 'ServerError', message: '获取结果失败' });
      }
    }
  });

  // 获取历史记录
  app.get('/api/polls/history', async (_req: Request, res: Response) => {
    try {
      const polls = await votingService.getHistoricalPolls();
      res.json(polls);
    } catch (error) {
      console.error('Error getting historical polls:', error);
      res.status(500).json({ error: 'ServerError', message: '获取历史记录失败' });
    }
  });

  // ============ 管理端路由 ============
  
  // 管理后台页面
  app.get('/sydqwy', (_req: Request, res: Response) => {
    res.send(getAdminPageHTML());
  });

  // 管理端 JavaScript
  app.get('/admin.js', (_req: Request, res: Response) => {
    res.type('application/javascript').send(getAdminPageJS());
  });

  // 管理员登录
  app.post('/sydqwy/login', async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const token = await adminService.authenticateAdmin(password);
      res.json({ token });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid password')) {
        res.status(401).json({ error: 'InvalidPassword', message: '密码错误' });
      } else {
        res.status(500).json({ error: 'ServerError', message: '登录失败' });
      }
    }
  });

  // 获取所有选择（需认证）
  app.get('/sydqwy/polls', verifyToken, async (_req: Request, res: Response) => {
    try {
      const polls = await adminService.getAllPolls();
      res.json(polls);
    } catch (error) {
      console.error('Error getting all polls:', error);
      res.status(500).json({ error: 'ServerError', message: '获取选择列表失败' });
    }
  });

  // 创建选择（需认证）
  app.post('/sydqwy/polls', verifyToken, async (req: Request, res: Response) => {
    try {
      const poll = await adminService.createPoll(req.body);
      res.json(poll);
    } catch (error: any) {
      console.error('Error creating poll:', error);
      
      if (error.message.includes('empty') || error.message.includes('required') || error.message.includes('future')) {
        res.status(400).json({ error: 'ValidationError', message: error.message });
      } else {
        res.status(500).json({ error: 'ServerError', message: '创建选择失败' });
      }
    }
  });

  // 更新选择（需认证）
  app.put('/sydqwy/polls/:pollId', verifyToken, async (req: Request, res: Response) => {
    try {
      const poll = await adminService.updatePoll(req.params.pollId, req.body);
      res.json(poll);
    } catch (error: any) {
      console.error('Error updating poll:', error);
      
      if (error.message.includes('empty') || error.message.includes('required') || error.message.includes('future')) {
        res.status(400).json({ error: 'ValidationError', message: error.message });
      } else {
        res.status(500).json({ error: 'ServerError', message: '更新选择失败' });
      }
    }
  });

  // 删除选择（需认证）
  app.delete('/sydqwy/polls/:pollId', verifyToken, async (req: Request, res: Response) => {
    try {
      await adminService.deletePoll(req.params.pollId);
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('Error deleting poll:', error);
      res.status(500).json({ error: 'ServerError', message: '删除选择失败' });
    }
  });
}
