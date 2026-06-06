// ColorVote — Data Layer

export const CV_COLORS = [
  { id:1,  name:"빨강",     hex:"#E63946", personality:"열정형",  trait:"용기 있고 열정적인",        votes:2450 },
  { id:2,  name:"주황",     hex:"#F4A261", personality:"사교형",  trait:"밝고 쾌활한",             votes:1980 },
  { id:3,  name:"노랑",     hex:"#FFD166", personality:"낙관형",  trait:"긍정적이고 창의적인",         votes:2120 },
  { id:4,  name:"초록",     hex:"#2D6A4F", personality:"안정형",  trait:"차분하고 조화로운",        votes:1840 },
  { id:5,  name:"파랑",     hex:"#1464C0", personality:"신뢰형",  trait:"신중하고 이성적인",         votes:2840 },
  { id:6,  name:"남색",     hex:"#1B2A4A", personality:"분석형",  trait:"집중력 있고 지적인",         votes:1560  },
  { id:7,  name:"보라",     hex:"#9B5DE5", personality:"개성형",  trait:"독창적이고 감수성이 풍부한",     votes:1680  },
];

export const CV_REGIONS = [
  { id:"seoul",     name:"서울특별시",     short:"서울",  topColorId:5,  votes:18420 },
  { id:"incheon",   name:"인천광역시",     short:"인천",  topColorId:7,  votes:9840  },
  { id:"gyeonggi",  name:"경기도",         short:"경기",  topColorId:1,  votes:32180 },
  { id:"gangwon",   name:"강원도",         short:"강원",  topColorId:6,  votes:7620  },
  { id:"chungbuk",  name:"충청북도",       short:"충북",  topColorId:3,  votes:6840  },
  { id:"chungnam",  name:"충청남도",       short:"충남",  topColorId:2,  votes:8960  },
  { id:"sejong",    name:"세종특별자치시", short:"세종",  topColorId:4,  votes:2340  },
  { id:"daejeon",   name:"대전광역시",     short:"대전",  topColorId:5,  votes:7180  },
  { id:"jeonbuk",   name:"전라북도",       short:"전북",  topColorId:2,  votes:7540  },
  { id:"jeonnam",   name:"전라남도",       short:"전남",  topColorId:5,  votes:6920  },
  { id:"gwangju",   name:"광주광역시",     short:"광주",  topColorId:7,  votes:8240  },
  { id:"gyeongbuk", name:"경상북도",       short:"경북",  topColorId:2,  votes:9120  },
  { id:"daegu",     name:"대구광역시",     short:"대구",  topColorId:1,  votes:10540 },
  { id:"gyeongnam", name:"경상남도",       short:"경남",  topColorId:3,  votes:10240 },
  { id:"pohang",    name:"포항시",         short:"포항",  topColorId:1,  votes:5820  },
  { id:"busan",     name:"부산광역시",     short:"부산",  topColorId:5,  votes:15640 },
  { id:"jeju",      name:"제주특별자치도", short:"제주",  topColorId:4,  votes:4380  },
];

export const CV_REGION_DETAIL = {
  seoul:     { topColors:[{id:5,pct:34},{id:7,pct:22},{id:3,pct:15}], byAge:{"10대":18,"20대":34,"30대":28,"40대":14,"50대+":6},  total:18420 },
  incheon:   { topColors:[{id:7,pct:31},{id:5,pct:19},{id:4,pct:14}], byAge:{"10대":22,"20대":29,"30대":26,"40대":16,"50대+":7},  total:9840  },
  gyeonggi:  { topColors:[{id:6,pct:28},{id:3,pct:21},{id:1,pct:17}], byAge:{"10대":20,"20대":32,"30대":30,"40대":13,"50대+":5},  total:32180 },
  gangwon:   { topColors:[{id:4,pct:35},{id:4,pct:22},{id:6,pct:13}],  byAge:{"10대":12,"20대":28,"30대":32,"40대":20,"50대+":8},  total:7620  },
  chungbuk:  { topColors:[{id:3,pct:29},{id:2,pct:18},{id:4,pct:16}], byAge:{"10대":14,"20대":26,"30대":33,"40대":19,"50대+":8},  total:6840  },
  chungnam:  { topColors:[{id:2,pct:26},{id:3,pct:20},{id:4,pct:15}], byAge:{"10대":15,"20대":28,"30대":31,"40대":18,"50대+":8},  total:8960  },
  sejong:    { topColors:[{id:4,pct:32},{id:5,pct:24},{id:7,pct:14}], byAge:{"10대":16,"20대":35,"30대":32,"40대":12,"50대+":5},  total:2340  },
  daejeon:   { topColors:[{id:5,pct:38},{id:7,pct:21},{id:4,pct:12}], byAge:{"10대":19,"20대":33,"30대":28,"40대":14,"50대+":6},  total:7180  },
  jeonbuk:   { topColors:[{id:2,pct:30},{id:2,pct:19},{id:1,pct:14}], byAge:{"10대":13,"20대":25,"30대":34,"40대":20,"50대+":8},  total:7540  },
  jeonnam:   { topColors:[{id:5,pct:33},{id:4,pct:21},{id:4,pct:15}],  byAge:{"10대":11,"20대":24,"30대":33,"40대":23,"50대+":9},  total:6920  },
  gwangju:   { topColors:[{id:7,pct:36},{id:2,pct:22},{id:7,pct:16}],  byAge:{"10대":24,"20대":36,"30대":26,"40대":11,"50대+":3},  total:8240  },
  gyeongbuk: { topColors:[{id:2,pct:27},{id:1,pct:18},{id:7,pct:14}], byAge:{"10대":10,"20대":22,"30대":34,"40대":24,"50대+":10}, total:9120  },
  daegu:     { topColors:[{id:1,pct:29},{id:5,pct:20},{id:7,pct:13}], byAge:{"10대":14,"20대":28,"30대":32,"40대":18,"50대+":8},  total:10540 },
  gyeongnam: { topColors:[{id:3,pct:31},{id:7,pct:19},{id:4,pct:14}],  byAge:{"10대":16,"20대":30,"30대":30,"40대":17,"50대+":7},  total:10240 },
  pohang:    { topColors:[{id:1,pct:28},{id:5,pct:22},{id:3,pct:18}],  byAge:{"10대":11,"20대":26,"30대":36,"40대":20,"50대+":7},  total:5820  },
  busan:     { topColors:[{id:5,pct:33},{id:3,pct:21},{id:7,pct:16}], byAge:{"10대":18,"20대":32,"30대":28,"40대":16,"50대+":6},  total:15640 },
  jeju:      { topColors:[{id:4,pct:40},{id:5,pct:22},{id:4,pct:14}],  byAge:{"10대":20,"20대":35,"30대":25,"40대":14,"50대+":6},  total:4380  },
};

export const CV_HEATMAP = {
  seoul:     {"10대":7, "20대":1, "30대":7, "40대":1, "50대+":6  },
  incheon:   {"10대":7, "20대":7, "30대":4, "40대":2, "50대+":6  },
  gyeonggi:  {"10대":7, "20대":1, "30대":3, "40대":1, "50대+":5  },
  gangwon:   {"10대":4, "20대":7, "30대":6, "40대":6, "50대+":7  },
  chungbuk:  {"10대":3, "20대":3, "30대":3, "40대":2, "50대+":6  },
  chungnam:  {"10대":3, "20대":2, "30대":2, "40대":2, "50대+":2  },
  sejong:    {"10대":4, "20대":4, "30대":4, "40대":7, "50대+":4  },
  daejeon:   {"10대":4, "20대":4, "30대":4, "40대":2, "50대+":5  },
  jeonbuk:   {"10대":2, "20대":2, "30대":2, "40대":2, "50대+":7  },
  jeonnam:   {"10대":5, "20대":5, "30대":5, "40대":6, "50대+":7  },
  gwangju:   {"10대":7, "20대":7, "30대":2, "40대":2, "50대+":2  },
  gyeongbuk: {"10대":2, "20대":2, "30대":2, "40대":7, "50대+":7  },
  daegu:     {"10대":1, "20대":1, "30대":2, "40대":7, "50대+":7  },
  gyeongnam: {"10대":3, "20대":3, "30대":3, "40대":4, "50대+":6  },
  pohang:    {"10대":1, "20대":3, "30대":1, "40대":2, "50대+":4  },
  busan:     {"10대":5, "20대":5, "30대":5, "40대":3, "50대+":4  },
  jeju:      {"10대":4, "20대":4, "30대":5, "40대":4, "50대+":6  },
};

export const CV_TRENDING = [
  { colorId:7, gainPct:42, hourVotes:284 },
  { colorId:4,  gainPct:38, hourVotes:256 },
  { colorId:1, gainPct:31, hourVotes:218 },
  { colorId:3,  gainPct:28, hourVotes:196 },
  { colorId:5, gainPct:22, hourVotes:154 },
];

export const CV_TICKER_MSGS = [
  "서울 20대의 빨강 선택률은 34%입니다",
  "부산 30대의 파랑 선택률은 33%입니다",
  "광주 10대의 보라 선택률은 41%입니다",
  "경기 20대의 보라 선택률은 28%입니다",
  "대구 30대의 빨강 선택률은 29%입니다",
  "인천 20대의 보라 선택률은 31%입니다",
  "제주 20대의 초록 선택률은 37%입니다",
  "강원 50대+의 남색 선택률은 35%입니다",
  "충북 30대의 노랑 선택률은 26%입니다",
  "전남 20대의 파랑 선택률은 33%입니다",
  "포항 30대의 빨강 선택률은 28%입니다",
  "대전 20대의 파랑 선택률은 38%입니다",
];

export const CV_AGE_GROUPS = ["10대","20대","30대","40대","50대+"];
export const CV_getColor  = (id) => CV_COLORS.find(c => c.id === id);
export const CV_getRegion = (id) => CV_REGIONS.find(r => r.id === id);
