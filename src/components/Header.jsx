import { AdminIcon, CalculatorIcon } from './Icons.jsx';
import { useState, useEffect } from 'react';

// B-Market Logo Component - 简约扁平化设计
const BMarketLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 外圈 - 代表市场/平台 */}
    <rect x="2" y="2" width="28" height="28" rx="8" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2"/>
    
    {/* 字母B的主体 */}
    <rect x="8" y="8" width="3" height="16" rx="1.5" fill="#f59e0b"/>
    
    {/* B的上半部分 */}
    <rect x="11" y="8" width="8" height="3" rx="1.5" fill="#f59e0b"/>
    <rect x="17" y="11" width="3" height="3" rx="1.5" fill="#f59e0b"/>
    
    {/* B的中间连接 */}
    <rect x="11" y="14" width="6" height="2" rx="1" fill="#f59e0b"/>
    
    {/* B的下半部分 */}
    <rect x="17" y="16" width="3" height="5" rx="1.5" fill="#f59e0b"/>
    <rect x="11" y="21" width="8" height="3" rx="1.5" fill="#f59e0b"/>
    
    {/* 装饰点 - 代表网络连接 */}
    <circle cx="24" cy="12" r="2" fill="#dc2626"/>
    <circle cx="24" cy="20" r="2" fill="#dc2626"/>
  </svg>
);

export default function Header() {
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初始检查
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const headerContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const siteTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    letterSpacing: '-0.025em'
  };

  const buttonsContainerStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  };

  const iconButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#374151',
    textDecoration: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    fontSize: '14px'
  };



  const calculatorButtonStyle = {
    ...iconButtonStyle,
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#374151'
  };

  return (
    <header style={headerStyle}>
      <div style={headerContentStyle}>
        <div style={logoContainerStyle}>
          <BMarketLogo />
          <h1 style={siteTitleStyle}>B-Market</h1>
        </div>
        <div style={buttonsContainerStyle}>
          <button 
            style={calculatorButtonStyle}
            onClick={() => window.openCalculatorModal && window.openCalculatorModal()}
            title="剩余价值计算器"
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <CalculatorIcon />
          </button>
          {!isMobile && (
            <a 
              href="/admin" 
              className="admin-button"
              style={iconButtonStyle}
              title="进入管理后台"
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <AdminIcon />
            </a>
          )}
        </div>
      </div>
    </header>
  );
} 