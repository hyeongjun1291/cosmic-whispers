# 📊 Analytics & Logging 설정 가이드

## 🔍 현재 상태

### ✅ 이미 로깅되는 것
- **서버 로그**: 모든 `console.log`가 Vercel Logs에 기록됨
- **IP 기반 Rate Limiting**: 일일 20회 제한 (메모리 저장)
- **API 요청**: `/api/chat` 호출 기록
- **Turnstile 검증**: CAPTCHA 통과/실패 로그

### ❌ 현재 추적 안되는 것
- 페이지 방문자 수
- 사용자 세션
- 캐릭터별 대화 통계
- 지역/디바이스 정보

---

## 📈 Analytics 추가하기

### **1. Vercel Analytics (권장, 무료)**

#### 설치
```bash
npm install @vercel/analytics
```

#### 코드 추가
`src/app/layout.tsx` 수정:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics /> {/* 👈 이 줄 추가 */}
      </body>
    </html>
  );
}
```

#### 확인
배포 후 Vercel Dashboard → Your Project → Analytics

**무료로 제공:**
- ✅ 페이지뷰 수
- ✅ Top 페이지
- ✅ 기본 트래픽 통계

---

### **2. Google Analytics (선택, 무료)**

#### GA4 설정 ID 받기
1. [Google Analytics](https://analytics.google.com) 접속
2. 속성 생성
3. 측정 ID 복사 (예: `G-XXXXXXXXXX`)

#### next.config.ts 수정
```typescript
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || '',
  }
};
```

#### .env.local 추가
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### 스크립트 추가
`src/app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html>
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📊 커스텀 이벤트 추적

### 사용자 행동 추적하기

#### 1. 캐릭터 선택 추적
`src/components/CharacterSelection.tsx`:

```typescript
const handleSelect = (charId: string) => {
  // 기존 코드
  onSelect(charId);
  
  // Analytics 이벤트
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'character_select', {
      character_id: charId,
      character_name: CHARACTERS[charId].name
    });
  }
};
```

#### 2. 메시지 전송 추적
`src/app/page.tsx`:

```typescript
const handleSendMessage = async (text: string) => {
  // Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'message_sent', {
      character_id: characterId,
      message_length: text.length
    });
  }
  
  // 기존 코드...
};
```

---

## 🔢 서버 사이드 로깅 강화

### API 사용 통계 추적

`src/app/api/chat/route.ts`에 추가:

```typescript
export async function POST(req: NextRequest) {
  const { characterId } = await req.json();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  // 통계 로그
  console.log('[Stats]', {
    timestamp: new Date().toISOString(),
    ip: ip.split(',')[0],
    character: characterId,
    endpoint: '/api/chat'
  });
  
  // 기존 로직...
}
```

---

## 📋 Vercel에서 로그 확인하기

### 1. 실시간 로그
```
Vercel Dashboard 
→ Your Project 
→ Deployments 
→ Functions (탭)
→ View Logs
```

**필터링:**
- 시간대별
- 함수별 (`/api/chat`)
- 에러만 보기

### 2. 로그 검색
```
[Stats]        # 통계 로그만
[Turnstile]    # CAPTCHA 관련
[Groq]         # AI 요청
[Affection]    # 호감도 변화
```

---

## 💾 영구 데이터 저장 (미래 확장)

현재는 **메모리** + **localStorage**만 사용 중입니다.  
영구 저장이 필요하면:

### 옵션 1: Vercel KV (Redis)
```bash
npm install @vercel/kv
```

### 옵션 2: Supabase (PostgreSQL)
```bash
npm install @supabase/supabase-js
```

### 옵션 3: MongoDB Atlas
```bash
npm install mongodb
```

---

## 🎯 추천 설정 (단계별)

### Phase 1: 최소 설정 (5분)
- [x] Vercel Analytics 활성화
- [x] 현재 로그 확인

### Phase 2: 기본 분석 (30분)
- [ ] Google Analytics 추가
- [ ] 캐릭터 선택 이벤트 추적
- [ ] 메시지 전송 이벤트 추적

### Phase 3: 고급 분석 (추후)
- [ ] Database 연동
- [ ] 사용자별 통계
- [ ] 대시보드 구축

---

## 📊 확인 가능한 지표

### Vercel Logs (무료, 지금 바로)
```javascript
// 이미 로깅 중인 정보
{
  "[Groq]": "캐릭터별 대화 요청 수",
  "[Turnstile]": "봇 차단 성공률",
  "[Affection]": "호감도 변화 패턴",
  "[Email Collection]": "이메일 구독자 수"
}
```

### Vercel Analytics (설치 후)
```
- 일일 방문자 수
- 페이지뷰
- Top 페이지
```

### Google Analytics (설치 후)
```
- 실시간 사용자
- 지역별 통계
- 디바이스/브라우저
- 사용자 흐름
- 전환율
```

---

## 🔐 개인정보 보호

현재 코드는 **개인정보를 수집하지 않습니다**:
- ✅ IP는 Rate limiting용으로만 사용 (메모리, 재시작 시 삭제)
- ✅ 사용자 데이터는 브라우저 localStorage에만 저장
- ✅ 서버에 사용자 정보 저장 안함

Analytics 추가 시:
- **익명 추적만 사용** (GA4 기본값)
- **개인식별정보 수집 금지**
- 필요시 개인정보처리방침 추가

---

**현재 상태로도 Vercel Logs에서 충분한 정보를 확인할 수 있습니다!** 🎉

