// ColorVote — Data Layer

export const CV_COLORS = [
  { id:1,  name:"딥 네이비",     hex:"#1B2A4A", personality:"냉정형",  trait:"분석적이고 신중한",        votes:2840 },
  { id:2,  name:"로열 블루",     hex:"#1464C0", personality:"리더형",  trait:"자신감 넘치는",             votes:1920 },
  { id:3,  name:"스카이 블루",   hex:"#5BA4CF", personality:"자유형",  trait:"개방적이고 활달한",         votes:1560 },
  { id:4,  name:"틸",            hex:"#008B8B", personality:"균형형",  trait:"이성과 감성의 균형",        votes:1380 },
  { id:5,  name:"에메랄드",      hex:"#00A878", personality:"성장형",  trait:"끊임없이 발전하는",         votes:1240 },
  { id:6,  name:"포레스트",      hex:"#2D6A4F", personality:"안정형",  trait:"믿음직하고 차분한",         votes:980  },
  { id:7,  name:"올리브",        hex:"#6B7C31", personality:"현실형",  trait:"실용적이고 현명한",         votes:760  },
  { id:8,  name:"민트",          hex:"#5ECFB0", personality:"청량형",  trait:"시원하고 생기 있는",        votes:1840 },
  { id:9,  name:"세이지",        hex:"#87A96B", personality:"치유형",  trait:"편안함을 주는",             votes:880  },
  { id:10, name:"골든",          hex:"#FFD166", personality:"낙관형",  trait:"밝고 긍정적인",             votes:2120 },
  { id:11, name:"앰버",          hex:"#F4A261", personality:"열정형",  trait:"따뜻하고 에너지 넘치는",    votes:1680 },
  { id:12, name:"코랄",          hex:"#E76F51", personality:"감성형",  trait:"풍부한 감수성",             votes:1540 },
  { id:13, name:"테라코타",      hex:"#B5500C", personality:"지속형",  trait:"끈기 있고 묵직한",          votes:720  },
  { id:14, name:"크림슨",        hex:"#C1121F", personality:"도전형",  trait:"두려움 없이 나아가는",      votes:1120 },
  { id:15, name:"로즈",          hex:"#E63946", personality:"강렬형",  trait:"강렬하고 직접적인",         votes:1460 },
  { id:16, name:"핫 핑크",       hex:"#FF6B9D", personality:"창의형",  trait:"독창적이고 개성 강한",      votes:2080 },
  { id:17, name:"마젠타",        hex:"#D62598", personality:"개성형",  trait:"자유롭고 창의적인",         votes:940  },
  { id:18, name:"라벤더",        hex:"#9B5DE5", personality:"몽상형",  trait:"상상력이 풍부한",           votes:2200 },
  { id:19, name:"딥 퍼플",       hex:"#5A189A", personality:"신비형",  trait:"깊이 있고 카리스마 있는",   votes:1620 },
  { id:20, name:"인디고",        hex:"#3A0CA3", personality:"직관형",  trait:"날카로운 통찰력",           votes:1340 },
  { id:21, name:"페리윙클",      hex:"#8192E6", personality:"공감형",  trait:"섬세하고 배려 깊은",        votes:1780 },
  { id:22, name:"버건디",        hex:"#800020", personality:"품격형",  trait:"우아하고 고집스러운",       votes:960  },
  { id:23, name:"실버",          hex:"#ADB5BD", personality:"중립형",  trait:"유연하고 적응력 강한",      votes:1040 },
  { id:24, name:"슬레이트",      hex:"#64748B", personality:"사고형",  trait:"객관적이고 냉철한",         votes:820  },
  { id:25, name:"샌드",          hex:"#D4A574", personality:"자연형",  trait:"소박하고 여유로운",         votes:1180 },
  { id:26, name:"카키",          hex:"#7D6C46", personality:"성실형",  trait:"꾸준하고 신뢰할 수 있는",   votes:640  },
  { id:27, name:"미드나잇",      hex:"#0D1B2A", personality:"내성형",  trait:"깊은 사색과 직관",          votes:1880 },
  { id:28, name:"블러시",        hex:"#FFB5C8", personality:"낭만형",  trait:"따뜻하고 감미로운",         votes:1420 },
];

export const CV_REGIONS = [
  { id:"seoul",     name:"서울특별시",     short:"서울",  topColorId:1,  votes:18420 },
  { id:"incheon",   name:"인천광역시",     short:"인천",  topColorId:18, votes:9840  },
  { id:"gyeonggi",  name:"경기도",         short:"경기",  topColorId:1,  votes:32180 },
  { id:"gangwon",   name:"강원도",         short:"강원",  topColorId:6,  votes:7620  },
  { id:"chungbuk",  name:"충청북도",       short:"충북",  topColorId:10, votes:6840  },
  { id:"chungnam",  name:"충청남도",       short:"충남",  topColorId:11, votes:8960  },
  { id:"sejong",    name:"세종특별자치시", short:"세종",  topColorId:4,  votes:2340  },
  { id:"daejeon",   name:"대전광역시",     short:"대전",  topColorId:8,  votes:7180  },
  { id:"jeonbuk",   name:"전라북도",       short:"전북",  topColorId:12, votes:7540  },
  { id:"jeonnam",   name:"전라남도",       short:"전남",  topColorId:5,  votes:6920  },
  { id:"gwangju",   name:"광주광역시",     short:"광주",  topColorId:16, votes:8240  },
  { id:"gyeongbuk", name:"경상북도",       short:"경북",  topColorId:2,  votes:9120  },
  { id:"daegu",     name:"대구광역시",     short:"대구",  topColorId:14, votes:10540 },
  { id:"gyeongnam", name:"경상남도",       short:"경남",  topColorId:3,  votes:10240 },
  { id:"pohang",    name:"포항시",         short:"포항",  topColorId:15, votes:5820  },
  { id:"busan",     name:"부산광역시",     short:"부산",  topColorId:21, votes:15640 },
  { id:"jeju",      name:"제주특별자치도", short:"제주",  topColorId:8,  votes:4380  },
];

export const CV_REGION_DETAIL = {
  seoul:     { topColors:[{id:1,pct:34},{id:18,pct:22},{id:10,pct:15}], byAge:{"10대":18,"20대":34,"30대":28,"40대":14,"50대+":6},  total:18420 },
  incheon:   { topColors:[{id:18,pct:31},{id:21,pct:19},{id:8,pct:14}], byAge:{"10대":22,"20대":29,"30대":26,"40대":16,"50대+":7},  total:9840  },
  gyeonggi:  { topColors:[{id:1,pct:28},{id:10,pct:21},{id:16,pct:17}], byAge:{"10대":20,"20대":32,"30대":30,"40대":13,"50대+":5},  total:32180 },
  gangwon:   { topColors:[{id:6,pct:35},{id:9,pct:22},{id:4,pct:13}],  byAge:{"10대":12,"20대":28,"30대":32,"40대":20,"50대+":8},  total:7620  },
  chungbuk:  { topColors:[{id:10,pct:29},{id:11,pct:18},{id:5,pct:16}], byAge:{"10대":14,"20대":26,"30대":33,"40대":19,"50대+":8},  total:6840  },
  chungnam:  { topColors:[{id:11,pct:26},{id:10,pct:20},{id:8,pct:15}], byAge:{"10대":15,"20대":28,"30대":31,"40대":18,"50대+":8},  total:8960  },
  sejong:    { topColors:[{id:4,pct:32},{id:8,pct:24},{id:18,pct:14}], byAge:{"10대":16,"20대":35,"30대":32,"40대":12,"50대+":5},  total:2340  },
  daejeon:   { topColors:[{id:8,pct:38},{id:18,pct:21},{id:4,pct:12}], byAge:{"10대":19,"20대":33,"30대":28,"40대":14,"50대+":6},  total:7180  },
  jeonbuk:   { topColors:[{id:12,pct:30},{id:11,pct:19},{id:15,pct:14}],byAge:{"10대":13,"20대":25,"30대":34,"40대":20,"50대+":8},  total:7540  },
  jeonnam:   { topColors:[{id:5,pct:33},{id:6,pct:21},{id:9,pct:15}],  byAge:{"10대":11,"20대":24,"30대":33,"40대":23,"50대+":9},  total:6920  },
  gwangju:   { topColors:[{id:16,pct:36},{id:12,pct:22},{id:17,pct:16}],byAge:{"10대":24,"20대":36,"30대":26,"40대":11,"50대+":3},  total:8240  },
  gyeongbuk: { topColors:[{id:2,pct:27},{id:14,pct:18},{id:22,pct:14}], byAge:{"10대":10,"20대":22,"30대":34,"40대":24,"50대+":10}, total:9120  },
  daegu:     { topColors:[{id:14,pct:29},{id:2,pct:20},{id:22,pct:13}], byAge:{"10대":14,"20대":28,"30대":32,"40대":18,"50대+":8},  total:10540 },
  gyeongnam: { topColors:[{id:3,pct:31},{id:21,pct:19},{id:4,pct:14}],  byAge:{"10대":16,"20대":30,"30대":30,"40대":17,"50대+":7},  total:10240 },
  pohang:    { topColors:[{id:15,pct:28},{id:2,pct:22},{id:3,pct:18}],  byAge:{"10대":11,"20대":26,"30대":36,"40대":20,"50대+":7},  total:5820  },
  busan:     { topColors:[{id:21,pct:33},{id:3,pct:21},{id:16,pct:16}], byAge:{"10대":18,"20대":32,"30대":28,"40대":16,"50대+":6},  total:15640 },
  jeju:      { topColors:[{id:8,pct:40},{id:5,pct:22},{id:9,pct:14}],  byAge:{"10대":20,"20대":35,"30대":25,"40대":14,"50대+":6},  total:4380  },
};

export const CV_HEATMAP = {
  seoul:     {"10대":16,"20대":1, "30대":18,"40대":1, "50대+":6  },
  incheon:   {"10대":16,"20대":18,"30대":4, "40대":11,"50대+":6  },
  gyeonggi:  {"10대":16,"20대":1, "30대":10,"40대":1, "50대+":23 },
  gangwon:   {"10대":8, "20대":18,"30대":6, "40대":6, "50대+":7  },
  chungbuk:  {"10대":10,"20대":10,"30대":10,"40대":11,"50대+":6  },
  chungnam:  {"10대":10,"20대":11,"30대":11,"40대":11,"50대+":25 },
  sejong:    {"10대":8, "20대":4, "30대":4, "40대":18,"50대+":4  },
  daejeon:   {"10대":8, "20대":8, "30대":4, "40대":11,"50대+":23 },
  jeonbuk:   {"10대":12,"20대":15,"30대":12,"40대":11,"50대+":7  },
  jeonnam:   {"10대":5, "20대":5, "30대":5, "40대":6, "50대+":7  },
  gwangju:   {"10대":16,"20대":16,"30대":12,"40대":12,"50대+":11 },
  gyeongbuk: {"10대":2, "20대":2, "30대":2, "40대":22,"50대+":22 },
  daegu:     {"10대":14,"20대":14,"30대":2, "40대":22,"50대+":22 },
  gyeongnam: {"10대":3, "20대":3, "30대":3, "40대":4, "50대+":6  },
  pohang:    {"10대":15,"20대":3, "30대":15,"40대":2, "50대+":24 },
  busan:     {"10대":21,"20대":21,"30대":21,"40대":3, "50대+":24 },
  jeju:      {"10대":8, "20대":8, "30대":5, "40대":9, "50대+":6  },
};

export const CV_TRENDING = [
  { colorId:16, gainPct:42, hourVotes:284 },
  { colorId:8,  gainPct:38, hourVotes:256 },
  { colorId:18, gainPct:31, hourVotes:218 },
  { colorId:1,  gainPct:28, hourVotes:196 },
  { colorId:21, gainPct:22, hourVotes:154 },
];

export const CV_TICKER_MSGS = [
  "서울 20대의 딥 네이비 선택률은 34%입니다",
  "부산 30대의 페리윙클 선택률은 33%입니다",
  "광주 10대의 핫 핑크 선택률은 41%입니다",
  "경기 20대의 라벤더 선택률은 28%입니다",
  "대구 30대의 크림슨 선택률은 29%입니다",
  "인천 20대의 라벤더 선택률은 31%입니다",
  "제주 20대의 민트 선택률은 37%입니다",
  "강원 50대+의 포레스트 선택률은 35%입니다",
  "충북 30대의 골든 선택률은 26%입니다",
  "전남 20대의 에메랄드 선택률은 33%입니다",
  "포항 30대의 로즈 선택률은 28%입니다",
  "대전 20대의 민트 선택률은 38%입니다",
];

export const CV_AGE_GROUPS = ["10대","20대","30대","40대","50대+"];
export const CV_getColor  = (id) => CV_COLORS.find(c => c.id === id);
export const CV_getRegion = (id) => CV_REGIONS.find(r => r.id === id);
