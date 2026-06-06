import { useState, useEffect, useRef } from 'react';
import { CV_getColor, CV_getRegion } from '../data';
import { getDNAStats, getSingleColorVotes } from '../lib/supabaseService';
import { toPng } from 'html-to-image';

function ResultPage({ vote, color, region, onRevote }) {
  const [visible, setVisible] = useState(false);
  const [dnaStats, setDnaStats] = useState({ pct: 0, votes: 0 });
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingDNA, setLoadingDNA] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const cardRef = useRef(null);

  const handleShareImage = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      // Capture at 2x ratio for Retina/High-DPI crisp quality
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
        style: {
          borderRadius: '24px',
        }
      });

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        try {
          // Convert dataUrl to Blob and then File object for Web Share API
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `colorvote-dna-${color.name.replace(/\s+/g, '')}.png`, { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: '나의 ColorVote 결과',
              text: `나의 색상은 ${color.name}입니다!`,
            });
            setSharing(false);
            return;
          }
        } catch (shareErr) {
          console.warn('Web Share failed, falling back to overlay:', shareErr);
        }

        // Fallback: Show press-to-save overlay modal for mobile browsers
        setCapturedImg(dataUrl);
        setSharing(false);
        return;
      }

      // Standard desktop download trigger
      const link = document.createElement('a');
      link.download = `colorvote-dna-${color.name.replace(/\s+/g, '')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('이미지 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Fetch dynamic DNA stats (Region + Age segment representation)
  useEffect(() => {
    if (vote && region && color) {
      setLoadingDNA(true);
      getDNAStats(vote.regionId, vote.ageGroup, vote.colorId)
        .then(stats => {
          if (stats) setDnaStats(stats);
        })
        .finally(() => {
          setLoadingDNA(false);
        });

      // Fetch dynamic total national votes
      getSingleColorVotes(color.id).then(count => {
        if (count > 0) setTotalVotes(count);
      });
    }
  }, [vote, region, color]);

  // Empty state
  if (!vote || !color) {
    return (
      <div className="tile tile-white" style={{ paddingTop: '160px', textAlign: 'center', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tile-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px dashed var(--hairline)',
            marginBottom: 24,
            animation: 'pulse 2s infinite ease-in-out',
          }} />
          <p className="typo-body" style={{ color: 'var(--ink-muted-48)', marginBottom: 20 }}>
            아직 투표하지 않았습니다
          </p>
          <button
            className="btn-primary"
            onClick={onRevote}
            style={{ fontWeight: 600 }}
          >
            투표하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(16px)',
      transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>

      {/* ── Tile 1: Hero (Dark Premium Card Representation) ── */}
      <section className="tile tile-dark" style={{ paddingTop: 120, paddingBottom: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* DNA CARD (320 × 480px, Dark Premium Style) */}
        <div ref={cardRef} style={{
          width: '320px',
          height: '480px',
          background: '#1a1a2e',
          borderRadius: '24px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left',
          position: 'relative',
          userSelect: 'none',
        }}>
          
          {/* Top Section (260px tall) */}
          <div style={{
            height: '260px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Wordmark (Top-left corner) */}
            <span style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              fontSize: '13px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.5px',
              fontFamily: 'var(--font-display)',
            }}>
              colorvote
            </span>

            {/* Frosted pill badge (Top-right corner) */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '24px',
              background: 'rgba(255,255,255,0.12)',
              border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}>
              {vote.ageGroup} · {region ? region.short : '전국'}
            </div>

            {/* Centered chosen color circle (140x140px) */}
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: color.hex,
            }} />
          </div>

          {/* Bottom Section (220px tall) */}
          <div style={{
            height: '220px',
            padding: '20px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Color name */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '4px',
            }}>
              {color.name}
            </h2>

            {/* Hex code */}
            <span style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'monospace',
              letterSpacing: '0.2px',
            }}>
              {color.hex}
            </span>

            {/* Gap of 20px, then a full-width divider */}
            <div style={{ marginTop: '20px' }} />
            <div style={{
              height: '0.5px',
              background: 'rgba(255,255,255,0.1)',
              width: '100%',
            }} />

            {/* Stat columns below divider */}
            <div style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              marginTop: '16px',
            }}>
              {/* Left Column: Personality */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#ffffff',
                }}>
                  {color.personality || '안정형'}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 400,
                }}>
                  색 성격
                </span>
              </div>

              {/* Vertical Divider */}
              <div style={{
                width: '0.5px',
                height: '32px',
                background: 'rgba(255,255,255,0.1)',
                margin: '0 12px',
              }} />

              {/* Right Column: Same choice count */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#ffffff',
                }}>
                  {loadingDNA ? '...' : `${dnaStats.votes.toLocaleString()}명`}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 400,
                }}>
                  같은 선택
                </span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ── Tile 2: Stats (White canvas, mapped to Dark) ── */}
      <section className="tile tile-white" style={{ textAlign: 'center', padding: '64px 20px' }}>
        <div className="tile-content" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Cohort Segment Card (Region + Age DNA) */}
          <div
            className="interactive-hover"
            style={{
              flex: '1 1 200px',
              maxWidth: '260px',
              background: 'var(--canvas-parchment)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
            }}
          >
            <p className="typo-caption-strong" style={{ color: 'var(--ink-muted-48)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {region ? region.short : '지역'} {vote.ageGroup} 동향
            </p>
            <p className="typo-lead" style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '24px' }}>
              {loadingDNA ? '분석 중...' : `${dnaStats.pct}% (${dnaStats.votes.toLocaleString()}표)`}
            </p>
          </div>

          {/* Region Card */}
          <div
            className="interactive-hover"
            style={{
              flex: '1 1 200px',
              maxWidth: '260px',
              background: 'var(--canvas-parchment)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
            }}
          >
            <p className="typo-caption-strong" style={{ color: 'var(--ink-muted-48)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>
              내 지역
            </p>
            <p className="typo-lead" style={{ color: 'var(--ink)', fontWeight: 700 }}>
              {region ? region.name : '—'}
            </p>
          </div>

          {/* National Votes Card */}
          <div
            className="interactive-hover"
            style={{
              flex: '1 1 200px',
              maxWidth: '260px',
              background: 'var(--canvas-parchment)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
            }}
          >
            <p className="typo-caption-strong" style={{ color: 'var(--ink-muted-48)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>
              전국 투표 수
            </p>
            <p className="typo-lead" style={{ color: 'var(--ink)', fontWeight: 700 }}>
              {totalVotes ? totalVotes.toLocaleString() + '표' : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Tile 3: Actions (Parchment canvas) ── */}
      <section className="tile tile-parchment" style={{ paddingBottom: 80, paddingTop: 48 }}>
        <div className="tile-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <button 
            className="btn-primary" 
            onClick={handleShareImage}
            disabled={sharing}
            style={{ width: '100%', maxWidth: 280, height: '52px', fontSize: '16px' }}
          >
            {sharing ? '사진 저장 중...' : '공유하기 (사진 저장)'}
          </button>
        </div>
      </section>

      {/* ── Mobile Image Press-to-Save Modal Overlay ── */}
      {capturedImg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: 1.5,
            fontFamily: 'var(--font-body)',
          }}>
            이미지를 <span style={{ color: 'var(--primary)' }}>길게 꾹 누르면</span><br />
            사진첩(갤러리)에 저장할 수 있습니다.
          </div>
          <img
            src={capturedImg}
            alt="ColorVote Result Card"
            style={{
              maxWidth: '100%',
              maxHeight: '65vh',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              display: 'block',
              marginBottom: '28px',
              pointerEvents: 'auto',
            }}
          />
          <button
            onClick={() => setCapturedImg(null)}
            style={{
              width: '100%',
              maxWidth: '180px',
              height: '48px',
              fontSize: '15px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              borderRadius: '999px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            닫기
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default ResultPage;
