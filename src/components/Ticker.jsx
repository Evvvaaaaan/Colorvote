import { useState, useEffect, useCallback } from 'react';
import { CV_getColor, CV_getRegion } from '../data';
import { getRecentVotes, subscribeVotes, getLegacyColorId, getBattlegroundInsights, getIpRegion } from '../lib/supabaseService';

const ENG_NAMES = {
  1: 'RED',
  2: 'ORANGE',
  3: 'YELLOW',
  4: 'GREEN',
  5: 'BLUE',
  6: 'NAVY',
  7: 'PURPLE'
};


// Build a formatted insight ticker item from raw DB insight
function formatInsight(raw) {
  const color1 = CV_getColor(raw.color1Id);
  if (!color1) return null;

  if (raw.type === 'battleground') {
    const color2 = CV_getColor(raw.color2Id);
    if (!color2) return null;

    const diff = raw.diff;
    const eng1 = ENG_NAMES[raw.color1Id] || color1.name;
    const eng2 = ENG_NAMES[raw.color2Id] || color2.name;
    let style; // 'flip' | 'civil' | 'crack' | 'clash'
    if (diff <= 1.0) {
      style = 'flip';
    } else if (diff <= 3.0) {
      style = 'civil';
    } else if (diff <= 5.0) {
      style = 'crack';
    } else {
      style = 'clash';
    }

    return {
      id: `battle-${raw.regionId}-${raw.color1Id}-${raw.color2Id}`,
      type: 'battleground',
      style,
      regionShort: raw.regionShort,
      color1Hex: color1.hex,
      color1Eng: eng1,
      pct1: raw.color1Pct,
      color2Hex: color2.hex,
      color2Eng: eng2,
      pct2: raw.color2Pct,
      diff
    };
  }

  if (raw.type === 'surge') {
    const gainPct = raw.gainPct || 0;
    const eng1 = ENG_NAMES[raw.color1Id] || color1.name;
    return {
      id: `surge-${raw.regionId}-${raw.color1Id}`,
      type: 'surge',
      regionShort: raw.regionShort,
      color1Hex: color1.hex,
      color1Eng: eng1,
      pct1: raw.color1Pct,
      gainPct
    };
  }

  return null;
}

function Ticker({ selectedRegionId = null }) {
  const [newsList, setNewsList] = useState([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [ipRegion, setIpRegion] = useState(null);

  // Resolve the visitor's region from server-side IP (used to filter battlegrounds)
  useEffect(() => {
    let active = true;
    getIpRegion().then(r => { if (active) setIpRegion(r); });
    return () => { active = false; };
  }, []);

  // Load all ticker items (insights + recent votes), callable for refresh
  const loadTickerData = useCallback(async () => {
    try {
      const [dbNews, rawInsights] = await Promise.all([
        getRecentVotes(),
        getBattlegroundInsights()
      ]);

      // 격전지는 사용자의 선택 지역 + IP 지역에 대해서만 노출 (급상승·실시간 피드는 전체).
      // 단, 두 지역 모두 알 수 없으면 모든 격전지를 노출.
      const allowedRegions = new Set([selectedRegionId, ipRegion].filter(Boolean));
      const visibleInsights = allowedRegions.size === 0
        ? rawInsights
        : rawInsights.filter(
            r => r.type !== 'battleground' || allowedRegions.has(r.regionId)
          );

      // Format raw insights into renderable ticker items
      const formattedInsights = visibleInsights
        .map(formatInsight)
        .filter(Boolean);

      // Interleave: insight → vote → vote → insight → vote → vote …
      const mixed = [];
      const votes = dbNews || [];
      let vi = 0;

      for (let i = 0; i < formattedInsights.length; i++) {
        mixed.push(formattedInsights[i]);
        // Add up to 2 recent vote items between each insight
        for (let j = 0; j < 2 && vi < votes.length; j++, vi++) {
          mixed.push(votes[vi]);
        }
      }
      // Append remaining votes
      while (vi < votes.length) {
        mixed.push(votes[vi++]);
      }

      // If no data at all, keep list empty (shows "no data" placeholder)
      if (mixed.length > 0) {
        setNewsList(mixed);
      }
    } catch (err) {
      console.error('Error loading ticker data:', err);
    }
  }, [selectedRegionId, ipRegion]);

  // 1. Initial load
  useEffect(() => {
    loadTickerData();
  }, [loadTickerData]);

  // 2. Listen to live real-time vote insertions
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
          isLiveAlert: true
        };

        setNewsList(prev => {
          const cleanedPrev = prev.filter(item => item.id !== newVote.id);
          return [newNewsItem, ...cleanedPrev.slice(0, 19)];
        });

        setIdx(0);
        setVisible(true);
      }

      // Re-fetch insights after a short delay so DB views reflect the new vote
      setTimeout(() => loadTickerData(), 3000);
    });

    return () => unsubscribe();
  }, [loadTickerData]);

  // 3. Ticker text rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (newsList.length <= 1) return;
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % newsList.length);
        setVisible(true);
      }, 350);
    }, 5000);

    return () => clearInterval(interval);
  }, [newsList]);

  // Empty state
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
  if (!currentNews) return null;

  const region = currentNews.regionId ? CV_getRegion(currentNews.regionId) : null;
  const isLive = currentNews.isLiveAlert;
  const statusColor = currentNews.colorHex || currentNews.color1Hex || '#888';

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

        {/* Badge */}
        {(isLive || currentNews.type === 'battleground' || currentNews.type === 'surge') && (
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            background: currentNews.type === 'battleground' ? '#ff3b30'
              : currentNews.type === 'surge' ? '#ff9500'
              : 'var(--primary)',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            animation: 'flash 1.5s infinite',
            flexShrink: 0,
          }}>
            {currentNews.type === 'battleground' ? '내전' : currentNews.type === 'surge' ? '급증' : '속보'}
          </span>
        )}

        {/* Content */}
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
            currentNews.style === 'flip' ? (
              <>
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{currentNews.regionShort}</strong>{' '}
                <span style={{ color: '#ff3b30', fontWeight: 600 }}>대표색 뒤집기 임박</span>{' '}
                <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>{currentNews.color1Eng} ({currentNews.pct1.toFixed(1)}%)</span>{' '}
                <span style={{ color: 'var(--ink-muted-48)' }}>vs</span>{' '}
                <span style={{ color: currentNews.color2Hex, fontWeight: 700 }}>{currentNews.color2Eng} ({currentNews.pct2.toFixed(1)}%)</span>{' '}
                <span style={{ color: '#ff3b30', fontWeight: 600 }}>| {currentNews.diff.toFixed(1)}% 차</span>
              </>
            ) : currentNews.style === 'civil' ? (
              <>
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{currentNews.regionShort} 내전:</strong>{' '}
                <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>{currentNews.color1Eng} ({currentNews.pct1.toFixed(1)}%)</span>{' '}
                <span style={{ color: 'var(--ink-muted-48)' }}>vs</span>{' '}
                <span style={{ color: currentNews.color2Hex, fontWeight: 700 }}>{currentNews.color2Eng} ({currentNews.pct2.toFixed(1)}%)</span>{' '}
                <span style={{ color: '#ff3b30', fontWeight: 600 }}>| {currentNews.diff.toFixed(1)}% 차이로 지배색 변동 임박</span>
              </>
            ) : currentNews.style === 'crack' ? (
              <>
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{currentNews.regionShort} 내부 균열:</strong>{' '}
                <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>{currentNews.color1Eng}</span>{' '}
                <span style={{ color: 'var(--ink-muted-48)' }}>독주 속</span>{' '}
                <span style={{ color: currentNews.color2Hex, fontWeight: 700 }}>{currentNews.color2Eng}</span>{' '}
                <span style={{ color: '#ff3b30', fontWeight: 600 }}>추격 (격차 {currentNews.diff.toFixed(1)}%)</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--ink-muted-48)' }}>지역 내 대립:</span>{' '}
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{currentNews.regionShort}</strong>{' '}
                <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>{currentNews.color1Eng}</span>{' '}
                <span style={{ color: 'var(--ink-muted-48)' }}>vs</span>{' '}
                <span style={{ color: currentNews.color2Hex, fontWeight: 700 }}>{currentNews.color2Eng}</span>{' '}
                <span style={{ color: '#ff3b30', fontWeight: 600 }}>({currentNews.diff.toFixed(1)}% 격차)</span>
              </>
            )
          ) : currentNews.type === 'surge' ? (
            <>
              <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{currentNews.regionShort}</strong>{' '}
              <span style={{ color: currentNews.color1Hex, fontWeight: 700 }}>{currentNews.color1Eng}</span>{' '}
              <span style={{ color: '#ff9500', fontWeight: 700 }}>+{currentNews.gainPct}% 급증</span>{' '}
              <span style={{ color: 'var(--ink-muted-48)' }}>({currentNews.pct1.toFixed(1)}% 점유 · 최근 1시간 유입 급증 🔥)</span>
            </>
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
