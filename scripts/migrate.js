const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('开始数据库迁移...');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '..', 'migrations', '0001_initial_schema_postgres.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // 执行迁移
    await pool.query(sql);

    console.log('✅ 数据库迁移成功完成！');
    console.log('已创建表：polls, vote_options, votes');
    console.log('已创建索引和测试数据');
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
