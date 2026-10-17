# 모아 — 수행평가 통합 일정표

여러 학교의 학년·반·과목별 수행평가 일정을 조회하고 공유하는 반응형 웹 앱입니다. iPad에서도 사용할 수 있도록 설계합니다.

## 기술 스택
- Frontend: React, Vite, JavaScript, CSS
- Backend: Node.js, Express
- Database: PostgreSQL (직접 설계: `schema.sql`)
- Hosting: Render

## 현재 구현한 기능
- 학교 / 학년 / 반별 일정 조회
- 계정 생성 및 로그인
- 로그인한 학생의 일정 등록
- 본인이 등록한 일정 수정 및 삭제
- 과목별 검색 및 필터링
- 학교, 학급, 과목 추가
- 모바일과 태블릿 화면에 대응하는 레이아웃

## 로컬 개발
Node.js 20 이상이 필요합니다.

```bash
npm install
npm run build
npm start
```

프런트엔드 개발 서버를 사용할 때는 한 터미널에서 `npm start`, 다른 터미널에서 `npm run dev`를 실행합니다. Vite는 `/api` 요청을 로컬 Express 서버로 전달합니다.

## Render 배포
- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`

Render PostgreSQL을 만든 뒤 SQL 실행 도구에서 `schema.sql`을 실행하세요. 웹 서비스와 DB는 같은 리전에 배치하고 가능하면 내부 데이터베이스 URL을 사용하세요.

### 환경 변수
- `DATABASE_URL`: Render PostgreSQL 연결 문자열
- `SESSION_SECRET`: 길고 무작위인 세션 비밀값
- `NODE_ENV`: `production`

비밀값을 저장소에 커밋하지 마세요. Render 서비스의 Environment 설정에서 입력합니다.

## 참고
현재 일정은 작성자가 수정·삭제할 수 있습니다. 여러 학생이 공유하는 학교 일정의 정확성과 중복 등록을 개선하려면 이후 신고 기능, 수정 이력, 일정 검증 절차를 추가하는 것이 좋습니다.
