import { useState, useEffect } from 'react';
import { CV_getColor, CV_getRegion } from './data';
import { submitVote, checkTodayVoteExists } from './lib/supabaseService';
import { trackPageView } from './lib/analytics';
import VotePage from './components/VotePage';
import ResultPage from './components/ResultPage';
import MapPage from './components/MapPage';
import StatsPage from './components/StatsPage';
import InfoPage from './components/InfoPage';
import AdminPage from './components/AdminPage';
import Ticker from './components/Ticker';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

function App() {
  const [page, setPage] = useState('vote');
  const [vote, setVote] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cv_vote') || 'null'); }
    catch { return null; }
  });
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    async function syncVoteStatus() {
      const dbVote = await checkTodayVoteExists();
      if (dbVote) {
        setVote(dbVote);
        try {
          localStorage.setItem('cv_vote', JSON.stringify(dbVote));
        } catch (e) {
          console.warn('localStorage setItem failed (incognito/private mode):', e);
        }
        if (page === 'vote') {
          navigate('result');
        }
      } else {
        setVote(null);
        try {
          localStorage.removeItem('cv_vote');
        } catch (e) {
          console.warn('localStorage removeItem failed:', e);
        }
        if (page === 'result') {
          navigate('vote');
        }
      }
    }
    syncVoteStatus();
  }, []);

  function navigate(newPage) {
    if (newPage === page) return;
    setTransitioning(true);
    setTimeout(() => {
      setPage(newPage);
      setTransitioning(false);
    }, 180);
  }

  async function handleVote(colorId, regionId, ageGroup) {
    try {
      // 1. Submit vote to Supabase (restricted daily via DB unique constraints)
      await submitVote(colorId, regionId, ageGroup);

      // 2. Save locally if DB insert completes successfully
      const v = { colorId, regionId, ageGroup, ts: Date.now() };
      setVote(v);
      try {
        localStorage.setItem('cv_vote', JSON.stringify(v));
      } catch (e) {
        console.warn('localStorage setItem failed (incognito/private mode):', e);
      }
      navigate('result');
      return { success: true };
    } catch (err) {
      console.error('Vote submission failed:', err);
      alert(err.message || '투표 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      return { success: false, error: err.message };
    }
  }

  function handleRevote() {
    setVote(null);
    try {
      localStorage.removeItem('cv_vote');
    } catch (e) {
      console.warn('localStorage removeItem failed:', e);
    }
    navigate('vote');
  }

  const color = vote ? CV_getColor(vote.colorId) : null;
  const region = vote ? CV_getRegion(vote.regionId) : null;
  const hasVoted = !!vote;

  return (
    <div style={{
      background: 'var(--canvas, #ffffff)',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)',
    }}>
      <NavBar currentPage={page} onNavigate={navigate} hasVoted={hasVoted} />
      <Ticker />

      <div style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}>
        {page === 'vote'   && <VotePage onVote={handleVote} />}
        {page === 'result' && <ResultPage vote={vote} color={color} region={region} onRevote={handleRevote} />}
        {page === 'map'    && <MapPage />}
        {page === 'stats'  && <StatsPage />}
        {(page === 'about' || page === 'privacy' || page === 'contact') && <InfoPage page={page} onNavigate={navigate} />}
        {page === 'admin'  && <AdminPage onNavigate={navigate} />}
      </div>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;
