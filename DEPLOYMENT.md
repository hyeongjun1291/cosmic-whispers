# 🚀 Cosmic Whispers 배포 체크리스트

## ✅ 배포 전 준비 (15분)

### 1. 코드 최종 점검
- [ ] 로컬에서 빌드 성공 확인
  ```bash
  npm run build
  npm start
  ```
- [ ] 콘솔 에러 확인 및 수정
- [ ] 모바일/데스크탑 반응형 테스트
- [ ] 모든 캐릭터 대화 테스트

### 2. 환경 변수 준비
- [ ] Groq API 키 확인 (https://console.groq.com)
- [ ] Cloudflare Turnstile Site Key 확인
- [ ] Cloudflare Turnstile Secret Key 확인
- [ ] `.env.example` 파일 생성 완료

### 3. Git 저장소 설정
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] GitHub에 저장소 생성
- [ ] 코드 push 완료
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/cosmic-whispers.git
  git push -u origin main
  ```

---

## 🌐 Vercel 배포 (10분)

### Step 1: 프로젝트 Import
1. [ ] [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. [ ] "New Project" 클릭
3. [ ] GitHub 저장소 `cosmic-whispers` 선택
4. [ ] Framework Preset: **Next.js** 확인

### Step 2: 환경 변수 설정
Project Settings → Environment Variables:

```
GROQ_API_KEY = gsk_...
NEXT_PUBLIC_TURNSTILE_SITE_KEY = 0x4AA...
TURNSTILE_SECRET_KEY = 0x4AB...
```

**중요**: 모든 환경(Production, Preview, Development)에 체크!

### Step 3: 배포
- [ ] "Deploy" 버튼 클릭
- [ ] 빌드 로그 확인 (2-3분 소요)
- [ ] 배포 완료 확인

---

## 🧪 배포 후 테스트 (5분)

### 필수 테스트
- [ ] 타이틀 화면 로딩
- [ ] Turnstile CAPTCHA 표시 확인
- [ ] 온보딩 프로세스 완료
- [ ] 캐릭터 선택 및 대화 테스트
  - [ ] 청산 (사주 입력 → 대화)
  - [ ] 지온 (타로 선택 → 대화)
  - [ ] 풍류 (풍류도 입문 → 대화)
- [ ] Rate limiting 확인 (20회 제한)
- [ ] 모바일 반응형 확인
- [ ] Dashboard 열기/닫기 테스트

### 성능 체크
- [ ] Lighthouse 점수 확인
  - Performance: 90+ 목표
  - Accessibility: 90+ 목표
  - Best Practices: 90+ 목표
  - SEO: 90+ 목표

---

## 🔧 선택적 설정

### 커스텀 도메인 (선택)
1. [ ] 도메인 구매 (Namecheap, Cloudflare 등)
2. [ ] Vercel Project Settings → Domains
3. [ ] 도메인 추가 및 DNS 설정
4. [ ] SSL 자동 적용 확인

### Analytics (선택)
- [ ] Vercel Analytics 활성화
- [ ] Google Analytics 태그 추가 (선택)

### 모니터링 (선택)
- [ ] Vercel Monitoring 확인
- [ ] Error tracking (Sentry 등) 설정

---

## 📊 운영 관리

### 일일 체크
- [ ] API 사용량 모니터링
  - Groq API quota
  - Turnstile verifications
  - Vercel bandwidth

### 주간 체크
- [ ] 사용자 피드백 확인
- [ ] 에러 로그 검토
- [ ] 성능 지표 확인

### 업데이트 프로세스
```bash
# 1. 로컬에서 변경사항 개발
git checkout -b feature/new-feature

# 2. 테스트
npm run build
npm start

# 3. Push (자동으로 Preview 배포됨)
git push origin feature/new-feature

# 4. PR 생성 및 Preview 확인

# 5. 메인 브랜치에 머지 (자동으로 Production 배포)
git checkout main
git merge feature/new-feature
git push origin main
```

---

## 🆘 트러블슈팅

### 빌드 실패
1. 로컬에서 `npm run build` 테스트
2. Vercel 빌드 로그 확인
3. 의존성 버전 확인

### 환경 변수 오류
1. Vercel Dashboard에서 환경 변수 재확인
2. "Redeploy" 클릭

### API 키 오류
1. Groq API 키 유효성 확인
2. Turnstile 키 도메인 설정 확인

### Rate Limit 문제
1. `src/lib/rate-limit.ts`에서 제한 조정
2. IP 화이트리스트 추가 고려

---

## 📈 추천 다음 단계

### Phase 1: 안정화 (1주)
- [ ] 실사용자 피드백 수집
- [ ] 버그 수정 및 최적화
- [ ] Analytics 데이터 분석

### Phase 2: 기능 추가 (2-4주)
- [ ] 추가 캐릭터 개발
- [ ] 사주 해석 고도화
- [ ] 대화 히스토리 내보내기
- [ ] 소셜 공유 기능

### Phase 3: 스케일링 (1-3개월)
- [ ] DB 연동 (대화 저장)
- [ ] 사용자 계정 시스템
- [ ] 프리미엄 기능 (무제한 대화 등)
- [ ] 다국어 지원

---

## 🎉 배포 완료!

배포된 URL: `https://cosmic-whispers.vercel.app`

**축하합니다! 이제 전 세계 사용자들이 별의 속삭임을 경험할 수 있습니다.** 🌟
