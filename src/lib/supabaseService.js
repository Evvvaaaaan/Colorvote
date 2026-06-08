import { supabase, isSupabaseConfigured } from './supabase';
import { CV_COLORS, CV_REGIONS, CV_REGION_DETAIL, CV_HEATMAP, CV_TRENDING, CV_AGE_GROUPS } from '../data';

// 1. Stable per-browser client ID (random, persisted in localStorage).
// Note: derived device fingerprints (userAgent/language/colorDepth) collide
// across users on identical devices, which wrongly blocks non-voters. A random
// per-browser ID keeps the "one vote per day per browser" rule without collisions.
export async function getFingerprint() {
  const KEY = 'cv_client_id';
  let id = null;
  try {
    id = localStorage.getItem(KEY);
  } catch { /* localStorage unavailable */ }

  if (!id) {
    id = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    try {
      localStorage.setItem(KEY, id);
    } catch { /* localStorage unavailable */ }
  }

  return id;
}

// 2. Map legacy integer color ID to Static Supabase UUID
export const LEGACY_UUID_MAP = {
  1: 'f0f9c2d1-bc74-4b53-90d2-97ba5a5d8b8a', // 딥 네이비
  2: 'a9e9a4f4-5f12-4217-bf3f-91cb61cf2ab0', // 로열 블루
  3: '7cb9352e-c1cf-41c3-bf6b-712c9bf1f274', // 스카이 블루
  4: '3d9f9a2b-819a-4c22-92e1-45fa2be416fb', // 틸
  5: 'e5a95f2d-ec3d-4c3e-908d-ef30825f381f', // 에메랄드
  6: '8cd92b21-4f1c-4b52-9b2f-38fa91cd9a2d', // 포레스트
  7: '1c9a4f22-dcf1-456f-87d2-7fb2a1dcf982', // 올리브
  8: 'bcfa9f45-d8cf-4bfa-90fa-12ab92cdaef0', // 민트
  9: 'a5f21c9b-ec22-4cf0-8bfa-dcb2a84fa218', // 세이지
  10: 'd2a9fb41-cf19-45e3-82a1-cf92ab1f5cf2', // 골든
  11: 'e8b2cf91-12c8-4dfb-90f2-fa12acfa1b2e', // 앰버
  12: 'fb12a95c-dcf1-4e92-9cf1-ab1cfb2da9f1', // 코랄
  13: '1ac2d9fa-cb19-4fa2-92f1-ecfa92cdfa21', // 테라코타
  14: 'cf1b2d9a-1290-4bf2-901d-12abac09df10', // 크림슨
  15: 'df2a9b4f-8cf1-4bfb-92b1-ac092bcfda12', // 로즈
  16: 'ef219ac0-dcf1-4f2a-89a1-ac219bcf82ab', // 핫 핑크
  17: 'a8cf129b-d8fa-4cfb-8ea1-cfba928cfb02', // 마젠타
  18: 'cf92ab14-ecf9-4cf0-90ab-ac98dc08fa14', // 라벤더
  19: '1ab92cda-c0df-4f01-9ac0-12bcaf089df1', // 딥 퍼플
  20: 'b9ac0dc2-df1a-4fa1-92b1-098cfacfa0e2', // 인디고
  21: 'bcfa92cf-1d8f-4cf0-82a1-92ab08dfda2b', // 페리윙클
  22: '98fa0dcf-2d10-4fa2-8b9a-12cfa8a09cf1', // 버건디
  23: 'c0dfa982-f12d-4bfb-87b1-ac2dfa981c2f', // 실버
  24: '87fa0bc2-d8fa-4a21-9ab2-8cf0da92cfa2', // 슬레이트
  25: '2ab987cd-d8fa-4cb2-87a1-ec92acfb09df', // 샌드
  26: '7d8f92ac-c19a-4c22-902d-acfa982cda0b', // 카키
  27: '0dfa92cb-cf90-4c22-82ac-098dbcf19ac0', // 미드나잇
  28: '8fa2c0df-d2a9-4fb2-80da-9cfa98b0cfdc', // 블러시
};

const AGE_TOP5 = {
  '10대': [
    { id: 7, pct: 41 }, { id: 4, pct: 23 }, { id: 1, pct: 18 }, { id: 3, pct: 12 }, { id: 5, pct: 8 },
  ],
  '20대': [
    { id: 1, pct: 34 }, { id: 5, pct: 22 }, { id: 7, pct: 17 }, { id: 3, pct: 15 }, { id: 2, pct: 11 },
  ],
  '30대': [
    { id: 5, pct: 31 }, { id: 7, pct: 26 }, { id: 3, pct: 19 }, { id: 2, pct: 14 }, { id: 6, pct: 10 },
  ],
  '40대': [
    { id: 2, pct: 28 }, { id: 5, pct: 24 }, { id: 1, pct: 18 }, { id: 6, pct: 16 }, { id: 3, pct: 13 },
  ],
  '50대+': [
    { id: 4, pct: 35 }, { id: 1, pct: 26 }, { id: 6, pct: 20 }, { id: 5, pct: 12 }, { id: 2, pct: 7 },
  ],
};

// 3. Reverse map UUID to Legacy Integer ID
export function getLegacyColorId(uuid) {
  if (!uuid) return null;
  const targetUuid = uuid.toLowerCase();
  const entry = Object.entries(LEGACY_UUID_MAP).find(([_, u]) => u.toLowerCase() === targetUuid);
  return entry ? parseInt(entry[0], 10) : null;
}

// ── Service API with Graceful Mock Fallbacks ──

// Helper: fetch all rows past PostgREST's 1000-row default cap via paging
async function fetchAllRows(buildQuery, pageSize = 1000) {
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// Fetch colors with optional time-range filtering
export async function getColors(timeRange = '전체') {
  if (!isSupabaseConfigured) return CV_COLORS;
  
  try {
    const { data: colorsData, error: colorsError } = await supabase
      .from('colors')
      .select('*')
      .order('legacy_id', { ascending: true });
      
    if (colorsError) throw colorsError;

    // Filter to only legacy IDs 1 to 7
    const filteredColorsData = colorsData.filter(c => c.legacy_id >= 1 && c.legacy_id <= 7);

    let voteCounts = {};
    if (timeRange === '전체') {
      const countResults = await Promise.all(
        filteredColorsData.map(c =>
          supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('color_id', c.id)
        )
      );
      countResults.forEach((res, i) => {
        if (res.error) throw res.error;
        voteCounts[filteredColorsData[i].id] = res.count || 0;
      });
    } else {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_colors_by_time_range', { t_range: timeRange });
      if (rpcError) throw rpcError;
      
      rpcData.forEach(item => {
        voteCounts[item.color_id] = parseInt(item.vote_count, 10);
      });
    }

    return filteredColorsData.map(c => {
      const rainbowColor = CV_COLORS.find(rc => rc.id === c.legacy_id);
      return {
        id: c.legacy_id,
        name: rainbowColor ? rainbowColor.name : c.name,
        hex: rainbowColor ? rainbowColor.hex : c.hex,
        personality: rainbowColor ? rainbowColor.personality : c.personality_type,
        trait: rainbowColor ? rainbowColor.trait : c.trait,
        votes: voteCounts[c.id] || 0
      };
    });
  } catch (err) {
    console.error('Error fetching colors:', err);
    return [];
  }
}

// Submit a vote to Supabase (restricted daily via DB unique constraints)
export async function submitVote(legacyColorId, regionId, ageGroup) {
  if (!isSupabaseConfigured) {
    console.log('Mock Vote Submitted:', { legacyColorId, regionId, ageGroup });
    return { success: true, mock: true };
  }

  const fingerprint = await getFingerprint();
  const colorUuid = LEGACY_UUID_MAP[legacyColorId];

  if (!colorUuid) {
    throw new Error('올바르지 않은 색상 식별자입니다.');
  }

  const { data, error } = await supabase
    .from('votes')
    .insert([
      {
        color_id: colorUuid,
        region: regionId,
        age_group: ageGroup,
        fingerprint: fingerprint
      }
    ])
    .select();

  if (error) {
    if (error.code === '23505') {
      throw new Error('오늘은 이미 참여하셨습니다. 내일 다시 참여해 주세요.');
    }
    throw error;
  }

  return { success: true, data };
}

// Fetch region statistics (Map Page representation)
export async function getStatsByRegion() {
  if (!isSupabaseConfigured) {
    return { regions: CV_REGIONS, detail: CV_REGION_DETAIL, heatmap: CV_HEATMAP };
  }

  try {
    const { data: rawRegionStats, error: regionErr } = await supabase
      .from('stats_by_region')
      .select('*')
      .order('region')
      .order('vote_count', { ascending: false });

    if (regionErr) throw regionErr;

    // Page through stats_combined (region × age × color can exceed the 1000-row cap)
    const rawCombinedStats = await fetchAllRows(() =>
      supabase
        .from('stats_combined')
        .select('*')
        .order('region')
        .order('age_group')
        .order('color_id')
    );

    const filteredRegionStats = rawRegionStats.filter(s => {
      const legacyId = getLegacyColorId(s.color_id);
      return legacyId >= 1 && legacyId <= 7;
    });

    const filteredCombinedStats = rawCombinedStats.filter(s => {
      const legacyId = getLegacyColorId(s.color_id);
      return legacyId >= 1 && legacyId <= 7;
    });

    const updatedRegions = CV_REGIONS.map(r => {
      const stats = filteredRegionStats.filter(s => s.region === r.id);
      const total = stats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
      // Region color = the single most-voted color in that region
      const topColorDb = stats.reduce(
        (best, curr) =>
          !best || parseInt(curr.vote_count, 10) > parseInt(best.vote_count, 10) ? curr : best,
        null
      );
      const topColorId = topColorDb ? getLegacyColorId(topColorDb.color_id) : null;

      return { ...r, topColorId, votes: total };
    });

    const updatedDetail = {};
    const updatedHeatmap = {};

    CV_REGIONS.forEach(r => {
      const stats = filteredRegionStats.filter(s => s.region === r.id);
      const total = stats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
      
      const topColors = stats
        .map(s => ({
          id: getLegacyColorId(s.color_id),
          pct: total > 0 ? Math.round((parseInt(s.vote_count, 10) / total) * 100) : 0
        }))
        .filter(tc => tc.id !== null)
        .slice(0, 3);

      const regionCombined = filteredCombinedStats.filter(s => s.region === r.id);
      const regionAgeTotal = regionCombined.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);

      const byAge = {};
      const regionHeatmap = {};
      
      CV_AGE_GROUPS.forEach(ag => {
        const ageStats = regionCombined.filter(s => s.age_group === ag);
        const ageTotal = ageStats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
        
        byAge[ag] = regionAgeTotal > 0 ? Math.round((ageTotal / regionAgeTotal) * 100) : 0;

        const sortedAgeColors = [...ageStats].sort((a, b) => parseInt(b.vote_count, 10) - parseInt(a.vote_count, 10));
        const topAgeColorDb = sortedAgeColors[0];
        regionHeatmap[ag] = topAgeColorDb ? getLegacyColorId(topAgeColorDb.color_id) : null;
      });

      updatedDetail[r.id] = { topColors, byAge, total };
      updatedHeatmap[r.id] = regionHeatmap;
    });

    return { regions: updatedRegions, detail: updatedDetail, heatmap: updatedHeatmap };
  } catch (err) {
    console.error('Error fetching region stats:', err);
    const emptyDetail = {};
    const emptyHeatmap = {};
    CV_REGIONS.forEach(r => {
      emptyDetail[r.id] = {
        topColors: [],
        byAge: Object.fromEntries(CV_AGE_GROUPS.map(ag => [ag, 0])),
        total: 0
      };
      emptyHeatmap[r.id] = Object.fromEntries(CV_AGE_GROUPS.map(ag => [ag, null]));
    });
    return {
      regions: CV_REGIONS.map(r => ({ ...r, topColorId: null, votes: 0 })),
      detail: emptyDetail,
      heatmap: emptyHeatmap
    };
  }
}

// Fetch age statistics ranking breakdown (StatsPage TOP COLOR BY AGE)
export async function getStatsByAgeRange() {
  if (!isSupabaseConfigured) return AGE_TOP5;

  try {
    const { data: rawAgeStats, error } = await supabase
      .from('stats_by_age')
      .select('*')
      .order('age_group')
      .order('vote_count', { ascending: false });

    if (error) throw error;

    const formattedAgeStats = {};
    CV_AGE_GROUPS.forEach(ag => {
      const ageRecords = rawAgeStats.filter(s => {
        if (s.age_group !== ag) return false;
        const legacyId = getLegacyColorId(s.color_id);
        return legacyId >= 1 && legacyId <= 7;
      });
      const top5 = ageRecords
        .slice(0, 5)
        .map(s => {
          const p = parseFloat(s.pct);
          return {
            id: getLegacyColorId(s.color_id),
            pct: Number.isFinite(p) ? Math.round(p) : 0
          };
        })
        .filter(s => s.id !== null);

      formattedAgeStats[ag] = top5;
    });

    return formattedAgeStats;
  } catch (err) {
    console.error('Error fetching age cohort rankings:', err);
    return {};
  }
}

// Fetch aggregate combined user DNA segment stats
export async function getDNAStats(regionId, ageGroup, legacyColorId) {
  if (!isSupabaseConfigured) {
    const segment = CV_REGION_DETAIL[regionId];
    const percentage = segment?.topColors.find(tc => tc.id === legacyColorId)?.pct || 15;
    const total = segment?.total || 5000;
    const segmentVotes = Math.round(total * (percentage / 100));
    return { pct: percentage, votes: segmentVotes };
  }

  try {
    const colorUuid = LEGACY_UUID_MAP[legacyColorId];
    const { data, error } = await supabase
      .from('stats_combined')
      .select('*')
      .eq('region', regionId)
      .eq('age_group', ageGroup)
      .eq('color_id', colorUuid)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const pct = parseFloat(data.pct);
      const votes = parseInt(data.vote_count, 10);
      return {
        pct: Number.isFinite(pct) ? pct : 0,
        votes: Number.isFinite(votes) ? votes : 0
      };
    }
    return { pct: 0, votes: 0 };
  } catch (err) {
    console.error('Error fetching DNA stats:', err);
    return { pct: 0, votes: 0 };
  }
}

// Fetch single color votes count
export async function getSingleColorVotes(legacyColorId) {
  if (!isSupabaseConfigured) {
    const color = CV_COLORS.find(c => c.id === legacyColorId);
    return color ? color.votes : 0;
  }

  try {
    const colorUuid = LEGACY_UUID_MAP[legacyColorId];
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('color_id', colorUuid);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error counting single color votes:', err);
    return 0;
  }
}

// Fetch battleground (close-race) and surge (momentum) insights for ticker
export async function getBattlegroundInsights() {
  if (!isSupabaseConfigured) {
    // Generate insights from mock CV_REGION_DETAIL data
    const insights = [];
    const regionIds = Object.keys(CV_REGION_DETAIL);
    
    regionIds.forEach(rid => {
      const d = CV_REGION_DETAIL[rid];
      const region = CV_REGIONS.find(r => r.id === rid);
      if (!d || !region || !d.topColors || d.topColors.length < 2) return;
      
      const c1 = d.topColors[0];
      const c2 = d.topColors[1];
      const diff = Math.abs(c1.pct - c2.pct);
      
      if (diff <= 10) {
        const color1 = CV_COLORS.find(c => c.id === c1.id);
        const color2 = CV_COLORS.find(c => c.id === c2.id);
        if (color1 && color2) {
          insights.push({
            type: 'battleground',
            regionId: rid,
            regionShort: region.short,
            color1Id: c1.id,
            color1Pct: c1.pct,
            color2Id: c2.id,
            color2Pct: c2.pct,
            diff
          });
        }
      }
    });

    // Mock surge from CV_TRENDING
    CV_TRENDING.slice(0, 2).forEach(t => {
      const color = CV_COLORS.find(c => c.id === t.colorId);
      if (color) {
        // Find which region this color dominates most
        let bestRegion = null;
        let bestPct = 0;
        regionIds.forEach(rid => {
          const d = CV_REGION_DETAIL[rid];
          if (d && d.topColors) {
            const entry = d.topColors.find(tc => tc.id === t.colorId);
            if (entry && entry.pct > bestPct) {
              bestPct = entry.pct;
              bestRegion = CV_REGIONS.find(r => r.id === rid);
            }
          }
        });
        if (bestRegion) {
          insights.push({
            type: 'surge',
            regionId: bestRegion.id,
            regionShort: bestRegion.short,
            color1Id: t.colorId,
            color1Pct: bestPct,
            gainPct: t.gainPct
          });
        }
      }
    });

    // Sort battlegrounds by smallest diff first (most exciting)
    return insights.sort((a, b) => {
      if (a.type === 'battleground' && b.type === 'battleground') return a.diff - b.diff;
      if (a.type === 'battleground') return -1;
      return 1;
    }).slice(0, 6);
  }

  try {
    // 1. Query stats_by_region for high-precision per-region color distribution
    const { data: rawRegionStats, error: regionErr } = await supabase
      .from('stats_by_region')
      .select('*')
      .order('region')
      .order('vote_count', { ascending: false });

    if (regionErr) throw regionErr;

    const filteredStats = rawRegionStats.filter(s => {
      const legacyId = getLegacyColorId(s.color_id);
      return legacyId !== null && legacyId >= 1 && legacyId <= 7;
    });

    // 2. Query stats_trending for hourly momentum
    const { data: trendingData, error: trendErr } = await supabase
      .from('stats_trending')
      .select('*')
      .limit(7);

    if (trendErr) throw trendErr;

    const trendingMap = {};
    trendingData.forEach(t => {
      const legacyId = getLegacyColorId(t.color_id);
      if (legacyId !== null && legacyId >= 1 && legacyId <= 7) {
        trendingMap[legacyId] = {
          gainPct: Math.round(parseFloat(t.gain_pct) || 0),
          hourVotes: parseInt(t.hour_votes, 10) || 0
        };
      }
    });

    // 3. Build per-region breakdown with float-precision percentages
    const insights = [];
    const regionGroups = {};
    
    filteredStats.forEach(s => {
      if (!regionGroups[s.region]) regionGroups[s.region] = [];
      regionGroups[s.region].push(s);
    });

    Object.entries(regionGroups).forEach(([rid, stats]) => {
      const region = CV_REGIONS.find(r => r.id === rid);
      if (!region) return;

      const total = stats.reduce((sum, s) => {
        const count = parseInt(s.vote_count, 10);
        return sum + (isNaN(count) ? 0 : count);
      }, 0);

      if (total <= 0) return;

      // Sort by vote_count descending
      const sorted = [...stats].sort((a, b) => {
        const aCount = parseInt(a.vote_count, 10) || 0;
        const bCount = parseInt(b.vote_count, 10) || 0;
        return bCount - aCount;
      });
      
      const c1Count = parseInt(sorted[0].vote_count, 10) || 0;
      const c1Id = getLegacyColorId(sorted[0].color_id);
      const c1Pct = total > 0 ? parseFloat(((c1Count / total) * 100).toFixed(1)) : 0;

      if (sorted.length >= 2) {
        const c2Count = parseInt(sorted[1].vote_count, 10) || 0;
        const c2Id = getLegacyColorId(sorted[1].color_id);
        const c2Pct = total > 0 ? parseFloat(((c2Count / total) * 100).toFixed(1)) : 0;
        const diff = parseFloat(Math.abs(c1Pct - c2Pct).toFixed(1));

        console.log(`[Ticker Debug] Region: ${region.short}, c1: ${c1Id} (${c1Pct}%, ${c1Count} votes), c2: ${c2Id} (${c2Pct}%, ${c2Count} votes), diff: ${diff}%, total: ${total}`);

        if (diff <= 10.0) {
          insights.push({
            type: 'battleground',
            regionId: rid,
            regionShort: region.short,
            color1Id: c1Id,
            color1Pct: c1Pct,
            color2Id: c2Id,
            color2Pct: c2Pct,
            diff
          });
        }
      }

      // Check for surge: top color has strong trending momentum
      const trend = trendingMap[c1Id];
      if (trend && trend.gainPct >= 20 && trend.hourVotes >= 1) {
        insights.push({
          type: 'surge',
          regionId: rid,
          regionShort: region.short,
          color1Id: c1Id,
          color1Pct: c1Pct,
          gainPct: trend.gainPct
        });
      }
    });

    // Sort: battlegrounds by smallest diff, then surges by highest gain
    return insights.sort((a, b) => {
      if (a.type === 'battleground' && b.type === 'battleground') return a.diff - b.diff;
      if (a.type === 'battleground') return -1;
      if (b.type === 'battleground') return 1;
      return (b.gainPct || 0) - (a.gainPct || 0);
    }).slice(0, 6);
  } catch (err) {
    console.error('Error fetching battleground insights:', err);
    return [];
  }
}

// Fetch real-time trending colors
export async function getTrendingColors() {
  if (!isSupabaseConfigured) return CV_TRENDING;

  try {
    const { data, error } = await supabase
      .from('stats_trending')
      .select('*')
      .limit(5);

    if (error) throw error;
    
    const formatted = data.map(t => {
      const gain = parseFloat(t.gain_pct);
      const hours = parseInt(t.hour_votes, 10);
      return {
        colorId: getLegacyColorId(t.color_id),
        gainPct: Number.isFinite(gain) ? Math.round(gain) : 0,
        hourVotes: Number.isFinite(hours) ? hours : 0
      };
    }).filter(t => t.colorId >= 1 && t.colorId <= 7);

    return formatted;
  } catch (err) {
    console.error('Error fetching trending:', err);
    return [];
  }
}

// Real-time listener subscription hook for live updates
export function subscribeVotes(onNewVote) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`votes-realtime-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes' },
      (payload) => {
        console.log('실시간 새 투표 수집 완료:', payload.new);
        onNewVote(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Fetch recent votes list for Ticker news
export async function getRecentVotes() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('stats_recent_votes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) throw error;
    return data.map(v => {
      const legacyId = getLegacyColorId(v.color_id);
      const rainbowColor = CV_COLORS.find(rc => rc.id === legacyId);
      return {
        id: v.id,
        regionId: v.region,
        age: v.age_group,
        colorId: legacyId,
        colorName: rainbowColor ? rainbowColor.name : v.color_name,
        colorHex: rainbowColor ? rainbowColor.hex : v.color_hex,
        time: v.created_at
      };
    }).filter(v => v.colorId >= 1 && v.colorId <= 7);
  } catch (err) {
    console.error('Error fetching recent votes:', err);
    return [];
  }
}

// Check if current device has voted today in Supabase
export async function checkTodayVoteExists() {
  if (!isSupabaseConfigured) return null;
  try {
    const fingerprint = await getFingerprint();
    
    // Calculate KST (UTC+9) today 00:00:00 equivalent in UTC
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKST = new Date(Date.now() + kstOffset);
    todayKST.setUTCHours(0, 0, 0, 0);
    const todayUtcIso = new Date(todayKST.getTime() - kstOffset).toISOString();

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('fingerprint', fingerprint)
      .gte('created_at', todayUtcIso)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      const v = data[0];
      return {
        colorId: getLegacyColorId(v.color_id),
        regionId: v.region,
        ageGroup: v.age_group,
        ts: new Date(v.created_at).getTime()
      };
    }
    return null;
  } catch (err) {
    console.error('Error checking today vote:', err);
    return null;
  }
}

// Fetch all votes for Admin Dashboard (limits to 200 rows with color joins)
export async function getAdminVotes() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        id,
        region,
        age_group,
        created_at,
        fingerprint,
        color_id,
        colors (
          name,
          hex
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    
    return data.map(v => {
      const legacyId = getLegacyColorId(v.color_id);
      const rainbowColor = CV_COLORS.find(rc => rc.id === legacyId);
      return {
        id: v.id,
        regionId: v.region,
        age: v.age_group,
        time: v.created_at,
        fingerprint: v.fingerprint,
        colorName: rainbowColor ? rainbowColor.name : (v.colors?.name || '알 수 없음'),
        colorHex: rainbowColor ? rainbowColor.hex : (v.colors?.hex || '#888888'),
        colorId: legacyId
      };
    }).filter(v => v.colorId >= 1 && v.colorId <= 7);
  } catch (err) {
    console.error('Failed to fetch admin votes:', err);
    return [];
  }
}

// Fetch total global votes count
export async function getTotalVoteCount() {
  if (!isSupabaseConfigured) return 0;
  try {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Failed to count total votes:', err);
    return 0;
  }
}


