export default function Footer() {
  const footerStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50
  };

  const footerContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 20px',
    textAlign: 'center'
  };

  const paragraphStyle = {
    color: '#6b7280',
    fontSize: '0.8125rem',
    margin: 0
  };

  return (
    <footer style={footerStyle}>
      <div style={footerContentStyle}>
        <p style={paragraphStyle}>
          Powered by @xhh1128
        </p>
      </div>
    </footer>
  );
} 