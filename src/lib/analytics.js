// Google Analytics 4 helper.
// Dynamically loads gtag.js when VITE_GA_TRACKING_ID environment variable is provided.
// Safely no-ops when tracking ID is not configured.

const GA_ID = import.meta.env.VITE_GA_TRACKING_ID;
let isInitialized = false;

function initGA() {
  if (!GA_ID || isInitialized || typeof window === 'undefined') return;

  try {
    // 1. Inject the script tag for gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // 2. Define window.gtag function and dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    // Disable default page_view since we track virtual SPA page views manually
    window.gtag('config', GA_ID, { send_page_view: false });
    
    isInitialized = true;
    console.log(`[Google Analytics 4] Successfully initialized with ID: ${GA_ID}`);
  } catch (err) {
    console.error('[Google Analytics 4] Init failed:', err);
  }
}

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
  if (typeof window === 'undefined') return;

  // Lazily initialize on first pageview hit if environmental ID is ready
  if (!isInitialized && GA_ID) {
    initGA();
  }

  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: PAGE_TITLES[page] || page,
    page_path: `/${page}`,
    page_location: `${window.location.origin}${import.meta.env.BASE_URL}${page}`,
  });
}

