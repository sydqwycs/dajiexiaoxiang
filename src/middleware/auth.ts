import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

/**
 * JWT 认证中间件
 * 验证请求头中的 JWT 令牌
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // 从 Authorization 头提取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '缺少认证令牌'
      });
      return;
    }

    // 格式：Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: '令牌格式无效'
      });
      return;
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        error: 'ServerError',
        message: '服务器配置错误'
      });
      return;
    }

    // 验证令牌
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // 将解码后的 payload 附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'TokenExpired',
        message: '令牌已过期，请重新登录'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'InvalidToken',
        message: '令牌无效'
      });
      return;
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'ServerError',
      message: '认证失败'
    });
  }
}
