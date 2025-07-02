// 安全配置和验证函数
const validator = require('validator');

// 安全常量
const SECURITY_CONSTANTS = {
  MAX_MERCHANT_LENGTH: 100,
  MAX_INPUT_LENGTH: 500,
  MAX_URL_LENGTH: 2000,
  MIN_SORT_ORDER: 0,
  MAX_SORT_ORDER: 9999,
  ALLOWED_SERVER_TYPES: ['独服', 'KVM', 'LXC', 'VPS'],
  ALLOWED_STATUS: ['出售', '已售', '暂停'],
  ALLOWED_RENEWAL_CYCLES: ['月', '季', '半年', '年', '永久']
};

// 输入验证函数
const validateInput = {
  // 验证商家名称
  merchant: (value) => {
    if (!value || typeof value !== 'string') {
      return { valid: false, message: '商家名称为必填项' };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return { valid: false, message: '商家名称不能为空' };
    }
    if (trimmed.length > SECURITY_CONSTANTS.MAX_MERCHANT_LENGTH) {
      return { valid: false, message: `商家名称不能超过${SECURITY_CONSTANTS.MAX_MERCHANT_LENGTH}个字符` };
    }
    return { valid: true, value: trimmed };
  },

  // 验证服务器类型
  serverType: (value) => {
    if (value && !SECURITY_CONSTANTS.ALLOWED_SERVER_TYPES.includes(value)) {
      return { valid: false, message: '无效的服务器类型' };
    }
    return { valid: true, value: value || '独服' };
  },

  // 验证状态
  status: (value) => {
    if (value && !SECURITY_CONSTANTS.ALLOWED_STATUS.includes(value)) {
      return { valid: false, message: '无效的状态' };
    }
    return { valid: true, value: value || '出售' };
  },

  // 验证排序顺序
  sortOrder: (value) => {
    if (value !== undefined && value !== null && value !== '') {
      const num = parseInt(value);
      if (isNaN(num) || num < SECURITY_CONSTANTS.MIN_SORT_ORDER || num > SECURITY_CONSTANTS.MAX_SORT_ORDER) {
        return { valid: false, message: `排序顺序必须是${SECURITY_CONSTANTS.MIN_SORT_ORDER}-${SECURITY_CONSTANTS.MAX_SORT_ORDER}之间的整数` };
      }
      return { valid: true, value: num };
    }
    return { valid: true, value: 1 };
  },

  // 验证URL
  url: (value, fieldName) => {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > SECURITY_CONSTANTS.MAX_URL_LENGTH) {
        return { valid: false, message: `${fieldName}链接长度不能超过${SECURITY_CONSTANTS.MAX_URL_LENGTH}个字符` };
      }
      if (trimmed && !validator.isURL(trimmed, { protocols: ['http', 'https'] })) {
        return { valid: false, message: `${fieldName}必须是有效的HTTP/HTTPS链接` };
      }
      return { valid: true, value: trimmed || null };
    }
    return { valid: true, value: null };
  },

  // 验证通用文本字段
  text: (value, fieldName, maxLength = SECURITY_CONSTANTS.MAX_INPUT_LENGTH) => {
    if (value && typeof value === 'string') {
      if (value.length > maxLength) {
        return { valid: false, message: `${fieldName}不能超过${maxLength}个字符` };
      }
      return { valid: true, value: value.trim() };
    }
    return { valid: true, value: value || '' };
  },

  // 验证日期
  date: (value, fieldName) => {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && !validator.isDate(trimmed, { format: 'YYYY-MM-DD', strictMode: true })) {
        return { valid: false, message: `${fieldName}必须是有效的日期格式(YYYY-MM-DD)` };
      }
      return { valid: true, value: trimmed || null };
    }
    return { valid: true, value: null };
  },

  // 验证标签数组
  tags: (value) => {
    if (Array.isArray(value)) {
      if (value.length > 20) {
        return { valid: false, message: '标签数量不能超过20个' };
      }
      const validTags = value.filter(tag => 
        typeof tag === 'string' && 
        tag.trim().length > 0 && 
        tag.trim().length <= 50
      );
      return { valid: true, value: validTags };
    }
    return { valid: true, value: [] };
  },

  // 验证相关链接数组
  relatedLinks: (value) => {
    if (Array.isArray(value)) {
      if (value.length > 10) {
        return { valid: false, message: '相关链接数量不能超过10个' };
      }
      for (const link of value) {
        if (!link.name || !link.url || typeof link.name !== 'string' || typeof link.url !== 'string') {
          return { valid: false, message: '相关链接格式不正确' };
        }
        if (link.name.length > 100 || link.url.length > SECURITY_CONSTANTS.MAX_URL_LENGTH) {
          return { valid: false, message: '相关链接名称或URL过长' };
        }
        if (!validator.isURL(link.url, { protocols: ['http', 'https'] })) {
          return { valid: false, message: '相关链接URL格式不正确' };
        }
      }
      return { valid: true, value };
    }
    return { valid: true, value: [] };
  }
};

// 验证服务器数据的完整函数
const validateServerData = (data) => {
  const errors = [];
  const validatedData = {};

  // 验证所有字段
  const validations = [
    { field: 'merchant', validator: validateInput.merchant },
    { field: 'serverType', validator: validateInput.serverType },
    { field: 'status', validator: validateInput.status },
    { field: 'sortOrder', validator: validateInput.sortOrder },
    { field: 'cpu', validator: (v) => validateInput.text(v, 'CPU', 50) },
    { field: 'memory', validator: (v) => validateInput.text(v, '内存', 50) },
    { field: 'storage', validator: (v) => validateInput.text(v, '存储', 100) },
    { field: 'traffic', validator: (v) => validateInput.text(v, '流量', 100) },
    { field: 'salePrice', validator: (v) => validateInput.text(v, '售价', 50) },
    { field: 'renewalPrice', validator: (v) => validateInput.text(v, '续费价格', 50) },
    { field: 'renewalCycle', validator: (v) => validateInput.text(v, '续费周期', 20) },
    { field: 'remainingValue', validator: (v) => validateInput.text(v, '剩余价值', 50) },
    { field: 'premiumValue', validator: (v) => validateInput.text(v, '溢价', 50) },
    { field: 'expirationDate', validator: (v) => validateInput.date(v, '到期日期') },
    { field: 'statusChangedDate', validator: (v) => validateInput.date(v, '状态变更日期') },
    { field: 'telegramLink', validator: (v) => validateInput.url(v, 'Telegram') },
    { field: 'nodeseekLink', validator: (v) => validateInput.url(v, 'NodeSeek') },
    { field: 'tags', validator: validateInput.tags },
    { field: 'relatedLinks', validator: validateInput.relatedLinks }
  ];

  for (const { field, validator } of validations) {
    const result = validator(data[field]);
    if (!result.valid) {
      errors.push(result.message);
    } else {
      validatedData[field] = result.value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validatedData
  };
};

// 清理HTML输入以防止XSS
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// 验证和清理对象中的所有字符串字段
const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

module.exports = {
  SECURITY_CONSTANTS,
  validateInput,
  validateServerData,
  sanitizeHtml,
  sanitizeObject
}; 