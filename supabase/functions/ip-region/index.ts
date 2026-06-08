// ip-region — resolves the caller's IP to a ColorVote region id, server-side.
// The browser never sends its IP to a third party directly; this function does
// the geolocation lookup and returns only a region id (or null).
//
// Deploy:  supabase functions deploy ip-region
// Invoke:  supabase.functions.invoke('ip-region')  (from the client)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ipapi.co `region`/`city` (English) → ColorVote region id.
// Keys are normalized (lowercased, non-letters stripped) before lookup.
const REGION_MAP: Record<string, string> = {
  seoul: 'seoul',
  incheon: 'incheon',
  gyeonggido: 'gyeonggi',
  gangwondo: 'gangwon',
  chungcheongbukdo: 'chungbuk',
  chungcheongnamdo: 'chungnam',
  sejong: 'sejong',
  sejongsi: 'sejong',
  daejeon: 'daejeon',
  jeollabukdo: 'jeonbuk',
  jeollanamdo: 'jeonnam',
  gwangju: 'gwangju',
  gyeongsangbukdo: 'gyeongbuk',
  daegu: 'daegu',
  gyeongsangnamdo: 'gyeongnam',
  busan: 'busan',
  jejudo: 'jeju',
  jeju: 'jeju',
  ulsan: 'gyeongnam', // Ulsan is merged into 경남 in this dataset
};

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');

function clientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Always answer 200 with a region (possibly null) so the client degrades gracefully.
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const ip = clientIp(req);
    if (!ip) return json({ region: null, reason: 'no-ip' });

    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return json({ region: null, reason: 'geo-failed' });
    const geo = await res.json();

    if (geo.country_code && geo.country_code !== 'KR') {
      return json({ region: null, reason: 'non-kr' });
    }

    // Pohang is its own region id in this dataset, so prefer the city match.
    if (norm(geo.city).includes('pohang')) {
      return json({ region: 'pohang' });
    }

    const region = REGION_MAP[norm(geo.region)] ?? null;
    return json({ region });
  } catch (err) {
    return json({ region: null, reason: String(err) });
  }
});
