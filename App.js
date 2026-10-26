import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Sparkles,
  MessageCircle,
  Scale,
  Lightbulb,
  Heart,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Upload,
  Wand2,
  Send,
  Award,
  RefreshCw,
  Check
} from 'lucide-react';

// ==========================================
// 1. Firebase 초기화 (개인별 안전 저장소)
// ==========================================
const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.warn('Firebase config parse skipped:', e);
  }
  return null;
};

const firebaseConfig = getFirebaseConfig();
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'career-persona-lab-v2';

// ==========================================
// 2. 진로 MBTI 8문항 & 16가지 진로 페르소나 데이터
// ==========================================
const BALANCE_QUESTIONS = [
  {
    id: 1,
    dimension: 'EI',
    question: '주말이 찾아왔다! 나의 에너지를 채우는 방식은?',
    optionA: {
      type: 'E',
      emoji: '🎉',
      title: '친구들과 핫플 탐방 & 수다 떨기',
      desc: '사람들과 어울리며 아이디어를 나눌 때 에너지가 뿜뿜!'
    },
    optionB: {
      type: 'I',
      emoji: '🎧',
      title: '내 방 침대에서 좋아하는 영상 & 취미 몰입',
      desc: '조용히 혼자만의 시간에 깊게 생각할 때 에너지가 충전됨!'
    }
  },
  {
    id: 2,
    dimension: 'EI',
    question: '모둠 프로젝트 첫 시간! 내가 자연스럽게 맡게 되는 포지션은?',
    optionA: {
      type: 'E',
      emoji: '🎤',
      title: '분위기 메이커 & 발표·소통 담당',
      desc: '어색한 공기를 깨고 의견을 모으거나 앞에서 발표하는 게 편해요.'
    },
    optionB: {
      type: 'I',
      emoji: '💻',
      title: '자료 심층 조사 & 고퀄리티 문서·디자인 정리',
      desc: '뒤에서 묵묵히 핵심 자료를 찾고 결과물의 완성도를 높여요.'
    }
  },
  {
    id: 3,
    dimension: 'SN',
    question: '새로운 진로 분야나 취미를 접했을 때 나의 첫 반응은?',
    optionA: {
      type: 'S',
      emoji: '🛠️',
      title: '"실제로 어떻게 쓰이지? 당장 해볼 수 있는 게 뭐야?"',
      desc: '눈에 보이는 확실한 결과물, 구체적인 사실과 경험이 중요해요.'
    },
    optionB: {
      type: 'N',
      emoji: '🚀',
      title: '"이걸로 미래엔 이런 것도 가능하지 않을까?"',
      desc: '상상력을 발휘해 숨은 의미와 새로운 가능성을 연결하는 게 재밌어요.'
    }
  },
  {
    id: 4,
    dimension: 'SN',
    question: '유튜브나 릴스를 볼 때 내가 더 빠져드는 콘텐츠는?',
    optionA: {
      type: 'S',
      emoji: '📹',
      title: '현직자 브이로그, 꿀팁 리뷰, 따라 하기 쉬운 노하우',
      desc: '현실적이고 당장 내 일상에 적용할 수 있는 생생한 정보가 좋아요.'
    },
    optionB: {
      type: 'N',
      emoji: '🌌',
      title: '세계관 해석, 기발한 광고, 미래 트렌드 & 만약에 시리즈',
      desc: '호기심을 자극하는 참신한 스토리와 남다른 시각이 매력적이에요.'
    }
  },
  {
    id: 5,
    dimension: 'TF',
    question: '친구가 진로 고민을 털어놓을 때 나의 리액션은?',
    optionA: {
      type: 'T',
      emoji: '📊',
      title: '"그 분야 전망은 어때? 필요한 과목부터 같이 찾아보자!"',
      desc: '객관적인 분석과 실질적인 해결책을 찾아주는 게 진짜 도움이라고 생각해요.'
    },
    optionB: {
      type: 'F',
      emoji: '🫂',
      title: '"요즘 많이 막막했겠다ㅠㅠ 네가 진짜 좋아하는 게 제일 중요해!"',
      desc: '친구의 불안한 마음에 먼저 공감해주고 따뜻한 응원을 건네는 게 우선이에요.'
    }
  },
  {
    id: 6,
    dimension: 'TF',
    question: '미래에 내가 일할 직장을 고른다면 더 끌리는 곳은?',
    optionA: {
      type: 'T',
      emoji: '🏆',
      title: '내 실력과 성과를 공정하게 인정받고 전문성이 쑥쑥 크는 곳',
      desc: '합리적인 시스템과 똑똑한 동료들 사이에서 성장하고 싶어요.'
    },
    optionB: {
      type: 'F',
      emoji: '🌱',
      title: '사람들에게 따뜻한 감동을 주고 세상에 선한 영향력을 펼치는 곳',
      desc: '내가 하는 일이 누군가에게 위로와 행복이 될 때 가장 큰 보람을 느껴요.'
    }
  },
  {
    id: 7,
    dimension: 'JP',
    question: '시험 기간이나 수행평가 주간! 나의 스타일은?',
    optionA: {
      type: 'J',
      emoji: '📅',
      title: '플래너에 요일별 할 일을 적어두고 하나씩 지워나갈 때 쾌감!',
      desc: '예측 가능한 계획 안에서 차근차근 준비해야 마음이 편안해요.'
    },
    optionB: {
      type: 'P',
      emoji: '⚡',
      title: '일단 영감이 떠오를 때 몰아서 초집중! 상황에 맞춰 유연하게!',
      desc: '틀에 박힌 계획보다는 그때그때 몰입도와 자율성이 있을 때 잘 돼요.'
    }
  },
  {
    id: 8,
    dimension: 'JP',
    question: '내가 꿈꾸는 10년 뒤 일하는 방식은?',
    optionA: {
      type: 'J',
      emoji: '🏛️',
      title: '체계적인 로드맵과 안정적인 시스템 속에서 프로젝트를 완성하는 전문가',
      desc: '명확한 목표와 순서가 잡혀 있을 때 최고의 실력을 발휘해요.'
    },
    optionB: {
      type: 'P',
      emoji: '🎨',
      title: '자유로운 분위기에서 매일 새로운 미션과 변화를 즐기는 크리에이터',
      desc: '변화무쌍한 환경에서 임기응변과 창의력을 발휘하는 게 즐거워요.'
    }
  }
];

const PERSONA_DATA = {
  ENFP: {
    badge: '🌈 인스파이어 스토리텔러',
    title: '세상을 움직이는 따뜻한 아이디어 뱅크',
    summary: '사람들의 마음을 읽는 공감 능력과 반짝이는 상상력으로 세상에 긍정적인 에너지를 퍼뜨리는 유형이에요.',
    keywords: ['공감소통', '크리에이티브', '트렌드리더'],
    recommendedRoles: ['문화콘텐츠 기획자', '브랜드 마케터', '방송/영상 PD', '심리상담·코칭 전문가', '에듀테크 기획자'],
    futureGreeting: '안녕! 2036년의 너야 ㅎㅎ 여전히 반짝이는 아이디어로 사람들의 마음을 움직이는 멋진 기획자로 활약하고 있단다!'
  },
  ENFJ: {
    badge: '🌟 다정한 체인지 메이커',
    title: '사람들의 성장을 돕고 세상을 연결하는 리더',
    summary: '타인의 잠재력을 발견해 이끌어주고, 더 나은 공동체를 만들기 위해 앞장서는 따뜻한 카리스마의 소유자예요.',
    keywords: ['선한영향력', '리더십', '성장멘토'],
    recommendedRoles: ['교육 전문가/교사', '국제기구·NGO 활동가', 'HR 인사·조직문화 디렉터', '아나운서/커뮤니케이터', '공공정책 기획자'],
    futureGreeting: '반가워! 10년 뒤의 너는 많은 사람들에게 영감과 용기를 주는 든든한 멘토이자 리더로 성장해 있어!'
  },
  ENTP: {
    badge: '🚀 경계를 깨는 이노베이터',
    title: '틀에 박힌 상식을 뒤집는 창의적 개척자',
    summary: '남들이 당연하게 여기는 것에 "왜?"라고 질문하며, 새로운 기술과 아이디어를 융합해 판을 바꾸는 모험가예요.',
    keywords: ['발상의전환', '융합사고', '도전정신'],
    recommendedRoles: ['IT 스타트업 창업가', 'AI 서비스 기획자', '크리에이티브 디렉터', '신사업 전략 컨설턴트', '특허·지식재산 전문가'],
    futureGreeting: '오, 드디어 연결됐네! 2036년의 너는 남들이 상상만 하던 아이디어를 실제 서비스로 만들어내며 신나게 도전 중이야!'
  },
  ENTJ: {
    badge: '👑 빅픽처 디렉터',
    title: '명쾌한 전략으로 미래를 지휘하는 캡틴',
    summary: '복잡한 문제 속에서도 핵심을 꿰뚫어 보고, 체계적인 로드맵을 세워 팀을 성공으로 이끄는 전략가예요.',
    keywords: ['전략기획', '결단력', '글로벌리더'],
    recommendedRoles: ['경영·전략 컨설턴트', '글로벌 프로젝트 매니저(PM)', '변호사/법조인', '빅데이터 분석가', '금융·핀테크 전문가'],
    futureGreeting: '안녕! 2036년의 너는 네가 세운 멋진 목표들을 하나씩 달성하며 큰 프로젝트를 이끄는 총괄 디렉터가 되었어!'
  },
  INFP: {
    badge: '🌷 감성 세계관 아티스트',
    title: '깊은 공감과 상상력으로 마음을 치유하는 창작자',
    summary: '자신만의 고유한 가치관과 섬세한 감수성으로 사람들의 지친 마음을 위로하는 따뜻한 콘텐츠와 가치를 만들어내요.',
    keywords: ['치유와공감', '스토리텔링', '가치중심'],
    recommendedRoles: ['웹툰·웹소설 작가', '예술치료사/심리상담가', '북에디터/출판기획자', 'UX 라이팅·브랜드 디자이너', '독립영화·영상 크리에이터'],
    futureGreeting: '안녕, 반가워 :) 2036년의 너는 네가 가진 따뜻한 시선과 이야기로 수많은 사람들에게 위로를 건네는 멋진 사람이 되었어.'
  },
  INFJ: {
    badge: '🔮 통찰력 있는 비전 가이드',
    title: '조용하지만 강한 울림으로 변화를 만드는 탐구자',
    summary: '사람과 사회에 대한 깊은 통찰력을 바탕으로, 세상의 문제를 근본적으로 해결할 따뜻한 해법을 설계해요.',
    keywords: ['깊은통찰', '휴머니즘', '미래설계'],
    recommendedRoles: ['임상심리전문가/정신과의사', '사회학·미래학 연구원', '지속가능성(ESG) 전문 기획자', '유엔/국제개발협력 전문가', '다큐멘터리 PD'],
    futureGreeting: '기다리고 있었어! 10년 뒤의 너는 사람을 향한 깊은 이해를 바탕으로 세상에 꼭 필요한 변화를 조용히 이끌어가고 있단다.'
  },
  INTP: {
    badge: '🧩 호기심 많은 지식 탐정',
    title: '원리를 파고들어 혁신적인 해답을 찾는 아키텍트',
    summary: '지적 호기심이 넘치고 논리적인 분석을 즐기며, 복잡한 데이터나 과학·기술의 원리를 명쾌하게 풀어내는 능력이 뛰어나요.',
    keywords: ['논리분석', '원리탐구', '창의적해법'],
    recommendedRoles: ['AI·소프트웨어 개발자', '뇌과학·바이오 연구원', '데이터 사이언티스트', '정보보안 전문가', '게임 시스템 기획자'],
    futureGreeting: '반가워! 2036년의 너는 네가 궁금해하던 분야를 마음껏 연구하며 세상에 없던 똑똑한 알고리즘과 해법을 만들고 있어!'
  },
  INTJ: {
    badge: '♟️ 마스터플랜 설계자',
    title: '독창적인 비전과 치밀한 분석으로 미래를 짓는 전문가',
    summary: '높은 집중력과 통찰력으로 먼 미래를 내다보며, 가장 효율적이고 완벽한 시스템을 설계해 내는 지성인이에요.',
    keywords: ['치밀한설계', '전문성', '시스템혁신'],
    recommendedRoles: ['AI·로보틱스 엔지니어', '의학·약학 연구원', '건축가/스마트시티 설계자', '경제·금융 애널리스트', '법학·정책 연구원'],
    futureGreeting: '안녕! 10년 뒤의 너는 고등학교 때부터 차곡차곡 쌓아온 깊이 있는 지식으로 이 분야의 대체 불가능한 전문가로 인정받고 있어.'
  },
  ESFP: {
    badge: '✨ 에너제틱 트렌드 메이커',
    title: '어디서나 빛나는 센스로 즐거움을 선물하는 스타',
    summary: '뛰어난 현장 감각과 친화력으로 사람들의 시선을 사로잡고, 일상을 축제처럼 생동감 있게 만드는 매력이 있어요.',
    keywords: ['현장감각', '트렌드세터', '에너지뿜뿜'],
    recommendedRoles: ['공연·페스티벌 기획자', '패션·뷰티 디렉터', '미디어 크리에이터/엔터테이너', '승무원/호텔리어', '스포츠·헬스케어 전문가'],
    futureGreeting: '야호! 반가워! 2036년의 너는 매일매일 좋아하는 일을 즐기며 사람들에게 해피 바이러스를 전파하는 최고의 트렌드 메이커야!'
  },
  ESTP: {
    badge: '⚡ 거침없는 액션 플레이어',
    title: '빠른 판단력과 추진력으로 현장을 누비는 해결사',
    summary: '책상 앞의 이론보다 직접 부딪히며 배우는 것을 좋아하고, 위기 상황에서도 순발력 있게 문제를 해결하는 능력자예요.',
    keywords: ['순발력', '현장해결사', '추진력'],
    recommendedRoles: ['응급의료/전문 의료인', '글로벌 비즈니스 협상가', '스포츠 마케팅·에이전트', '사이버 범죄 수사관/경찰', '라이브 커머스·유통 기획자'],
    futureGreeting: '안녕! 2036년의 너는 다이내믹한 현장에서 누구보다 빠르게 판단하고 멋지게 문제를 해결하는 에이스로 활약 중이야!'
  },
  ESFJ: {
    badge: '💝 하모니 서포터',
    title: '세심한 배려로 모두를 행복하게 만드는 조력자',
    summary: '주변 사람들의 필요를 누구보다 빨리 알아채고 실질적인 도움을 주며, 따뜻하고 화목한 공동체를 만드는 데 탁월해요.',
    keywords: ['세심한케어', '협업능력', '신뢰감'],
    recommendedRoles: ['간호사/보건의료 전문가', '초·중등 교사', '사회복지·아동청소년 전문가', '고객경험(CX) 매니저', '국제행사·컨벤션 기획자'],
    futureGreeting: '안녕! 10년 뒤의 너는 네 따뜻한 보살핌과 꼼꼼함 덕분에 주변 동료들과 많은 사람들이 가장 의지하는 멋진 전문가가 되었단다!'
  },
  ESTJ: {
    badge: '📋 빈틈없는 스마트 디렉터',
    title: '명확한 기준과 실행력으로 결과를 만들어내는 리더',
    summary: '책임감이 강하고 일 처리가 깔끔해서, 어떤 복잡한 일도 체계적으로 정리해 기한 내에 완벽히 해내는 든든한 기둥이에요.',
    keywords: ['책임감', '체계적관리', '실행력'],
    recommendedRoles: ['약사/보건행정 전문가', '공인회계사/세무사', '공기업·행정 공무원', '품질·생산관리 엔지니어', '학교·교육행정 전문가'],
    futureGreeting: '반가워! 2036년의 너는 흔들림 없는 성실함과 정확한 일 처리로 조직에서 가장 신뢰받는 핵심 리더로 일하고 있어!'
  },
  ISFP: {
    badge: '🎨 감각적인 무드 디자이너',
    title: '다정한 시선과 미적 감각으로 일상을 아름답게 물들이는 예술가',
    summary: '겸손하고 온화한 성품 속에 남다른 예술적 감각을 지니고 있어, 눈에 보이는 아름다움과 편안한 경험을 만들어내요.',
    keywords: ['미적감각', '온화한공감', '디테일'],
    recommendedRoles: ['시각·공간·UX 디자이너', '플로리스트/조경 디자이너', '반려동물 전문가/수의테크니션', '뷰티·메이크업 아티스트', '파티시에/푸드 디렉터'],
    futureGreeting: '안녕 :) 2036년의 너는 네가 좋아하는 감성과 색깔을 가득 담은 공간과 작품으로 사람들에게 힐링을 선물하고 있어!'
  },
  ISTP: {
    badge: '🔧 쿨한 테크 크래프터',
    title: '군더더기 없는 실력과 기술로 핵심만 딱 해결하는 장인',
    summary: '관찰력이 뛰어나고 도구와 기술을 다루는 감각이 탁월해서, 복잡한 기계나 소프트웨어 문제도 쿨하게 해결해 내요.',
    keywords: ['실용기술', '문제해결', '냉철한판단'],
    recommendedRoles: ['프론트엔드/백엔드 개발자', '항공기·자동차 엔지니어', '의공학·의료기기 전문가', '영상편집·VFX 아티스트', '데이터 엔지니어'],
    futureGreeting: '오, 반가워! 2036년의 너는 누구도 따라올 수 없는 진짜배기 기술력을 갖추고 워라밸까지 완벽하게 챙기는 멋진 전문가야!'
  },
  ISFJ: {
    badge: '🛡️ 든든한 가디언 메이커',
    title: '성실함과 다정함으로 사람들의 일상을 지키는 수호자',
    summary: '한 번 맡은 일은 끝까지 책임지며, 보이지 않는 곳에서도 세심하게 타인을 배려해 세상이 안전하게 돌아가게 돕는 유형이에요.',
    keywords: ['성실함', '세심한배려', '안정감'],
    recommendedRoles: ['보건의료인(간호·임상병리·물리치료)', '사서·아카이브 전문가', '영양사/식품연구 전문가', '유아·특수교육 교사', '공공기관·금융 사무원'],
    futureGreeting: '안녕! 10년 뒤의 너는 네가 가진 꾸준함과 따뜻함으로 사람들의 건강과 일상을 든든하게 지켜주는 멋진 전문가가 되었단다!'
  },
  ISTJ: {
    badge: '📐 무결점 데이터 아키텍트',
    title: '정확함과 끈기로 세상의 기준을 세우는 신뢰의 아이콘',
    summary: '사실과 근거를 바탕으로 빈틈없이 일을 처리하며, 한 분야를 꾸준히 파고들어 최고의 정확도를 자랑하는 전문가예요.',
    keywords: ['정확성', '원칙준수', '꾸준함'],
    recommendedRoles: ['데이터베이스·클라우드 엔지니어', '회계사/재무분석가', '의무기록·보건통계 전문가', '법무·특허 행정 전문가', '생명공학·화학 연구원'],
    futureGreeting: '반가워! 2036년의 너는 흔들리지 않는 성실함과 정확성 덕분에 모두가 믿고 맡기는 최고의 스페셜리스트로 활약하고 있어!'
  }
};

// 3차시 교과목 & 딜레마 프리셋
const SUBJECT_LIST = [
  '국어', '영어', '수학', '통합사회', '통합과학', '정보', '기술·가정', '미술/음악'
];

const DILEMMA_TOPICS = [
  {
    id: 'ai_replace',
    tag: '🤖 AI와 인간의 공존',
    title: '인공지능이 내 진로 분야의 일을 대신한다면?',
    question: '2036년에는 초고성능 AI가 문서 작성, 진단, 디자인, 분석까지 1초 만에 해냅니다. 이때 인간 전문가인 나만이 줄 수 있는 대체 불가능한 가치는 무엇일까요?'
  },
  {
    id: 'efficiency_ethics',
    tag: '⚖️ 효율성 vs 윤리·공정성',
    title: '빠른 성과와 도덕적 가치 중 무엇이 먼저일까?',
    question: '비용을 아끼거나 빠른 성과를 내기 위해 환경이나 소외계층의 안전을 조금 포기하자는 의견이 나왔습니다. 이 분야에서 일하는 나는 어떤 기준으로 문제를 해결할까요?'
  },
  {
    id: 'privacy_care',
    tag: '🔐 맞춤형 편의 vs 개인정보 보호',
    title: '더 좋은 서비스를 위해 개인 데이터를 어디까지 써도 될까?',
    question: '사람들의 건강·심리·취향 데이터를 수집하면 맞춤형 도움을 줄 수 있지만 사생활 침해 우려도 큽니다. 두 가치를 모두 지키는 나만의 아이디어는 무엇인가요?'
  }
];

// 아바타 목록
const AVATARS = ['🐰', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🦄', '🐥', '🦋', '🍀'];

// 초기 포트폴리오 상태
const INITIAL_PORTFOLIO = {
  studentId: '',
  studentName: '',
  avatar: '🐰',
  // 1차시
  quizAnswers: {},
  mbtiType: '',
  selectedRole: '',
  customGoalReason: '',
  // 2차시
  interviewQ1: '',
  interviewQ2: '',
  interviewQ3: '',
  // 3차시
  selectedDilemmaId: 'ai_replace',
  linkedSubjects: [],
  dilemmaSolution: '',
  // 4차시
  projectTitle: '',
  projectTarget: '',
  projectActionPlan: '',
  // 5차시
  peerName: '',
  peerPraise: '',
  myRevision: '',
  // 6차시
  grade2Subjects: '',
  finalReflection: ''
};

export default function App() {
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO);
  const [currentStep, setCurrentStep] = useState(1);
  const [quizStep, setQuizStep] = useState(0); // 0~7 문항 진행
  const [saveStatus, setSaveStatus] = useState('저장 완료');
  const [toastMessage, setToastMessage] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // 모달 상태들
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [showSummaryGenerator, setShowSummaryGenerator] = useState(false);

  // 2차시 채팅창 현재 선택된 질문 탭 (1, 2, 3)
  const [activeChatTab, setActiveChatTab] = useState(1);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // ==========================================
  // 초기 로컬스토리지 및 Firebase 1회 로드 (타이핑 충돌 방지)
  // ==========================================
  useEffect(() => {
    const savedLocal = localStorage.getItem('career_persona_portfolio_v2');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        setPortfolio((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Local load error:', e);
      }
    }

    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn('Auth init skipped:', e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'career_portfolio', 'main_data');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const cloudData = snap.data();
            setPortfolio((prev) => {
              const merged = { ...prev, ...cloudData };
              localStorage.setItem('career_persona_portfolio_v2', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (err) {
          console.warn('Initial cloud load skipped:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 포트폴리오 필드 업데이트 (부드러운 한글 입력을 위해 로컬 즉시 반영 + 디바운스 저장)
  // ==========================================
  const updateField = (field, value) => {
    setPortfolio((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem('career_persona_portfolio_v2', JSON.stringify(updated));
      return updated;
    });
    setSaveStatus('작성 중...');
  };

  // 타이핑이 멈추면 1초 뒤 클라우드에 조용히 백업
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (user && db) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'career_portfolio', 'main_data');
          await setDoc(docRef, { ...portfolio, updatedAt: new Date().toISOString() }, { merge: true });
          setSaveStatus('안전 저장됨 ✨');
        } catch (e) {
          setSaveStatus('기기 저장됨');
        }
      } else {
        setSaveStatus('기기 저장됨');
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [portfolio, user]);

  const saveToPrivateCloud = async (dataToSave = portfolio, silent = false) => {
    localStorage.setItem('career_persona_portfolio_v2', JSON.stringify(dataToSave));
    if (user && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'career_portfolio', 'main_data');
        await setDoc(docRef, { ...dataToSave, updatedAt: new Date().toISOString() }, { merge: true });
        setSaveStatus('안전 저장됨 ✨');
        if (!silent) showToast('내 전용 공간에 안전하게 저장되었어요!');
      } catch (e) {
        if (!silent) showToast('내 기기에 안전하게 저장되었어요!');
      }
    } else {
      if (!silent) showToast('내 기기에 안전하게 저장되었어요!');
    }
  };

  // ==========================================
  // 1차시 밸런스 게임 답변 및 MBTI 계산
  // ==========================================
  const handleSelectQuizOption = (questionId, selectedType) => {
    const updatedAnswers = { ...portfolio.quizAnswers, [questionId]: selectedType };

    // 8문항 모두 응답 시 MBTI 계산
    let calculatedMbti = portfolio.mbtiType;
    if (Object.keys(updatedAnswers).length === 8) {
      const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      Object.values(updatedAnswers).forEach((val) => {
        if (counts[val] !== undefined) counts[val] += 1;
      });
      const eOrI = counts.E >= counts.I ? 'E' : 'I';
      const sOrN = counts.S >= counts.N ? 'S' : 'N';
      const tOrF = counts.T >= counts.F ? 'T' : 'F';
      const jOrP = counts.J >= counts.P ? 'J' : 'P';
      calculatedMbti = `${eOrI}${sOrN}${tOrF}${jOrP}`;
    }

    const nextRole =
      !portfolio.selectedRole && calculatedMbti && PERSONA_DATA[calculatedMbti]
        ? PERSONA_DATA[calculatedMbti].recommendedRoles[0]
        : portfolio.selectedRole;

    setPortfolio((prev) => {
      const updated = {
        ...prev,
        quizAnswers: updatedAnswers,
        mbtiType: calculatedMbti,
        selectedRole: nextRole
      };
      localStorage.setItem('career_persona_portfolio_v2', JSON.stringify(updated));
      return updated;
    });

    if (quizStep < 7) {
      setTimeout(() => setQuizStep((prev) => prev + 1), 180);
    } else {
      showToast('🎉 짜잔! 나만의 진로 페르소나 캐릭터가 탄생했어요!');
    }
  };

  const currentPersona = useMemo(() => {
    if (portfolio.mbtiType && PERSONA_DATA[portfolio.mbtiType]) {
      return PERSONA_DATA[portfolio.mbtiType];
    }
    return null;
  }, [portfolio.mbtiType]);

  // ==========================================
  // 차시별 완료 여부(스탬프) 및 달성률 계산
  // ==========================================
  const stepCompletion = useMemo(() => {
    return {
      1: Boolean(portfolio.mbtiType && portfolio.selectedRole && portfolio.customGoalReason.trim().length >= 5),
      2: Boolean(
        portfolio.interviewQ1.trim().length >= 5 &&
          portfolio.interviewQ2.trim().length >= 5 &&
          portfolio.interviewQ3.trim().length >= 5
      ),
      3: Boolean(portfolio.linkedSubjects.length > 0 && portfolio.dilemmaSolution.trim().length >= 10),
      4: Boolean(portfolio.projectTitle.trim().length >= 2 && portfolio.projectActionPlan.trim().length >= 10),
      5: Boolean(portfolio.peerPraise.trim().length >= 5 && portfolio.myRevision.trim().length >= 5),
      6: Boolean(portfolio.grade2Subjects.trim().length >= 2 && portfolio.finalReflection.trim().length >= 10)
    };
  }, [portfolio]);

  const completedCount = Object.values(stepCompletion).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  // ==========================================
  // 백업 코드 복사 및 복원
  // ==========================================
  const handleCopyBackupCode = () => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(portfolio)));
      navigator.clipboard.writeText(encoded);
      showToast('🔑 백업 코드가 복사되었어요! 메모장이나 카톡 나에게 보내기에 보관하세요.');
    } catch (e) {
      showToast('복사 중 오류가 발생했어요.');
    }
  };

  const handleRestoreFromCode = () => {
    if (!restoreInput.trim()) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(restoreInput.trim())));
      setPortfolio((prev) => ({ ...prev, ...decoded }));
      localStorage.setItem('career_persona_portfolio_v2', JSON.stringify(decoded));
      setShowRestoreModal(false);
      setRestoreInput('');
      showToast('✨ 내 이전 활동 기록을 성공적으로 불러왔어요!');
    } catch (e) {
      showToast('올바른 백업 코드가 아니에요. 다시 확인해 주세요!');
    }
  };

  // ==========================================
  // 워드(.doc) 파일 다운로드 및 종합 활동 요약문 생성
  // ==========================================
  const generateComprehensiveSummary = () => {
    const role = portfolio.selectedRole || '희망 진로 분야';
    const personaTitle = currentPersona ? `${currentPersona.badge}(${portfolio.mbtiType})` : '진로 탐험가';
    const dilemmaObj = DILEMMA_TOPICS.find((d) => d.id === portfolio.selectedDilemmaId) || DILEMMA_TOPICS[0];
    const subjects = portfolio.linkedSubjects.length > 0 ? portfolio.linkedSubjects.join(', ') : '관련 교과';

    return `진로 가치관 및 성향 탐색 활동을 통해 자신의 페르소나를 '${personaTitle}'로 도출하고, '${role}' 분야에 대한 구체적인 탐색 목표(${portfolio.customGoalReason || '사람들에게 도움을 주는 전문가로 성장'})를 수립함. 가상 미래 멘토 인터뷰 활동을 통해 해당 직무의 핵심 역량(${portfolio.interviewQ1 || '전문 지식과 소통 역량'})과 고교 시절 준비 과정(${portfolio.interviewQ2 || '교과 심화 탐구 및 독서 활동'})을 주도적으로 파악함. 특히 '${dilemmaObj.tag}'라는 직무 딜레마 상황에서 ${subjects} 교과의 원리를 융합하여 '${portfolio.dilemmaSolution || '인간 중심의 윤리적 기준과 기술을 조화시키는 방안'}'이라는 창의적 해결책을 제시함. 나아가 '${portfolio.projectTitle || '청소년 문제 해결 미니 캠페인'}'을 기획하여 구체적인 실행 계획(${portfolio.projectActionPlan || '대상자 맞춤형 콘텐츠 제작 및 실천'})을 설계하고, 동료 피드백(${portfolio.peerPraise || '실현 가능성과 공감대에 대한 조언'})을 수용하여 기획안을 발전시킴(${portfolio.myRevision || '구체적 실천 단계 보완'}). 일련의 과정을 통해 2학년 선택과목(${portfolio.grade2Subjects || '진로 관련 심화 과목'}) 이수 계획을 체계화하고 진로에 대한 확고한 성장 의지(${portfolio.finalReflection || '주도적인 탐구 태도 확립'})를 보임.`;
  };

  const handleDownloadWordReport = () => {
    const dilemmaObj = DILEMMA_TOPICS.find((d) => d.id === portfolio.selectedDilemmaId) || DILEMMA_TOPICS[0];
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>나의 진로 페르소나 심화 탐구 보고서</title></head>
      <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #1e293b;">
        <h1 style="text-align: center; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 12px;">
          🎓 나의 진로 페르소나 심화 탐구 보고서
        </h1>
        <p style="text-align: right; font-size: 11pt;">
          <strong>학번:</strong> ${portfolio.studentId || '미입력'} &nbsp;|&nbsp;
          <strong>이름:</strong> ${portfolio.studentName || '미입력'} &nbsp;|&nbsp;
          <strong>진로 캐릭터:</strong> ${currentPersona ? `${currentPersona.badge} (${portfolio.mbtiType})` : '탐색 중'}
        </p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">1. 나의 진로 페르소나 & 탐구 동기 (1차시)</h3>
        <p><strong>• 희망 진로/역할:</strong> ${portfolio.selectedRole || '-'}</p>
        <p><strong>• 이 분야에 끌리는 이유와 이루고 싶은 가치:</strong><br/>${portfolio.customGoalReason || '-'}</p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">2. 2036년 미래의 나 인터뷰 기록 (2차시)</h3>
        <p><strong>• Q1. 미래 현장에서 하는 핵심 업무와 가장 필요한 역량:</strong><br/>${portfolio.interviewQ1 || '-'}</p>
        <p><strong>• Q2. 고등학교 1학년 때 해두면 가장 좋은 경험:</strong><br/>${portfolio.interviewQ2 || '-'}</p>
        <p><strong>• Q3. 미래의 내가 지금의 나에게 전하는 응원 메시지:</strong><br/>${portfolio.interviewQ3 || '-'}</p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">3. 교과 연결 & 직무 딜레마 해결 탐구 (3차시)</h3>
        <p><strong>• 선택한 딜레마 주제:</strong> ${dilemmaObj.tag} - ${dilemmaObj.title}</p>
        <p><strong>• 연결한 고1 교과목:</strong> ${portfolio.linkedSubjects.join(', ') || '-'}</p>
        <p><strong>• 나만의 해결 아이디어:</strong><br/>${portfolio.dilemmaSolution || '-'}</p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">4. 세상을 바꾸는 상상 미니 프로젝트 기획 (4차시)</h3>
        <p><strong>• 프로젝트 제목:</strong> ${portfolio.projectTitle || '-'}</p>
        <p><strong>• 도움을 주고 싶은 대상:</strong> ${portfolio.projectTarget || '-'}</p>
        <p><strong>• 구체적인 실행 방법 (Action Plan):</strong><br/>${portfolio.projectActionPlan || '-'}</p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">5. 친구와의 응원 교환 & 기획안 업그레이드 (5차시)</h3>
        <p><strong>• 함께 이야기 나눈 친구:</strong> ${portfolio.peerName || '-'}</p>
        <p><strong>• 친구에게 받은 칭찬과 아이디어 피드백:</strong><br/>${portfolio.peerPraise || '-'}</p>
        <p><strong>• 피드백을 반영해 더 발전시킨 내 기획안:</strong><br/>${portfolio.myRevision || '-'}</p>

        <h3 style="background:#f1f5f9; padding:8px; border-left:4px solid #6366f1;">6. 향후 선택과목 다짐 및 최종 성찰 (6차시)</h3>
        <p><strong>• 2학년 때 관심을 두고 배우고 싶은 선택과목:</strong> ${portfolio.grade2Subjects || '-'}</p>
        <p><strong>• 1~6차시 활동을 마치며 느낀 점과 나의 성장 다짐:</strong><br/>${portfolio.finalReflection || '-'}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `진로탐구보고서_${portfolio.studentId || '학번'}_${portfolio.studentName || '이름'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📄 보고서 파일(.doc)이 다운로드되었어요!');
  };

  // 네비게이션 탭 목록
  const STEPS = [
    { step: 1, title: '진로 캐릭터 뽑기', emoji: '🔮', icon: Sparkles },
    { step: 2, title: '2036년의 나 톡!', emoji: '💬', icon: MessageCircle },
    { step: 3, title: '만약에 밸런스 톡', emoji: '⚖️', icon: Scale },
    { step: 4, title: '상상 프로젝트', emoji: '💡', icon: Lightbulb },
    { step: 5, title: '짝꿍 응원 & 레벨업', emoji: '🤝', icon: Heart },
    { step: 6, title: '드림 리포트 완성', emoji: '🎓', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 text-slate-800 pb-16">
      {/* 상단 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs md:text-sm font-bold animate-bounce print:hidden">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 백업 코드 복원 모달 */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              🔑 내 백업 코드로 기록 불러오기
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              다른 기기나 컴퓨터에서 복사해 둔 백업 코드를 아래 칸에 붙여넣으면 내가 작성했던 1~6차시 기록이 그대로 복원됩니다.
            </p>
            <textarea
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              placeholder="복사해 둔 백업 코드를 여기에 붙여넣으세요..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleRestoreFromCode}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-indigo-600"
              >
                내 기록 불러오기 ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          상단 캐릭터 상태바 & 헤더 (인쇄 시 숨김)
      ============================================================ */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-30 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* 좌측: 로고 & 아바타 선택 */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              title="클릭해서 내 아바타 바꾸기"
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-100 to-indigo-100 border border-pink-200 flex items-center justify-center text-2xl shadow-sm hover:scale-105 transition"
            >
              {portfolio.avatar || '🐰'}
            </button>

            {showAvatarPicker && (
              <div className="absolute top-14 left-0 bg-white rounded-2xl shadow-xl border border-pink-100 p-3 z-40 w-60">
                <div className="text-[11px] font-bold text-slate-500 mb-2">내 캐릭터 아이콘 고르기 ✨</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      onClick={() => {
                        updateField('avatar', av);
                        setShowAvatarPicker(false);
                      }}
                      className={`p-1.5 rounded-xl text-lg hover:bg-pink-50 transition ${
                        portfolio.avatar === av ? 'bg-pink-100 ring-2 ring-pink-400' : ''
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  나의 진로 페르소나 연구소
                </h1>
                {currentPersona && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-pink-100 text-pink-700">
                    {currentPersona.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                1~6차시 스탬프를 모으면 나만의 진로 탐구 리포트가 자동으로 완성돼요!
              </p>
            </div>
          </div>

          {/* 우측: 학번/이름 입력 & 백업 버튼 */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={portfolio.studentId}
              onChange={(e) => updateField('studentId', e.target.value)}
              placeholder="학번 (예: 10101)"
              className="w-28 px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50/40 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <input
              type="text"
              value={portfolio.studentName}
              onChange={(e) => updateField('studentName', e.target.value)}
              placeholder="이름 입력"
              className="w-24 px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50/40 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            <button
              onClick={handleCopyBackupCode}
              title="다른 컴퓨터로 옮길 때 내 기록 복사하기"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">백업코드 복사</span>
            </button>
            <button
              onClick={() => setShowRestoreModal(true)}
              title="복사한 백업코드로 내 기록 불러오기"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">불러오기</span>
            </button>

            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {saveStatus}
            </span>
          </div>
        </div>

        {/* 차시 탭 & 스탬프 진행바 */}
        <div className="max-w-5xl mx-auto px-4 pb-3 pt-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600">
              <Award className="w-4 h-4 text-pink-500" />
              <span>나의 진로 스탬프 {completedCount} / 6개 획득</span>
            </div>
            <div className="w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
            {STEPS.map((item) => {
              const isDone = stepCompletion[item.step];
              const isActive = currentStep === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => setCurrentStep(item.step)}
                  className={`flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-extrabold transition border ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white border-transparent shadow-md scale-[1.02]'
                      : isDone
                      ? 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50/50'
                      : 'bg-white/70 text-slate-500 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <span className="truncate">
                    {item.step}. {item.emoji} {item.title}
                  </span>
                  {isDone && (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ml-1 ${isActive ? 'text-pink-200' : 'text-emerald-500'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============================================================
          메인 콘텐츠 영역
      ============================================================ */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        {/* ============================================================
            1차시: 진로 캐릭터 뽑기 (심리테스트형 밸런스 게임)
        ============================================================ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-extrabold mb-2">
                    STEP 1 · 진로 성향 밸런스 게임
                  </span>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                    🔮 아직 꿈이 없어도 괜찮아! 나의 진로 캐릭터 뽑기
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    8가지 일상 속 순간 중 더 내 마음 같은 선택지를 골라보세요.
                  </p>
                </div>

                {Object.keys(portfolio.quizAnswers).length > 0 && (
                  <button
                    onClick={() => {
                      setQuizStep(0);
                      updateField('quizAnswers', {});
                      updateField('mbtiType', '');
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-pink-600 bg-slate-100 px-3 py-1.5 rounded-xl transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    테스트 다시 하기
                  </button>
                )}
              </div>

              {/* 문항 진행 카드 */}
              {!currentPersona ? (
                <div className="bg-gradient-to-br from-pink-50/70 via-white to-indigo-50/70 rounded-3xl p-6 border border-pink-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-pink-600">
                      Q{quizStep + 1} / {BALANCE_QUESTIONS.length}
                    </span>
                    <div className="flex gap-1">
                      {BALANCE_QUESTIONS.map((q, idx) => (
                        <button
                          key={q.id}
                          onClick={() => setQuizStep(idx)}
                          className={`w-6 h-2 rounded-full transition ${
                            idx === quizStep
                              ? 'bg-pink-500 w-8'
                              : portfolio.quizAnswers[q.id]
                              ? 'bg-indigo-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-base md:text-lg font-extrabold text-slate-800 mb-5">
                    {BALANCE_QUESTIONS[quizStep].question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['optionA', 'optionB'].map((optKey) => {
                      const opt = BALANCE_QUESTIONS[quizStep][optKey];
                      const isSelected = portfolio.quizAnswers[BALANCE_QUESTIONS[quizStep].id] === opt.type;
                      return (
                        <button
                          key={optKey}
                          onClick={() => handleSelectQuizOption(BALANCE_QUESTIONS[quizStep].id, opt.type)}
                          className={`text-left p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] ${
                            isSelected
                              ? 'border-pink-500 bg-pink-50/70 shadow-md'
                              : 'border-slate-200 bg-white hover:border-pink-300'
                          }`}
                        >
                          <div className="text-3xl mb-2">{opt.emoji}</div>
                          <div className="text-sm md:text-base font-extrabold text-slate-800 mb-1">{opt.title}</div>
                          <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 16가지 페르소나 결과 카드 */
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-extrabold">
                        <span>진로 성향 코드: {portfolio.mbtiType}</span>
                        <span>•</span>
                        <span>{currentPersona.badge}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-extrabold">{currentPersona.title}</h3>
                      <p className="text-xs md:text-sm text-pink-100 leading-relaxed max-w-2xl">
                        {currentPersona.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {currentPersona.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-3 py-1 rounded-full bg-black/20 text-xs font-bold text-pink-100"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center shrink-0 border border-white/20">
                      <div className="text-5xl mb-1">{portfolio.avatar || '🐰'}</div>
                      <div className="text-xs font-extrabold">{portfolio.studentName || '나'}의 캐릭터</div>
                      <div className="text-[11px] text-pink-100 mt-0.5">{portfolio.selectedRole || '역할 선택 전'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 희망 진로·역할 선택 및 이유 작성 */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-5">
                <div>
                  <label className="block text-sm font-extrabold text-slate-800 mb-2">
                    🎯 오늘 내가 탐색해 볼 진로 분야 또는 역할 고르기 (버튼 클릭 또는 직접 수정 가능!)
                  </label>
                  {currentPersona && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentPersona.recommendedRoles.map((role) => (
                        <button
                          key={role}
                          onClick={() => updateField('selectedRole', role)}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                            portfolio.selectedRole === role
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {portfolio.selectedRole === role && <Check className="w-3.5 h-3.5" />}
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={portfolio.selectedRole}
                    onChange={(e) => updateField('selectedRole', e.target.value)}
                    placeholder="내가 관심 있는 직업이나 역할을 자유롭게 적어보세요 (예: 간호사, 웹툰 PD, AI 개발자 등)"
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-extrabold text-slate-800">
                      💌 이 진로(역할)에 마음이 끌리는 이유와 내가 이루고 싶은 가치는?
                    </label>
                    <button
                      onClick={() => {
                        const sample = ` 평소 ${
                          currentPersona ? currentPersona.keywords.join(', ') : '소통과 창의성'
                        }에 강점이 있다고 느꼈는데, '${
                          portfolio.selectedRole || '이 분야'
                        }'에서 일하며 사람들의 어려움을 해결해주고 세상에 긍정적인 에너지를 전하고 싶기 때문이다.`;
                        updateField('customGoalReason', (portfolio.customGoalReason + sample).trim());
                      }}
                      className="text-xs font-extrabold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      🪄 첫 문장 예시 채우기
                    </button>
                  </div>
                  <textarea
                    value={portfolio.customGoalReason}
                    onChange={(e) => updateField('customGoalReason', e.target.value)}
                    rows={3}
                    placeholder="예: 사람들의 이야기를 듣고 공감할 때 가장 행복한데, 이 직업을 통해 누군가에게 위로와 실질적인 도움을 주는 전문가가 되고 싶다."
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            2차시: 2036년의 나 톡! (메신저형 미래 멘토 인터뷰)
        ============================================================ */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100 space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold mb-2">
                STEP 2 · 2036년 미래의 나와 메신저 인터뷰
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                💬 10년 뒤 ‘{portfolio.selectedRole || '멋진 전문가'}’가 된 나에게 카톡이 왔어요!
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                2036년의 내가 되어 3가지 질문에 답장을 보내보세요. 막막할 땐 [🪄 답장 힌트 넣기]를 눌러보세요!
              </p>
            </div>

            {/* 메신저 채팅방 UI */}
            <div className="bg-slate-100 rounded-3xl p-4 md:p-6 border border-slate-200 space-y-4">
              {/* 미래의 나 인사말 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shrink-0 shadow">
                  {portfolio.avatar || '🐰'}
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-xl border border-slate-200/80">
                  <div className="text-[11px] font-extrabold text-indigo-600 mb-1">
                    2036년의 {portfolio.studentName || '나'} ({portfolio.selectedRole || '미래 전문가'})
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    {currentPersona
                      ? currentPersona.futureGreeting
                      : '안녕! 2036년 미래에서 일하고 있는 너야! 고1 때 네가 해준 고민 덕분에 지금 정말 멋지게 일하고 있어. 궁금한 걸 물어봐 줄래?'}
                  </p>
                </div>
              </div>

              {/* 3가지 질문 탭 버튼 */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { id: 1, label: '질문 1. 실제로 하는 일 & 핵심 역량' },
                  { id: 2, label: '질문 2. 고1 때 해두면 좋은 경험' },
                  { id: 3, label: '질문 3. 지금의 나에게 해주고 싶은 말' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChatTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeChatTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-indigo-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 질문 1 */}
              {activeChatTab === 1 && (
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700">
                      Q1. 2036년에 ‘{portfolio.selectedRole || '이 분야'}’로 일하면서 가장 중요하게 하는 일과 꼭 필요한 능력은 뭐야?
                    </span>
                    <button
                      onClick={() =>
                        updateField(
                          'interviewQ1',
                          `단순히 지식만 아는 것을 넘어 사람들의 숨은 필요를 깊이 공감하고 소통하는 능력, 그리고 빠르게 변하는 최신 기술 트렌드를 업무에 융합하는 능력이 가장 중요해!`
                        )
                      }
                      className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg hover:bg-pink-100 shrink-0"
                    >
                      🪄 답장 힌트 넣기
                    </button>
                  </div>
                  <textarea
                    value={portfolio.interviewQ1}
                    onChange={(e) => updateField('interviewQ1', e.target.value)}
                    rows={3}
                    placeholder="미래의 내가 되어 답장을 적어보세요..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* 질문 2 */}
              {activeChatTab === 2 && (
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700">
                      Q2. 고등학교 1학년 때 학교 수업이나 창체 활동에서 어떤 경험을 해두면 가장 도움이 될까?
                    </span>
                    <button
                      onClick={() =>
                        updateField(
                          'interviewQ2',
                          `교과 수업 시간에 배운 개념을 내 관심 진로와 연결해 작은 발표나 탐구 보고서로 남겨두는 게 정말 큰 도움이 됐어! 또 친구들과 모둠 프로젝트를 하며 의견을 조율해 본 경험도 꼭 챙겨봐.`
                        )
                      }
                      className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg hover:bg-pink-100 shrink-0"
                    >
                      🪄 답장 힌트 넣기
                    </button>
                  </div>
                  <textarea
                    value={portfolio.interviewQ2}
                    onChange={(e) => updateField('interviewQ2', e.target.value)}
                    rows={3}
                    placeholder="고1 시절 해두면 좋을 독서, 교과 탐구, 태도 등을 적어보세요..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* 질문 3 */}
              {activeChatTab === 3 && (
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700">
                      Q3. 아직 진로와 공부가 고민인 고1의 나에게 꼭 해주고 싶은 응원의 한마디는?
                    </span>
                    <button
                      onClick={() =>
                        updateField(
                          'interviewQ3',
                          `지금은 가끔 막막하고 완벽하지 않은 것 같아도 괜찮아! 네가 좋아하는 것들을 하나씩 시도해 보는 과정 자체가 전부 미래의 멋진 밑거름이 되고 있으니까 자신감을 가져!`
                        )
                      }
                      className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg hover:bg-pink-100 shrink-0"
                    >
                      🪄 답장 힌트 넣기
                    </button>
                  </div>
                  <textarea
                    value={portfolio.interviewQ3}
                    onChange={(e) => updateField('interviewQ3', e.target.value)}
                    rows={3}
                    placeholder="10년 뒤의 내가 지금의 나에게 보내는 따뜻한 응원 메시지..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* 3개 질문 한눈에 미리보기 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  { num: 1, title: '핵심 업무 & 역량', val: portfolio.interviewQ1 },
                  { num: 2, title: '고1 추천 경험', val: portfolio.interviewQ2 },
                  { num: 3, title: '미래의 응원 메시지', val: portfolio.interviewQ3 }
                ].map((box) => (
                  <div
                    key={box.num}
                    onClick={() => setActiveChatTab(box.num)}
                    className="cursor-pointer bg-white/80 hover:bg-white p-3.5 rounded-2xl border border-slate-200/80 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-600 mb-1">
                      <span>답장 {box.num}. {box.title}</span>
                      {box.val.trim().length >= 5 ? (
                        <span className="text-emerald-600">완료 ✓</span>
                      ) : (
                        <span className="text-pink-500">작성 필요</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {box.val || '클릭해서 답장을 작성해 보세요!'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            3차시: 만약에 밸런스 톡 (교과 연결 & 딜레마 탐구)
        ============================================================ */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100 space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold mb-2">
                STEP 3 · 교과목 연결 & 만약에 딜레마 톡
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                ⚖️ 내 진로 분야에서 이런 문제가 생긴다면 어떻게 해결할까?
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                흥미로운 딜레마 주제 하나를 고르고, 지금 배우는 고1 수업 과목과 연결해 나만의 해결책을 적어보세요.
              </p>
            </div>

            {/* 딜레마 카드 3종 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DILEMMA_TOPICS.map((topic) => {
                const isSelected = portfolio.selectedDilemmaId === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => updateField('selectedDilemmaId', topic.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-extrabold mb-2">
                      {topic.tag}
                    </span>
                    <div className="text-sm font-extrabold text-slate-800 mb-1.5">{topic.title}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{topic.question}</p>
                  </button>
                );
              })}
            </div>

            {/* 고1 연결 교과목 태그 선택 */}
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-2">
                📚 이 문제를 해결할 때 연결할 수 있는 고1 교과목을 골라보세요 (복수 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_LIST.map((subj) => {
                  const active = portfolio.linkedSubjects.includes(subj);
                  return (
                    <button
                      key={subj}
                      onClick={() => {
                        const next = active
                          ? portfolio.linkedSubjects.filter((s) => s !== subj)
                          : [...portfolio.linkedSubjects, subj];
                        updateField('linkedSubjects', next);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                        active
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
                      }`}
                    >
                      {active ? `✓ ${subj}` : `+ ${subj}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 해결책 입력 */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-extrabold text-slate-800">
                  💡 선택한 교과목 지식과 내 진로 역량을 합친 나만의 해결 아이디어는?
                </label>
                <button
                  onClick={() => {
                    const subjText =
                      portfolio.linkedSubjects.length > 0 ? portfolio.linkedSubjects.join(', ') : '통합사회와 정보';
                    const sample = `${subjText} 시간에 배운 올바른 가치 판단과 데이터 활용 원리를 바탕으로, 기술의 편리함만 쫓기보다 사람의 마음과 안전을 최우선으로 보호하는 가이드라인을 함께 설계하겠다.`;
                    updateField('dilemmaSolution', sample);
                  }}
                  className="text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl flex items-center gap-1"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  🪄 예시 문장 불러오기
                </button>
              </div>
              <textarea
                value={portfolio.dilemmaSolution}
                onChange={(e) => updateField('dilemmaSolution', e.target.value)}
                rows={4}
                placeholder="예: 통합사회 시간에 배운 인권과 공정성의 가치를 바탕으로, AI가 빠르게 분석한 결과라도 최종 결정에는 반드시 인간 전문가가 대상자의 감정과 상황을 상담하도록 이중 확인 절차를 만들 것이다."
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        )}

        {/* ============================================================
            4차시: 상상 프로젝트 (세상을 바꾸는 미니 액션 플랜)
        ============================================================ */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-extrabold mb-2">
                  STEP 4 · 우리 학교·일상을 바꾸는 미니 프로젝트
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                  💡 내 진로 재능으로 친구들이나 이웃을 돕는 작은 프로젝트를 기획해요!
                </h2>
              </div>
              <button
                onClick={() => {
                  const role = portfolio.selectedRole || '진로 탐험가';
                  updateField('projectTitle', `우리 반 마음 충전 & ${role} 체험 카드뉴스 캠페인`);
                  updateField('projectTarget', '학업과 진로 고민으로 지친 우리 학교 1학년 친구들');
                  updateField(
                    'projectActionPlan',
                    `1단계: 친구들이 가장 궁금해하거나 힘들어하는 주제를 설문으로 모은다.\n2단계: 나의 관심 분야인 '${role}'의 시선으로 도움이 되는 꿀팁과 따뜻한 응원 메시지를 4컷 카드뉴스로 제작한다.\n3단계: 학급 게시판과 온라인 공간에 공유하고 실천 후기를 나눈다.`
                  );
                }}
                className="text-xs font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl flex items-center gap-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                🪄 프로젝트 예시 자동 채우기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  📌 미니 프로젝트 이름 (멋진 제목 지어보기)
                </label>
                <input
                  type="text"
                  value={portfolio.projectTitle}
                  onChange={(e) => updateField('projectTitle', e.target.value)}
                  placeholder="예: 청소년 수면 건강 지킴이 캠페인 / 마음이 편해지는 디자인 가이드"
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  🎯 내가 도움을 주고 싶은 대상은 누구인가요?
                </label>
                <input
                  type="text"
                  value={portfolio.projectTarget}
                  onChange={(e) => updateField('projectTarget', e.target.value)}
                  placeholder="예: 우리 반 친구들, 진로가 막막한 고1 학생들, 동네 어르신 등"
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                🚀 구체적으로 어떻게 실행할지 1~3단계로 적어보세요 (캠페인, 카드뉴스, 앱 기획, 봉사 등 무엇이든 OK!)
              </label>
              <textarea
                value={portfolio.projectActionPlan}
                onChange={(e) => updateField('projectActionPlan', e.target.value)}
                rows={4}
                placeholder="1단계: 문제 원인 찾아보기&#13;&#10;2단계: 내 진로 역량을 활용해 해결 아이디어(포스터, 영상, 캠페인 등) 만들기&#13;&#10;3단계: 친구들과 공유하고 변화 확인하기"
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        )}

        {/* ============================================================
            5차시: 짝꿍 응원 & 레벨업 (동료 피드백 및 리비전)
        ============================================================ */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold mb-2">
                  STEP 5 · 짝꿍과 아이디어 교환 & 레벨업
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                  🤝 옆자리 친구에게 내 프로젝트를 소개하고 응원 댓글을 주고받아요!
                </h2>
              </div>
              <button
                onClick={() => {
                  updateField(
                    'peerPraise',
                    '우리 학교 친구들에게 꼭 필요한 주제라서 공감이 많이 가고, 카드뉴스로 핵심을 쉽게 알려준다는 점이 정말 참신하다는 칭찬을 받았다.'
                  );
                  updateField(
                    'myRevision',
                    '친구의 조언을 반영해 일방적으로 정보만 전달하는 대신, 친구들이 직접 참여할 수 있는 짧은 밸런스 투표 코너를 추가하여 프로젝트를 업그레이드했다.'
                  );
                }}
                className="text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl flex items-center gap-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                🪄 피드백 예시 채우기
              </button>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                👩‍❤️‍👩 오늘 나와 이야기를 나눈 친구(짝꿍) 이름
              </label>
              <input
                type="text"
                value={portfolio.peerName}
                onChange={(e) => updateField('peerName', e.target.value)}
                placeholder="함께 대화 나눈 친구 이름을 적어주세요"
                className="w-full md:w-72 rounded-2xl border border-slate-200 p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  💖 친구가 내 프로젝트에 해준 칭찬이나 새로운 아이디어 조언은?
                </label>
                <textarea
                  value={portfolio.peerPraise}
                  onChange={(e) => updateField('peerPraise', e.target.value)}
                  rows={4}
                  placeholder="친구가 칭찬해 준 점이나 '이런 것도 추가하면 좋겠다!'라고 조언해 준 내용을 적어보세요."
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  ✨ 친구의 의견을 듣고 내 기획안을 어떻게 더 멋지게 고쳤나요?
                </label>
                <textarea
                  value={portfolio.myRevision}
                  onChange={(e) => updateField('myRevision', e.target.value)}
                  rows={4}
                  placeholder="친구의 피드백을 반영해서 내가 보완하거나 한 단계 업그레이드한 내용을 적어보세요!"
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            6차시: 나의 드림 리포트 완성 & 파일 다운로드
        ============================================================ */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {/* 6차시 마무리 작성 영역 (인쇄 시 숨김) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-pink-100 space-y-6 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold mb-2">
                    STEP 6 · 최종 다짐 & 나의 드림 리포트 완성
                  </span>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                    🎓 마지막 한 조각을 채우고 나만의 진로 탐구 보고서를 완성해요!
                  </h2>
                </div>
                <button
                  onClick={() => {
                    updateField(
                      'grade2Subjects',
                      '내 진로 분야의 기초를 탄탄히 다질 수 있는 사회·과학·정보 관련 선택과목'
                    );
                    updateField(
                      'finalReflection',
                      `처음에는 내 진로가 막연하게만 느껴졌는데, 1~6차시 활동을 통해 나의 강점 페르소나를 발견하고 교과 지식과 연결해 실제 문제를 해결하는 프로젝트까지 기획해 보며 큰 자신감을 얻었다. 앞으로도 호기심을 잃지 않고 꾸준히 탐구해 나가고 싶다.`
                    );
                  }}
                  className="text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl flex items-center gap-1"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  🪄 소감문 예시 채우기
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    📘 2학년 때 더 깊이 공부해보고 싶은 관심 선택과목이나 분야는?
                  </label>
                  <input
                    type="text"
                    value={portfolio.grade2Subjects}
                    onChange={(e) => updateField('grade2Subjects', e.target.value)}
                    placeholder="예: 심리학, 생활과 윤리, 생명과학Ⅰ, 인공지능 기초, 데이터 과학 등"
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    🌟 1~6차시 진로 활동을 마치며 느낀 점과 나의 성장 다짐!
                  </label>
                  <textarea
                    value={portfolio.finalReflection}
                    onChange={(e) => updateField('finalReflection', e.target.value)}
                    rows={4}
                    placeholder="활동을 통해 새롭게 알게 된 나의 모습, 진로에 대한 생각의 변화, 앞으로의 다짐을 자유롭게 적어보세요!"
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* 보고서 다운로드 & 인쇄 액션 바 */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadWordReport}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs md:text-sm font-extrabold shadow-md hover:opacity-95 flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    보고서 파일(.doc) 다운로드
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-3 rounded-2xl bg-slate-800 text-white text-xs md:text-sm font-extrabold shadow-md hover:bg-slate-700 flex items-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    PDF 저장 / 인쇄하기
                  </button>
                </div>

                <button
                  onClick={() => setShowSummaryGenerator((prev) => !prev)}
                  className="px-4 py-2.5 rounded-2xl bg-pink-50 text-pink-700 hover:bg-pink-100 text-xs font-extrabold transition"
                >
                  {showSummaryGenerator ? '활동 종합 요약 닫기 ▲' : '📋 내 활동 한눈에 요약문 보기 ▼'}
                </button>
              </div>

              {/* 토글 시에만 열리는 1~6차시 종합 요약문 */}
              {showSummaryGenerator && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900">
                      ✨ 나의 1~6차시 진로 활동 한눈에 모아보기
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateComprehensiveSummary());
                        showToast('활동 요약문이 복사되었어요!');
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      전체 복사하기
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-indigo-100">
                    {generateComprehensiveSummary()}
                  </p>
                </div>
              )}
            </div>

            {/* ============================================================
                하단 실시간 완성 보고서 미리보기 (인쇄 시 이 영역이 출력됨)
            ============================================================ */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0">
              <div className="border-b-2 border-indigo-600 pb-4 mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold text-indigo-600 mb-1">
                    창의적 체험활동 · 진로 심화 탐구 포트폴리오
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {portfolio.avatar} 나의 진로 페르소나 심화 탐구 보고서
                  </h2>
                </div>
                <div className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
                  학번: <span className="text-slate-900">{portfolio.studentId || '미입력'}</span> &nbsp;|&nbsp; 이름:{' '}
                  <span className="text-slate-900">{portfolio.studentName || '미입력'}</span>
                </div>
              </div>

              <div className="space-y-5 text-sm">
                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    1. 나의 진로 페르소나 & 탐구 동기 (1차시)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <strong>• 진로 페르소나 유형:</strong>{' '}
                      {currentPersona ? `${currentPersona.badge} (${portfolio.mbtiType})` : '미진단'}
                    </div>
                    <div>
                      <strong>• 희망 진로·역할:</strong> {portfolio.selectedRole || '-'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 탐구 동기 및 추구 가치:</strong> {portfolio.customGoalReason || '-'}
                  </p>
                </section>

                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    2. 2036년 미래의 나 인터뷰 기록 (2차시)
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 핵심 업무와 필요 역량:</strong> {portfolio.interviewQ1 || '-'}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 고1 시기 추천 경험:</strong> {portfolio.interviewQ2 || '-'}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 미래의 응원 메시지:</strong> {portfolio.interviewQ3 || '-'}
                  </p>
                </section>

                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    3. 교과 연결 & 직무 딜레마 해결 탐구 (3차시)
                  </h3>
                  <p className="text-xs text-slate-700">
                    <strong>• 탐구 딜레마:</strong>{' '}
                    {(DILEMMA_TOPICS.find((d) => d.id === portfolio.selectedDilemmaId) || DILEMMA_TOPICS[0]).title}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong>• 연결 고1 교과목:</strong> {portfolio.linkedSubjects.join(', ') || '-'}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 나만의 해결 아이디어:</strong> {portfolio.dilemmaSolution || '-'}
                  </p>
                </section>

                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    4. 세상을 바꾸는 상상 미니 프로젝트 기획 (4차시)
                  </h3>
                  <p className="text-xs text-slate-700">
                    <strong>• 프로젝트명:</strong> {portfolio.projectTitle || '-'} (대상: {portfolio.projectTarget || '-'})
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    <strong>• 실행 계획:</strong> {portfolio.projectActionPlan || '-'}
                  </p>
                </section>

                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    5. 동료 응원 피드백 및 프로젝트 레벨업 (5차시)
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 친구({portfolio.peerName || '짝꿍'})의 피드백:</strong> {portfolio.peerPraise || '-'}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 피드백 반영 및 개선 내용:</strong> {portfolio.myRevision || '-'}
                  </p>
                </section>

                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    6. 향후 학업 계획 및 최종 성찰 (6차시)
                  </h3>
                  <p className="text-xs text-slate-700">
                    <strong>• 2학년 관심 선택과목:</strong> {portfolio.grade2Subjects || '-'}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>• 최종 느낀 점 및 성장 다짐:</strong> {portfolio.finalReflection || '-'}
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* 하단 이전/다음 차시 네비게이션 */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => {
              setCurrentStep((prev) => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition"
          >
            <ChevronLeft className="w-4 h-4" />
            이전 차시
          </button>

          <div className="text-xs font-bold text-slate-400">
            {currentStep} / 6 단계 진행 중
          </div>

          <button
            onClick={() => {
              saveToPrivateCloud(portfolio, true);
              setCurrentStep((prev) => Math.min(6, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentStep === 6}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-95 disabled:opacity-40 shadow-md transition"
          >
            다음 차시로 이동
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
