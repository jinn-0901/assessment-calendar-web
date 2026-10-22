# 모아 — 수행평가 통합 일정표

학교·학년·반별 수행평가 일정을 확인하고, 학생이 일정 등록 및 수정 신청을 제출하면 학교 관리자가 검토하는 웹 서비스입니다.

- **서비스:** https://jinn-0901.github.io/assessment-calendar-web/
- **프런트엔드 저장소:** https://github.com/jinn-0901/assessment-calendar-web
- **백엔드 저장소:** https://github.com/jinn-0901/assessment-calendar-server
- **백엔드 API:** https://assessment-calendar-server.onrender.com

## 주요 기능

- 학교와 학년·반별 수행평가 일정 조회
- 달력에서 일정 확인 및 여러 날짜에 걸친 일정 표시
- 과목별 검색 및 필터링
- 로그인 없이 수행평가 등록·수정 신청 제출
- 학교 관리자 로그인 및 신청 승인·반려
- 학교·학급·과목 등록
- NEIS 학교 검색 연동
- 모바일·태블릿 반응형 화면과 다크 모드

학생이 제출한 등록·수정 신청은 승인 전까지 공개 일정에 반영되지 않습니다. 관리자가 직접 등록한 일정은 즉시 공개됩니다.

## 기술 스택

- React 18
- Create React App (`react-scripts`)
- CSS
- 백엔드: Node.js + Express
- 데이터베이스: PostgreSQL

## 로컬 실행

Node.js 18 이상이 필요합니다.

```bash
npm install
npm start
```

개발 서버는 보통 http://localhost:3000 에서 열립니다. 실제 학교·학급·일정 데이터를 사용하려면 백엔드 API와 데이터베이스가 정상적으로 설정되어 있어야 합니다.

## 환경 변수

프런트엔드 빌드 환경 변수 `REACT_APP_API_BASE_URL`에 백엔드 API의 기본 주소를 설정합니다.

예시:

```text
REACT_APP_API_BASE_URL=https://assessment-calendar-server.onrender.com
```

주소 끝에 슬래시를 붙이지 마세요. 환경 변수 변경 후에는 프런트엔드를 다시 빌드하고 배포해야 합니다. 관리자 인증은 브라우저 세션/토큰 처리와 API 설정에 의존하므로, 배포 후 로그인 및 신청 승인 흐름을 실제 브라우저에서 확인하세요.

## 빌드

```bash
npm run build
```

배포된 사이트는 GitHub Pages를 사용합니다. 배포 설정은 이 저장소의 GitHub Pages 및 Actions 설정을 기준으로 합니다.

## 백엔드

API 구현, 필수 서버 환경 변수, 데이터베이스 준비, 관리자 최초 설정 및 자동 일정 정리 안내는 [백엔드 README](https://github.com/jinn-0901/assessment-calendar-server#readme)를 참고하세요.
