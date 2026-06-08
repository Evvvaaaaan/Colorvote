import { CV_COLORS } from '../data';

// 투표 전 결과(지도·통계)를 블러로 가리고, 칩을 눌러 투표를 유도하는 래퍼.
// locked=false면 자식을 그대로 노출한다.
const TEASER_DOTS = [16, 8, 1, 10, 6, 18]; // 칩 위 미리보기용 컬러 점

function ResultGate({ locked, onUnlock, children }) {
  if (!locked) return children;

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* 블러 처리된 실제 결과 (살짝 비치는 보상 미끼) */}
      <div
        aria-hidden="true"
        style={{
          filter: 'blur(14px)',
          transform: 'scale(1.04)',
          pointerEvents: 'none',
          userSelect: 'none',
          height: '100%',
        }}
      >
        {children}
      </div>

      {/* 잠금 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.8) 100%)',
        backdropFilter: 'saturate(120%) blur(2px)',
        WebkitBackdropFilter: 'saturate(120%) blur(2px)',
      }}>
        {/* 컬러 점 미리보기 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {TEASER_DOTS.map(id => {
            const c = CV_COLORS.find(col => col.id === id);
            if (!c) return null;
            return (
              <div
                key={id}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: c.hex,
                  boxShadow: `0 0 12px ${c.hex}`,
                }}
              />
            );
          })}
        </div>

        <div>
          <div className="typo-display-md" style={{ color: 'var(--body-on-dark)', fontWeight: 700, marginBottom: '10px' }}>
            결과가 잠겨 있어요
          </div>
          <p className="typo-body" style={{ color: 'var(--ink-muted-80)', maxWidth: '320px', margin: '0 auto' }}>
            우리 지역의 색은 어떤 색일까요?<br />
            한 번의 선택으로 전국 결과가 열립니다.
          </p>
        </div>

        {/* CTA 칩 */}
        <button
          onClick={onUnlock}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--primary)',
            color: '#ffffff',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '-0.3px',
            border: 'none',
            borderRadius: 'var(--rounded-pill)',
            padding: '15px 28px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(41,151,255,0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(41,151,255,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(41,151,255,0.4)';
          }}
        >
          {/* 자물쇠 아이콘 */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          당신의 지역 색깔을 고르세요
        </button>
      </div>
    </div>
  );
}

export default ResultGate;
