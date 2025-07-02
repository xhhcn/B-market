const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { getServerQueries } = require('./database');

const router = express.Router();

// 速率限制 - 登录API
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 跳过信任代理检查，使用自定义键生成器
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // 使用更安全的IP获取方式
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// 密码加密相关函数
const generateSalt = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

const generateSessionToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// 验证密码强度
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符(@$!%*?&)' };
  }
  return { valid: true };
};

// 检查用户是否被锁定
const isUserLocked = (user) => {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
};

// 获取IP地址
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

// 中间件：验证会话
const authenticateSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.sessionToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        requireAuth: true
      });
    }

    const queries = getServerQueries();
    const session = queries.getSessionByToken.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: '会话已过期或无效',
        requireAuth: true
      });
    }

    // 将用户信息添加到请求中
    req.user = {
      id: session.user_id,
      username: session.username,
      isFirstLogin: session.is_first_login
    };
    req.sessionToken = token;

    next();
  } catch (error) {
    console.error('会话验证失败:', error);
    res.status(500).json({
      success: false,
      message: '认证过程出错'
    });
  }
};

// 检查是否为首次登录
router.get('/check-first-login', (req, res) => {
  try {
    const queries = getServerQueries();
    const user = queries.getUserByUsername.get('admin');
    
    res.json({
      success: true,
      isFirstLogin: !user // 如果没有用户，就是首次登录
    });
  } catch (error) {
    console.error('检查首次登录状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查登录状态失败'
    });
  }
});

// 首次设置密码
router.post('/setup-password', loginLimiter, (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    // 验证输入
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '请填写密码和确认密码'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致'
      });
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const queries = getServerQueries();
    
    // 检查是否已经有用户
    const existingUser = queries.getUserByUsername.get('admin');
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '系统已经初始化，请使用登录功能'
      });
    }

    // 创建用户
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    
    queries.createUser.run('admin', passwordHash, salt);

    // 创建会话
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    const newUser = queries.getUserByUsername.get('admin');
    queries.createSession.run(sessionToken, newUser.id, expiresAt.toISOString(), clientIP, userAgent);

    res.json({
      success: true,
      message: '密码设置成功',
      sessionToken,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('设置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '设置密码失败'
    });
  }
});

// 用户登录
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码'
      });
    }

    const queries = getServerQueries();
    const user = queries.getUserByUsername.get('admin');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在，请先设置密码'
      });
    }

    // 检查用户是否被锁定
    if (isUserLocked(user)) {
      const lockTime = new Date(user.locked_until);
      return res.status(423).json({
        success: false,
        message: `账户已被锁定，请在 ${lockTime.toLocaleString()} 后重试`
      });
    }

    // 验证密码
    const passwordHash = hashPassword(password, user.salt);
    if (passwordHash !== user.password_hash) {
      // 增加失败次数
      queries.incrementLoginAttempts.run(user.id);
      
      const attemptsLeft = Math.max(0, 5 - (user.login_attempts + 1));
      return res.status(401).json({
        success: false,
        message: `密码错误，还有 ${attemptsLeft} 次尝试机会`
      });
    }

    // 登录成功，更新登录信息
    queries.updateUserLogin.run(user.id);

    // 创建会话
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    queries.createSession.run(sessionToken, user.id, expiresAt.toISOString(), clientIP, userAgent);

    res.json({
      success: true,
      message: '登录成功',
      sessionToken,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录过程出错'
    });
  }
});

// 修改密码
router.post('/change-password', authenticateSession, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '请填写所有密码字段'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码和确认密码不一致'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同'
      });
    }

    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const queries = getServerQueries();
    const user = queries.getUserByUsername.get('admin');

    // 验证当前密码
    const currentPasswordHash = hashPassword(currentPassword, user.salt);
    if (currentPasswordHash !== user.password_hash) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 更新密码
    const newSalt = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);
    
    queries.updateUserPassword.run(newPasswordHash, newSalt, user.id);

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

// 验证会话
router.get('/verify', authenticateSession, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 退出登录
router.post('/logout', authenticateSession, (req, res) => {
  try {
    const queries = getServerQueries();
    queries.deleteSession.run(req.sessionToken);

    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    res.status(500).json({
      success: false,
      message: '退出失败'
    });
  }
});

// 清理过期会话（定时任务）
const cleanupExpiredSessions = () => {
  try {
    const queries = getServerQueries();
    queries.cleanExpiredSessions.run();
    console.log('🧹 已清理过期会话');
  } catch (error) {
    console.error('清理过期会话失败:', error);
  }
};

// 每小时清理一次过期会话
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  router,
  authenticateSession,
  cleanupExpiredSessions
}; 