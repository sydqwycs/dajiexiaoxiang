# 大街小巷选择系统 - Zeabur 版本完整总结

## 📋 项目概述

**项目名称**: 大街小巷选择系统  
**英文名称**: dajiexianxiang-choice  
**目标平台**: Zeabur (`.zeabur.app` 域名在中国可访问)  
**原平台**: Cloudflare Workers (`.workers.dev` 在中国被屏蔽)

---

## 🎯 核心功能

### 用户端功能
1. **查看当前选择** - 显示进行中的选择活动、标题、截止时间、所有选项
2. **参与选择** - 选择选项并提交，IP 限制（每个 IP 只能投一次）
3. **查看实时结果** - 显示票数、百分比、进度条（紫色到粉色渐变）
4. **查看历史记录** - 浏览已结束的选择活动及详细结果
5. **特效动画**:
   - 投票成功：150 个花朵飘落（根据月份不同）
   - 鼠标点击：47 种随机花朵特效

### 管理员功能
1. **隐藏登录** - 路径 `/sydqwy`（不是 `/admin`）
2. **密码**: `o-Q>3WK..@Y[XFplt10OHsGfkU,Ws;2K`
3. **创建选择** - 标题、截止时间、多个选项（至少2个）
4. **管理列表** - 查看所有选择（进行中/已结束）
5. **删除选择** - 红色删除按钮，需确认
6. **修改选择** - 更新标题、截止时间、选项内容

---

## 🛠️ 技术栈

### 后端
- **框架**: Node.js + Express.js
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **认证**: JWT (jsonwebtoken 库)
- **密码加密**: SHA-256

### 前端
- **纯 HTML/CSS/JavaScript** (内联在服务器代码中)
- **响应式设计** (适配手机和桌面)
- **主题色**: 紫色渐变 (#667eea → #764ba2)

### 依赖包
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.10.2",
    "@types/pg": "^8.10.9",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.7.2",
    "tsx": "^4.7.0"
  }
}
```

---

## 🗄️ 数据库结构

### polls 表（选择活动）
```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### vote_options 表（选择选项）
```sql
CREATE TABLE vote_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    display_order INTEGER NOT NULL
);
```

### votes 表（投票记录）
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, ip_address)
);
```

### 索引
```sql
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_deadline ON polls(deadline);
CREATE INDEX idx_vote_options_poll_id ON vote_options(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_ip_poll ON votes(poll_id, ip_address);
```

---

## 🌐 API 端点

### 用户端
- `GET /` - 首页 HTML
- `GET /api/polls/active` - 获取当前活跃选择
- `POST /api/votes` - 提交投票 `{ pollId, optionId }`
- `GET /api/polls/:pollId/results` - 获取结果
- `GET /api/polls/history` - 获取历史记录
- `GET /app.js` - 前端 JavaScript
- `GET /admin.js` - 管理端 JavaScript

### 管理端（需认证）
- `GET /sydqwy` - 管理后台页面
- `POST /sydqwy/login` - 登录 `{ password }`
- `GET /sydqwy/polls` - 获取所有选择
- `POST /sydqwy/polls` - 创建选择 `{ title, options[], deadline }`
- `PUT /sydqwy/polls/:pollId` - 更新选择
- `DELETE /sydqwy/polls/:pollId` - 删除选择

---

## 🔐 环境变量

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 管理员密码哈希 (SHA-256)
ADMIN_PASSWORD_HASH=e42424a90c0a85e9f9ccfbafaff886a334f91a503a8a2d3f359b3f1ec1deb898

# JWT 密钥
JWT_SECRET=your-secret-key-change-in-production

# 服务器端口
PORT=3000

# 环境
NODE_ENV=production
```

---

## 📁 项目结构

```
dajiexianxiang-choice/
├── src/
│   ├── index.ts              # Express 服务器入口
│   ├── router.ts             # 路由定义
│   ├── db.ts                 # PostgreSQL 连接池
│   ├── types.ts              # TypeScript 类型定义
│   ├── static-content.ts     # 内联的 HTML/JS 内容
│   ├── middleware/
│   │   └── auth.ts           # JWT 认证中间件
│   ├── services/
│   │   ├── voting-service.ts # 投票业务逻辑
│   │   └── admin-service.ts  # 管理业务逻辑
│   └── utils/
│       └── ip-extractor.ts   # IP 地址提取
├── migrations/
│   └── 0001_initial_schema_postgres.sql  # 数据库迁移脚本
├── scripts/
│   └── migrate.js            # 数据库迁移工具
├── package.json
├── tsconfig.json
├── zbpack.json               # Zeabur 配置
└── .env                      # 环境变量
```

---

## 🎨 UI/UX 特点

### 设计风格
- **主题色**: 紫色渐变 (#667eea → #764ba2)
- **品牌**: 大街小巷
- **响应式**: 适配手机和桌面
- **现代简洁**: 圆角、阴影、渐变

### 导航
- 顶部导航栏
- 两个标签: "当前选择" | "历史记录"
- **不显示**管理后台链接（隐藏访问）

### 交互反馈
- 按钮悬停效果
- 选项框悬停高亮（整个框可点击，不只是圆形按钮）
- 加载状态提示
- 成功/错误消息
- 动画过渡

### 特效动画

#### 投票成功特效（150个花朵飘落）
```javascript
// 根据月份显示不同花朵
1-2月: ❄️⛄ (雪花)
3-4月: 🌸🌺 (樱花)
5-6月: 🌹🌷 (玫瑰)
7-8月: 🌻☀️ (向日葵)
9-10月: 🍂🍁 (枫叶)
11-12月: ❄️⭐ (雪花星星)
```

#### 鼠标点击特效（47种花朵）
```javascript
// 随机显示，放大、旋转、上浮、淡出动画
🌸🌺🌻🌷🌹🥀🏵️💐🌼🌾🌿☘️🍀🍁🍂🍃
🌱🌲🌳🌴🌵🌾🌿🍀🍁🍂🍃🌺🌻🌼🌷🌹
🥀🏵️💐💮🌸🏵️🌺🌻🌼🌷🌹🥀
```

---

## 🔒 安全特性

### 投票限制
- 基于 IP 地址限制
- 每个 IP 对同一选择只能投一次
- 检查投票是否已截止
- 检查选择是否已关闭

### 管理员认证
- 密码 SHA-256 加密存储
- JWT 令牌认证（24小时有效期）
- 令牌过期检查
- 所有管理操作需要认证

### 数据验证
- 选择标题不能为空
- 至少需要 2 个选项
- 截止时间必须在未来
- 选项文本不能为空

---

## 📊 测试数据

系统包含 3 个历史选择的测试数据：
1. "最喜欢的季节"（10票）
2. "最喜欢的编程语言"（12票）
3. "周末活动偏好"（15票）

---

## 🚀 部署到 Zeabur

### 1. 准备工作
- 注册 Zeabur 账号
- 安装 Git
- 准备代码仓库

### 2. 创建项目
```bash
# 在 Zeabur 控制台
1. 创建新项目
2. 添加 PostgreSQL 服务
3. 添加 Git 服务（连接你的仓库）
```

### 3. 配置环境变量
在 Zeabur 项目设置中添加：
```
DATABASE_URL=<自动生成>
ADMIN_PASSWORD_HASH=e42424a90c0a85e9f9ccfbafaff886a334f91a503a8a2d3f359b3f1ec1deb898
JWT_SECRET=<生成随机密钥>
NODE_ENV=production
```

### 4. 数据库迁移
```bash
# 连接到 Zeabur PostgreSQL
# 执行 migrations/0001_initial_schema_postgres.sql
```

### 5. 部署
- 推送代码到 Git 仓库
- Zeabur 自动构建和部署
- 访问生成的 `.zeabur.app` 域名

---

## 📝 重要注意事项

### 术语规范
- ✅ 使用 "选择" 而不是 "投票"
- ✅ 使用 "选择系统" 而不是 "投票系统"
- ✅ 所有界面使用中文

### 管理后台
- ⚠️ 路径必须是 `/sydqwy`（不是 `/admin`）
- ⚠️ 不在用户界面显示管理后台链接
- ⚠️ 通过隐藏路径访问

### 品牌信息
- 项目名称: 大街小巷
- 页面标题: 大街小巷
- 页脚: © 2026 大街小巷

---

## 🔄 数据流程

### 用户投票流程
1. 用户访问首页 `/`
2. 系统加载当前活跃选择
3. 用户选择一个选项
4. 点击"提交选择"
5. 系统检查 IP 是否已投票
6. 如果未投票，记录投票
7. 显示成功消息和花朵特效
8. 刷新显示实时结果

### 管理员创建选择流程
1. 管理员访问 `/sydqwy`
2. 输入密码登录
3. 点击"创建新选择"
4. 填写标题、截止时间、选项
5. 提交创建
6. 系统验证数据
7. 创建选择和选项（事务处理）
8. 刷新选择列表

---

## ✅ 功能清单

- ✅ 用户投票功能
- ✅ IP 限制（每个 IP 只能投一次）
- ✅ 实时结果显示
- ✅ 历史记录查看
- ✅ 管理员后台（隐藏路径）
- ✅ 创建/删除/修改选择
- ✅ 花朵特效动画（投票成功 + 鼠标点击）
- ✅ 响应式设计
- ✅ 安全认证（JWT + SHA-256）
- ✅ 数据库连接池
- ✅ 事务处理
- ✅ 错误处理
- ✅ 部署到 Zeabur

---

## 🎯 目标

提供一个**简单、美观、易用**的在线选择系统，可以在**中国正常访问**。

---

## 📞 管理员信息

**管理后台地址**: `https://your-domain.zeabur.app/sydqwy`  
**管理员密码**: `o-Q>3WK..@Y[XFplt10OHsGfkU,Ws;2K`  
**密码哈希**: `e42424a90c0a85e9f9ccfbafaff886a334f91a503a8a2d3f359b3f1ec1deb898`

---

**文档创建时间**: 2026-01-14  
**版本**: Zeabur 迁移版本  
**状态**: 准备重新开发 ✨
