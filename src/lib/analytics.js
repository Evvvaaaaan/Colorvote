// Google Analytics 4 helper.
// gtag.js is loaded in index.html; this only sends SPA virtual page views.
// Safely no-ops when gtag is unavailable (blocked, or measurement ID not yet set).

const PAGE_TITLES = {
  vote: '투표',
  result: '결과',
  map: '지역별 색상',
  stats: '색상 통계',
  about: '소개',
  privacy: '개인정보처리방침',
  contact: '문의',
};

export function trackPageView(page) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_title: PAGE_TITLES[page] || page,
    page_path: `/${page}`,
    page_location: `${window.location.origin}/${page}`,
  });
}
