# test-storage-access-api

Storage Access API 진단 & iframe 내 카카오 OAuth 로그인 연동 테스트용 앱.

**빠른 시작**
```bash
pnpm install
pnpm dev
```

**환경 변수**
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN` (선택)
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REDIRECT_URI` (`/api/auth/kakao/callback`)

**DB**
```bash
pnpm db:push
```
