import { useState, useEffect } from 'react';
import { CV_AGE_GROUPS, CV_getColor, CV_getRegion } from '../data';
import { getColors, subscribeVotes, getLegacyColorId, getStatsByAgeRange, getTrendingColors, getStatsByRegion } from '../lib/supabaseService';

// Which regions have notable % for a given color (sourced from live region detail)
function getColorRegionalData(colorId, regionDetail) {
  const results = [];
  for (const rid in regionDetail) {
    const entry = regionDetail[rid].topColors.find(t => t.id === colorId);
    if (entry) results.push({ region: CV_getRegion(rid), pct: entry.pct });
  }
  return results.sort((a, b) => b.pct - a.pct).slice(0, 5);
}

// Section title component
function SectionTitle({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="typo-tagline"
      style={{
        color: 'var(--ink)',
        marginBottom: '24px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        fontWeight: 600,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={e => {
        if (onClick) e.currentTarget.style.opacity = '0.75';
      }}
      onMouseLeave={e => {
        if (onClick) e.currentTarget.style.opacity = '1';
      }}
    >
      {children}
      {onClick && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="var(--ink-muted-48)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// 데이터 없음 공지
function NoData({ label = '아직 투표 데이터가 없습니다' }) {
  return (
    <div style={{
      padding: '32px 0',
      textAlign: 'center',
      color: 'var(--ink-muted-48)',
      fontSize: '14px',
      fontFamily: 'var(--font-body)',
    }}>
      {label}
    </div>
  );
}

function StatsPage() {
  const [timeRange, setTimeRange] = useState('전체');
  const [expandedColorId, setExpandedColorId] = useState(null);
  const [expandedAge, setExpandedAge] = useState(null);
  const [barsReady, setBarsReady] = useState(false);
  const [hoveredRankIndex, setHoveredRankIndex] = useState(null);
  const [hoveredRateId, setHoveredRateId] = useState(null);

  // Dynamic state hooks for live DB integration
  const [colors, setColors] = useState([]);
  const [ageStats, setAgeStats] = useState(null);
  const [trendingColors, setTrendingColors] = useState(null);
  const [regionDetail, setRegionDetail] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial statistics and handle timeRange filter changes
  useEffect(() => {
    setLoading(true);
    getColors(timeRange)
      .then(data => {
        if (data) setColors(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [timeRange]);

  // 2. Fetch age statistics, trending and region detail lists on mount
  useEffect(() => {
    getStatsByAgeRange().then(data => {
      if (data) setAgeStats(data);
    });

    getTrendingColors().then(data => {
      if (data) setTrendingColors(data);
    });

    getStatsByRegion().then(data => {
      if (data) setRegionDetail(data.detail);
    });
  }, []);

  // 3. Subscribe to real-time vote updates
  useEffect(() => {
    const unsubscribe = subscribeVotes((newVote) => {
      const legacyColorId = getLegacyColorId(newVote.color_id);
      if (legacyColorId) {
        // Increment live vote count
        setColors(prevColors =>
          prevColors.map(c =>
            c.id === legacyColorId ? { ...c, votes: c.votes + 1 } : c
          )
        );

        // Re-fetch aggregate views to keep trending, age and region lists in sync
        getStatsByAgeRange().then(data => {
          if (data) setAgeStats(data);
        });
        getTrendingColors().then(data => {
          if (data) setTrendingColors(data);
        });
        getStatsByRegion().then(data => {
          if (data) setRegionDetail(data.detail);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Re-trigger bar animation on time range switch
  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 120);
    return () => clearTimeout(t);
  }, [timeRange]);

  const totalVotes = colors.reduce((s, c) => s + c.votes, 0);
  const sorted = [...colors].sort((a, b) => b.votes - a.votes);
  const top3 = sorted.slice(0, 3);
  const maxVotes = sorted[0] ? sorted[0].votes : 0;

  // 빈 상태 판정 (연결됐는데 데이터가 없을 때 공지용)
  const noColorData = !loading && totalVotes === 0;
  const ageLoaded = ageStats !== null;
  const hasAgeData = ageLoaded && CV_AGE_GROUPS.some(ag => ageStats[ag] && ageStats[ag].length > 0);
  const trendingList = trendingColors || [];
  const noTrending = trendingColors !== null && trendingList.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>

      {/* ── Tile 1: Header (white canvas -> dark mode canvas) ── */}
      <div className="tile tile-white" style={{ paddingTop: '100px', paddingBottom: '48px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="tile-content" style={{ textAlign: 'center' }}>
          <div className="typo-caption-strong" style={{
            color: 'var(--primary)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Statistics
          </div>
          <div className="typo-hero" style={{ marginBottom: '32px', fontWeight: 700 }}>
            색상 통계
          </div>

          {/* Time filter pills */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              gap: '4px',
              background: 'var(--canvas-parchment)',
              padding: '5px',
              borderRadius: 'var(--rounded-pill)',
              border: '1px solid var(--hairline)'
            }}>
              {['오늘', '이번 주', '전체'].map(t => {
                const isActive = timeRange === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 'var(--rounded-pill)',
                      background: isActive ? 'var(--canvas)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--ink-muted-48)',
                      border: isActive ? '1px solid var(--hairline)' : 'none',
                      boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.3)' : 'none',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >{t}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tile 2: TOP 3 (parchment -> secondary dark bg) ── */}
      <div className="tile tile-parchment" style={{ paddingTop: '64px', paddingBottom: '64px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="tile-content">
          <SectionTitle>전국 TOP 3</SectionTitle>
          {noColorData ? <NoData /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {top3.map((color, i) => {
              const pct = totalVotes > 0 ? (color.votes / totalVotes * 100).toFixed(1) : '0.0';
              const isHov = hoveredRankIndex === i;
              return (
                <div
                  key={color.id}
                  onMouseEnter={() => setHoveredRankIndex(i)}
                  onMouseLeave={() => setHoveredRankIndex(null)}
                  style={{
                    background: 'var(--canvas)',
                    borderRadius: 'var(--rounded-lg)',
                    padding: '24px',
                    border: isHov ? '1.5px solid var(--primary)' : '1.5px solid var(--hairline)',
                    transform: isHov ? 'translateY(-4px)' : 'none',
                    boxShadow: isHov ? `0 12px 32px rgba(0,0,0,0.5), 0 0 12px ${color.hex}44` : 'none',
                    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.25s ease, box-shadow 0.3s ease',
                  }}
                >
                  <div className="typo-caption-strong" style={{
                    color: isHov ? 'var(--primary)' : 'var(--ink-muted-48)',
                    marginBottom: '16px',
                    transition: 'color 0.2s ease',
                  }}>
                    {i + 1}위
                  </div>
                  {/* Circular swatch preview */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: color.hex,
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    boxShadow: isHov ? `0 0 16px ${color.hex}` : 'none',
                    marginBottom: '16px',
                    transition: 'box-shadow 0.3s ease',
                  }} />
                  <div className="typo-body-strong" style={{ marginBottom: '4px', fontSize: '18px', color: 'var(--ink)' }}>
                    {color.name}
                  </div>
                  <div className="typo-caption" style={{ color: 'var(--ink-muted-48)', fontWeight: 500 }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* ── Tile 3: 색상별 선택률 (white -> main dark bg) ── */}
      <div className="tile tile-white" style={{ paddingTop: '64px', paddingBottom: '64px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="tile-content">
          <SectionTitle onClick={expandedColorId ? () => setExpandedColorId(null) : null}>
            색상별 선택률 {loading && <span style={{ fontSize: '12px', color: 'var(--primary)', marginLeft: '10px' }}>(로딩 중...)</span>}
          </SectionTitle>

          {noColorData ? <NoData /> : sorted.slice(0, 16).map(color => {
            const pct = totalVotes > 0 ? (color.votes / totalVotes * 100).toFixed(1) : '0.0';
            const barFill = (barsReady && maxVotes > 0) ? (color.votes / maxVotes * 100) : 0;
            const isOpen = expandedColorId === color.id;
            const regData = isOpen ? getColorRegionalData(color.id, regionDetail) : [];
            const isHov = hoveredRateId === color.id;

            return (
              <div key={color.id} style={{ marginBottom: isOpen ? '20px' : '12px' }}>
                {/* Row button */}
                <button
                  onClick={() => setExpandedColorId(isOpen ? null : color.id)}
                  onMouseEnter={() => setHoveredRateId(color.id)}
                  onMouseLeave={() => setHoveredRateId(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: isHov ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    marginLeft: '-12px',
                    width: 'calc(100% + 24px)',
                    transition: 'background-color 0.25s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Glowing round dot */}
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color.hex,
                    boxShadow: isHov || isOpen ? `0 0 10px ${color.hex}` : 'none',
                    flexShrink: 0,
                    transition: 'box-shadow 0.25s ease',
                  }} />
                  {/* Name */}
                  <span style={{
                    fontSize: '14px',
                    color: isHov || isOpen ? 'var(--ink)' : 'var(--ink-muted-80)',
                    fontWeight: 600,
                    width: '80px',
                    flexShrink: 0,
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s ease',
                  }}>{color.name}</span>
                  {/* Bar track (rounded) */}
                  <div style={{
                    flex: 1,
                    height: '6px',
                    background: 'var(--canvas-parchment)',
                    overflow: 'hidden',
                    borderRadius: 'var(--rounded-pill)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${barFill}%`,
                      background: color.hex,
                      borderRadius: 'var(--rounded-pill)',
                      boxShadow: isHov || isOpen ? `0 0 8px ${color.hex}` : 'none',
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                    }} />
                  </div>
                  {/* Pct */}
                  <span className="typo-caption" style={{
                    color: isHov || isOpen ? 'var(--primary)' : 'var(--ink-muted-48)',
                    fontWeight: 600,
                    width: '56px',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.2s ease',
                  }}>{pct}%</span>
                </button>

                {/* Inline regional expansion */}
                {isOpen && regData.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '20px 24px',
                    background: 'var(--canvas-parchment)',
                    borderRadius: 'var(--rounded-lg)',
                    borderLeft: `3px solid ${color.hex}`,
                    borderTop: '1px solid var(--hairline)',
                    borderBottom: '1px solid var(--hairline)',
                    borderRight: '1px solid var(--hairline)',
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }}>
                    <div className="typo-caption-strong" style={{
                      color: 'var(--ink-muted-48)',
                      marginBottom: '16px',
                    }}>
                      지역별 분석
                    </div>
                    {regData.map(d => (
                      <div key={d.region.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '10px',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--ink)',
                          width: '40px',
                          flexShrink: 0,
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                        }}>{d.region.short}</span>
                        {/* Round bar */}
                        <div style={{
                          flex: 1,
                          height: '4px',
                          background: 'var(--canvas)',
                          borderRadius: 'var(--rounded-pill)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${d.pct}%`,
                            background: color.hex,
                            borderRadius: 'var(--rounded-pill)',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--ink-muted-48)',
                          width: '38px',
                          whiteSpace: 'nowrap',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 500,
                          fontFamily: 'monospace',
                        }}>{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tile 4: 연령대별 1위 (parchment) ── */}
      <div className="tile tile-parchment" style={{ paddingTop: '64px', paddingBottom: '64px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="tile-content">
          <SectionTitle onClick={expandedAge ? () => setExpandedAge(null) : null}>
            연령대별 1위
          </SectionTitle>

          {ageLoaded && !hasAgeData ? <NoData /> : (
          <>
          {/* Scroll strip */}
          <div style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '8px',
            margin: '0 -24px',
            padding: '0 24px 8px',
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              width: 'max-content',
            }}>
              {CV_AGE_GROUPS.map(ag => {
                const ageGroupList = ageStats ? ageStats[ag] : null;
                const topEntry = ageGroupList ? ageGroupList[0] : null;
                const topColor = topEntry ? CV_getColor(topEntry.id) : null;
                const isOpen = expandedAge === ag;
                if (!topColor) return null;
                return (
                  <button
                    key={ag}
                    onClick={() => setExpandedAge(isOpen ? null : ag)}
                    style={{
                      background: 'var(--canvas)',
                      borderRadius: 'var(--rounded-lg)',
                      padding: '20px 24px',
                      border: isOpen
                        ? '2.5px solid var(--primary)'
                        : '1.5px solid var(--hairline)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flexShrink: 0,
                      width: '140px',
                      boxShadow: isOpen ? '0 8px 20px rgba(0,0,0,0.4)' : 'none',
                      transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = 'var(--ink-muted-48)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = 'var(--hairline)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <div className="typo-caption-strong" style={{
                      color: isOpen ? 'var(--primary)' : 'var(--ink-muted-48)',
                      marginBottom: '16px',
                      transition: 'color 0.25s ease',
                    }}>
                      {ag}
                    </div>
                    {/* Circular swatch */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: topColor.hex,
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: isOpen ? `0 0 10px ${topColor.hex}` : 'none',
                      marginBottom: '12px',
                      transition: 'box-shadow 0.25s ease',
                    }} />
                    <div className="typo-body-strong" style={{
                      color: 'var(--ink)',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      fontSize: '15px',
                    }}>
                      {topColor.name}
                    </div>
                    <div className="typo-caption" style={{ color: 'var(--ink-muted-48)' }}>
                      {topEntry.pct}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          </>
          )}

          {/* Expanded age ranking panel */}
          {expandedAge && ageStats && ageStats[expandedAge] && (
            <div style={{
              marginTop: '16px',
              background: 'var(--canvas)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
              border: '1px solid var(--hairline)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}>
              <div className="typo-caption-strong" style={{
                color: 'var(--primary)',
                marginBottom: '20px',
              }}>
                {expandedAge} 전체 순위
              </div>
              {ageStats[expandedAge].map((entry, i) => {
                const c = CV_getColor(entry.id);
                if (!c) return null;
                return (
                  <div key={c.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: i < 4 ? '12px' : 0,
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted-48)',
                      width: '18px',
                      textAlign: 'right',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                    }}>{i + 1}</span>
                    {/* Round swatch */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: '1px solid rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      flex: 1,
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '-0.2px',
                    }}>{c.name}</span>
                    {/* Round bar */}
                    <div style={{
                      width: '80px',
                      height: '4px',
                      background: 'var(--canvas-parchment)',
                      borderRadius: 'var(--rounded-pill)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${entry.pct}%`,
                        background: c.hex,
                        borderRadius: 'var(--rounded-pill)',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted-48)',
                      width: '38px',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                    }}>{entry.pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Tile 5: 지금 뜨는 색 (dark tile) ── */}
      <div className="tile tile-dark" style={{ paddingTop: '64px', paddingBottom: '96px', background: 'var(--tile-dark-1)' }}>
        <div className="tile-content">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}>
            {/* Live Indicator (circular) */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#30d158',
              boxShadow: '0 0 10px #30d158',
              flexShrink: 0,
            }} />
            <span className="typo-tagline" style={{ color: 'var(--body-on-dark)', letterSpacing: '-0.2px' }}>
              지금 뜨는 색
            </span>
          </div>

          {noTrending ? <NoData /> : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {trendingList.slice(0, 3).map(t => {
              const c = CV_getColor(t.colorId);
              if (!c) return null;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--rounded-pill)',
                    padding: '12px 20px',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Round swatch */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--body-on-dark)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.name}
                  </span>
                  {/* Apple systemBlue arrow indicator */}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--primary-on-dark)',
                    letterSpacing: '-0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 8V2M2 5l3-3 3 3" stroke="var(--primary-on-dark)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t.gainPct > 0 ? '+' : ''}{t.gainPct}%
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
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

export default StatsPage;
