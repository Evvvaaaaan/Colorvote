import { useState, useEffect } from 'react';
import { CV_getColor, CV_getRegion } from '../data';
import { getRecentVotes, subscribeVotes, getLegacyColorId, getStatsByRegion } from '../lib/supabaseService';

const ENG_NAMES = {
  1: 'RED',
  2: 'ORANGE',
  3: 'YELLOW',
  4: 'GREEN',
  5: 'BLUE',
  6: 'NAVY',
  7: 'PURPLE'
};

function generateInsights(regionStats) {
  if (!regionStats || !regionStats.detail) return [];

  const insights = [];
  const { regions, detail } = regionStats;

  // 1. Generate Battlegrounds (격전지)
  regions.forEach(r => {
    const d = detail[r.id];
    if (d && d.topColors && d.topColors.length >= 2) {
      const c1 = d.topColors[0];
      const c2 = d.topColors[1];
      const diff = Math.abs(c1.pct - c2.pct);

      if (diff <= 8.0 && d.total > 0) {
        const color1Obj = CV_getColor(c1.id);
        const color2Obj = CV_getColor(c2.id);
        if (color1Obj && color2Obj) {
          const ratio = c1.pct / (c1.pct + c2.pct);
          const blocks = Math.round(ratio * 15);
          const bar = '█'.repeat(blocks) + '░'.repeat(15 - blocks);
          
          const eng1 = ENG_NAMES[c1.id] || 'COLOR1';
          const eng2 = ENG_NAMES[c2.id] || 'COLOR2';

          let desc = '';
          if (diff <= 1.0) {
            desc = `(${diff.toFixed(1)}% 차이! 뒤집히기 3분 전 ⚔️)`;
          } else if (diff <= 3.0) {
            desc = `(${diff.toFixed(1)}% 차이! 격렬한 접전 중 ⚔️)`;
          } else {
            desc = `(${diff.toFixed(1)}% 차이! 선두 추격 중 ⚔️)`;
          }

          let formattedRegion = r.short;
          if (formattedRegion.length === 2) {
            formattedRegion = formattedRegion.split('').join(' ');
          }

          insights.push({
            id: `insight-battle-${r.id}-${Date.now()}`,
            type: 'battleground',
            regionShort: formattedRegion,
            bar,
            color1Hex: color1Obj.hex,
            color1Eng: eng1,
            pct1: c1.pct,
            color2Hex: color2Obj.hex,
            color2Eng: eng2,
            pct2: c2.pct,
            desc
          });
        }
      }
    }
  });

  // 2. Generate Surging (유입 급증/폭발 중)
  regions.forEach(r => {
    const d = detail[r.id];
    if (d && d.topColors && d.topColors.length >= 1) {
      const c1 = d.topColors[0];
      if (c1.pct >= 30.0 && d.total > 0) {
        const color1Obj = CV_getColor(c1.id);
        if (color1Obj) {
          const ratio = c1.pct / 100;
          const blocks = Math.round(ratio * 15);
          const bar = '█'.repeat(blocks) + '░'.repeat(15 - blocks);
          
          const eng1 = ENG_NAMES[c1.id] || 'COLOR1';

          let formattedRegion = r.short;
          if (formattedRegion.length === 2) {
            formattedRegion = formattedRegion.split('').join(' ');
          }

          insights.push({
            id: `insight-surge-${r.id}-${Date.now()}`,
            type: 'surge',
            regionShort: formattedRegion,
            bar,
            color1Hex: color1Obj.hex,
            color1Eng: eng1,
            pct1: c1.pct,
            desc: `(${eng1} ${c1.pct.toFixed(1)}% ▲ 폭발 중! 최근 1시간 유입 급증 🔥)`
          });
        }
      }
    }
  });

  return insights;
}

function getMockInsights() {
  return [
    {
      id: 'mock-insight-1',
      type: 'battleground',
      regionShort: '대 구',
      bar: '████████████░░░░░░░░░',
      color1Hex: '#1464C0',
      color1Eng: 'BLUE',
      pct1: 50.1,
      color2Hex: '#E63946',
      color2Eng: 'RED',
      pct2: 49.9,
      desc: '(0.2% 차이! 뒤집히기 3분 전 ⚔️)'
    },
    {
      id: 'mock-insight-2',
      type: 'surge',
      regionShort: '부 산',
      bar: '████████████████░░░░░',
      color1Hex: '#2D6A4F',
      color1Eng: 'GREEN',
      pct1: 61.0,
      desc: '(GREEN 61.0% ▲ 14.2% 폭발 중! 최근 1시간 유입 급증 🔥)'
    }
  ];
}

function Ticker() {
  const [newsList, setNewsList] = useState([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // 1. Fetch initial data (recent votes + region statistics for battleground alerts)
  useEffect(() => {
    async function loadTickerData() {
      try {
        const dbNews = await getRecentVotes();
        const regionStats = await getStatsByRegion();
        
        let insightsList = generateInsights(regionStats);
        if (insightsList.length === 0) {
          insightsList = getMockInsights();
        }

        // Mix recent votes and insights
        const mixed = [];
        const votes = dbNews || [];
        const maxLen = Math.max(votes.length, insightsList.length);
        
        for (let i = 0; i < maxLen; i++) {
          if (i < insightsList.length) {
            mixed.push(insightsList[i]);
          }
          if (i * 2 < votes.length) {
            mixed.push(votes[i * 2]);
          }
          if (i * 2 + 1 < votes.length) {
            mixed.push(votes[i * 2 + 1]);
          }
        }
        
        setNewsList(mixed);
      } catch (err) {
        console.error('Error loading ticker data:', err);
        setNewsList(getMockInsights());
      }
    }
    
    loadTickerData();
  }, []);

  // 2. Listen to live real-time votes insertions
  useEffect(() => {
    const unsubscribe = subscribeVotes((newVote) => {
      const legacyColorId = getLegacyColorId(newVote.color_id);
      const colorObj = CV_getColor(legacyColorId);
      const regionObj = CV_getRegion(newVote.region);

      if (colorObj && regionObj) {
        const newNewsItem = {
          id: newVote.id,
          regionId: newVote.region,
          age: newVote.age_group,
          colorId: legacyColorId,
          colorName: colorObj.name,
          colorHex: colorObj.hex,
          isLiveAlert: true // Meta tag for styling
        };

        setNewsList(prev => {
          // Prepend new live message, keeping length cap to 15 items
          const cleanedPrev = prev.filter(item => item.id !== newVote.id);
          return [newNewsItem, ...cleanedPrev.slice(0, 14)];
        });
        
        // Reset ticker index immediately to show the incoming live flash news
        setIdx(0);
        setVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Ticker text rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (newsList.length <= 1) return;
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % newsList.length);
        setVisible(true);
      }, 350);
    }, 4500);
    
    return () => clearInterval(interval);
  }, [newsList]);

  // 연결됐지만 아직 선택 데이터가 없을 때
  if (newsList.length === 0) {
    return (
      <div style={{
        width: '100%',
        background: 'var(--canvas-parchment)',
        borderBottom: '1px solid var(--hairline)',
        marginTop: '64px',
        userSelect: 'none',
      }}>
        <div style={{
          maxWidth: '980px',
          margin: '0 auto',
          padding: '10px 24px',
          fontSize: '13px',
          color: 'var(--ink-muted-48)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '-0.2px',
        }}>
          아직 선택 데이터가 없습니다
        </div>
      </div>
    );
  }

  const currentNews = newsList[idx];

  // Graceful handling
  if (!currentNews) return null;

  const region = currentNews.regionId ? CV_getRegion(currentNews.regionId) : null;
  const isLive = currentNews.isLiveAlert;
  const statusColor = currentNews.colorHex || currentNews.color1Hex || '#888';

  return (
    <div style={{
      width: '100%',
      background: 'var(--canvas-parchment)',
      borderBottom: '1px solid var(--hairline)',
      marginTop: '64px', /* Shift below 64px navbar */
      userSelect: 'none',
    }}>
      <div style={{
        maxWidth: '980px',
        margin: '0 auto',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(-2px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        {/* Animated glowing status dot */}
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 10px ${statusColor}`,
          flexShrink: 0,
          display: 'block',
        }} />

        {/* Live badge if it's a real-time incoming push, battleground, or surge */}
        {(isLive || currentNews.type === 'battleground' || currentNews.type === 'surge') && (
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            background: currentNews.type === 'battleground' ? '#ff3b30' : (currentNews.type === 'surge' ? '#ff9500' : 'var(--primary)'),
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            animation: 'flash 1.5s infinite',
            flexShrink: 0,
          }}>
            {currentNews.type === 'battleground' ? '격전' : (currentNews.type === 'surge' ? '급상승' : '속보')}
          </span>
        )}

        <span style={{
          fontSize: '13px',
          fontWeight: 400,
          letterSpacing: '-0.2px',
          color: 'var(--ink-muted-48)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: 'var(--font-body)',
        }}>
          {currentNews.type === 'battleground' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#ff3b30', fontWeight: 700 }}>[ 실시간 격전지 ⚔️ ]</strong>
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                ● {currentNews.regionShort}
              </span>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                letterSpacing: '-0.5px',
                color: 'var(--ink-muted-80)',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '0.5px solid var(--hairline)',
              }}>
                [{currentNews.bar}]
              </span>
              <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>
                {currentNews.color1Eng} {currentNews.pct1.toFixed(1)}%
              </span>
              <span style={{ color: 'var(--ink-muted-48)' }}>vs</span>
              <span style={{ color: currentNews.color2Hex, fontWeight: 700 }}>
                {currentNews.color2Eng} {currentNews.pct2.toFixed(1)}%
              </span>
              <span style={{ color: '#ff3b30', fontWeight: 600 }}>
                {currentNews.desc}
              </span>
            </span>
          ) : currentNews.type === 'surge' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#ff9500', fontWeight: 700 }}>[ 실시간 급상승 🔥 ]</strong>
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                ● {currentNews.regionShort}
              </span>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                letterSpacing: '-0.5px',
                color: 'var(--ink-muted-80)',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '0.5px solid var(--hairline)',
              }}>
                [{currentNews.bar}]
              </span>
              <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>
                {currentNews.color1Eng} {currentNews.pct1.toFixed(1)}%
              </span>
              <span style={{ color: '#ff9500', fontWeight: 600 }}>
                ▲ 폭발 중! 최근 유입 급증 ⚡
              </span>
            </span>
          ) : isLive ? (
            <>
              방금 <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{region?.name || '지역'}</strong>의{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{currentNews.age}</strong> 참여자가{' '}
              <span style={{ color: currentNews.colorHex, fontWeight: 600 }}>{currentNews.colorName}</span>를 선택하셨습니다!
            </>
          ) : (
            <>
              {region?.short} {currentNews.age}의 <span style={{ color: currentNews.colorHex, fontWeight: 600 }}>{currentNews.colorName}</span> 선택률이 상승하고 있습니다
            </>
          )}
        </span>
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default Ticker;
