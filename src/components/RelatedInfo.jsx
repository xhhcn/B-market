import { useState } from 'react';
import { ArrowDownIcon } from './Icons.jsx';

export default function RelatedInfo({ server }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 检查是否有相关信息需要显示
  const hasTags = server.tags && server.tags.length > 0 && server.tags.some(tag => tag && tag.trim() !== '');
  const hasRelatedLinks = server.relatedLinks && server.relatedLinks.length > 0 && 
    server.relatedLinks.some(link => link && link.name && link.name.trim() !== '' && link.url && link.url.trim() !== '');
  
  // 如果没有任何相关信息，不显示组件
  if (!hasTags && !hasRelatedLinks) {
    return null;
  }

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
      transition: 'transform 0.2s ease',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
    },
    configText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500'
    },
    relatedContent: {
      marginTop: '0px',
      animation: 'slideDown 0.3s ease-out'
    },
    tagsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: hasRelatedLinks ? '14px' : '0'
    },
    linksSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500'
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    tag: {
      background: 'rgba(243, 244, 246, 0.8)',
      color: '#374151',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.8125rem',
      fontWeight: '500',
      border: '1px solid rgba(229, 231, 235, 0.8)'
    },
    links: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px'
    },
    link: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      color: '#3b82f6',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'color 0.2s ease'
    },
    linkIcon: {
      width: '12px',
      height: '12px',
      opacity: '0.7'
    }
  };

  // 响应式样式调整
  const getResponsiveStyles = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      
      if (width <= 480) {
        return {
          ...styles,
          label: {
            ...styles.label,
            fontSize: '0.75rem'
          },
          tag: {
            ...styles.tag,
            fontSize: '0.75rem',
            padding: '3px 8px'
          },
          link: {
            ...styles.link,
            fontSize: '0.75rem'
          }
        };
      } else if (width <= 768) {
        return {
          ...styles,
          label: {
            ...styles.label,
            fontSize: '0.75rem'
          },
          tag: {
            ...styles.tag,
            fontSize: '0.75rem',
            padding: '3px 8px'
          },
          link: {
            ...styles.link,
            fontSize: '0.75rem'
          }
        };
      } else if (width <= 900) {
        return {
          ...styles,
          label: {
            ...styles.label,
            fontSize: '0.8125rem'
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
        <span style={currentStyles.configText}>相关信息</span>
      </div>
      
      {isExpanded && (
        <div style={currentStyles.relatedContent}>
          {hasTags && (
            <div style={currentStyles.tagsSection}>
              <span style={currentStyles.label}>特点标签</span>
              <div style={currentStyles.tags}>
                {server.tags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                  <span key={index} style={currentStyles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {hasRelatedLinks && (
            <div style={currentStyles.linksSection}>
              <span style={currentStyles.label}>相关链接</span>
              <div style={currentStyles.links}>
                {server.relatedLinks.filter(link => link && link.name && link.name.trim() !== '' && link.url && link.url.trim() !== '').map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    style={currentStyles.link}
                    onMouseOver={(e) => e.target.style.color = '#1d4ed8'}
                    onMouseOut={(e) => e.target.style.color = '#3b82f6'}
                  >
                    {link.name}
                    <svg style={currentStyles.linkIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 