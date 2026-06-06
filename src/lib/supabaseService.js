import { supabase, isSupabaseConfigured } from './supabase';
import { CV_COLORS, CV_REGIONS, CV_REGION_DETAIL, CV_HEATMAP, CV_TRENDING, CV_AGE_GROUPS } from '../data';

// 1. Generate client fingerprint based on UserAgent + Screen details
export async function getFingerprint() {
  const navigatorInfo = window.navigator.userAgent + window.navigator.language + window.screen.colorDepth;
  
  // Simple SHA-256 equivalent hashing in browser js
  const msgBuffer = new TextEncoder().encode(navigatorInfo);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
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
    { id: 16, pct: 41 }, { id: 8, pct: 23 }, { id: 18, pct: 18 }, { id: 10, pct: 12 }, { id: 17, pct: 8 },
  ],
  '20대': [
    { id: 18, pct: 34 }, { id: 1, pct: 22 }, { id: 21, pct: 17 }, { id: 16, pct: 15 }, { id: 10, pct: 11 },
  ],
  '30대': [
    { id: 1, pct: 31 }, { id: 18, pct: 26 }, { id: 10, pct: 19 }, { id: 11, pct: 14 }, { id: 3, pct: 10 },
  ],
  '40대': [
    { id: 11, pct: 28 }, { id: 1, pct: 24 }, { id: 23, pct: 18 }, { id: 2, pct: 16 }, { id: 10, pct: 13 },
  ],
  '50대+': [
    { id: 6, pct: 35 }, { id: 23, pct: 26 }, { id: 1, pct: 20 }, { id: 7, pct: 12 }, { id: 11, pct: 7 },
  ],
};

// 3. Reverse map UUID to Legacy Integer ID
export function getLegacyColorId(uuid) {
  const entry = Object.entries(LEGACY_UUID_MAP).find(([_, u]) => u === uuid);
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

    let voteCounts = {};
    if (timeRange === '전체') {
      // Count per color via head-only exact counts (no row body transfer, no 1000-row cap)
      const countResults = await Promise.all(
        colorsData.map(c =>
          supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('color_id', c.id)
        )
      );
      countResults.forEach((res, i) => {
        if (res.error) throw res.error;
        voteCounts[colorsData[i].id] = res.count || 0;
      });
    } else {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_colors_by_time_range', { t_range: timeRange });
      if (rpcError) throw rpcError;
      
      rpcData.forEach(item => {
        voteCounts[item.color_id] = parseInt(item.vote_count, 10);
      });
    }

    return colorsData.map(c => ({
      id: c.legacy_id,
      name: c.name,
      hex: c.hex,
      personality: c.personality_type,
      trait: c.trait,
      votes: voteCounts[c.id] || 0
    }));
  } catch (err) {
    console.error('Error fetching colors, using mockup:', err);
    return CV_COLORS;
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
      throw new Error('오늘은 이미 투표에 참여하셨습니다. 내일 다시 참여해 주세요.');
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

    const updatedRegions = CV_REGIONS.map(r => {
      const stats = rawRegionStats.filter(s => s.region === r.id);
      const total = stats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
      // Region color = the single most-voted color in that region
      const topColorDb = stats.reduce(
        (best, curr) =>
          !best || parseInt(curr.vote_count, 10) > parseInt(best.vote_count, 10) ? curr : best,
        null
      );
      const topColorId = topColorDb ? getLegacyColorId(topColorDb.color_id) : r.topColorId;

      return {
        ...r,
        topColorId,
        votes: total > 0 ? total : r.votes
      };
    });

    const updatedDetail = {};
    const updatedHeatmap = {};

    CV_REGIONS.forEach(r => {
      const stats = rawRegionStats.filter(s => s.region === r.id);
      const total = stats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
      
      const topColors = stats.slice(0, 3).map(s => ({
        id: getLegacyColorId(s.color_id),
        pct: total > 0 ? Math.round((parseInt(s.vote_count, 10) / total) * 100) : 0
      }));

      const regionCombined = rawCombinedStats.filter(s => s.region === r.id);
      const regionAgeTotal = regionCombined.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);

      const byAge = {};
      const regionHeatmap = {};
      
      CV_AGE_GROUPS.forEach(ag => {
        const ageStats = regionCombined.filter(s => s.age_group === ag);
        const ageTotal = ageStats.reduce((acc, curr) => acc + parseInt(curr.vote_count, 10), 0);
        
        byAge[ag] = regionAgeTotal > 0 ? Math.round((ageTotal / regionAgeTotal) * 100) : (CV_REGION_DETAIL[r.id].byAge[ag] || 0);

        const sortedAgeColors = [...ageStats].sort((a, b) => parseInt(b.vote_count, 10) - parseInt(a.vote_count, 10));
        const topAgeColorDb = sortedAgeColors[0];
        regionHeatmap[ag] = topAgeColorDb ? getLegacyColorId(topAgeColorDb.color_id) : (CV_HEATMAP[r.id]?.[ag] || r.topColorId);
      });

      updatedDetail[r.id] = {
        topColors: topColors.length > 0 ? topColors : CV_REGION_DETAIL[r.id].topColors,
        byAge: Object.keys(byAge).length > 0 ? byAge : CV_REGION_DETAIL[r.id].byAge,
        total: total > 0 ? total : CV_REGION_DETAIL[r.id].total
      };

      updatedHeatmap[r.id] = regionHeatmap;
    });

    return { regions: updatedRegions, detail: updatedDetail, heatmap: updatedHeatmap };
  } catch (err) {
    console.error('Error fetching region stats, using mockups:', err);
    return { regions: CV_REGIONS, detail: CV_REGION_DETAIL, heatmap: CV_HEATMAP };
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
      const ageRecords = rawAgeStats.filter(s => s.age_group === ag);
      const top5 = ageRecords.slice(0, 5).map(s => ({
        id: getLegacyColorId(s.color_id),
        pct: Math.round(parseFloat(s.pct))
      }));
      
      formattedAgeStats[ag] = top5.length > 0 ? top5 : AGE_TOP5[ag];
    });

    return formattedAgeStats;
  } catch (err) {
    console.error('Error fetching age cohort rankings, using fallback:', err);
    return AGE_TOP5;
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
      return {
        pct: parseFloat(data.pct),
        votes: parseInt(data.vote_count, 10)
      };
    }
    return { pct: 0, votes: 0 };
  } catch (err) {
    console.error('Error fetching DNA stats, using mocks:', err);
    return { pct: 15, votes: 200 };
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
    const color = CV_COLORS.find(c => c.id === legacyColorId);
    return color ? color.votes : 0;
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
    
    const formatted = data.map(t => ({
      colorId: getLegacyColorId(t.color_id),
      gainPct: Math.round(parseFloat(t.gain_pct)),
      hourVotes: parseInt(t.hour_votes, 10)
    })).filter(t => t.colorId !== null);

    return formatted.length > 0 ? formatted : CV_TRENDING;
  } catch (err) {
    console.error('Error fetching trending, fallback:', err);
    return CV_TRENDING;
  }
}

// Real-time listener subscription hook for live updates
export function subscribeVotes(onNewVote) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('votes-realtime-channel')
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
      .select('*');

    if (error) throw error;
    return data.map(v => ({
      id: v.id,
      regionId: v.region,
      age: v.age_group,
      colorId: getLegacyColorId(v.color_id),
      colorName: v.color_name,
      colorHex: v.color_hex,
      time: v.created_at
    }));
  } catch (err) {
    console.error('Error fetching recent votes:', err);
    return null;
  }
}
