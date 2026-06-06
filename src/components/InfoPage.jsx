import { useEffect, useState } from 'react';

// 문의/개인정보처리방침에 노출되는 운영자 연락처. 필요 시 한 곳만 수정하면 됩니다.
const CONTACT_EMAIL = 'vmfhrmfoald36@gmail.com';
const EFFECTIVE_DATE = '2026년 6월 6일';

// ── 소형 빌딩 블록 (기존 typo 유틸 + 다크 토큰 사용) ──
function H2({ children }) {
  return (
    <h2 className="typo-tagline" style={{
      color: 'var(--ink)',
      fontWeight: 600,
      marginTop: '40px',
      marginBottom: '14px',
    }}>
      {children}
    </h2>
  );
}

function P({ children }) {
  return (
    <p className="typo-body" style={{
      color: 'var(--ink-muted-80)',
      marginBottom: '14px',
      lineHeight: 1.7,
    }}>
      {children}
    </p>
  );
}

function Li({ children }) {
  return (
    <li className="typo-body" style={{
      color: 'var(--ink-muted-80)',
      marginBottom: '8px',
      lineHeight: 1.7,
    }}>
      {children}
    </li>
  );
}

function Ul({ children }) {
  return <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>{children}</ul>;
}

// ── 페이지별 본문 ──
function AboutBody() {
  return (
    <>
      <P>
        ColorVote는 대한민국 사람들이 가장 좋아하는 색을 선택으로 모아,
        지역과 연령대에 따라 색 선호가 어떻게 달라지는지를 실시간으로 보여주는
        데이터 시각화 프로젝트입니다. 누구나 한 번의 선택으로 참여할 수 있고,
        모인 결과는 지도와 통계로 공개됩니다.
      </P>

      <H2>어떻게 참여하나요</H2>
      <Ul>
        <Li>좋아하는 색 하나를 선택합니다.</Li>
        <Li>거주 지역과 연령대를 함께 선택합니다.</Li>
        <Li>제출하면 전국·지역·연령대별 결과를 바로 확인할 수 있습니다.</Li>
      </Ul>
      <P>
        공정한 집계를 위해 선택은 하루 1회로 제한되며, 중복 선택을 막기 위한
        최소한의 기술적 식별만 사용합니다.
      </P>

      <H2>결과는 어떻게 읽나요</H2>
      <Ul>
        <Li><strong style={{ color: 'var(--ink)' }}>통계</strong> — 전국 색상 선택률과 연령대별 1위, 지금 뜨는 색을 보여줍니다.</Li>
        <Li><strong style={{ color: 'var(--ink)' }}>지도</strong> — 지역마다 가장 인기 있는 색을 한눈에 비교할 수 있습니다.</Li>
      </Ul>
      <P>
        모든 수치는 실제 선택을 실시간으로 집계한 값이며, 특정 색이나 지역을
        대표하거나 평가하기 위한 것이 아닙니다. 가볍게 색의 취향을 나누고
        살펴보는 즐거운 데이터 놀이로 만들어졌습니다.
      </P>

      <H2>운영</H2>
      <P>
        ColorVote는 개인이 운영하는 비상업적 프로젝트입니다. 문의는&nbsp;
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-link" style={{ fontSize: '17px' }}>
          {CONTACT_EMAIL}
        </a>
        &nbsp;로 보내주세요.
      </P>
    </>
  );
}

function PrivacyBody() {
  return (
    <>
      <P>
        ColorVote(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며, 아래와 같이
        개인정보를 처리합니다. 본 방침은 {EFFECTIVE_DATE}부터 적용됩니다.
      </P>

      <H2>1. 수집하는 정보</H2>
      <P>서비스는 회원가입 없이 이용할 수 있으며, 이름·전화번호 등 직접적인 신원 정보는 수집하지 않습니다. 다음 정보만 처리됩니다.</P>
      <Ul>
        <Li>선택 데이터: 선택한 색상, 지역, 연령대</Li>
        <Li>중복 선택 방지를 위한 최소한의 기술적 식별 정보</Li>
        <Li>브라우저 로컬 저장소(localStorage)에 저장되는 내 선택 기록</Li>
      </Ul>

      <H2>2. 쿠키 및 Google 광고</H2>
      <P>
        서비스는 운영 유지를 위해 Google AdSense 광고를 게재할 수 있습니다.
        Google을 포함한 제3자 광고 공급업체는 쿠키를 사용하여 이용자의 이전 방문
        기록을 바탕으로 광고를 게재합니다.
      </P>
      <Ul>
        <Li>
          Google은 광고 쿠키를 사용하여 이용자가 본 서비스 및 다른 사이트를 방문한
          기록을 기반으로 맞춤형 광고를 제공할 수 있습니다.
        </Li>
        <Li>
          이용자는&nbsp;
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-link" style={{ fontSize: '17px' }}>
            Google 광고 설정
          </a>
          &nbsp;에서 맞춤 광고를 비활성화할 수 있습니다.
        </Li>
        <Li>
          제3자 공급업체의 쿠키 사용은&nbsp;
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-link" style={{ fontSize: '17px' }}>
            www.aboutads.info
          </a>
          &nbsp;에서 거부할 수 있습니다.
        </Li>
      </Ul>

      <H2>3. 정보의 보관 및 처리 위탁</H2>
      <P>
        선택 데이터는 통계 집계 목적으로 데이터베이스 호스팅 서비스(Supabase)에
        저장됩니다. 수집된 데이터는 통계 산출 목적 외에 사용되지 않으며, 제3자에게
        판매하거나 별도로 제공하지 않습니다.
      </P>

      <H2>4. 이용자의 권리</H2>
      <P>
        이용자는 브라우저의 쿠키 및 사이트 데이터 삭제 기능을 통해 로컬에 저장된
        선택 기록을 직접 삭제할 수 있습니다. 기타 문의 사항은 아래 연락처로 요청해
        주시기 바랍니다.
      </P>

      <H2>5. 방침의 변경</H2>
      <P>
        본 개인정보처리방침은 법령이나 서비스 정책의 변경에 따라 수정될 수 있으며,
        변경 시 본 페이지를 통해 공지합니다.
      </P>

      <H2>6. 문의처</H2>
      <P>
        개인정보 관련 문의:&nbsp;
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-link" style={{ fontSize: '17px' }}>
          {CONTACT_EMAIL}
        </a>
      </P>
    </>
  );
}

function ContactBody() {
  return (
    <>
      <P>
        ColorVote 이용 중 궁금한 점, 오류 제보, 제휴 및 광고 문의는 아래 이메일로
        연락해 주세요. 확인하는 대로 답변드리겠습니다.
      </P>

      <H2>이메일</H2>
      <P>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-link" style={{ fontSize: '17px' }}>
          {CONTACT_EMAIL}
        </a>
      </P>

      <H2>운영</H2>
      <P>
        ColorVote는 개인이 운영하는 비상업적 데이터 프로젝트입니다. 서비스에 관한
        모든 의견을 환영합니다.
      </P>
    </>
  );
}

const PAGES = {
  about:   { eyebrow: 'About',   title: '소개',           Body: AboutBody },
  privacy: { eyebrow: 'Privacy', title: '개인정보처리방침', Body: PrivacyBody },
  contact: { eyebrow: 'Contact', title: '문의',           Body: ContactBody },
};

function InfoPage({ page, onNavigate }) {
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  const [clickCount, setClickCount] = useState(0);

  const meta = PAGES[page];
  if (!meta) return null;
  const { eyebrow, title, Body } = meta;

  const handleTitleClick = () => {
    if (page === 'about') {
      const next = clickCount + 1;
      setClickCount(next);
      if (next >= 10) {
        setClickCount(0);
        if (typeof onNavigate === 'function') {
          onNavigate('admin');
        }
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      {/* Header */}
      <div className="tile tile-white" style={{ paddingTop: '100px', paddingBottom: '40px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="tile-content" style={{ textAlign: 'center' }}>
          <div className="typo-caption-strong" style={{
            color: 'var(--primary)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {eyebrow}
          </div>
          <div 
            className="typo-hero" 
            onClick={handleTitleClick}
            style={{ 
              fontWeight: 700, 
              cursor: page === 'about' ? 'pointer' : 'default',
              userSelect: 'none' 
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="tile tile-white" style={{ paddingTop: '48px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Body />
        </div>
      </div>
    </div>
  );
}

export default InfoPage;
