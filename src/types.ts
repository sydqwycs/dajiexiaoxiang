// 大街小巷选择系统 - TypeScript 类型定义

// ============ 核心数据模型 ============

export interface Poll {
  id: string;
  title: string;
  deadline: Date;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  options?: Option[];
}

export interface Option {
  id: string;
  pollId: string;
  optionText: string;
  displayOrder: number;
  voteCount?: number;
  percentage?: number;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  ipAddress: string;
  votedAt: Date;
}

export interface PollResults {
  poll: Poll;
  options: Option[];
  totalVotes: number;
}

// ============ API 请求类型 ============

export interface CreatePollRequest {
  title: string;
  deadline: string; // ISO 8601 format
  options: string[];
}

export interface UpdatePollRequest {
  title?: string;
  deadline?: string; // ISO 8601 format
  options?: Array<{
    id?: string;
    text: string;
    order: number;
  }>;
}

export interface VoteRequest {
  pollId: string;
  optionId: string;
}

export interface LoginRequest {
  password: string;
}

// ============ API 响应类型 ============

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// ============ JWT Payload ============

export interface JWTPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

// ============ Express 扩展类型 ============

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ============ 数据库行类型 ============

export interface PollRow {
  id: string;
  title: string;
  deadline: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface OptionRow {
  id: string;
  poll_id: string;
  option_text: string;
  display_order: number;
}

export interface VoteRow {
  id: string;
  poll_id: string;
  option_id: string;
  ip_address: string;
  voted_at: Date;
}
