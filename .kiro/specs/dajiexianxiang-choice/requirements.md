# Requirements Document

## Introduction

大街小巷选择系统是一个在线选择投票平台，允许用户参与选择活动并查看实时结果。系统提供隐藏的管理后台用于创建和管理选择活动。系统部署在 Zeabur 平台，使用 `.zeabur.app` 域名以确保在中国可访问。

## Glossary

- **System**: 大街小巷选择系统
- **Poll**: 选择活动，包含标题、截止时间和多个选项
- **Option**: 选择活动中的一个可选项
- **Vote**: 用户对某个选项的选择记录
- **User**: 访问系统参与选择的普通用户
- **Admin**: 系统管理员，可以创建和管理选择活动
- **IP_Address**: 用户的网络 IP 地址，用于限制重复投票
- **Active_Poll**: 状态为活跃且未超过截止时间的选择活动
- **Historical_Poll**: 已结束或已关闭的选择活动
- **JWT_Token**: JSON Web Token，用于管理员身份认证
- **Database**: PostgreSQL 数据库系统
- **Flower_Effect**: 投票成功后的花朵飘落动画特效

## Requirements

### Requirement 1: 用户查看当前选择

**User Story:** 作为用户，我想查看当前进行中的选择活动，以便了解可以参与的选择。

#### Acceptance Criteria

1. WHEN a User访问首页, THE System SHALL display the Active_Poll with title, deadline, and all Options
2. IF no Active_Poll exists, THEN THE System SHALL display a message indicating no active polls
3. WHEN displaying Options, THE System SHALL show each Option with its current vote count and percentage
4. THE System SHALL display a progress bar for each Option using purple to pink gradient colors
5. THE System SHALL update the display to reflect real-time voting results

### Requirement 2: 用户参与选择

**User Story:** 作为用户，我想选择一个选项并提交，以便参与选择活动。

#### Acceptance Criteria

1. WHEN a User selects an Option and clicks submit, THE System SHALL record the Vote with the User's IP_Address
2. IF the User's IP_Address has already voted for the same Poll, THEN THE System SHALL reject the Vote and display an error message
3. IF the Poll deadline has passed, THEN THE System SHALL reject the Vote and display an error message
4. IF the Poll status is not active, THEN THE System SHALL reject the Vote and display an error message
5. WHEN a Vote is successfully recorded, THE System SHALL display a success message
6. WHEN a Vote is successfully recorded, THE System SHALL trigger the Flower_Effect animation with 150 flowers

### Requirement 3: 花朵特效动画

**User Story:** 作为用户，我想看到美观的动画特效，以便获得更好的交互体验。

#### Acceptance Criteria

1. WHEN a Vote is successfully submitted, THE System SHALL display 150 falling flowers based on the current month
2. WHEN the current month is January or February, THE System SHALL use snowflake emojis (❄️⛄)
3. WHEN the current month is March or April, THE System SHALL use cherry blossom emojis (🌸🌺)
4. WHEN the current month is May or June, THE System SHALL use rose emojis (🌹🌷)
5. WHEN the current month is July or August, THE System SHALL use sunflower emojis (🌻☀️)
6. WHEN the current month is September or October, THE System SHALL use maple leaf emojis (🍂🍁)
7. WHEN the current month is November or December, THE System SHALL use snowflake and star emojis (❄️⭐)
8. WHEN a User clicks anywhere on the page, THE System SHALL display a random flower emoji from 47 varieties with animation effects

### Requirement 4: 用户查看历史记录

**User Story:** 作为用户，我想查看已结束的选择活动及其结果，以便了解过往的选择情况。

#### Acceptance Criteria

1. WHEN a User navigates to the history tab, THE System SHALL display all Historical_Polls
2. WHEN displaying Historical_Polls, THE System SHALL show title, deadline, and final results for each Poll
3. WHEN displaying results, THE System SHALL show vote counts and percentages for all Options
4. THE System SHALL order Historical_Polls by creation date in descending order

### Requirement 5: 管理员登录认证

**User Story:** 作为管理员，我想通过隐藏路径登录管理后台，以便管理选择活动。

#### Acceptance Criteria

1. THE System SHALL provide an admin interface at the path `/sydqwy` (not `/admin`)
2. WHEN an Admin访问 `/sydqwy` without authentication, THE System SHALL display a login form
3. WHEN an Admin submits the password, THE System SHALL hash it using SHA-256 and compare with stored hash
4. IF the password hash matches, THEN THE System SHALL generate a JWT_Token with 24-hour expiration
5. IF the password hash does not match, THEN THE System SHALL reject the login and display an error message
6. THE System SHALL store the JWT_Token in the client for subsequent requests
7. WHEN a JWT_Token expires, THE System SHALL require the Admin to login again

### Requirement 6: 管理员创建选择

**User Story:** 作为管理员，我想创建新的选择活动，以便用户可以参与。

#### Acceptance Criteria

1. WHEN an authenticated Admin submits a new Poll, THE System SHALL validate that the title is not empty
2. WHEN an authenticated Admin submits a new Poll, THE System SHALL validate that at least 2 Options are provided
3. WHEN an authenticated Admin submits a new Poll, THE System SHALL validate that the deadline is in the future
4. WHEN an authenticated Admin submits a new Poll, THE System SHALL validate that all Option texts are not empty
5. WHEN validation passes, THE System SHALL create the Poll and all Options in a single database transaction
6. IF the transaction fails, THEN THE System SHALL rollback all changes and return an error message
7. WHEN a Poll is successfully created, THE System SHALL set its status to active

### Requirement 7: 管理员管理选择

**User Story:** 作为管理员，我想查看、修改和删除选择活动，以便管理系统内容。

#### Acceptance Criteria

1. WHEN an authenticated Admin访问管理后台, THE System SHALL display all Polls (both active and historical)
2. WHEN an authenticated Admin clicks edit on a Poll, THE System SHALL allow updating the title, deadline, and Options
3. WHEN an authenticated Admin updates a Poll, THE System SHALL validate the same rules as creation
4. WHEN an authenticated Admin clicks delete on a Poll, THE System SHALL display a confirmation dialog
5. WHEN an authenticated Admin confirms deletion, THE System SHALL delete the Poll and all associated Options and Votes
6. THE System SHALL use database CASCADE to ensure all related records are deleted

### Requirement 8: 数据持久化

**User Story:** 作为系统架构师，我想使用 PostgreSQL 数据库存储所有数据，以便确保数据可靠性和一致性。

#### Acceptance Criteria

1. THE System SHALL use a PostgreSQL Database with connection pooling
2. THE System SHALL store Polls in a `polls` table with id, title, deadline, status, created_at, and updated_at columns
3. THE System SHALL store Options in a `vote_options` table with id, poll_id, option_text, and display_order columns
4. THE System SHALL store Votes in a `votes` table with id, poll_id, option_id, ip_address, and voted_at columns
5. THE System SHALL enforce a UNIQUE constraint on (poll_id, ip_address) in the votes table
6. THE System SHALL use foreign key constraints with CASCADE delete for data integrity
7. THE System SHALL create indexes on frequently queried columns for performance

### Requirement 9: IP 地址提取

**User Story:** 作为系统开发者，我想准确提取用户的 IP 地址，以便实施投票限制。

#### Acceptance Criteria

1. WHEN extracting IP_Address, THE System SHALL first check the `x-forwarded-for` header
2. WHEN extracting IP_Address, THE System SHALL check the `x-real-ip` header if `x-forwarded-for` is not present
3. WHEN extracting IP_Address, THE System SHALL use the socket remote address if no proxy headers are present
4. WHEN multiple IPs are present in `x-forwarded-for`, THE System SHALL use the first IP in the list
5. THE System SHALL normalize IPv6 addresses to a consistent format

### Requirement 10: 响应式用户界面

**User Story:** 作为用户，我想在手机和桌面设备上都能正常使用系统，以便随时参与选择。

#### Acceptance Criteria

1. THE System SHALL provide a responsive design that adapts to mobile and desktop screen sizes
2. THE System SHALL use a purple gradient theme (#667eea → #764ba2) for branding
3. THE System SHALL display a navigation bar with two tabs: "当前选择" and "历史记录"
4. THE System SHALL NOT display a link to the admin interface in the user navigation
5. WHEN a User hovers over an Option, THE System SHALL highlight the entire option box
6. THE System SHALL use rounded corners, shadows, and gradients for a modern aesthetic
7. THE System SHALL display loading states during API requests

### Requirement 11: 错误处理

**User Story:** 作为用户，我想在发生错误时看到清晰的错误消息，以便了解问题所在。

#### Acceptance Criteria

1. WHEN a database error occurs, THE System SHALL log the error and return a generic error message to the client
2. WHEN a validation error occurs, THE System SHALL return a specific error message describing the validation failure
3. WHEN an authentication error occurs, THE System SHALL return a 401 status code with an error message
4. WHEN a resource is not found, THE System SHALL return a 404 status code with an error message
5. THE System SHALL handle database connection failures gracefully and attempt to reconnect

### Requirement 12: 安全性

**User Story:** 作为系统管理员，我想确保系统安全，以便防止未授权访问和数据泄露。

#### Acceptance Criteria

1. THE System SHALL store the admin password as a SHA-256 hash in environment variables
2. THE System SHALL use JWT tokens with a secret key stored in environment variables
3. THE System SHALL validate JWT tokens on all admin API endpoints
4. THE System SHALL use CORS middleware to control cross-origin requests
5. THE System SHALL sanitize user inputs to prevent SQL injection attacks
6. THE System SHALL use parameterized queries for all database operations
