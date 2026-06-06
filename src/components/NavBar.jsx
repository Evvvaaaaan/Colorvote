function NavBar({ currentPage, onNavigate, hasVoted }) {
  const tabs = [
    { id: 'vote', label: '투표' },
    { id: 'result', label: '결과' },
    { id: 'map', label: '지도' },
    { id: 'stats', label: '통계' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      {/* Frosted Sub Nav — Single Main Dark Header */}
      <nav style={{
        height: '64px',
        background: 'rgba(22, 22, 23, 0.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.3s ease',
      }}>
        <div style={{
          maxWidth: '980px',
          width: '100%',
          margin: '0 auto',
          padding: '0 var(--sp-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand Logo */}
          <span
            onClick={() => onNavigate('vote')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ColorVote
          </span>

          {/* Navigation Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}>
            {tabs.map(tab => {
              const active = currentPage === tab.id;
              const locked = tab.id === 'result' && !hasVoted;

              return (
                <button
                  key={tab.id}
                  onClick={() => !locked && onNavigate(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 0',
                    margin: '0',
                    cursor: locked ? 'default' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    lineHeight: 1.43,
                    letterSpacing: '-0.224px',
                    color: active ? 'var(--primary)' : 'var(--ink-muted-48)',
                    opacity: locked ? 0.35 : 1,
                    position: 'relative',
                    transition: 'color 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!locked && !active) {
                      e.currentTarget.style.color = 'var(--ink)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!locked && !active) {
                      e.currentTarget.style.color = 'var(--ink-muted-48)';
                    }
                  }}
                >
                  {tab.label}
                  {/* Subtle active line indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'var(--primary)',
                      borderRadius: '1px',
                      boxShadow: '0 0 8px rgba(41,151,255,0.4)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 640px) {
          nav > div {
            padding: 0 16px !important;
          }
          nav > div > div {
            gap: 18px !important;
          }
          nav > div > span {
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default NavBar;
