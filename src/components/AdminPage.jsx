import { useState, useEffect } from 'react';
import { getAdminVotes, getTotalVoteCount } from '../lib/supabaseService';
import { CV_getRegion } from '../data';

function AdminPage({ onNavigate }) {
  const [votes, setVotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [votesData, countData] = await Promise.all([
        getAdminVotes(),
        getTotalVoteCount()
      ]);
      setVotes(votesData);
      setTotalCount(countData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function formatTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function maskFingerprint(fp) {
    if (!fp) return '—';
    if (fp.length <= 8) return fp;
    return `${fp.slice(0, 6)}...${fp.slice(-6)}`;
  }

  return (
    <div style={{
      background: '#0f0f14',
      minHeight: '100vh',
      color: '#ffffff',
      paddingTop: '100px',
      paddingBottom: '80px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        maxWidth: '980px',
        margin: '0 auto',
        padding: '0 var(--sp-lg)',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <button
              onClick={() => onNavigate('vote')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                padding: '0',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← 투표하러 가기
            </button>
            <h1 className="typo-hero" style={{ margin: 0, fontWeight: 700, color: '#ffffff' }}>
              관리자 대시보드
            </h1>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              height: '40px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            {loading ? '로딩 중...' : '새로고침'}
          </button>
        </div>

        {/* Aggregate metric cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div className="typo-caption-strong" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              누적 총 투표수
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--primary)' }}>
              {loading ? '...' : totalCount.toLocaleString()}표
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div className="typo-caption-strong" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              최근 조회 로그 수
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#ffffff' }}>
              {loading ? '...' : votes.length.toLocaleString()}건
            </div>
          </div>
        </div>

        {/* Votes log table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1.5px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#ffffff' }}>
              실시간 투표 로그 (최근 200건)
            </h2>
          </div>

          {loading && votes.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '15px' }}>
              데이터를 불러오는 중입니다...
            </div>
          ) : votes.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '15px' }}>
              등록된 투표 데이터가 없습니다.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '14px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <th style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>일시</th>
                    <th style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>선택 색상</th>
                    <th style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>지역</th>
                    <th style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>연령대</th>
                    <th style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>기기 핑거프린트</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((v) => {
                    const reg = CV_getRegion(v.regionId);
                    return (
                      <tr key={v.id} style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '16px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {formatTime(v.time)}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: v.colorHex,
                              display: 'inline-block',
                              boxShadow: `0 0 8px ${v.colorHex}`
                            }} />
                            <span style={{ fontWeight: 600, color: '#ffffff' }}>{v.colorName}</span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{v.colorHex}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 500 }}>
                          {reg ? reg.name : v.regionId}
                        </td>
                        <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 500 }}>
                          {v.age}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace', fontSize: '12px' }}>
                          {maskFingerprint(v.fingerprint)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
