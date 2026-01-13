import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { Database } from './db';
import { VotingService } from './services/voting-service';
import { AdminService } from './services/admin-service';
import { setupRoutes } from './router';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 初始化数据库和服务
const db = Database.getInstance();
const votingService = new VotingService(db);
const adminService = new AdminService(db);

// 设置路由
setupRoutes(app, votingService, adminService);

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'ServerError',
    message: '服务器内部错误'
  });
});

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: '请求的资源不存在'
  });
});

// 启动服务器
async function start() {
  try {
    // 测试数据库连接
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🌸 大街小巷选择系统启动成功 🌸`);
      console.log(`Server running on port ${PORT}`);
      console.log(`User interface: http://localhost:${PORT}`);
      console.log(`Admin interface: http://localhost:${PORT}/sydqwy`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await db.close();
  process.exit(0);
});

start();
