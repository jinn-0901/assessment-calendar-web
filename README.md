# 수행평가 통합 일정표

여러 학교의 학년·반·과목별 수행평가 일정을 조회하고 관리하는 웹 앱입니다.

## 기술 스택
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Hosting: Render

## 주요 기능
- 학교 / 학년 / 반 선택
- 과목별 수행평가 일정 조회
- 계정 생성 및 로그인
- 로그인한 사용자의 일정 등록·수정·삭제
- 다른 학생들이 같은 일정을 조회하는 공유 구조

## 필요한 환경 변수
- DATABASE_URL: PostgreSQL 연결 문자열
- SESSION_SECRET: 길고 무작위인 세션 비밀값
- NODE_ENV: 배포 시 production

비밀값은 GitHub에 저장하지 마세요. Render의 Environment 설정에서 입력합니다.

## Render 설정
- Runtime: Node
- Build command: npm install
- Start command: npm start

먼저 Render PostgreSQL을 만든 다음 schema.sql을 실행하세요. 웹 서비스와 DB는 같은 리전에 두고, DATABASE_URL에는 가능하면 내부 연결 문자열을 사용하세요.
