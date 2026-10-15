export const company = {name:'유림엔지니어링(주)',en:'YURIM ENGINEERING',tel:'031-774-8358',fax:'031-774-8359',email:'yurimkorea@gmail.com',address:'경기도 양평군 양평읍 창대리 649-6 에이스빌딩 2층',roadAddress:'경기도 양평군 양평읍 남북로 62 에이스빌딩 2층'};
export const nav = [
 {label:'환경',en:'ENVIRONMENT',path:'/environment',items:[['개인하수처리시설 설계시공','/environment/water'],['개인하수처리시설 관리','/environment/management'],['IoT 스마트 관리','/environment/iot',1],['악취 저감사업','/environment/odor']]},
 {label:'건설',en:'CONSTRUCTION',path:'/construction',items:[['상하수도공사','/construction/pipeline'],['철근콘크리트공사','/construction/concrete'],['수평오거천공 압입공사','/construction/auger']]},
 {label:'시공실적',en:'PROJECTS',path:'/projects',items:[['전체','/projects'],['환경','/projects/environment'],['개인하수처리시설','/projects/water',1],['시설관리','/projects/management',1],['악취저감','/projects/odor',1],['건설','/projects/construction'],['상하수도','/projects/pipeline',1],['철근콘크리트','/projects/concrete',1],['수평오거천공','/projects/auger',1]]},
 {label:'기술·장비',en:'TECHNOLOGY',path:'/technology',items:[['하수처리 기술','/technology/water'],['IoT 기술','/technology/iot'],['악취저감 기술','/technology/odor'],['수평오거천공 기술','/technology/auger'],['보유장비','/technology/equipment']]},
 {label:'회사소개',en:'COMPANY',path:'/company',items:[['회사개요','/company'],['CEO 인사말','/company/ceo'],['연혁','/company/history'],['면허·인증','/company/certifications'],['오시는 길','/company/location']]},
 {label:'자료실',en:'RESOURCES',path:'/resources',items:[]},
 {label:'문의',en:'CONTACT',path:'/contact',items:[['공사문의','/contact/construction'],['시설관리 문의','/contact/management'],['IoT 서비스 문의','/contact/iot']]}
];
export const services = [
 {path:'/environment/water',category:'환경',title:'개인하수처리시설 설계시공',en:'WATER TREATMENT',headline:'맑은 물로 돌아가는 과정,\n현장에 맞게 설계합니다.',desc:'시설의 용도와 유입 특성을 살펴 처리공정과 시설 규모를 계획합니다. 설계부터 시공, 운영을 고려하는 하수처리 솔루션을 제안합니다.',graphic:'water',caption:'양평 개인하수처리시설',scope:['현장 여건과 유입수 특성 검토','처리공정·용량 및 배치 계획','시설·배관 설계와 시공 협의','시운전 및 운영관리 연계'],steps:['현장 조사','처리계획 수립','설계·시공','운영 연계'],point:'운영까지 생각한 설계',detail:'하수의 유입량, 부지 조건, 유지관리 동선을 함께 검토해 현장에 적합한 시설 구성을 협의합니다.',type:'construction'},
 {path:'/environment/management',category:'환경',title:'개인하수처리시설 관리',en:'FACILITY MANAGEMENT',headline:'설비의 오늘을 살피고,\n안정적인 내일을 준비합니다.',desc:'하수처리시설의 상태를 점검하고 운영 중 발생하는 문제를 함께 살핍니다. 정기 점검과 기록 관리를 바탕으로 관리 방향을 제안합니다.',graphic:'water',caption:'개인하수처리시설 운영관리',scope:['시설 상태 및 운영 이력 확인','설비·배관·처리공정 점검','수질과 악취 발생 요인 검토','개선사항 안내 및 관리 협의'],steps:['시설 확인','점검 계획','운영 점검','개선 협의'],point:'시설을 이해하는 관리',detail:'기계 설비만이 아니라 처리공정과 유입 조건을 함께 살펴, 시설별로 필요한 관리 항목을 협의합니다.',type:'management'},
 {path:'/environment/iot',category:'환경',title:'IoT 스마트 관리',en:'CONNECTED WATER',headline:'멀리 있는 시설도,\n가까이에서 살피듯.',desc:'센서와 통신을 활용해 시설의 상태를 확인하는 스마트 관리 구성을 제안합니다. 현장의 설치 조건과 필요한 측정 항목을 먼저 검토합니다.',graphic:'iot',scope:['측정 항목 및 센서 설치 여건 검토','현장 통신·전원 환경 확인','상태 확인 및 알림 구성 협의','점검 기록과 현장 대응 연계'],steps:['현장 진단','측정 항목 선정','연결 구성','관리 연계'],point:'현장과 데이터를 연결',detail:'수위·설비 운전 상태 등 필요한 항목을 정하고, 실제 설치 가능한 센서와 통신 방식에 맞춰 관리 구성을 협의합니다.',type:'iot'},
 {path:'/environment/odor',category:'환경',title:'악취 저감사업',en:'BIO ENVIRONMENT',headline:'현장의 공기를 바꾸는\n작은 생물의 큰 가능성.',desc:'Bio Gold-200을 활용한 악취 저감 방안을 현장 조건에 맞춰 검토합니다. 적용 전후의 변화를 측정하고 운영 환경을 함께 확인합니다.',graphic:'bio',caption:'Bio Gold-200 악취 저감',scope:['악취 발생원과 적용 범위 조사','Bio Gold-200 적용 방법 협의','현장 살포 및 운영 조건 검토','적용 전후 측정·결과 확인'],steps:['발생원 조사','적용 계획','현장 적용','변화 확인'],point:'측정으로 확인하는 접근',detail:'양평 양동면 양돈농가에서 2026년 4월 30일부터 5월 30일까지 적용 전후의 변화를 살폈습니다. 현장별 결과는 적용 조건에 따라 달라집니다.',type:'construction'},
 {path:'/construction/pipeline',category:'건설',title:'상하수도공사',en:'WATER INFRASTRUCTURE',headline:'일상을 지탱하는 물길,\n기본부터 단단하게.',desc:'상하수도 관로와 부대시설의 공사 범위를 협의합니다. 지형, 기존 매설물, 작업 공간을 살피고 현장 조건에 맞는 시공 계획을 검토합니다.',graphic:'pipeline',scope:['기존 관로와 매설물 확인','상수·하수 관로 시공 범위 협의','맨홀·부대 구조물 계획','연결 및 현장 복구 검토'],steps:['현장 확인','공법 검토','시공 협의','점검·복구'],point:'보이지 않는 곳의 완성도',detail:'관로의 연결과 유지관리 접근성을 함께 고려하고, 현장 조사 결과에 따라 공사 범위와 공법을 협의합니다.',type:'construction'},
 {path:'/construction/concrete',category:'건설',title:'철근콘크리트공사',en:'STRUCTURAL CONSTRUCTION',headline:'보이지 않는 기초에서\n신뢰는 시작됩니다.',desc:'구조물의 목적과 현장 여건에 맞춰 철근콘크리트 공사를 협의합니다. 기초와 구조, 공정 사이의 연결을 세심하게 살핍니다.',graphic:'concrete',scope:['구조물 및 기초 공사 범위 검토','철근·거푸집 공정 계획','콘크리트 타설 조건 협의','품질 확인과 후속 공정 연계'],steps:['도면 검토','공정 계획','시공 협의','품질 확인'],point:'현장 조건을 읽는 시공',detail:'설계도서와 현장 접근성, 작업 공간 등을 함께 확인해 실행 가능한 공정 계획을 검토합니다.',type:'construction'},
 {path:'/construction/auger',category:'건설',title:'수평오거천공 압입공사',en:'HORIZONTAL AUGER BORING',headline:'지상의 흐름을 지키며,\n지중의 길을 연결합니다.',desc:'수평오거 천공기계와 확장형 잭해머를 이용해 강관을 매설하는 공법입니다. 도로·철도·하천 횡단 구간에서 전력선 등의 지중화에 필요한 지중선로를 구축합니다.',body:['한국전력공사 배전터널공사 구간 중 도로·철도·하천 횡단 구간에 적용하는 강관 압입 공법으로, 수평오거 천공기계와 확장형 잭해머를 활용합니다.','토사부터 풍화암, 연암, 보통암 및 초경암에 이르기까지 다양한 지반 조건에 대응하며, 현장 여건에 따라 천공과 개착을 병행할 수 있습니다.','공사 여건에 맞는 시공 방식을 적용해 공사비 절감, 시공 안전성 향상과 공사 기간 단축을 도모합니다.'],graphic:'auger',scope:['다양한 지반 대응 — 토사 및 다양한 암반 지층에 적용','효율적인 시공 — 지반 조건에 따른 천공·개착 병행','경제성 향상 — 현장 여건에 적합한 시공 방식 검토','공기 단축 — 효율적인 공정 운영으로 공사 기간 단축 도모','지중선로 구축 — 도로·철도·하천 횡단 및 전력선 지중화'],steps:['지반·횡단 조건 조사','시공 방식·작업구 계획','천공·강관 압입','관로 연결·현장 확인'],point:'다양한 지반을 잇는 강관 압입',detail:'천공 구간의 지반과 매설물, 강관 규격, 추진·도달 기지의 작업 공간을 함께 확인해 현장에 맞는 공정과 적용 범위를 협의합니다.',type:'construction'}
];
export const projects = [
 {id:'yangpyeong-water',title:'양평 개인하수처리시설',kind:'water',category:'환경',location:'경기도 양평군',meta:'처리용량 20톤/일',graphic:'water',desc:'양평 지역의 20톤/일 규모 개인하수처리시설에 Bio Gold-200이 적용된 사례입니다. 하수처리시설 운영 환경에 맞춘 바이오 솔루션의 적용 분야를 소개합니다.',source:'Bio Gold-200 제품 소개서 · 적용 사례',status:'현장 적용'},
 {id:'yangdong-demonstration',title:'양평 양동면 양돈농가 실증',kind:'odor',category:'환경',location:'경기도 양평군 양동면',meta:'2026.04.30 — 05.30',image:'farm-field.jpg',desc:'2,600두 규모 양돈농가에서 1개월 동안 암모니아, 파리 개체수, 돼지 임상 징후, 분뇨 부숙 상태를 관찰했습니다. 4개 지점에서 총 5회 측정하며 적용 전후의 변화를 살폈습니다.',source:'슈퍼바이오골드-200 실증결과, 2026년 7월',status:'현장 실증'},
 {id:'eumseong-farm',title:'음성 양돈농가 적용 사례',kind:'odor',category:'환경',location:'충청북도 음성군',meta:'약 2,500두 규모',graphic:'bio',desc:'음성 지역의 약 2,500두 규모 양돈농가에 Bio Gold-200이 적용된 사례입니다. 농가의 운영 환경과 악취 발생 조건을 고려하는 바이오 솔루션을 소개합니다.',source:'Bio Gold-200 제품 소개서 · 적용 사례',status:'현장 적용'},
 {id:'yangju-farm',title:'양주 젖소농장 적용 사례',kind:'odor',category:'환경',location:'경기도 양주시',meta:'축산 환경 적용',graphic:'bio',desc:'양주 지역의 젖소농장에 Bio Gold-200이 적용된 사례입니다. 축산 환경에서 활용하는 바이오 솔루션의 적용 분야를 소개합니다.',source:'Bio Gold-200 제품 소개서 · 적용 사례',status:'현장 적용'},
 {
  id:'bongsang-drainage-2023',title:'양평군 단원면 봉상1리 배수관(개거) 설치공사',
  kind:'pipeline',category:'건설',location:'경기도 양평군',year:2023,
  meta:'2023년 · 배수관(개거) 설치',desc:'봉상1리 배수관(개거) 설치공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'mangmi-waterway-2023',title:'양평군 지평면 망미1리 용수로 재해복구공사',
  kind:'pipeline',category:'건설',location:'경기도 양평군 지평면',year:2023,
  meta:'2023년 · 용수로 재해복구',desc:'지평면 망미1리 용수로 재해복구공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'seokgok-drainage-2023',title:'양평군 양동면 지역현안사업 석곡1리 배수로 설치공사',
  kind:'pipeline',category:'건설',location:'경기도 양평군 양동면',year:2023,
  meta:'2023년 · 배수로 설치',desc:'양동면 지역현안사업으로 진행한 석곡1리 배수로 설치공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'samsan-drainage-2023',title:'양평군 양동면 지역현안사업 삼산1리 배수로 설치공사',
  kind:'pipeline',category:'건설',location:'경기도 양평군 양동면',year:2023,
  meta:'2023년 · 배수로 설치',desc:'양동면 지역현안사업으로 진행한 삼산1리 배수로 설치공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'ilsin-drainage-2023',title:'양평군 지평면 일신4리 배수설비 정비 공사',
  kind:'pipeline',category:'건설',location:'경기도 양평군 지평면',year:2023,
  meta:'2023년 · 배수설비 정비',desc:'지평면 일신4리 배수설비 정비 공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'daepyeong-reservoir-2023',title:'2023년 가뭄대비용수개발사업 대평저수지 준설공사',
  kind:'pipeline',category:'건설',location:'대평저수지',year:2023,
  client:'한국농어촌공사 경기지역본부 양평.광주.서울지사',
  meta:'2023년 · 저수지 준설',desc:'가뭄대비용수개발사업 대평저수지 준설공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'damun-drainage-2024',title:'용문면 다문리 배수설비 및 흄관부설 공사',
  kind:'pipeline',category:'건설',location:'용문면 다문리',year:2024,client:'한성건영 주식회사',
  meta:'2024년 · 배수설비·흄관 부설',desc:'용문면 다문리 배수설비 및 흄관부설 공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'yangpyeong-sewer-2024',title:'양평군 양평읍 상습침수지역 하수관로 정비공사 [재배정]',
  kind:'pipeline',category:'건설',location:'경기도 양평군 양평읍',year:2024,
  meta:'2024년 · 하수관로 정비',desc:'양평읍 상습침수지역 하수관로 정비공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'byeongsan-drainage-2024',title:'양평군 강상면 병산1리 배수로 정비 공사 [주민지원사업]',
  kind:'pipeline',category:'건설',location:'경기도 양평군 강상면',year:2024,
  meta:'2024년 · 배수로 정비',desc:'주민지원사업으로 진행한 강상면 병산1리 배수로 정비 공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'wondeok-irrigation-2025',title:'양평군 2025년 수리시설 정비사업 (원덕지구)',
  kind:'pipeline',category:'건설',location:'경기도 양평군 원덕지구',year:2025,
  meta:'2025년 · 수리시설 정비',desc:'원덕지구 수리시설 정비사업 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'bongseong-drainage-2026',title:'양평군 양평읍 (봉성2리) 배수로 정비 공사 [주민지원사업]',
  kind:'pipeline',category:'건설',location:'경기도 양평군 양평읍',year:2026,
  meta:'2026년 · 배수로 정비',desc:'주민지원사업의 양평읍 봉성2리 배수로 정비 공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'gyecheong-stream-2023',title:'양평군 양동면 재해복구사업(계청천 3공구)',
  kind:'concrete',category:'건설',location:'경기도 양평군 양동면',year:2023,
  meta:'2023년 · 재해복구',desc:'양동면 재해복구사업 계청천 3공구의 공사실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'byeongsan-road-2024',title:'양평군 강상면 병산4리 마을안길 도로 보수공사',
  kind:'concrete',category:'건설',location:'경기도 양평군 강상면',year:2024,
  meta:'2024년 · 마을안길 도로 보수',desc:'강상면 병산4리 마을안길 도로 보수공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'unsim-flood-recovery-2024',title:'양평군 양동면 운심리 275-2번지 일원 수해복구공사',
  kind:'concrete',category:'건설',location:'경기도 양평군',year:2024,
  meta:'2024년 · 수해복구',desc:'운심리 275-2번지 일원의 수해복구공사 실적입니다.',
  status:'공사실적',ongoing:false,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'ulsan-bancheon-auger-2016',title:'울산 반천일반산업단지 단지밖 수평오거천공 압입공사',
  kind:'auger',category:'건설',location:'울산 반천일반산업단지',year:2016,
  meta:'2016년 · 강관 1,000mm · 32m, 28m',desc:'울산 반천일반산업단지 단지밖 구간의 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','1,000mm · 32m, 28m'],['추진기지 가시설','8m × 4.5m × 6m · 2개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'cheongdo-iseo-auger-2016',title:'청도 S/S 이서D/L 과부하 해소 수평오거천공 강관압입공사',
  kind:'auger',category:'건설',location:'청도 S/S 이서D/L',year:2016,
  meta:'2016년 · 강관 800mm · 89m',desc:'청도 S/S 이서D/L 과부하 해소를 위한 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','800mm · 89m'],['추진기지 가시설','11m × 4.5m × 4.5m · 1개소'],['도달기지 가시설','6m × 4m × 4.5m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'yangsan-hoeya-auger-2018',title:'양산 서창산단 단지밖 회야천 횡단 소구경 배전터널 압입공사',
  kind:'auger',category:'건설',location:'양산 서창산단 · 회야천',year:2018,
  meta:'2018년 · 강관 800mm · 68m',desc:'양산 서창산단 단지밖 회야천 횡단 구간의 소구경 배전터널 압입공사 실적입니다.',
  specifications:[['강관 압입','800mm · 68m'],['추진기지 가시설','11m × 4.5m × 7.4m · 1개소'],['도달기지 가시설','6.5m × 4.5m × 7.4m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'gimhae-juchon-auger-2018',title:'김해 주촌선천지구 단지 밖 배전간선 수평오거천공 압입공사',
  kind:'auger',category:'건설',location:'김해 주촌선천지구',year:2018,
  meta:'2018년 · 강관 1,000mm · 48m',desc:'김해 주촌선천지구 단지 밖 배전간선의 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','1,000mm · 48m'],['추진기지 가시설','11m × 4.5m × 8m · 1개소'],['도달기지 가시설','6m × 4m × 8m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'daegu-industrial-auger-2019',title:'대구 국가산단 수평오거천공 강관압입공사',
  kind:'auger',category:'건설',location:'대구 국가산단',year:2019,
  meta:'2019년 · 강관 1,000mm · 42m',desc:'대구 국가산단의 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','1,000mm · 42m'],['추진기지 가시설','11m × 4.5m × 10.2m · 1개소'],['도달기지 가시설','6m × 4m × 10m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'unjeong-facilities-auger-2021',title:'운정지구 농업관련 대체시설 설치사업',
  kind:'auger',category:'건설',location:'운정지구',year:2021,
  meta:'2021년 · 강관 1,000mm · 68m',desc:'운정지구 농업관련 대체시설 설치사업의 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','1,000mm · 68m'],['추진기지 가시설','11m × 4.5m × 6m · 1개소'],['도달기지 가시설','6m × 4m × 6m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'sungin-jongno-auger-2023',title:'숭인동 종로구청 유수장애 이설 강관압입공사',
  kind:'auger',category:'건설',location:'숭인동 · 종로구',year:2023,
  meta:'2023년 · 강관 1,000mm · 25m',desc:'숭인동 종로구청 유수장애 이설을 위한 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','1,000mm · 25m']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'uiseong-dain-auger-2024',title:'의성군 다인면 소재지 지중화 수평오거천공 압입공사',
  sourceTitle:'의성군 다인면소새지 지중화 수평오거천공 압입공사',
  kind:'auger',category:'건설',location:'의성군 다인면',year:2024,
  meta:'2024년 · 강관 800mm · 32m, 24m',desc:'의성군 다인면 소재지 지중화를 위한 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','800mm · 32m / 800mm · 24m'],['추진기지 가시설','11.4m × 4.5m × 8m · 1개소'],['도달기지 가시설','4.5m × 6m × 8m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'yecheon-wolo-auger-2024',title:'예천 S/S 월오D/L 일반1회선 신설 철도횡단개소 수평오거천공 압입공사',
  kind:'auger',category:'건설',location:'예천 S/S 월오D/L',year:2024,
  meta:'2024년 · 강관 800mm · 24m',desc:'예천 S/S 월오D/L 일반1회선 신설 철도횡단 구간의 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','800mm · 24m'],['추진기지 가시설','11.4m × 4.5m × 7m · 1개소'],['도달기지 가시설','4.5m × 6m × 7.5m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'ulsan-branch-auger-2025',title:'울산지사 수평오거천공강관 압입공사',
  kind:'auger',category:'건설',location:'울산지사',year:2025,
  meta:'2025년 · 강관 800mm · 44m',desc:'울산지사 수평오거천공 강관 압입공사 실적입니다.',
  specifications:[['강관 압입','800mm · 44m'],['추진기지 가시설','11.4m × 4.5m × 7.5m · 1개소'],['도달기지 가시설','4.5m × 6m × 7.5m · 1개소']],
  status:'공사실적',ongoing:false,source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 },
 {
  id:'gyeongbuk-newtown-auger-2026',title:'경북도청 신도시(2단계) 간선설치 수평오거천공 압입공사',
  kind:'auger',category:'건설',location:'경북도청 신도시',year:2026,
  meta:'2026년 · 진행 중',desc:'경북도청 신도시 2단계 간선설치 구간의 수평오거천공 압입공사를 진행하고 있습니다.',
  status:'진행 중',ongoing:true,specifications:[],source:'유림엔지니어링 홈페이지 디자인 수정 요청서'
 }
];
export const tech = [
 {slug:'water',title:'하수처리 기술',en:'WATER PROCESS',lead:'유입에서 처리까지,\n흐름 전체를 살핍니다.',desc:'유입수와 시설 조건을 파악하고 처리공정의 연결을 검토합니다. 설계·시공·관리를 하나의 흐름으로 이해하는 것이 출발점입니다.',graphic:'water',points:[['유입 특성','시설 용도, 유입량과 부하 조건을 확인합니다.'],['공정 구성','전처리·생물학적 처리·침전 등 현장에 필요한 공정을 검토합니다.'],['운영 연계','점검 동선과 운전 조건을 함께 고려합니다.']]},
 {slug:'iot',title:'IoT 기술',en:'CONNECTED SYSTEM',lead:'시설의 상태를\n관리의 정보로.',desc:'센서에서 수집한 정보를 연결해 시설 상태를 확인하는 구성을 제안합니다. 측정 항목과 현장 통신 조건에 따라 적용 방식을 협의합니다.',graphic:'iot',points:[['센싱','수위와 설비 상태 등 현장별로 필요한 측정 항목을 선정합니다.'],['연결','전원·통신 여건을 확인하고 연결 방식을 검토합니다.'],['확인과 대응','상태 확인, 알림 및 현장 점검의 연계를 협의합니다.']]},
 {slug:'odor',title:'악취저감 기술',en:'BIO GOLD-200',lead:'바이오 기술로 살피는\n환경 개선의 가능성.',desc:'Bio Gold-200은 19종의 미생물 군집을 활용하는 바이오 제품입니다. 악취 발생 현장의 조건을 확인하고 적용 범위와 방법을 검토합니다.',graphic:'bio',points:[['미생물 군집','19종의 미생물 군집을 활용합니다.'],['현장 적용','돈사·슬러지 피트·퇴비사 등 발생원별로 적용 조건을 살핍니다.'],['결과 확인','암모니아 농도 등 측정 항목을 정해 적용 전후를 비교합니다.']]},
 {slug:'auger',title:'수평오거천공 기술',en:'UNDERGROUND CONNECTION',lead:'다양한 지반을 넘어,\n지중의 연결을 만듭니다.',desc:'수평오거 천공기계와 확장형 잭해머를 활용한 강관 압입 공법입니다. 한국전력공사 배전터널공사 중 도로·철도·하천 횡단 구간에서 전력선 등의 지중화를 위한 강관을 매설합니다.',body:['토사, 풍화암, 연암, 보통암 및 초경암 등 다양한 지반 조건에 대응하고, 지반 여건에 따라 천공과 개착을 병행해 시공 효율을 높일 수 있습니다.','현장에 적합한 시공 방식을 적용해 공사비 절감과 시공 안전성 향상, 공사 기간 단축을 도모합니다.'],graphic:'auger',points:[['다양한 지반 대응','토사 및 다양한 암반 지층에 적용할 수 있습니다.'],['효율적인 시공','지반 조건에 따라 천공과 개착을 병행합니다.'],['경제성 향상','현장 여건에 적합한 시공 방식으로 공사 효율 개선을 도모합니다.'],['공기 단축','효율적인 공정 운영을 통해 공사 기간 단축을 기대할 수 있습니다.'],['지중선로 구축','도로·철도·하천 횡단 구간의 강관 매설과 전력선 지중화에 활용합니다.']]}
];
