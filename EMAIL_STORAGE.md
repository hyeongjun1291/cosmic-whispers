# 📧 이메일 구독 저장 가이드

## ✅ 현재 상태 (완료!)

이메일이 이제 **Vercel Logs에 구조화된 형태로 저장**됩니다:

```json
{
  "[Email Subscription]": {
    "email": "user@example.com",
    "timestamp": "2026-01-13T20:41:53.000Z",
    "ip": "123.456.789.0",
    "source": "cosmic-whispers"
  }
}
```

**확인 방법:**
1. Vercel Dashboard → Your Project
2. Deployments → Functions → View Logs
3. 검색: `[Email Subscription]`

---

## 📊 Google Sheets 연동 (선택, 5분)

### **Step 1: Google Sheets 생성**

1. [Google Sheets](https://sheets.google.com) 접속
2. 새 스프레드시트 생성: "Cosmic Whispers - Email List"
3. 첫 행에 헤더 추가:
   ```
   A1: Email
   B1: Timestamp
   C1: IP Address
   D1: Source
   ```

---

### **Step 2: Apps Script Webhook 생성**

1. **확장 프로그램** → **Apps Script** 클릭
2. 기본 코드 삭제하고 아래 코드 붙여넣기:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Add row: [email, timestamp, ip, source]
    sheet.appendRow([
      data.email,
      data.timestamp,
      data.ip || 'unknown',
      data.source || 'cosmic-whispers'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **배포** 클릭 → **새 배포**
4. 설정:
   - 유형: **웹 앱**
   - 다음 사용자로 실행: **나**
   - 액세스 권한: **모든 사용자**
5. **배포** 클릭
6. **웹 앱 URL 복사** (예: `https://script.google.com/macros/s/AKf...`)

---

### **Step 3: Vercel 환경 변수 추가**

Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_WEBHOOK_URL
```

**모든 환경에 추가** (Production, Preview, Development)

---

### **Step 4: Redeploy**

환경 변수 추가 후 Vercel에서:
1. Deployments 탭
2. 최신 배포 옆 ⋯ 클릭
3. **Redeploy** 클릭

또는 GitHub에 새로 push:
```bash
git add .
git commit -m "Add Google Sheets webhook integration"
git push
```

---

## 🧪 테스트

1. 배포된 사이트 접속
2. 이메일 입력 후 제출
3. **Vercel Logs 확인** (즉시)
4. **Google Sheets 확인** (2-3초 후)

---

## 📊 대안: 직접 DB 사용

### **옵션 1: Vercel KV (Redis) - 간단함**

```bash
npm install @vercel/kv
```

`src/app/api/subscribe/route.ts`:
```typescript
import { kv } from '@vercel/kv';

// Save to Redis
await kv.sadd('email:subscribers', email);
await kv.hset(`email:${email}`, {
  timestamp: new Date().toISOString(),
  ip: req.headers.get("x-forwarded-for")?.split(',')[0]
});
```

**가격:**
- 무료: 256MB storage, 30개 요청/일
- Pro: $1/월 (3,000 요청/일)

---

### **옵션 2: Supabase (PostgreSQL) - 강력함**

```bash
npm install @supabase/supabase-js
```

1. [Supabase](https://supabase.com) 가입
2. 프로젝트 생성
3. SQL Editor에서 테이블 생성:

```sql
CREATE TABLE email_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'cosmic-whispers'
);
```

4. API 사용:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

await supabase.from('email_subscribers').insert({
  email,
  ip_address: req.headers.get("x-forwarded-for")?.split(',')[0],
  source: 'cosmic-whispers'
});
```

**가격:**
- 무료: 500MB DB, 2GB bandwidth/월
- Pro: $25/월

---

## 🎯 추천 순서

### **즉시 사용 가능 (지금)**
✅ **Vercel Logs** - 이미 작동 중!
- 검색: `[Email Subscription]`
- 30일 보관
- 무료

### **Phase 1: 간편한 저장 (5분)**
🟡 **Google Sheets** - 위 가이드 따라하기
- 무료
- 스프레드시트로 쉽게 관리
- Webhook 1회 설정

### **Phase 2: 본격 운영 (나중에)**
🔵 **Supabase** 또는 **Vercel KV**
- DB 기능 필요할 때
- 대량 구독자 처리
- 중복 제거 자동화

---

## 🔍 현재 로그 예시

**Vercel Logs에서 보이는 내용:**
```
2026-01-13 20:42:15 KST
[Email Subscription] {
  email: "user@example.com",
  timestamp: "2026-01-13T11:42:15.123Z",
  ip: "123.456.789.0"
}
```

**이 정보로 충분히:**
- 구독자 이메일 수집
- 시간대별 통계
- IP 기반 중복 확인 가능

---

## ✅ 완료 체크리스트

- [x] `/api/subscribe` API 생성
- [x] EmailCollectionModal 연동
- [x] CharacterSelection 연동
- [x] Vercel Logs 구조화 저장
- [ ] Google Sheets 연동 (선택)
- [ ] DB 연동 (나중에)

---

**지금 상태로도 모든 이메일이 Vercel Logs에 영구 기록됩니다!** 🎉
