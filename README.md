# 🌟 별의 속삭임 (Cosmic Whispers)

운명을 읽는 AI 사주·타로 비주얼 노벨

## ✨ 주요 기능

- 🔮 **3인의 운명 해석가**
  - 청산: 사주명리 전문가
  - 지온: 타로 해석가
  - 풍류: 풍류도 철학자

- 💬 **실시간 AI 대화**
  - Groq API 기반 자연스러운 대화
  - 감정 표현과 호감도 시스템
  - 장기 기억 시스템

- 🎨 **몰입형 비주얼 노벨**
  - 캐릭터별 감정 표현 이미지
  - 반응형 디자인 (PC/모바일)
  - 동양 미학 UI/UX

- 🛡️ **보안 & 제한**
  - Cloudflare Turnstile CAPTCHA
  - Rate limiting (20회/일)
  - 서버사이드 API 키 보호

## 🚀 빠른 시작

### 필수 조건

- Node.js 18.0 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/cosmic-whispers.git
cd cosmic-whispers

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수 설정

`.env.local` 파일에 다음 값을 설정하세요:

```bash
# Groq API Key (https://console.groq.com)
GROQ_API_KEY=gsk_your_api_key_here

# Cloudflare Turnstile (https://dash.cloudflare.com/turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AA_your_site_key
TURNSTILE_SECRET_KEY=0x4AB_your_secret_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📦 빌드 & 배포

### 로컬 빌드

```bash
npm run build
npm start
```

### Vercel 배포

#### 1. Vercel CLI 설치 (선택)

```bash
npm i -g vercel
vercel login
```

#### 2. 배포

```bash
vercel
```

#### 3. 환경 변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 설정:

- `GROQ_API_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

모든 환경(Production, Preview, Development)에 적용하세요.

#### 4. 자동 배포 (권장)

GitHub 저장소와 연동하면 push 시 자동 배포됩니다.

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **New Project** → GitHub 저장소 연결
3. 환경 변수 설정
4. **Deploy** 클릭

## 🏗️ 프로젝트 구조

```
cosmic-whispers/
├── public/
│   └── images/
│       ├── characters/     # 캐릭터 이미지
│       └── ui/            # UI 아이콘
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/      # Chat API 엔드포인트
│   │   ├── globals.css    # 전역 스타일
│   │   ├── layout.tsx
│   │   └── page.tsx       # 메인 페이지
│   ├── components/        # React 컴포넌트
│   │   ├── VisualNovel.tsx
│   │   ├── CharacterSelection.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── characters.ts  # 캐릭터 데이터
│   │   ├── groq.ts        # Groq API 클라이언트
│   │   ├── saju.ts        # 사주 계산 로직
│   │   ├── rate-limit.ts  # Rate limiting
│   │   └── turnstile.ts   # Turnstile 검증
│   └── types/
└── package.json
```

## 🔧 기술 스택

- **Framework**: Next.js 15 (App Router)
- **UI Library**: Mantine 7
- **Animation**: Framer Motion
- **AI**: Groq API (Llama 3.3 70B)
- **Security**: Cloudflare Turnstile
- **Styling**: CSS Modules + Mantine
- **Language**: TypeScript

## 📊 API 사용량

- **Rate Limit**: 20회/일 (IP 기반)
- **Groq Free Tier**: 14,400 requests/day
- **Cloudflare Turnstile**: 1M verifications/month (무료)

## 🛠️ 개발 가이드

### 새 캐릭터 추가

1. `src/lib/characters.ts`에 캐릭터 정의
2. `public/images/characters/` 에 이미지 추가
3. `public/images/ui/`에 네비게이션 아이콘 추가
4. Groq prompt에 캐릭터 페르소나 추가

### 감정 표현 추가

각 캐릭터별로 `{imageNumber}_{emotion}.jpg` 형식:
- `default`: 기본 표정
- `joy`: 기쁨
- `sadness`: 슬픔
- `frust`: 좌절
- `magic`: 마법/타로 해석 중

## 🐛 알려진 이슈

- [ ] 브라우저 뒤로가기 시 상태 유지 개선 필요
- [ ] 이미지 로딩 최적화 (Next.js Image 적용 고려)

## 📝 라이선스

MIT License

## 🤝 기여

이슈 제보 및 풀 리퀘스트 환영합니다!

## 📧 연락처

문의사항이 있으시면 이메일로 연락주세요.

---

**Made with 💜 by the Cosmic Whispers Team**
