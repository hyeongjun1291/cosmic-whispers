# 별의 속삭임 (Cosmic Whispers)

사주와 타로를 소재로 한 한국어 캐릭터 대화 게임입니다. 청산, 풍류, 흑영, 시온의 페르소나와 관계 단계가 다음 대화에 반영됩니다.

## 로컬 실행

Node.js 20.9 이상과 npm이 필요합니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local`에 `GROQ_API_KEY`를 넣으면 [localhost:3000](http://localhost:3000)에서 대화를 사용할 수 있습니다. `GROQ_MODEL`의 기본값은 `openai/gpt-oss-120b`입니다. 로컬 개발 서버에서 CAPTCHA를 확인하려면 Turnstile 사이트 키와 비밀 키를 함께 설정하세요. 운영 빌드에서 채팅을 사용하려면 실제 Turnstile 키와 Upstash Redis도 필요합니다. [배포 설정](DEPLOYMENT.md)

```sh
npm run lint
npm test
npm run build
```

## 대화 흐름

1. 브라우저가 현재 캐릭터와 관계 점수, 최근 메시지 최대 15개, 사주·타로 맥락을 채팅 API에 보냅니다.
2. API는 요청 크기와 입력 타입을 확인하고, CAPTCHA와 일일 한도를 통과한 요청을 Groq에 보냅니다. 응답 파서는 대사, 감정 태그, 호감도 변화량을 검증합니다.
3. 브라우저는 캐릭터별 점수를 0–100 범위로 갱신합니다. 변화량의 절댓값이 2 이상인 턴을 최대 20개 저장하고, 다음 요청에 최대 3개를 포함합니다.

[채팅 API](src/app/api/chat/route.ts) · [페르소나](src/lib/characters.ts) · [Groq 호출](src/lib/groq.ts) · [응답 파서](src/lib/model-reply.ts) · [기억](src/lib/memory.ts)

## 데이터와 요청 한도

대화 기록, 표시 이름, 호감도와 대화 기억은 브라우저 저장소에 남습니다. 대화에 필요한 표시 이름, 메시지, 맥락은 Groq로 전송됩니다. 설정의 데이터 초기화는 이 브라우저의 기록과 기억을 지웁니다.

기본 한도는 UTC 기준 하루 20회입니다. Vercel에서는 플랫폼이 제공하는 IP를 기준으로 집계하고, 그 외 환경에서는 하나의 공용 한도를 적용합니다. 운영 카운터는 Upstash Redis를 사용합니다.

기술 스택은 TypeScript, Next.js 16 App Router, React 19, Mantine 8, Framer Motion입니다.
