import { useState, useEffect } from 'react';
import { CV_getColor, CV_getRegion } from '../data';
import { getRecentVotes, subscribeVotes, getLegacyColorId } from '../lib/supabaseService';

function Ticker() {
  const [newsList, setNewsList] = useState([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // 1. Fetch initial recent votes (real data only; hidden when none)
  useEffect(() => {
    getRecentVotes().then(dbNews => {
      if (dbNews) setNewsList(dbNews);
    });
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

  // 연결됐지만 아직 투표 데이터가 없을 때
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
          아직 투표 데이터가 없습니다
        </div>
      </div>
    );
  }

  const currentNews = newsList[idx];

  // Graceful handling
  if (!currentNews) return null;

  const region = CV_getRegion(currentNews.regionId);
  const isLive = currentNews.isLiveAlert;

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
          background: currentNews.colorHex || '#888',
          boxShadow: `0 0 10px ${currentNews.colorHex || '#888'}`,
          flexShrink: 0,
          display: 'block',
        }} />

        {/* Live badge if it's a real-time incoming push */}
        {isLive && (
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            animation: 'flash 1.5s infinite',
            flexShrink: 0,
          }}>
            속보
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
          {isLive ? (
            <>
              방금 <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{region?.name || '지역'}</strong>의{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{currentNews.age}</strong> 투표자가{' '}
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
