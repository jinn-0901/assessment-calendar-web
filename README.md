# 모아 — 수행평가 통합 일정표

React 기반 프런트엔드입니다. 화면 진입은 `public/index.html`, React 실행은 `src/index.js`에서 시작합니다. API 서버는 별도 저장소 `jinn-0901/assessment-calendar-server`에서 관리합니다.

## 파일 구조

```text
public/
└── index.html
src/
├── index.js
├── App.js
├── styles.css
├── components/
│   ├── common/
│   │   ├── Modal.jsx
│   │   ├── Field.jsx
│   │   └── EmptyState.jsx
│   ├── assessments/
│   │   └── AssessmentModal.jsx
│   └── setup/
│       └── SetupModal.jsx
└── lib/
    ├── api.js
    └── date.js
```

## 로컬 실행

Node.js 18 이상에서 `npm install` 후 `npm start`를 실행합니다. 개발 서버는 보통 `http://localhost:3000`에서 열립니다.

## Netlify 설정

- Build command: `npm run build`
- Publish directory: `build`
- Environment variable: `REACT_APP_API_BASE_URL` = 백엔드 HTTPS 주소 (끝에 `/` 없이)

`npm start`는 로컬 개발용이고 Netlify는 정적 파일을 만들기 위해 `npm run build`를 실행합니다. 백엔드가 아직 연결되지 않은 경우 화면은 열리지만 학교·학급·일정 데이터를 불러오려면 API 서버가 필요합니다.

## 기능

- 학교 / 학년 / 반별 수행평가 일정 조회
- 로그인 없는 일정 등록·수정 신청
- 학교 관리자 승인·반려
- 과목별 검색 및 필터링
- 학교·학급·과목 등록
- 모바일·태블릿 반응형 화면

일정 신청은 승인 전까지 공개 일정에 표시되지 않습니다. 삭제 신청 기능은 아직 구현되지 않았습니다.
