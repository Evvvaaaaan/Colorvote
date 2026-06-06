function Footer({ onNavigate }) {
  const links = [
    { id: 'about', label: '소개' },
    { id: 'privacy', label: '개인정보처리방침' },
    { id: 'contact', label: '문의' },
  ];

  return (
    <footer style={{
      background: 'var(--canvas)',
      borderTop: '1px solid var(--hairline)',
      padding: '40px var(--sp-lg) 56px',
    }}>
      <div style={{
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        {/* Policy / info links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className="typo-caption"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                cursor: 'pointer',
                color: 'var(--ink-muted-48)',
                fontFamily: 'var(--font-body)',
                transition: 'color 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-muted-48)'; }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Copyright */}
        <div className="typo-fine-print" style={{ color: 'var(--ink-muted-48)', lineHeight: 1.5 }}>
          © {new Date().getFullYear()} ColorVote. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
