# 모아 — 수행평가 통합 일정표 (웹)

React 기반 프런트엔드입니다. 서버 API와는 별도 저장소이며 Vite를 사용하지 않고 esbuild로 빌드합니다.

## Render Static Site 설정
- Repository: `jinn-0901/assessment-calendar-web`
- Build command: `npm install --include=dev && npm run build`
- Publish directory: `dist`
- Environment variable: `API_BASE_URL` = 배포한 백엔드의 HTTPS 주소 (예: `https://your-api.onrender.com`, 끝에 `/` 없이)

## 로컬 빌드
Node.js 20 이상에서 다음 명령어를 실행합니다.

```bash
npm install
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. 프런트엔드 파일을 바꾸면 다시 빌드해야 합니다.

## 기능
- 학교 / 학년 / 반별 수행평가 일정 조회
- 회원가입 및 로그인
- 일정 등록, 본인이 등록한 일정 수정 및 삭제
- 과목별 검색 및 필터링
- 학교, 학급, 과목 추가
- 모바일·태블릿 반응형 화면

API 서버는 별도 저장소 `assessment-calendar-server`에서 관리합니다.
