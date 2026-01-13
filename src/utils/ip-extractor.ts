import { Request } from 'express';

/**
 * 从 HTTP 请求中提取真实 IP 地址
 * 按优先级检查：x-forwarded-for > x-real-ip > socket地址
 */
export function extractIP(req: Request): string {
  // 1. 检查 x-forwarded-for 头（代理服务器设置）
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for 可能包含多个 IP，格式：client, proxy1, proxy2
    // 取第一个 IP（客户端真实 IP）
    const ips = typeof forwardedFor === 'string' 
      ? forwardedFor.split(',').map(ip => ip.trim())
      : forwardedFor;
    
    if (Array.isArray(ips) && ips.length > 0) {
      return normalizeIP(ips[0]);
    }
  }

  // 2. 检查 x-real-ip 头（Nginx 等设置）
  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return normalizeIP(realIP);
  }

  // 3. 回退到 socket 远程地址
  const socketIP = req.socket.remoteAddress || req.connection.remoteAddress;
  if (socketIP) {
    return normalizeIP(socketIP);
  }

  // 4. 默认返回 unknown（不应该发生）
  return 'unknown';
}

/**
 * 规范化 IP 地址格式
 * - IPv4: 保持原样
 * - IPv6: 移除 ::ffff: 前缀，统一格式
 */
export function normalizeIP(ip: string): string {
  // 移除空格
  ip = ip.trim();

  // 处理 IPv4-mapped IPv6 地址 (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // 处理完整的 IPv6 地址
  if (ip.includes(':')) {
    return normalizeIPv6(ip);
  }

  // IPv4 地址直接返回
  return ip;
}

/**
 * 规范化 IPv6 地址
 * 将缩写形式展开为完整形式
 */
function normalizeIPv6(ip: string): string {
  // 简单的 IPv6 规范化：转换为小写
  return ip.toLowerCase();
}
