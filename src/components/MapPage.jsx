import { useState, useEffect } from 'react';
import { CV_REGIONS, CV_AGE_GROUPS, CV_getColor } from '../data';
import { getStatsByRegion } from '../lib/supabaseService';

/*
  한반도 SVG 지도 — Apple Design System 재설계 (Dark Mode)
  viewBox: 0 0 380 540
  좌표 기준: 실제 대한민국 행정구역 경계를 기반으로 설계
*/

const PROVINCE_PATHS = [
  { id: "gyeonggi",
    d: "M88,62 L105,52 L125,46 L145,42 L168,44 L175,50 L185,66 L194,86 L200,108 L205,135 L208,160 L208,178 L200,188 L188,196 L172,202 L155,206 L138,208 L120,208 L102,206 L88,204 L72,200 L58,196 L48,192 L46,176 L46,158 L48,140 L52,124 L58,108 L66,92 L76,76 Z" },
  { id: "gangwon",
    d: "M175,50 L194,42 L215,36 L238,32 L258,28 L278,28 L292,32 L300,44 L308,62 L314,84 L318,110 L324,140 L330,168 L336,195 L338,208 L324,206 L308,202 L290,200 L272,200 L258,202 L244,200 L230,196 L218,192 L210,188 L208,178 L208,160 L205,135 L200,108 L194,86 L185,66 Z" },
  { id: "chungnam",
    d: "M48,196 L58,200 L72,204 L88,208 L102,210 L120,212 L138,212 L148,212 L152,226 L150,246 L146,262 L140,276 L132,286 L120,294 L104,300 L86,306 L68,310 L52,314 L42,306 L38,292 L34,276 L30,258 L28,242 L30,228 L36,216 L42,206 Z" },
  { id: "chungbuk",
    d: "M148,212 L155,208 L172,204 L188,198 L200,192 L210,190 L218,194 L230,198 L244,202 L258,204 L256,222 L252,244 L246,264 L240,280 L228,286 L212,284 L198,288 L182,292 L166,290 L148,284 L140,278 L146,264 L150,248 L152,228 Z" },
  { id: "jeonbuk",
    d: "M42,318 L52,318 L68,314 L86,310 L104,304 L120,298 L132,290 L148,288 L166,294 L180,302 L192,314 L198,332 L196,352 L190,368 L178,376 L162,382 L144,386 L124,384 L106,380 L88,374 L72,366 L58,358 L48,346 L42,332 Z" },
  { id: "jeonnam",
    d: "M42,338 L48,350 L58,362 L72,370 L88,378 L106,384 L124,388 L144,390 L162,386 L178,380 L190,372 L198,384 L200,402 L198,418 L190,432 L178,444 L162,452 L142,456 L122,454 L102,448 L82,442 L65,434 L50,424 L40,412 L36,398 L34,382 L36,364 L38,350 Z" },
  { id: "gyeongbuk",
    d: "M258,206 L272,204 L290,204 L308,206 L324,210 L338,212 L340,232 L342,255 L342,278 L340,298 L336,316 L330,330 L320,342 L306,350 L292,354 L278,354 L268,350 L260,342 L254,330 L250,314 L248,296 L246,278 L248,258 L252,240 L255,224 Z" },
  { id: "gyeongnam",
    d: "M260,346 L268,354 L278,358 L292,358 L306,354 L320,348 L330,336 L338,348 L342,368 L340,390 L334,406 L324,420 L312,432 L298,440 L282,444 L266,444 L250,440 L236,432 L224,420 L216,408 L210,394 L206,378 L204,362 L208,350 L218,342 L235,338 L248,340 Z" },
];

const METRO_PATHS = [
  { id: "seoul",
    d: "M122,100 L150,98 L152,120 L124,122 Z" },
  { id: "incheon",
    d: "M48,124 L70,112 L88,118 L86,142 L66,148 L48,140 Z" },
  { id: "sejong",
    d: "M148,242 L166,240 L168,258 L150,260 Z" },
  { id: "daejeon",
    d: "M138,270 L158,268 L160,286 L140,288 Z" },
  { id: "gwangju",
    d: "M102,394 L128,392 L130,414 L104,416 Z" },
  { id: "daegu",
    d: "M264,314 L294,312 L296,336 L266,338 Z" },
  { id: "pohang",
    d: "M330,280 L354,278 L356,302 L332,304 Z" },
  { id: "busan",
    d: "M302,400 L336,395 L340,420 L322,428 L300,422 Z" },
];

const JEJU = { cx: 148, cy: 505, rx: 64, ry: 24 };

const LABELS = [
  { id: "gyeonggi",  x: 132, y: 148, label: "경기" },
  { id: "gangwon",   x: 270, y: 132, label: "강원" },
  { id: "chungnam",  x: 86,  y: 258, label: "충남" },
  { id: "chungbuk",  x: 202, y: 244, label: "충북" },
  { id: "sejong",    x: 158, y: 252, label: "세종" },
  { id: "daejeon",   x: 149, y: 280, label: "대전" },
  { id: "jeonbuk",   x: 118, y: 345, label: "전북" },
  { id: "jeonnam",   x: 112, y: 420, label: "전남" },
  { id: "gwangju",   x: 116, y: 407, label: "광주" },
  { id: "gyeongbuk", x: 298, y: 272, label: "경북" },
  { id: "daegu",     x: 280, y: 327, label: "대구" },
  { id: "gyeongnam", x: 275, y: 394, label: "경남" },
  { id: "pohang",    x: 344, y: 293, label: "포항" },
  { id: "busan",     x: 322, y: 412, label: "부산" },
  { id: "seoul",     x: 138, y: 113, label: "서울" },
  { id: "incheon",   x: 68,  y: 133, label: "인천" },
  { id: "jeju",      x: 148, y: 508, label: "제주" },
];

const METRO_IDS = ['seoul','incheon','sejong','daejeon','gwangju','daegu','pohang','busan'];

// 데이터가 없는 지역을 칠할 중립 회색
const MAP_EMPTY_FILL = '#3a3a3c';

function MapPage() {
  const [selected, setSelected]   = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  
  // Real database stats state — start from catalog regions with no stats (no mock),
  // filled by getStatsByRegion. Empty stats render neutral until data loads.
  const [mapData, setMapData]     = useState({
    regions: CV_REGIONS.map(r => ({ ...r, topColorId: null, votes: 0 })),
    detail: {},
    heatmap: {},
  });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    getStatsByRegion()
      .then(data => {
        if (data) setMapData(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function onSelect(id) {
    setSelected(id);
    setPanelOpen(true);
  }
  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 280);
  }

  const detail    = selected ? mapData.detail[selected] : null;
  const regionObj = selected ? mapData.regions.find(r => r.id === selected) : null;
  const hasData   = mapData.regions.some(r => r.votes > 0);

  /* ── Shape renderer ── */
  function renderShape(shape, isMetro = false) {
    const region = mapData.regions.find(r => r.id === shape.id);
    if (!region) return null;
    const topColor = CV_getColor(region.topColorId);
    const fillHex = topColor ? topColor.hex : MAP_EMPTY_FILL;
    const isSel    = selected === shape.id;
    const isHov    = hoveredId === shape.id;

    // Premium glowing fill logic
    const fillOpacity = isSel ? 0.95 : (isHov ? 0.85 : (isMetro ? 0.70 : 0.45));
    const strokeColor = isSel ? '#ffffff' : (isHov ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)');

    return (
      <path
        key={shape.id}
        d={shape.d}
        fill={fillHex}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={isSel ? 1.8 : (isHov ? 1.4 : (isMetro ? 1.2 : 0.8))}
        strokeLinejoin="round"
        style={{
          cursor: 'pointer',
          filter: isSel && topColor
            ? `drop-shadow(0 0 12px ${topColor.hex})`
            : (isHov && topColor ? `drop-shadow(0 0 6px ${topColor.hex}aa)` : 'none'),
          transform: isHov ? 'scale(1.01)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'fill-opacity 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), stroke 0.25s ease, filter 0.25s ease, transform 0.2s ease',
        }}
        onMouseEnter={() => setHoveredId(shape.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => onSelect(shape.id)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>

      {/* ═══ Tile 1 — Header (Dark styled canvas) ═══ */}
      <section className="tile tile-white" style={{ paddingTop: '80px', paddingBottom: '32px' }}>
        <div className="tile-content" style={{ textAlign: 'center' }}>
          <div className="typo-caption-strong" style={{
            color: 'var(--primary)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Map
          </div>
          <h1 className="typo-hero" style={{ fontWeight: 700 }}>지역별 색상</h1>
          <p className="typo-body" style={{ color: 'var(--ink-muted-48)', marginTop: 12 }}>
            {loading
              ? '최신 선택 데이터를 분석 중...'
              : (hasData ? '지역을 탭하여 실시간 선두 컬러와 세부 통계를 확인해 보세요' : '아직 선택 데이터가 없습니다')}
          </p>
        </div>
      </section>

      {/* ═══ Tile 2 — Map (Sleek Space Black map wrapper) ═══ */}
      <section className="tile tile-dark" style={{ paddingTop: 24, paddingBottom: 140, background: 'var(--canvas)' }}>
        <div className="tile-content" style={{ position: 'relative' }}>
          {/* Subtle map backdrop lighting */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(41,151,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <svg
            viewBox="0 0 380 540"
            style={{
              width: '100%',
              maxWidth: 460,
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.5))',
              position: 'relative',
              zIndex: 1,
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Province shapes */}
            <g>
              {PROVINCE_PATHS.map(shape => renderShape(shape, false))}
            </g>

            {/* Metro city shapes */}
            {METRO_PATHS.map(shape => renderShape(shape, true))}

            {/* Jeju island */}
            {(() => {
              const r = mapData.regions.find(reg => reg.id === 'jeju');
              if (!r) return null;
              const topColor = CV_getColor(r.topColorId);
              const fillHex = topColor ? topColor.hex : MAP_EMPTY_FILL;
              const isSel = selected === 'jeju';
              const isHov = hoveredId === 'jeju';
              const strokeColor = isSel ? '#ffffff' : (isHov ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)');

              return (
                <ellipse
                  cx={JEJU.cx} cy={JEJU.cy} rx={JEJU.rx} ry={JEJU.ry}
                  fill={fillHex}
                  fillOpacity={isSel ? 0.95 : (isHov ? 0.85 : 0.55)}
                  stroke={strokeColor}
                  strokeWidth={isSel ? 1.8 : (isHov ? 1.4 : 1)}
                  style={{
                    cursor: 'pointer',
                    filter: isSel && topColor
                      ? `drop-shadow(0 0 12px ${topColor.hex})`
                      : (isHov && topColor ? `drop-shadow(0 0 6px ${topColor.hex}aa)` : 'none'),
                    transform: isHov ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '148px 505px',
                    transition: 'fill-opacity 0.25s ease, stroke 0.25s ease, filter 0.25s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={() => setHoveredId('jeju')}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect('jeju')}
                />
              );
            })()}

            {/* Clean Modern Labels */}
            {LABELS.map(lbl => {
              const r = mapData.regions.find(reg => reg.id === lbl.id);
              if (!r) return null;
              const isMetro = METRO_IDS.includes(lbl.id);
              const isSel = selected === lbl.id;
              const isHov = hoveredId === lbl.id;

              return (
                <text
                  key={lbl.id}
                  x={lbl.x}
                  y={lbl.y}
                  textAnchor="middle"
                  style={{
                    fontSize: isMetro ? '7px' : '9.5px',
                    fill: isSel || isHov ? '#ffffff' : 'rgba(255,255,255,0.85)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: isSel || isHov ? 700 : 500,
                    pointerEvents: 'none',
                    letterSpacing: '-0.1px',
                    textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.6)',
                    transition: 'fill 0.2s ease, font-weight 0.2s ease',
                  }}
                >
                  {lbl.label}
                </text>
              );
            })}
          </svg>
        </div>
      </section>

      {/* ═══ Backdrop overlay ═══ */}
      {panelOpen && selected && (
        <div
          onClick={closePanel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 175,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease',
          }}
        />
      )}

      {/* ═══ Detail Panel — Bottom Sheet (Frosted Dark Glassmorphism) ═══ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${panelOpen && selected ? '0' : '110%'})`,
        width: '100%',
        maxWidth: 680,
        background: 'rgba(22, 22, 23, 0.82)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '24px 24px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        zIndex: 180,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        maxHeight: '70vh',
        overflowY: 'auto',
        color: 'var(--ink)',
        boxShadow: '0 -15px 40px rgba(0,0,0,0.6)',
      }}>
        {selected && detail && regionObj && (() => {
          const topColorObj = CV_getColor(regionObj.topColorId);
          // Scale age bars to the region's own peak so a single dominant age group
          // (sparse/skewed data) never overflows the fixed-height track.
          const maxAgePct = Math.max(...CV_AGE_GROUPS.map(ag => detail.byAge[ag] || 0), 1);
          return (
            <div style={{ padding: '20px 24px 32px' }}>
              {/* Handle bar */}
              <div style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.15)',
                margin: '0 auto 20px',
              }} />

              {/* Region header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: topColorObj?.hex || '#ccc',
                    boxShadow: topColorObj ? `0 0 12px ${topColorObj.hex}` : 'none',
                    flexShrink: 0,
                    border: '1.5px solid rgba(255,255,255,0.2)',
                  }} />
                  <div>
                    <div className="typo-tagline" style={{ fontWeight: 700 }}>{regionObj.name}</div>
                    <div className="typo-caption" style={{ color: 'var(--ink-muted-48)', marginTop: 2 }}>
                      지역별 통계
                    </div>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    color: 'var(--ink-muted-48)',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'var(--ink-muted-48)';
                  }}
                >×</button>
              </div>

              {detail.total === 0 ? (
                <div style={{
                  padding: '8px 0 24px',
                  textAlign: 'center',
                  color: 'var(--ink-muted-48)',
                  fontSize: 14,
                }}>
                  아직 선택 데이터가 없습니다
                </div>
              ) : (
                <>
              {/* Top 3 colors */}
              <div style={{ marginBottom: 32 }}>
                <div className="typo-caption-strong" style={{
                  color: 'var(--primary)',
                  letterSpacing: '1px',
                  marginBottom: 16,
                }}>
                  TOP 3 색상
                </div>
                {detail.topColors.map((tc, i) => {
                  const c = CV_getColor(tc.id);
                  if (!c) return null;
                  return (
                    <div key={c.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{
                          fontSize: 13,
                          color: 'var(--ink-muted-48)',
                          width: 14,
                          fontWeight: 700,
                        }}>{i + 1}</span>
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: c.hex,
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.15)',
                        }} />
                        <span className="typo-caption" style={{
                          fontWeight: 600,
                          color: 'var(--ink)',
                          flex: 1,
                        }}>{c.name}</span>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}>{tc.pct}%</span>
                      </div>
                      {/* Smooth rounded bar track */}
                      <div style={{
                        marginLeft: 24,
                        height: 6,
                        borderRadius: 'var(--rounded-pill)',
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${tc.pct}%`,
                          background: c.hex,
                          borderRadius: 'var(--rounded-pill)',
                          boxShadow: `0 0 6px ${c.hex}aa`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Age breakdown bar chart */}
              <div>
                <div className="typo-caption-strong" style={{
                  color: 'var(--primary)',
                  letterSpacing: '1px',
                  marginBottom: 16,
                }}>
                  연령별 분포
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 80, padding: '0 8px' }}>
                  {CV_AGE_GROUPS.map(ag => {
                    const pct = detail.byAge[ag] || 0;
                    const winColor = CV_getColor((mapData.heatmap?.[selected]?.[ag]) || regionObj.topColorId);
                    if (!winColor) return null;
                    return (
                      <div key={ag} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 50 }}>
                          <div style={{
                            width: '100%',
                            minHeight: 4,
                            height: `${pct > 0 ? Math.max((pct / maxAgePct) * 100, 8) : 0}%`,
                            background: winColor.hex,
                            borderRadius: '3px 3px 0 0',
                            opacity: 0.85,
                            boxShadow: `0 0 8px ${winColor.hex}55`,
                            transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                          }} />
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--ink-muted-48)',
                          textAlign: 'center',
                          lineHeight: 1.3,
                        }}>
                          <span style={{ color: 'var(--ink)' }}>{ag}</span><br />{pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default MapPage;
