import { useState } from 'react';
import { CV_COLORS, CV_REGIONS, CV_AGE_GROUPS } from '../data';

// 파랑 계열: 로열 블루(2)만 유지, 딥 네이비(1)·스카이 블루(3) 제외
// 빨강 계열: 로즈(15)만 유지, 크림슨(14) 제외
// 버건디(22) 제외
const VOTE_COLORS = CV_COLORS.filter(c => ![1, 3, 14, 22].includes(c.id));

function VotePage({ onVote }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [region, setRegion] = useState('');
  const [age, setAge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredColorId, setHoveredColorId] = useState(null);

  const canSubmit = selectedColor && region && age;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const res = await onVote(selectedColor.id, region, age);
    if (res && !res.success) {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* ── Tile 1: Hero (white canvas, mapped to dark canvas) ── */}
      <section className="tile tile-white" style={{ paddingTop: '80px', paddingBottom: '64px' }}>
        <div className="tile-content" style={{ textAlign: 'center' }}>
          {/* Small label */}
          <div className="typo-caption-strong" style={{
            color: 'var(--primary)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            ColorVote
          </div>

          {/* Main heading */}
          <h1 className="typo-hero" style={{ marginBottom: 16, whiteSpace: 'pre-line', fontWeight: 700 }}>
            지금 당신의 색은{'\n'}무엇인가요?
          </h1>

          {/* Tagline */}
          <p className="typo-lead" style={{
            color: 'var(--ink-muted-48)',
            marginBottom: 44,
            fontSize: '20px',
          }}>
            당신만의 색을 선택하세요
          </p>

          {/* Rainbow check-box logo render with soft ambient back-light */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 44 }}>
            <div style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '24px',
              background: selectedColor ? selectedColor.hex : 'var(--primary)',
              opacity: 0.18,
              filter: 'blur(32px)',
              transition: 'background 0.5s ease',
              pointerEvents: 'none',
            }} />
            <img
              src={`${import.meta.env.BASE_URL}apple_hero_vote_box.png`}
              alt="Color Vote Box"
              style={{
                width: 200,
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: selectedColor ? 'scale(1.04)' : 'none',
              }}
            />
          </div>

          {/* Selected Color Details */}
          <div style={{ minHeight: 96, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {selectedColor ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 24px',
                borderRadius: 'var(--rounded-lg)',
                border: '1px solid var(--hairline)',
                minWidth: '220px',
                animation: 'fadeInUp 0.3s ease forwards',
              }}>
                <div style={{
                  fontSize: 21,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  letterSpacing: '0.231px',
                }}>{selectedColor.name}</div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: selectedColor.hex,
                  letterSpacing: '0.5px',
                  fontFamily: 'monospace',
                }}>{selectedColor.hex}</div>
              </div>
            ) : (
              <div style={{
                fontSize: 15,
                color: 'var(--ink-muted-48)',
                letterSpacing: '-0.224px',
              }}>
                아래에서 색상을 탭하여 시작하십시오
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Tile 2: Color Grid (parchment canvas) ── */}
      <section className="tile tile-parchment" style={{ padding: '64px 20px' }}>
        <div className="tile-content">
          <h2 className="typo-tagline" style={{
            color: 'var(--ink)',
            marginBottom: 24,
            fontWeight: 600,
          }}>색상 선택</h2>

          <div className="color-grid">
            {VOTE_COLORS.map(color => {
              const sel = selectedColor?.id === color.id;
              const hov = hoveredColorId === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color)}
                  onMouseEnter={() => setHoveredColorId(color.id)}
                  onMouseLeave={() => setHoveredColorId(null)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--rounded-sm)',
                    background: color.hex,
                    border: 'none',
                    cursor: 'pointer',
                    transform: sel ? 'scale(1.08)' : (hov ? 'scale(1.05)' : 'scale(1)'),
                    boxShadow: sel
                      ? `0 0 20px ${color.hex}`
                      : (hov ? `0 4px 12px ${color.hex}80` : 'none'),
                    transition: 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    padding: 0,
                    position: 'relative',
                  }}
                  title={color.name}
                >
                  {sel && (
                    <div style={{
                      position: 'absolute',
                      inset: -3,
                      borderRadius: '10px',
                      border: '2px solid #ffffff',
                      pointerEvents: 'none',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tile 3: Form + CTA (white canvas) ── */}
      <section className="tile tile-white" style={{ padding: '64px 20px 100px' }}>
        <div className="tile-content" style={{ maxWidth: '600px' }}>
          <h2 className="typo-tagline" style={{
            color: 'var(--ink)',
            marginBottom: 24,
            fontWeight: 600,
          }}>정보 입력</h2>

          {/* Region select */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 'var(--rounded-pill)',
                border: '1px solid var(--hairline)',
                background: 'var(--canvas-parchment)',
                padding: '14px 44px 14px 20px',
                fontSize: 16,
                fontFamily: 'var(--font-body)',
                color: region ? 'var(--ink)' : 'var(--ink-muted-48)',
                appearance: 'none',
                WebkitAppearance: 'none',
                outline: 'none',
                cursor: 'pointer',
                letterSpacing: '-0.2px',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41,151,255,0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--hairline)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="" disabled>시/도를 선택하세요</option>
              {CV_REGIONS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <svg
              style={{
                position: 'absolute',
                right: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                transition: 'transform 0.2s ease',
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-muted-48)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {/* Age group pills */}
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}>
            {CV_AGE_GROUPS.map(a => {
              const sel = age === a;
              return (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--rounded-pill)',
                    background: sel ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                    color: sel ? '#ffffff' : 'var(--ink-muted-48)',
                    border: sel ? '1.5px solid var(--primary)' : '1.5px solid var(--hairline)',
                    fontSize: 14,
                    fontFamily: 'var(--font-body)',
                    fontWeight: sel ? 600 : 400,
                    letterSpacing: '-0.2px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    boxShadow: sel ? '0 4px 12px rgba(41,151,255,0.3)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!sel) {
                      e.currentTarget.style.color = 'var(--ink)';
                      e.currentTarget.style.borderColor = 'var(--ink-muted-48)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!sel) {
                      e.currentTarget.style.color = 'var(--ink-muted-48)';
                      e.currentTarget.style.borderColor = 'var(--hairline)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                >{a}</button>
              );
            })}
          </div>

          {/* CTA */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              width: '100%',
              padding: '16px',
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
            }}
          >
            {submitting ? '집계 중...' : '선택하기'}
          </button>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default VotePage;
