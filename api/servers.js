const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { initDatabase, getServerQueries, formatServerData } = require('./database');
const { router: authRouter, authenticateSession } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
initDatabase();

// 安全头中间件
app.use((req, res, next) => {
  // 安全响应头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // 禁用服务器信息泄露
  res.removeHeader('X-Powered-By');
  
  next();
});

// 中间件
app.use(cors({
  origin: [
    'http://localhost:4321', 
    'http://localhost:3000', 
    'http://127.0.0.1:4321',
    'http://13.70.189.213:4321'  // 外部访问地址
  ],
  credentials: true,
  optionsSuccessStatus: 200 // 支持老浏览器
}));

// 限制请求体大小防止DoS攻击
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// 设置信任代理以正确获取客户端IP - 使用更安全的配置
app.set('trust proxy', 1); // 信任第一个代理

// 全局API速率限制
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

app.use('/api', apiLimiter);

// 认证路由
app.use('/api/auth', authRouter);

// API 路由

// 获取所有服务器
app.get('/api/servers', (req, res) => {
  try {
    const serverQueries = getServerQueries();
    const servers = serverQueries.getAllServers.all();
    const formattedServers = servers.map(formatServerData);
    
    res.json({
      success: true,
      data: formattedServers,
      total: formattedServers.length
    });
  } catch (error) {
    console.error('获取服务器列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务器列表失败',
      error: error.message
    });
  }
});

// 根据ID获取服务器
app.get('/api/servers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的服务器ID'
      });
    }
    
    const serverQueries = getServerQueries();
    const server = serverQueries.getServerById.get(id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    res.json({
      success: true,
      data: formatServerData(server)
    });
  } catch (error) {
    console.error('获取服务器详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务器详情失败',
      error: error.message
    });
  }
});

// 添加服务器（需要认证）
app.post('/api/servers', authenticateSession, (req, res) => {
  try {
    const {
      merchant,
      countryCode,
      serverType,
      sortOrder,
      cpu,
      memory,
      storage,
      traffic,
      salePrice,
      renewalPrice,
      renewalCycle,
      remainingValue,
      premiumValue,
      expirationDate,
      status = '出售',
      statusChangedDate,
      telegramLink,
      nodeseekLink,
      tags = [],
      relatedLinks = [],
      soldExchangeRates = null
    } = req.body;
    
    // 验证必填字段
    if (!merchant) {
      return res.status(400).json({
        success: false,
        message: '商家名称为必填项'
      });
    }
    
    // 插入数据库
    const serverQueries = getServerQueries();
    let result;
    
    // 检查是否需要设置状态变更日期
    if (status === '已售') {
      // 确定要使用的状态变更日期
      let statusDateToUse = statusChangedDate;
      if (!statusDateToUse) {
        // 如果没有提供日期，使用当前日期
        const now = new Date();
        statusDateToUse = now.getFullYear() + '-' + 
          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
          String(now.getDate()).padStart(2, '0');
        console.log('添加已售服务器，使用当前日期:', statusDateToUse);
      } else {
        console.log('添加已售服务器，使用自定义日期:', statusDateToUse);
      }
      
      // 使用包含状态变更日期的查询
      result = serverQueries.addServerWithStatusDate.run(
        merchant,
        countryCode || 'cn',
        serverType || '独服',
        parseInt(sortOrder) || 1,
        cpu || '',
        memory || '',
        storage || '',
        traffic || '',
        salePrice || '',
        renewalPrice || '',
        renewalCycle || '',
        remainingValue || '',
        premiumValue || '',
        expirationDate || '',
        status,
        telegramLink || null,
        nodeseekLink || null,
        JSON.stringify(tags),
        JSON.stringify(relatedLinks),
        soldExchangeRates ? JSON.stringify(soldExchangeRates) : null,
        statusDateToUse
      );
    } else {
      // 普通添加（不包含状态变更日期）
      result = serverQueries.addServer.run(
        merchant,
        countryCode || 'cn',
        serverType || '独服',
        parseInt(sortOrder) || 1,
        cpu || '',
        memory || '',
        storage || '',
        traffic || '',
        salePrice || '',
        renewalPrice || '',
        renewalCycle || '',
        remainingValue || '',
        premiumValue || '',
        expirationDate || '',
        status,
        telegramLink || null,
        nodeseekLink || null,
        JSON.stringify(tags),
        JSON.stringify(relatedLinks),
        soldExchangeRates ? JSON.stringify(soldExchangeRates) : null
      );
    }
    
    // 获取新创建的服务器
    const newServer = serverQueries.getServerById.get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      message: '服务器添加成功',
      data: formatServerData(newServer)
    });
  } catch (error) {
    console.error('添加服务器失败:', error);
    res.status(500).json({
      success: false,
      message: '添加服务器失败',
      error: error.message
    });
  }
});

// 更新服务器（需要认证）
app.put('/api/servers/:id', authenticateSession, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的服务器ID'
      });
    }
    
    // 检查服务器是否存在
    const serverQueries = getServerQueries();
    const existingServer = serverQueries.getServerById.get(id);
    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    const {
      merchant,
      countryCode,
      serverType,
      sortOrder,
      cpu,
      memory,
      storage,
      traffic,
      salePrice,
      renewalPrice,
      renewalCycle,
      remainingValue,
      premiumValue,
      expirationDate,
      status,
      statusChangedDate,
      telegramLink,
      nodeseekLink,
      tags = [],
      relatedLinks = [],
      soldExchangeRates = null
    } = req.body;
    
    // 验证必填字段
    if (!merchant) {
      return res.status(400).json({
        success: false,
        message: '商家名称为必填项'
      });
    }
    
    // 检查状态是否发生变更
    const newStatus = status || '出售';
    const statusChanged = existingServer.status !== newStatus;
    
    // 检查是否需要设置状态变更日期
    const needsStatusDate = statusChanged || (newStatus === '已售' && !existingServer.status_changed_date) || statusChangedDate;
    
    // 确定要使用的状态变更日期
    let statusDateToUse = null;
    if (needsStatusDate) {
      if (statusChangedDate) {
        // 使用前端传递的自定义日期
        statusDateToUse = statusChangedDate;
        console.log('使用前端自定义日期:', statusChangedDate);
      } else {
        // 使用当前系统日期
        const now = new Date();
        statusDateToUse = now.getFullYear() + '-' + 
          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
          String(now.getDate()).padStart(2, '0');
        console.log('使用系统当前日期:', statusDateToUse);
      }
      
      // 更新数据库（包含状态变更日期）
      serverQueries.updateServerWithStatusDate.run(
        merchant,
        countryCode || 'cn',
        serverType || '独服',
        parseInt(sortOrder) || 1,
        cpu || '',
        memory || '',
        storage || '',
        traffic || '',
        salePrice || '',
        renewalPrice || '',
        renewalCycle || '',
        remainingValue || '',
        premiumValue || '',
        expirationDate || '',
        newStatus,
        telegramLink || null,
        nodeseekLink || null,
        JSON.stringify(tags),
        JSON.stringify(relatedLinks),
        soldExchangeRates ? JSON.stringify(soldExchangeRates) : null,
        statusDateToUse,
        id
      );
    } else {
      // 状态未变更，使用普通更新
      serverQueries.updateServer.run(
        merchant,
        countryCode || 'cn',
        serverType || '独服',
        parseInt(sortOrder) || 1,
        cpu || '',
        memory || '',
        storage || '',
        traffic || '',
        salePrice || '',
        renewalPrice || '',
        renewalCycle || '',
        remainingValue || '',
        premiumValue || '',
        expirationDate || '',
        newStatus,
        telegramLink || null,
        nodeseekLink || null,
        JSON.stringify(tags),
        JSON.stringify(relatedLinks),
        soldExchangeRates ? JSON.stringify(soldExchangeRates) : null,
        id
      );
    }
    
    // 获取更新后的服务器
    const updatedServer = serverQueries.getServerById.get(id);
    
    res.json({
      success: true,
      message: '服务器更新成功',
      data: formatServerData(updatedServer)
    });
  } catch (error) {
    console.error('更新服务器失败:', error);
    res.status(500).json({
      success: false,
      message: '更新服务器失败',
      error: error.message
    });
  }
});

// 删除服务器（需要认证）
app.delete('/api/servers/:id', authenticateSession, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的服务器ID'
      });
    }
    
    // 检查服务器是否存在
    const serverQueries = getServerQueries();
    const existingServer = serverQueries.getServerById.get(id);
    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 删除服务器
    serverQueries.deleteServer.run(id);
    
    res.json({
      success: true,
      message: '服务器删除成功'
    });
  } catch (error) {
    console.error('删除服务器失败:', error);
    res.status(500).json({
      success: false,
      message: '删除服务器失败',
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'B-Market API'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API路径不存在'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  // 不泄露敏感错误信息
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    ...(isDev && { error: error.message, stack: error.stack })
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 B-Market API服务器启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📡 外网地址: http://13.70.189.213:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/api/servers`);
  console.log(`💾 数据库连接成功`);
});

module.exports = app; 