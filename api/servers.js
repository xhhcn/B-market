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

// 定时任务：自动更新服务器剩余价值和溢价信息
const updateServerValuesJob = async () => {
  console.log('🔄 开始定时更新服务器剩余价值和溢价信息（使用最新汇率）...');
  
  try {
    const serverQueries = getServerQueries();
    const servers = serverQueries.getAllServers.all();
    let updatedCount = 0;
    let skippedSoldCount = 0;
    
    for (const server of servers) {
      try {
        // 跳过已售服务器 - 已售服务器的数据应该保持在售出时刻的状态
        if (server.status === '已售') {
          skippedSoldCount++;
          console.log(`⏭️ 跳过已售服务器 ${server.merchant}（数据保持在售出时刻）`);
          continue;
        }
        
        // 跳过没有续费价格的服务器
        if (!server.renewal_price) {
          continue;
        }
        
        // 解析续费价格和货币
        const renewalPriceStr = server.renewal_price;
        const renewalCurrency = detectCurrencyFromPrice(renewalPriceStr);
        const renewalAmount = parseFloat(renewalPriceStr.replace(/[^0-9.]/g, ''));
        
        if (!renewalAmount || renewalAmount <= 0) {
          continue;
        }
        
        let newRemainingValue = '';
        let remainingValueCNY = 0;
        
        if (server.renewal_cycle === '永久') {
          // 永久服务器：剩余价值 = 续费价格
          remainingValueCNY = await convertCurrencyServer(renewalAmount, renewalCurrency, 'CNY');
          newRemainingValue = `${renewalAmount} ${renewalCurrency}`;
        } else if (server.expiration_date) {
          // 有期限的服务器：计算剩余价值（只对非已售服务器）
          const purchaseDate = calculatePurchaseDateServer(server.expiration_date, server.renewal_cycle);
          
          if (purchaseDate) {
            // 对于非已售服务器，使用当前日期计算
            let calculationDate = new Date();
            calculationDate.setHours(0, 0, 0, 0);
            
            const remainingRatio = calculateRemainingRatioServer(purchaseDate, new Date(server.expiration_date), calculationDate);
            const remainingValueOriginal = renewalAmount * remainingRatio;
            remainingValueCNY = await convertCurrencyServer(remainingValueOriginal, renewalCurrency, 'CNY');
            
            newRemainingValue = `${remainingValueOriginal.toFixed(2)} ${renewalCurrency}`;
          }
        }
        
        // 计算新的溢价信息
        let newPremiumValue = server.premium_value; // 默认保持原值
        
        if (server.sale_price && server.sale_price !== '-' && remainingValueCNY > 0) {
          try {
            const salePriceStr = server.sale_price;
            const saleCurrency = detectCurrencyFromPrice(salePriceStr);
            const saleAmount = parseFloat(salePriceStr.replace(/[^0-9.]/g, ''));
            
            if (saleAmount > 0) {
              const salePriceCNY = await convertCurrencyServer(saleAmount, saleCurrency, 'CNY');
              const premium = salePriceCNY - remainingValueCNY;
              newPremiumValue = `¥${premium.toFixed(2)}`;
            }
          } catch (error) {
            console.warn(`计算服务器 ${server.merchant} 溢价信息失败:`, error.message);
          }
        }
        
        // 更新数据库（包括剩余价值和溢价信息）
        if (newRemainingValue && (newRemainingValue !== server.remaining_value || newPremiumValue !== server.premium_value)) {
          serverQueries.updateServer.run(
            server.merchant,
            server.country_code,
            server.server_type,
            server.sort_order,
            server.cpu,
            server.memory,
            server.storage,
            server.traffic,
            server.sale_price,
            server.renewal_price,
            server.renewal_cycle,
            newRemainingValue, // 更新剩余价值
            newPremiumValue,   // 更新溢价信息
            server.expiration_date,
            server.status,
            server.telegram_link,
            server.nodeseek_link,
            server.tags,
            server.related_links,
            server.sold_exchange_rates,
            server.id
          );
          
          updatedCount++;
          console.log(`✅ 更新服务器 ${server.merchant}:`);
          console.log(`   剩余价值: ${server.remaining_value} -> ${newRemainingValue}`);
          console.log(`   溢价信息: ${server.premium_value} -> ${newPremiumValue}`);
        }
        
      } catch (error) {
        console.warn(`更新服务器 ${server.merchant} 失败:`, error.message);
      }
    }
    
    if (updatedCount > 0 || skippedSoldCount > 0) {
      console.log(`✅ 定时任务完成，已更新 ${updatedCount} 个服务器，跳过 ${skippedSoldCount} 个已售服务器`);
    } else {
      console.log('ℹ️ 定时任务完成，所有服务器的剩余价值和溢价信息都是最新的');
    }
    
  } catch (error) {
    console.error('❌ 定时更新任务失败:', error);
  }
};

// 辅助函数：从价格字符串中提取货币类型
function detectCurrencyFromPrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return 'CNY';
  
  // 检查是否包含货币代码
  const codeMatch = priceStr.match(/([A-Z]{3})/i);
  if (codeMatch) {
    return codeMatch[1].toUpperCase();
  }
  
  // 检查货币符号
  if (priceStr.includes('$')) return 'USD';
  if (priceStr.includes('€')) return 'EUR';
  if (priceStr.includes('£')) return 'GBP';
  if (priceStr.includes('¥')) return 'CNY';
  
  return 'CNY'; // 默认
}

// 服务器端货币转换函数
async function convertCurrencyServer(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const apiUrl = `https://open.er-api.com/v6/latest/${fromCurrency}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      return amount * data.rates[toCurrency];
    }
    
    return amount; // 如果获取失败，返回原值
  } catch (error) {
    console.warn(`汇率转换失败 ${fromCurrency} -> ${toCurrency}:`, error.message);
    return amount;
  }
}

// 服务器端购买日期计算
function calculatePurchaseDateServer(expirationDate, renewalCycle) {
  if (!expirationDate || !renewalCycle || renewalCycle === '永久') {
    return null;
  }
  
  const cycleMap = {
    '月付': 1, '季付': 3, '半年付': 6, '年付': 12,
    '两年付': 24, '三年付': 36, '五年付': 60
  };
  
  const months = cycleMap[renewalCycle] || 0;
  if (months === 0) return null;
  
  const expDate = new Date(expirationDate);
  const purchaseDate = new Date(expDate);
  purchaseDate.setMonth(purchaseDate.getMonth() - months);
  
  return purchaseDate;
}

// 服务器端剩余比例计算
function calculateRemainingRatioServer(purchaseDate, expirationDate, today = new Date()) {
  if (!purchaseDate || !expirationDate) return 0;
  
  const totalTime = expirationDate.getTime() - purchaseDate.getTime();
  const remainingTime = Math.max(0, expirationDate.getTime() - today.getTime());
  
  if (totalTime <= 0) return 0;
  
  const ratio = remainingTime / totalTime;
  return Math.max(0, Math.min(1, ratio));
}

// 启动定时任务
console.log('🕒 启动服务器剩余价值和溢价信息定时更新任务...');

// 服务器启动后5分钟执行第一次更新
setTimeout(updateServerValuesJob, 5 * 60 * 1000);

// 每12小时执行一次更新（每天执行2次）
setInterval(updateServerValuesJob, 12 * 60 * 60 * 1000);

console.log('✅ 定时任务已设置：每12小时自动更新一次服务器剩余价值和溢价信息');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 B-Market API服务器启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📡 外网地址: http://13.70.189.213:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/api/servers`);
  console.log(`💾 数据库连接成功`);
  console.log(`⏰ 定时任务：每12小时自动更新服务器剩余价值和溢价信息`);
});

module.exports = app; 