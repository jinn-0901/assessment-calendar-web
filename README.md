# 모아 — 수행평가 통합 일정표 (웹)

React 기반 프런트엔드입니다. API 서버는 별도 저장소 `jinn-0901/assessment-calendar-server`에서 관리합니다. Vite 대신 esbuild를 사용합니다.

## 파일 구성

```text
client/
├── index.html
└── src/
    ├── main.jsx                 # React 진입점
    ├── App.jsx                  # 화면 상태와 페이지 조립
    ├── styles.css               # 전역·반응형 스타일
    ├── components/
    │   ├── common/
    │   │   ├── Modal.jsx        # 공통 모달
    │   │   ├── Field.jsx        # 공통 폼 필드
    │   │   └── EmptyState.jsx   # 빈 목록 안내
    │   ├── assessments/
    │   │   └── AssessmentModal.jsx # 일정 등록·수정
    │   └── setup/
    │       └── SetupModal.jsx   # 학교·학급·과목 설정
    └── lib/
        ├── api.js               # API 요청, 오류 처리, 세션 쿠키
        └── date.js              # 날짜 표시·계산 유틸리티
scripts/
└── build.js                     # esbuild 번들 및 dist 생성
```

공통 UI는 `components/common`, 재사용 로직은 `lib`에 둡니다. 화면 기능이 늘어나면 일정·관리자 기능도 기능별 폴더로 분리하는 방식으로 확장합니다.

## 빌드 설정

- Node.js: 20 이상
- Build command: `npm install --include=dev && npm run build`
- Output directory: `dist`
- Environment variable: `API_BASE_URL` = 배포한 백엔드의 HTTPS 주소 (끝에 `/` 없이)

## 로컬 빌드

```bash
npm install
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## 기능

- 학교 / 학년 / 반별 수행평가 일정 조회
- 로그인 없는 일정 등록·수정 신청
- 학교 관리자 승인·반려
- 과목별 검색 및 필터링
- 학교·학급·과목 등록
- 모바일·태블릿 반응형 화면

일정 신청은 승인 전까지 공개 일정에 표시되지 않습니다. 삭제 신청 기능은 아직 구현되지 않았습니다.
