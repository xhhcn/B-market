const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径 - 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'servers.db');

// 确保数据目录存在
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ 数据目录已创建:', dataDir);
}
const db = new Database(dbPath);

// 创建用户认证表
const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL DEFAULT 'admin',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      is_first_login BOOLEAN DEFAULT 1,
      last_login_at DATETIME,
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(sql);
  console.log('✅ 用户认证表已创建');
};

// 创建会话表
const createSessionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;
  
  db.exec(sql);
  console.log('✅ 会话表已创建');
};

// 创建服务器表
const createServersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant TEXT NOT NULL,
      country_code TEXT DEFAULT 'cn',
      server_type TEXT DEFAULT '独服',
      sort_order INTEGER DEFAULT 999,
      cpu TEXT,
      memory TEXT,
      storage TEXT,
      sale_price TEXT,
      renewal_price TEXT,
      renewal_cycle TEXT,
      remaining_value TEXT,
      premium_value TEXT,
      expiration_date TEXT,
      status TEXT DEFAULT '出售',
      telegram_link TEXT,
      nodeseek_link TEXT,
      tags TEXT,
      related_links TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(sql);
  
  // 检查并添加 renewal_cycle 字段（如果不存在）
  try {
    db.exec('ALTER TABLE servers ADD COLUMN renewal_cycle TEXT');
    console.log('✅ 已添加 renewal_cycle 字段到数据库');
  } catch (error) {
    // 字段已存在或其他错误，忽略
    if (!error.message.includes('duplicate column name')) {
      console.log('ℹ️  renewal_cycle 字段已存在');
    }
  }
  
  // 检查并添加 status_changed_date 字段（如果不存在）
  try {
    db.exec('ALTER TABLE servers ADD COLUMN status_changed_date TEXT');
    console.log('✅ 已添加 status_changed_date 字段到数据库');
  } catch (error) {
    // 字段已存在或其他错误，忽略
    if (!error.message.includes('duplicate column name')) {
      console.log('ℹ️  status_changed_date 字段已存在');
    }
  }
  
  // 检查并添加 sold_exchange_rates 字段（如果不存在）
  try {
    db.exec('ALTER TABLE servers ADD COLUMN sold_exchange_rates TEXT');
    console.log('✅ 已添加 sold_exchange_rates 字段到数据库');
  } catch (error) {
    // 字段已存在或其他错误，忽略
    if (!error.message.includes('duplicate column name')) {
      console.log('ℹ️  sold_exchange_rates 字段已存在');
    }
  }
  
  // 检查并添加 traffic 字段（如果不存在）
  try {
    db.exec('ALTER TABLE servers ADD COLUMN traffic TEXT');
    console.log('✅ 已添加 traffic 字段到数据库');
  } catch (error) {
    // 字段已存在或其他错误，忽略
    if (!error.message.includes('duplicate column name')) {
      console.log('ℹ️  traffic 字段已存在');
    }
  }
};

// 初始化数据库
const initDatabase = () => {
  createUsersTable();
  createSessionsTable();
  createServersTable();
  
  // 初始化查询语句
  initQueries();
  
  // 数据库初始化完成，不插入任何初始数据
  console.log('✅ 数据库初始化完成');
};

// 数据库操作函数 - 延迟初始化
let serverQueries = null;

const initQueries = () => {
  if (!serverQueries) {
    serverQueries = {
      // 获取所有服务器
      getAllServers: db.prepare(`
        SELECT * FROM servers ORDER BY sort_order ASC, created_at ASC
      `),
      
      // 根据ID获取服务器
      getServerById: db.prepare(`
        SELECT * FROM servers WHERE id = ?
      `),
      
      // 添加服务器
      addServer: db.prepare(`
        INSERT INTO servers (
          merchant, country_code, server_type, sort_order, cpu, memory, storage, traffic,
          sale_price, renewal_price, renewal_cycle, remaining_value, premium_value, expiration_date,
          status, telegram_link, nodeseek_link, tags, related_links, sold_exchange_rates
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      // 添加服务器（包含状态变更日期）
      addServerWithStatusDate: db.prepare(`
        INSERT INTO servers (
          merchant, country_code, server_type, sort_order, cpu, memory, storage, traffic,
          sale_price, renewal_price, renewal_cycle, remaining_value, premium_value, expiration_date,
          status, telegram_link, nodeseek_link, tags, related_links, sold_exchange_rates, status_changed_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      // 更新服务器
      updateServer: db.prepare(`
        UPDATE servers SET
          merchant = ?, country_code = ?, server_type = ?, sort_order = ?, cpu = ?, memory = ?, storage = ?, traffic = ?,
          sale_price = ?, renewal_price = ?, renewal_cycle = ?, remaining_value = ?, premium_value = ?, expiration_date = ?,
          status = ?, telegram_link = ?, nodeseek_link = ?, tags = ?, related_links = ?, sold_exchange_rates = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      
      // 更新服务器状态（包含状态变更日期）
      updateServerWithStatusDate: db.prepare(`
        UPDATE servers SET
          merchant = ?, country_code = ?, server_type = ?, sort_order = ?, cpu = ?, memory = ?, storage = ?, traffic = ?,
          sale_price = ?, renewal_price = ?, renewal_cycle = ?, remaining_value = ?, premium_value = ?, expiration_date = ?,
          status = ?, telegram_link = ?, nodeseek_link = ?, tags = ?, related_links = ?, sold_exchange_rates = ?,
          status_changed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      
      // 删除服务器
      deleteServer: db.prepare(`
        DELETE FROM servers WHERE id = ?
      `),
      
      // 用户认证查询
      // 根据用户名获取用户
      getUserByUsername: db.prepare(`
        SELECT * FROM users WHERE username = ?
      `),
      
      // 创建用户（初次设置密码）
      createUser: db.prepare(`
        INSERT INTO users (username, password_hash, salt, is_first_login) 
        VALUES (?, ?, ?, 0)
      `),
      
      // 更新用户密码
      updateUserPassword: db.prepare(`
        UPDATE users SET 
          password_hash = ?, 
          salt = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `),
      
      // 更新登录信息
      updateUserLogin: db.prepare(`
        UPDATE users SET
          last_login_at = CURRENT_TIMESTAMP,
          login_attempts = 0,
          locked_until = NULL
        WHERE id = ?
      `),
      
      // 增加失败登录次数
      incrementLoginAttempts: db.prepare(`
        UPDATE users SET 
          login_attempts = login_attempts + 1,
          locked_until = CASE 
            WHEN login_attempts >= 4 THEN datetime('now', '+15 minutes')
            ELSE locked_until
          END
        WHERE id = ?
      `),
      
      // 会话管理查询
      // 创建会话
      createSession: db.prepare(`
        INSERT INTO sessions (session_token, user_id, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `),
      
      // 根据token获取会话
      getSessionByToken: db.prepare(`
        SELECT s.*, u.username, u.is_first_login 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.session_token = ? AND s.expires_at > datetime('now')
      `),
      
      // 删除会话
      deleteSession: db.prepare(`
        DELETE FROM sessions WHERE session_token = ?
      `),
      
      // 清理过期会话
      cleanExpiredSessions: db.prepare(`
        DELETE FROM sessions WHERE expires_at <= datetime('now')
      `)
    };
  }
  return serverQueries;
};

// 格式化数据库数据为前端格式
const formatServerData = (server) => {
  if (!server) return null;
  
  return {
    id: server.id,
    merchant: server.merchant,
    countryCode: server.country_code,
    serverType: server.server_type,
    sortOrder: server.sort_order,
    cpu: server.cpu,
    memory: server.memory,
    storage: server.storage,
    traffic: server.traffic,
    salePrice: server.sale_price,
    renewalPrice: server.renewal_price,
    renewalCycle: server.renewal_cycle,
    remainingValue: server.remaining_value,
    premiumValue: server.premium_value,
    expirationDate: server.expiration_date,
    status: server.status,
    telegramLink: server.telegram_link,
    nodeseekLink: server.nodeseek_link,
    tags: server.tags ? JSON.parse(server.tags) : [],
    relatedLinks: server.related_links ? JSON.parse(server.related_links) : [],
    statusChangedDate: server.status_changed_date,
    soldExchangeRates: server.sold_exchange_rates ? JSON.parse(server.sold_exchange_rates) : null,
    createdAt: server.created_at,
    updatedAt: server.updated_at
  };
};

module.exports = {
  db,
  initDatabase,
  getServerQueries: () => initQueries(),
  formatServerData
}; 