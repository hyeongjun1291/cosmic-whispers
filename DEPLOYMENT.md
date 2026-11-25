# 배포 설정

로컬 실행 절차는 [README](README.md)에 있습니다. 배포 전 Node.js 20.9 이상에서 `npm ci`, `npm run lint`, `npm test`, `npm run build`를 실행합니다.

## 환경 변수

운영과 공개 프리뷰에 사용할 값입니다. 비밀 키와 토큰은 서버 환경 변수에만 보관합니다.

| 이름 | 용도 |
| --- | --- |
| `GROQ_API_KEY` | Groq 서버 API 키 |
| `GROQ_MODEL` | JSON Object Mode를 지원하는 모델 ID. 기본값은 `openai/gpt-oss-120b` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 배포 도메인을 허용한 실제 Cloudflare 위젯의 공개 키 |
| `TURNSTILE_SECRET_KEY` | 위젯의 서버 검증용 비밀 키 |
| `UPSTASH_REDIS_REST_URL` | 일일 요청 한도를 공유하는 Upstash Redis의 REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis의 서버 인증 토큰 |

운영 모드에서 필수 설정이 없거나, CAPTCHA 또는 요청 한도를 확인하는 외부 서비스가 응답하지 않으면 채팅 API는 `503`을 반환합니다. Cloudflare 테스트 키는 로컬 개발에서만 사용합니다. Vercel이 보장하는 IP 헤더를 사용할 수 없는 환경에서는 모든 요청이 공용 한도를 공유합니다.

Google OAuth가 필요한 환경에서는 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, 최소 32자 이상의 무작위 `NEXTAUTH_SECRET`, `NEXTAUTH_URL`을 설정합니다. 자격 증명이 없으면 인증 경로는 `503`을 반환합니다. 채팅 화면의 온보딩은 표시 이름을 쓰며 Google 로그인을 요구하지 않습니다.

## 배포 후 확인

- 실제 Turnstile 위젯으로 같은 세션에서 연속 두 턴이 완료되는지 확인합니다.
- 청산의 사주 입력과 시온의 첫 타로 해석을 확인합니다.
- 사용량 한도를 넘기면 `429`와 재시도 시간이 오는지 확인합니다.
- 설정에서 데이터를 초기화한 뒤 브라우저에 이전 대화나 기억이 남지 않는지 확인합니다.

[Turnstile 서버 검증](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) · [Upstash Redis 설정](https://upstash.com/docs/redis/quickstarts/nextjs-app-router) · [Groq 모델 목록](https://console.groq.com/docs/models)
