# Design Document

## Overview

大街小巷选择系统是一个基于 Node.js + Express + PostgreSQL 的全栈 Web 应用。系统采用服务器端渲染（SSR）架构，将 HTML、CSS 和 JavaScript 内联在服务器代码中，简化部署流程。系统使用 TypeScript 开发，提供类型安全和更好的开发体验。

核心设计原则：
- **简单性**: 最小化依赖，使用内联前端代码
- **安全性**: JWT 认证、密码哈希、SQL 注入防护
- **可靠性**: 数据库事务、连接池、错误处理
- **用户体验**: 响应式设计、实时反馈、动画特效

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  User Page   │  │ History Page │  │  Admin Page  │      │
│  │  (HTML/JS)   │  │  (HTML/JS)   │  │  (HTML/JS)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express.js Server                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Router Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │ User Routes│  │Static Files│  │Admin Routes│    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Middleware Layer                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │    CORS    │  │ Auth (JWT) │  │Error Handler│   │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Service Layer                       │   │
│  │  ┌────────────────┐  ┌────────────────┐            │   │
│  │  │ Voting Service │  │  Admin Service │            │   │
│  │  └────────────────┘  └────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Utility Layer                      │   │
│  │  ┌────────────────┐  ┌────────────────┐            │   │
│  │  │ IP Extractor   │  │  Static Content│            │   │
│  │  └────────────────┘  └────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  polls table │  │vote_options  │  │  votes table │      │
│  │              │  │    table     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈选择

**后端框架**: Express.js
- 成熟稳定的 Node.js Web 框架
- 丰富的中间件生态系统
- 简单易用的路由系统

**数据库**: PostgreSQL
- 强大的关系型数据库
- 支持事务和外键约束
- 优秀的性能和可靠性

**认证**: JWT (jsonwebtoken)
- 无状态认证机制
- 适合 RESTful API
- 易于扩展到多服务器

**密码加密**: SHA-256
- 单向哈希函数
- 快速且安全
- Node.js 内置支持

## Components and Interfaces

### 1. Database Layer (db.ts)

**职责**: 管理 PostgreSQL 数据库连接池

```typescript
interface DatabaseConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: Pool;
  
  constructor(config: DatabaseConfig);
  query<T>(text: string, params?: any[]): Promise<QueryResult<T>>;
  getClient(): Promise<PoolClient>;
  close(): Promise<void>;
}
```

**关键功能**:
- 创建和管理连接池
- 提供查询接口
- 处理连接错误和重试

### 2. Voting Service (voting-service.ts)

**职责**: 处理用户投票相关的业务逻辑

```typescript
interface VotingService {
  getActivePoll(): Promise<Poll | null>;
  getPollResults(pollId: string): Promise<PollResults>;
  getHistoricalPolls(): Promise<Poll[]>;
  submitVote(pollId: string, optionId: string, ipAddress: string): Promise<void>;
  hasUserVoted(pollId: string, ipAddress: string): Promise<boolean>;
}

interface Poll {
  id: string;
  title: string;
  deadline: Date;
  status: 'active' | 'closed';
  options: Option[];
  createdAt: Date;
  updatedAt: Date;
}

interface Option {
  id: string;
  pollId: string;
  optionText: string;
  displayOrder: number;
  voteCount?: number;
  percentage?: number;
}

interface PollResults {
  poll: Poll;
  options: Option[];
  totalVotes: number;
}
```

**关键功能**:
- 获取当前活跃的选择活动
- 提交投票并验证 IP 限制
- 计算投票结果和百分比
- 获取历史记录

### 3. Admin Service (admin-service.ts)

**职责**: 处理管理员相关的业务逻辑

```typescript
interface AdminService {
  authenticateAdmin(password: string): Promise<string>; // Returns JWT token
  createPoll(data: CreatePollData): Promise<Poll>;
  updatePoll(pollId: string, data: UpdatePollData): Promise<Poll>;
  deletePoll(pollId: string): Promise<void>;
  getAllPolls(): Promise<Poll[]>;
}

interface CreatePollData {
  title: string;
  deadline: Date;
  options: string[];
}

interface UpdatePollData {
  title?: string;
  deadline?: Date;
  options?: Array<{ id?: string; text: string; order: number }>;
}
```

**关键功能**:
- 管理员密码验证和 JWT 生成
- 创建选择活动（事务处理）
- 更新选择活动
- 删除选择活动（级联删除）
- 获取所有选择活动

### 4. Auth Middleware (middleware/auth.ts)

**职责**: 验证 JWT 令牌

```typescript
interface AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void;
}

interface JWTPayload {
  role: 'admin';
  iat: number;
  exp: number;
}
```

**关键功能**:
- 从请求头提取 JWT 令牌
- 验证令牌签名和过期时间
- 将解码后的 payload 附加到请求对象

### 5. IP Extractor Utility (utils/ip-extractor.ts)

**职责**: 从 HTTP 请求中提取真实 IP 地址

```typescript
interface IPExtractor {
  extractIP(req: Request): string;
}
```

**关键功能**:
- 检查 `x-forwarded-for` 头
- 检查 `x-real-ip` 头
- 回退到 socket 地址
- 处理 IPv6 地址

### 6. Static Content (static-content.ts)

**职责**: 存储内联的 HTML、CSS 和 JavaScript 代码

```typescript
interface StaticContent {
  getUserPageHTML(): string;
  getAdminPageHTML(): string;
  getUserPageJS(): string;
  getAdminPageJS(): string;
}
```

**关键功能**:
- 提供用户页面 HTML
- 提供管理页面 HTML
- 提供前端 JavaScript 代码
- 包含所有 CSS 样式

### 7. Router (router.ts)

**职责**: 定义所有 HTTP 路由

```typescript
interface Router {
  setupRoutes(app: Express): void;
}
```

**路由定义**:

**用户端路由**:
- `GET /` - 返回用户页面 HTML
- `GET /app.js` - 返回用户端 JavaScript
- `GET /api/polls/active` - 获取当前活跃选择
- `POST /api/votes` - 提交投票
- `GET /api/polls/:pollId/results` - 获取选择结果
- `GET /api/polls/history` - 获取历史记录

**管理端路由**:
- `GET /sydqwy` - 返回管理页面 HTML
- `GET /admin.js` - 返回管理端 JavaScript
- `POST /sydqwy/login` - 管理员登录
- `GET /sydqwy/polls` - 获取所有选择（需认证）
- `POST /sydqwy/polls` - 创建选择（需认证）
- `PUT /sydqwy/polls/:pollId` - 更新选择（需认证）
- `DELETE /sydqwy/polls/:pollId` - 删除选择（需认证）

## Data Models

### Database Schema

#### polls 表

```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_deadline ON polls(deadline);
```

**字段说明**:
- `id`: UUID 主键，自动生成
- `title`: 选择活动标题
- `deadline`: 截止时间
- `status`: 状态（active/closed）
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### vote_options 表

```sql
CREATE TABLE vote_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    display_order INTEGER NOT NULL
);

CREATE INDEX idx_vote_options_poll_id ON vote_options(poll_id);
```

**字段说明**:
- `id`: UUID 主键，自动生成
- `poll_id`: 关联的选择活动 ID（外键，级联删除）
- `option_text`: 选项文本
- `display_order`: 显示顺序

#### votes 表

```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, ip_address)
);

CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_ip_poll ON votes(poll_id, ip_address);
```

**字段说明**:
- `id`: UUID 主键，自动生成
- `poll_id`: 关联的选择活动 ID（外键，级联删除）
- `option_id`: 关联的选项 ID（外键，级联删除）
- `ip_address`: 投票者的 IP 地址
- `voted_at`: 投票时间
- `UNIQUE(poll_id, ip_address)`: 确保每个 IP 对同一选择只能投一次票。当新的选择活动创建时，所有 IP 都可以重新投票，因为 poll_id 不同

### TypeScript 类型定义

```typescript
// types.ts

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

export interface CreatePollRequest {
  title: string;
  deadline: string; // ISO 8601 format
  options: string[];
}

export interface UpdatePollRequest {
  title?: string;
  deadline?: string;
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

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
```

## Correctness Properties

*属性（Property）是系统在所有有效执行中应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*


### Property 1: 选项显示完整性
*对于任何* 选择活动的选项列表，每个选项都应该包含投票数和百分比字段。
**Validates: Requirements 1.3**

### Property 2: 投票记录持久化
*对于任何* 有效的投票提交（包含 pollId、optionId 和 IP 地址），系统应该在数据库中创建一条投票记录。
**Validates: Requirements 2.1**

### Property 3: 重复投票防护
*对于任何* 选择活动和 IP 地址，如果该 IP 已经对该选择投过票，再次尝试投票应该被拒绝。每个 IP 的投票限制仅针对单个选择活动，当新的选择活动开始时，所有 IP 都可以重新投票。
**Validates: Requirements 2.2**

### Property 4: 截止时间验证
*对于任何* 截止时间已过的选择活动，尝试投票应该被拒绝并返回错误消息。
**Validates: Requirements 2.3**

### Property 5: 活跃状态验证
*对于任何* 状态不是 "active" 的选择活动，尝试投票应该被拒绝并返回错误消息。
**Validates: Requirements 2.4**

### Property 6: 历史记录完整性
*对于任何* 历史记录查询，返回的结果应该包含所有状态为 "closed" 或截止时间已过的选择活动。
**Validates: Requirements 4.1**

### Property 7: 历史记录字段完整性
*对于任何* 历史选择活动，返回的数据应该包含标题、截止时间和所有选项的最终结果。
**Validates: Requirements 4.2**

### Property 8: 结果数据完整性
*对于任何* 选择活动的结果，所有选项都应该包含投票数和百分比。
**Validates: Requirements 4.3**

### Property 9: 历史记录排序
*对于任何* 历史选择活动列表，它们应该按创建时间降序排列。
**Validates: Requirements 4.4**

### Property 10: 密码哈希验证
*对于任何* 提交的密码，系统应该使用 SHA-256 进行哈希处理后再与存储的哈希值比较。
**Validates: Requirements 5.3**

### Property 11: JWT 令牌生成
*对于任何* 有效的管理员密码，系统应该生成一个包含 24 小时过期时间的 JWT 令牌。
**Validates: Requirements 5.4**

### Property 12: 无效密码拒绝
*对于任何* 与存储哈希值不匹配的密码，登录尝试应该被拒绝并返回错误消息。
**Validates: Requirements 5.5**

### Property 13: JWT 令牌过期验证
*对于任何* 过期的 JWT 令牌，使用该令牌的请求应该被拒绝并要求重新登录。
**Validates: Requirements 5.7**

### Property 14: 创建投票验证规则
*对于任何* 创建投票的请求，系统应该验证：标题非空、至少有 2 个选项、截止时间在未来、所有选项文本非空。任何违反这些规则的请求都应该被拒绝。
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 15: 投票创建事务性
*对于任何* 有效的创建投票请求，系统应该在单个事务中创建投票和所有选项，确保要么全部成功要么全部失败。
**Validates: Requirements 6.5, 6.6**

### Property 16: 新投票初始状态
*对于任何* 新创建的选择活动，其状态应该被设置为 "active"。
**Validates: Requirements 6.7**

### Property 17: 管理员投票列表完整性
*对于任何* 管理员的投票列表查询，返回结果应该包含所有投票，无论其状态如何。
**Validates: Requirements 7.1**

### Property 18: 投票更新功能
*对于任何* 有效的更新请求，系统应该正确更新投票的标题、截止时间和选项。
**Validates: Requirements 7.2**

### Property 19: 更新验证一致性
*对于任何* 投票更新请求，系统应该应用与创建时相同的验证规则。
**Validates: Requirements 7.3**

### Property 20: 级联删除
*对于任何* 投票删除操作，系统应该同时删除该投票的所有关联选项和投票记录。
**Validates: Requirements 7.5**

### Property 21: IP 地址提取优先级
*对于任何* HTTP 请求，系统应该按以下优先级提取 IP 地址：首先检查 `x-forwarded-for` 头，然后检查 `x-real-ip` 头，最后使用 socket 远程地址。当 `x-forwarded-for` 包含多个 IP 时，应该使用第一个。
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 22: IPv6 地址规范化
*对于任何* IPv6 地址，系统应该将其规范化为一致的格式。
**Validates: Requirements 9.5**

### Property 23: 数据库错误处理
*对于任何* 数据库错误，系统应该记录错误并向客户端返回通用错误消息（不暴露内部细节）。
**Validates: Requirements 11.1**

### Property 24: 错误响应规范
*对于任何* 错误情况，系统应该返回适当的 HTTP 状态码和错误消息：验证错误返回具体消息，认证错误返回 401，资源未找到返回 404。
**Validates: Requirements 11.2, 11.3, 11.4**

### Property 25: 管理端点认证要求
*对于任何* 管理 API 端点，系统应该验证请求包含有效的 JWT 令牌，否则拒绝访问。
**Validates: Requirements 12.3**

### Property 26: SQL 注入防护
*对于任何* 用户输入，系统应该使用参数化查询来防止 SQL 注入攻击。
**Validates: Requirements 12.5**

## Error Handling

### 错误分类

**1. 验证错误 (400 Bad Request)**
- 空标题
- 选项少于 2 个
- 截止时间在过去
- 空选项文本
- 无效的 UUID 格式

**2. 认证错误 (401 Unauthorized)**
- 缺少 JWT 令牌
- 无效的 JWT 令牌
- 过期的 JWT 令牌
- 错误的管理员密码

**3. 授权错误 (403 Forbidden)**
- IP 地址已投票
- 投票已截止
- 投票未激活

**4. 资源未找到 (404 Not Found)**
- 投票 ID 不存在
- 选项 ID 不存在

**5. 服务器错误 (500 Internal Server Error)**
- 数据库连接失败
- 事务失败
- 未预期的运行时错误

### 错误响应格式

```typescript
interface ErrorResponse {
  error: string;        // 错误类型
  message: string;      // 用户友好的错误消息
  details?: any;        // 可选的详细信息（仅开发环境）
}
```

### 错误处理策略

**数据库错误**:
- 记录完整的错误堆栈到日志
- 向客户端返回通用消息
- 不暴露数据库结构或查询细节

**验证错误**:
- 返回具体的验证失败原因
- 帮助用户理解如何修正输入

**认证错误**:
- 返回通用的认证失败消息
- 不透露密码是否存在或令牌格式

**事务错误**:
- 自动回滚所有更改
- 记录失败原因
- 返回通用的操作失败消息

### 日志记录

**日志级别**:
- `ERROR`: 数据库错误、事务失败、未捕获异常
- `WARN`: 验证失败、认证失败、重复投票尝试
- `INFO`: 成功的操作、投票提交、管理员登录
- `DEBUG`: 详细的请求/响应信息（仅开发环境）

**日志内容**:
- 时间戳
- 请求 ID（用于追踪）
- 用户 IP 地址
- 操作类型
- 错误消息和堆栈（如果适用）

## Testing Strategy

### 测试方法

系统将采用**双重测试方法**，结合单元测试和基于属性的测试：

**单元测试**:
- 验证特定示例和边缘情况
- 测试集成点
- 测试错误条件
- 使用 Jest 测试框架

**基于属性的测试**:
- 验证通用属性在所有输入下成立
- 通过随机化实现全面的输入覆盖
- 使用 fast-check 库
- 每个属性测试至少运行 100 次迭代

### 测试配置

**测试框架**: Jest
**属性测试库**: fast-check
**最小迭代次数**: 100 次/属性测试
**测试数据库**: 使用 Docker 容器运行的 PostgreSQL 测试实例

### 测试覆盖范围

**1. 数据库层测试**
- 连接池管理
- 查询执行
- 事务处理
- 错误处理和重试

**2. 服务层测试**
- Voting Service 的所有方法
- Admin Service 的所有方法
- 业务逻辑验证
- 数据转换

**3. 中间件测试**
- JWT 令牌验证
- 错误处理中间件
- CORS 配置

**4. 工具函数测试**
- IP 地址提取
- 密码哈希
- 日期时间处理

**5. API 端点测试**
- 所有用户端点
- 所有管理端点
- 认证流程
- 错误响应

### 属性测试标签格式

每个属性测试必须使用以下格式标记：

```typescript
test('Feature: dajiexianxiang-choice, Property 1: 选项显示完整性', () => {
  fc.assert(
    fc.property(
      // 生成器和断言
    ),
    { numRuns: 100 }
  );
});
```

### 测试数据生成器

**Poll 生成器**:
```typescript
const pollArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  deadline: fc.date({ min: new Date() }),
  status: fc.constantFrom('active', 'closed'),
  options: fc.array(
    fc.record({
      text: fc.string({ minLength: 1, maxLength: 100 }),
      order: fc.nat()
    }),
    { minLength: 2, maxLength: 10 }
  )
});
```

**IP 地址生成器**:
```typescript
const ipv4Arbitrary = fc.tuple(
  fc.nat(255), fc.nat(255), fc.nat(255), fc.nat(255)
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

const ipv6Arbitrary = fc.hexaString({ minLength: 1, maxLength: 4 })
  .chain(seg => fc.array(fc.constant(seg), { minLength: 8, maxLength: 8 }))
  .map(segments => segments.join(':'));
```

**投票请求生成器**:
```typescript
const voteRequestArbitrary = fc.record({
  pollId: fc.uuid(),
  optionId: fc.uuid(),
  ipAddress: fc.oneof(ipv4Arbitrary, ipv6Arbitrary)
});
```

### 边缘情况测试

**必须测试的边缘情况**:
- 空数据库（无活跃投票）
- 截止时间刚好到期
- 最大数量的选项
- 最小数量的选项（2个）
- 非常长的标题和选项文本
- 特殊字符和 Unicode 字符
- IPv4 和 IPv6 地址
- 代理头中的多个 IP
- 过期的 JWT 令牌
- 并发投票尝试

### 集成测试

**测试场景**:
1. 完整的用户投票流程
2. 完整的管理员创建投票流程
3. 投票更新和删除流程
4. 认证和授权流程
5. 错误恢复流程

### 性能测试

**基准测试**:
- 数据库查询性能
- API 响应时间
- 并发请求处理
- 内存使用

**性能目标**:
- API 响应时间 < 200ms (p95)
- 数据库查询 < 50ms (p95)
- 支持 100 并发用户
- 内存使用 < 512MB

### 测试环境

**开发环境**:
- 本地 PostgreSQL 数据库
- 模拟的环境变量
- 详细的日志输出

**CI/CD 环境**:
- Docker 容器化的 PostgreSQL
- 自动化测试执行
- 代码覆盖率报告
- 测试结果通知

### 测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:property

# 运行集成测试
npm run test:integration

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

### 测试覆盖率目标

- 语句覆盖率: > 80%
- 分支覆盖率: > 75%
- 函数覆盖率: > 85%
- 行覆盖率: > 80%

### 持续集成

**CI 流程**:
1. 代码提交触发 CI
2. 安装依赖
3. 启动测试数据库
4. 运行 linter
5. 运行所有测试
6. 生成覆盖率报告
7. 构建 Docker 镜像
8. 部署到 Zeabur（如果在主分支）

**测试失败处理**:
- 阻止合并到主分支
- 通知开发者
- 提供详细的失败日志
- 保留测试数据库快照用于调试
