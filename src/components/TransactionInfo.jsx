import { useState } from 'react';
import { ArrowDownIcon } from './Icons.jsx';

export default function TransactionInfo({ server }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = {
    configItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '0',
      cursor: 'pointer'
    },
    configIcon: {
      width: '16px',
      height: '16px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      transition: 'transform 0.3s ease',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
    },
    configText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500'
    },
    transactionContent: {
      marginTop: '8px',
      overflow: 'hidden',
      transition: 'all 0.3s ease-out',
      opacity: isExpanded ? 1 : 0,
      maxHeight: isExpanded ? '500px' : '0px',
      paddingBottom: isExpanded ? '4px' : '0px'
    },
    transactionInfoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px 16px'
    },
    transactionInfoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: '0'
    },
    label: {
      fontSize: '0.75rem',
      color: '#6b7280',
      fontWeight: '500',
      lineHeight: '1.2'
    },
    span: {
      fontSize: '0.875rem',
      color: '#1a1a1a',
      fontWeight: '500',
      lineHeight: '1.3'
    },
    price: {
      fontSize: '0.875rem',
      color: '#dc2626',
      fontWeight: '600',
      lineHeight: '1.3'
    },
    value: {
      fontSize: '0.875rem',
      color: '#059669',
      fontWeight: '600',
      lineHeight: '1.3'
    },
    permanent: {
      fontSize: '0.875rem',
      color: '#7c3aed',
      fontWeight: '600',
      lineHeight: '1.3'
    }
  };

  // 响应式样式调整
  const getResponsiveStyles = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      
      if (width <= 480) {
        return {
          ...styles,
          transactionContent: {
            ...styles.transactionContent,
            marginTop: '0px'
          },
          transactionInfoGrid: {
            ...styles.transactionInfoGrid,
            gridTemplateColumns: '1fr 1fr',
            gap: '6px 12px'
          },
          transactionInfoItem: {
            ...styles.transactionInfoItem,
            gap: '1px'
          },
          label: {
            ...styles.label,
            fontSize: '0.6875rem'
          },
          span: {
            ...styles.span,
            fontSize: '0.8125rem'
          },
          price: {
            ...styles.price,
            fontSize: '0.8125rem'
          },
          value: {
            ...styles.value,
            fontSize: '0.8125rem'
          },
          permanent: {
            ...styles.permanent,
            fontSize: '0.8125rem'
          }
        };
      } else if (width <= 768) {
        return {
          ...styles,
          transactionContent: {
            ...styles.transactionContent,
            marginTop: '0px'
          },
          transactionInfoGrid: {
            ...styles.transactionInfoGrid,
            gap: '7px 12px'
          },
          transactionInfoItem: {
            ...styles.transactionInfoItem,
            gap: '2px'
          },
          label: {
            ...styles.label,
            fontSize: '0.75rem'
          },
          span: {
            ...styles.span,
            fontSize: '0.8125rem'
          },
          price: {
            ...styles.price,
            fontSize: '0.8125rem'
          },
          value: {
            ...styles.value,
            fontSize: '0.8125rem'
          },
          permanent: {
            ...styles.permanent,
            fontSize: '0.8125rem'
          }
        };
      } else if (width <= 900) {
        return {
          ...styles,
          transactionInfoGrid: {
            ...styles.transactionInfoGrid,
            gap: '8px 15px'
          },
          label: {
            ...styles.label,
            fontSize: '0.8125rem'
          },
          span: {
            ...styles.span,
            fontSize: '0.9375rem'
          },
          price: {
            ...styles.price,
            fontSize: '0.9375rem'
          },
          value: {
            ...styles.value,
            fontSize: '0.9375rem'
          },
          permanent: {
            ...styles.permanent,
            fontSize: '0.9375rem'
          }
        };
      }
    }
    return styles;
  };

  const currentStyles = getResponsiveStyles();

  return (
    <>
      <div 
        style={currentStyles.configItem}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={currentStyles.configIcon}>
          <ArrowDownIcon />
        </div>
        <span style={currentStyles.configText}>交易信息</span>
      </div>
      
      {isExpanded && (
        <div style={currentStyles.transactionContent}>
          <div style={currentStyles.transactionInfoGrid}>
            <div style={currentStyles.transactionInfoItem}>
              <span style={currentStyles.label}>续费价格</span>
              <span className="renewal-price" style={currentStyles.price}>{server.renewalPrice}</span>
            </div>
            
            <div style={currentStyles.transactionInfoItem}>
              <span style={currentStyles.label}>到期日期</span>
              <span className="expiration-date" style={server.renewalCycle === '永久' ? currentStyles.permanent : currentStyles.span}>
                {server.renewalCycle === '永久' ? '永久有效' : (server.expirationDate || '未设置')}
              </span>
            </div>
            
            <div style={currentStyles.transactionInfoItem}>
              <span style={currentStyles.label}>剩余价值</span>
              <span className="remaining-value" style={currentStyles.value}>{server.remainingValue}</span>
            </div>
            
            <div style={currentStyles.transactionInfoItem}>
              <span style={currentStyles.label}>溢价信息</span>
              <span className="premium-value" style={currentStyles.value}>{server.premiumValue}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 