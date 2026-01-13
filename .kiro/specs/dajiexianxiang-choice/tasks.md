# Implementation Plan: 大街小巷选择系统

## Overview

本实施计划将大街小巷选择系统分解为一系列增量开发任务。系统使用 TypeScript + Express + PostgreSQL 技术栈，采用服务器端渲染架构。每个任务都建立在前一个任务的基础上，确保代码逐步集成，没有孤立的未使用代码。

## Tasks

- [x] 1. 项目初始化和基础设施
  - 创建项目目录结构
  - 初始化 package.json 和 TypeScript 配置
  - 安装核心依赖：express, pg, cors, dotenv, jsonwebtoken
  - 安装开发依赖：typescript, tsx, @types/* 包
  - 创建 .env.example 文件模板
  - 创建 tsconfig.json 配置
  - 创建 zbpack.json 用于 Zeabur 部署
  - _Requirements: 8.1_

- [x] 1.1 编写项目初始化测试
  - 验证 package.json 配置正确
  - 验证 TypeScript 配置有效
  - _Requirements: 8.1_

- [x] 2. 数据库层实现
  - [x] 2.1 创建数据库迁移脚本
    - 编写 migrations/0001_initial_schema_postgres.sql
    - 创建 polls、vote_options、votes 表
    - 添加外键约束和级联删除
    - 创建必要的索引
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 2.2 实现数据库连接池 (src/db.ts)
    - 创建 PostgreSQL 连接池
    - 实现 query 方法
    - 实现 getClient 方法用于事务
    - 添加错误处理和日志记录
    - _Requirements: 8.1_

  - [x] 2.3 编写数据库层单元测试
    - 测试连接池创建
    - 测试查询执行
    - 测试错误处理
    - _Requirements: 8.1_

- [x] 3. TypeScript 类型定义
  - 创建 src/types.ts
  - 定义 Poll、Option、Vote 接口
  - 定义 PollResults 接口
  - 定义请求和响应类型
  - 定义错误响应类型
  - _Requirements: 所有需求_

- [x] 4. 工具函数实现
  - [x] 4.1 实现 IP 地址提取器 (src/utils/ip-extractor.ts)
    - 检查 x-forwarded-for 头
    - 检查 x-real-ip 头
    - 回退到 socket 地址
    - 处理多个 IP 的情况
    - 规范化 IPv6 地址
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.2 编写 IP 提取器属性测试
    - **Property 21: IP 地址提取优先级**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - 生成随机请求头组合
    - 验证提取优先级正确
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 4.3 编写 IPv6 规范化属性测试
    - **Property 22: IPv6 地址规范化**
    - **Validates: Requirements 9.5**
    - 生成随机 IPv6 地址
    - 验证规范化一致性
    - _Requirements: 9.5_

- [ ] 5. 认证中间件实现
  - [x] 5.1 实现 JWT 认证中间件 (src/middleware/auth.ts)
    - 从请求头提取 JWT 令牌
    - 验证令牌签名
    - 检查令牌过期时间
    - 将 payload 附加到请求对象
    - 处理认证错误
    - _Requirements: 5.7, 12.3_

  - [ ] 5.2 编写认证中间件属性测试
    - **Property 13: JWT 令牌过期验证**
    - **Validates: Requirements 5.7**
    - 生成过期和有效令牌
    - 验证过期令牌被拒绝
    - _Requirements: 5.7_

  - [ ] 5.3 编写管理端点认证属性测试
    - **Property 25: 管理端点认证要求**
    - **Validates: Requirements 12.3**
    - 测试所有管理端点需要认证
    - _Requirements: 12.3_

- [ ] 6. Checkpoint - 基础设施验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 7. 投票服务实现
  - [x] 7.1 实现 Voting Service (src/services/voting-service.ts)
    - 实现 getActivePoll 方法
    - 实现 getPollResults 方法
    - 实现 getHistoricalPolls 方法
    - 实现 submitVote 方法
    - 实现 hasUserVoted 方法
    - 添加投票验证逻辑（IP、截止时间、状态）
    - 计算投票百分比
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

  - [ ] 7.2 编写选项显示完整性属性测试
    - **Property 1: 选项显示完整性**
    - **Validates: Requirements 1.3**
    - 生成随机选择活动
    - 验证所有选项包含投票数和百分比
    - _Requirements: 1.3_

  - [ ] 7.3 编写投票记录持久化属性测试
    - **Property 2: 投票记录持久化**
    - **Validates: Requirements 2.1**
    - 生成随机投票请求
    - 验证投票被正确记录
    - _Requirements: 2.1_

  - [ ] 7.4 编写重复投票防护属性测试
    - **Property 3: 重复投票防护**
    - **Validates: Requirements 2.2**
    - 生成随机选择和 IP
    - 验证重复投票被拒绝
    - 验证新选择允许相同 IP 投票
    - _Requirements: 2.2_

  - [ ] 7.5 编写截止时间验证属性测试
    - **Property 4: 截止时间验证**
    - **Validates: Requirements 2.3**
    - 生成过期的选择活动
    - 验证投票被拒绝
    - _Requirements: 2.3_

  - [ ] 7.6 编写活跃状态验证属性测试
    - **Property 5: 活跃状态验证**
    - **Validates: Requirements 2.4**
    - 生成非活跃状态的选择
    - 验证投票被拒绝
    - _Requirements: 2.4_

  - [ ] 7.7 编写历史记录属性测试
    - **Property 6: 历史记录完整性**
    - **Property 7: 历史记录字段完整性**
    - **Property 8: 结果数据完整性**
    - **Property 9: 历史记录排序**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - 生成多个历史选择
    - 验证返回完整性和排序
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. 管理服务实现
  - [ ] 8.1 实现 Admin Service (src/services/admin-service.ts)
    - 实现 authenticateAdmin 方法（SHA-256 哈希验证）
    - 实现 createPoll 方法（带事务）
    - 实现 updatePoll 方法
    - 实现 deletePoll 方法
    - 实现 getAllPolls 方法
    - 添加输入验证逻辑
    - 生成 JWT 令牌
    - _Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.5_

  - [ ] 8.2 编写密码验证属性测试
    - **Property 10: 密码哈希验证**
    - **Property 11: JWT 令牌生成**
    - **Property 12: 无效密码拒绝**
    - **Validates: Requirements 5.3, 5.4, 5.5**
    - 生成随机密码
    - 验证哈希和令牌生成
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ] 8.3 编写创建投票验证属性测试
    - **Property 14: 创建投票验证规则**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - 生成各种无效的创建请求
    - 验证所有验证规则生效
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 8.4 编写投票创建事务性属性测试
    - **Property 15: 投票创建事务性**
    - **Validates: Requirements 6.5, 6.6**
    - 模拟事务失败
    - 验证回滚正确
    - _Requirements: 6.5, 6.6_

  - [ ] 8.5 编写新投票初始状态属性测试
    - **Property 16: 新投票初始状态**
    - **Validates: Requirements 6.7**
    - 创建随机投票
    - 验证状态为 active
    - _Requirements: 6.7_

  - [ ] 8.6 编写管理功能属性测试
    - **Property 17: 管理员投票列表完整性**
    - **Property 18: 投票更新功能**
    - **Property 19: 更新验证一致性**
    - **Property 20: 级联删除**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
    - 测试列表、更新、删除功能
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 9. Checkpoint - 服务层验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 10. 静态内容实现
  - [ ] 10.1 创建用户页面 HTML (src/static-content.ts)
    - 实现 getUserPageHTML 函数
    - 包含导航栏（当前选择、历史记录）
    - 包含选择显示区域
    - 包含投票表单
    - 包含历史记录显示区域
    - 使用紫色渐变主题
    - 响应式设计
    - _Requirements: 1.1, 10.1, 10.2, 10.3, 10.4_

  - [ ] 10.2 创建用户页面 JavaScript (src/static-content.ts)
    - 实现 getUserPageJS 函数
    - 加载当前活跃选择
    - 处理投票提交
    - 显示实时结果
    - 加载历史记录
    - 实现花朵特效动画（投票成功 150 个）
    - 实现鼠标点击花朵特效（47 种）
    - 根据月份选择花朵类型
    - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1_

  - [ ] 10.3 创建管理页面 HTML (src/static-content.ts)
    - 实现 getAdminPageHTML 函数
    - 包含登录表单
    - 包含选择列表
    - 包含创建选择表单
    - 包含编辑和删除按钮
    - 使用紫色渐变主题
    - _Requirements: 5.1, 5.2, 7.1_

  - [ ] 10.4 创建管理页面 JavaScript (src/static-content.ts)
    - 实现 getAdminPageJS 函数
    - 处理登录
    - 存储 JWT 令牌
    - 加载所有选择
    - 处理创建选择
    - 处理更新选择
    - 处理删除选择（带确认）
    - _Requirements: 5.3, 5.4, 6.5, 7.2, 7.4, 7.5_

- [ ] 11. 路由层实现
  - [ ] 11.1 实现路由定义 (src/router.ts)
    - 定义用户端路由（GET /, GET /app.js）
    - 定义用户 API 路由（GET /api/polls/active, POST /api/votes, GET /api/polls/:pollId/results, GET /api/polls/history）
    - 定义管理端路由（GET /sydqwy, GET /admin.js）
    - 定义管理 API 路由（POST /sydqwy/login, GET /sydqwy/polls, POST /sydqwy/polls, PUT /sydqwy/polls/:pollId, DELETE /sydqwy/polls/:pollId）
    - 应用认证中间件到管理 API 路由
    - 连接服务层方法
    - 添加错误处理
    - _Requirements: 所有需求_

  - [ ] 11.2 编写路由集成测试
    - 测试所有用户端点
    - 测试所有管理端点
    - 测试认证流程
    - 测试错误响应
    - _Requirements: 所有需求_

- [ ] 12. 错误处理实现
  - [ ] 12.1 实现全局错误处理中间件
    - 捕获所有未处理的错误
    - 根据错误类型返回适当的状态码
    - 记录错误到日志
    - 返回用户友好的错误消息
    - 不暴露内部细节
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 12.2 编写错误处理属性测试
    - **Property 23: 数据库错误处理**
    - **Property 24: 错误响应规范**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
    - 模拟各种错误情况
    - 验证错误响应正确
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 13. 服务器入口实现
  - [ ] 13.1 创建 Express 服务器 (src/index.ts)
    - 初始化 Express 应用
    - 配置 CORS 中间件
    - 配置 JSON 解析中间件
    - 设置路由
    - 设置错误处理中间件
    - 启动服务器监听
    - 处理优雅关闭
    - _Requirements: 12.4_

  - [ ] 13.2 编写 SQL 注入防护测试
    - **Property 26: SQL 注入防护**
    - **Validates: Requirements 12.5**
    - 生成 SQL 注入尝试
    - 验证参数化查询防护
    - _Requirements: 12.5_

- [ ] 14. 数据库迁移工具
  - 创建 scripts/migrate.js
  - 读取迁移 SQL 文件
  - 连接数据库并执行迁移
  - 添加错误处理
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 15. 环境配置和文档
  - 创建 .env.example 文件
  - 创建 README.md 文档
  - 添加部署说明
  - 添加本地开发说明
  - 添加环境变量说明
  - _Requirements: 12.1, 12.2_

- [ ] 16. Checkpoint - 完整系统验证
  - 运行所有测试
  - 验证所有功能正常工作
  - 检查代码覆盖率
  - 如有问题请询问用户

- [ ] 17. 测试数据初始化
  - 创建测试数据脚本
  - 添加 3 个历史选择示例
  - 添加投票记录
  - _Requirements: 所有需求_

- [ ] 18. 端到端测试
  - 测试完整的用户投票流程
  - 测试完整的管理员创建流程
  - 测试并发投票场景
  - 测试错误恢复场景
  - _Requirements: 所有需求_

## Notes

- 所有任务都是必需的，确保全面的测试覆盖
- 每个任务都引用了具体的需求以便追溯
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边缘情况
- 所有属性测试使用 fast-check 库，至少运行 100 次迭代
