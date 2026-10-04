# ساختار پروژه JobPilot Agent

```
JobPilot-Agent/
├── docs/                          # مستندات مسابقه
│   ├── 01_MVP_SPECIFICATION.md
│   ├── 02_AGENT_ARCHITECTURE.md
│   ├── 03_ROADMAP_AND_TEST_PLAN.md
│   ├── 04_PROJECT_STRUCTURE.md
│   ├── 05_TECHNICAL_DOCS.md       # بعداً کامل می‌شود
│   ├── 06_BUSINESS_PLAN.md        # بعداً کامل می‌شود
│   └── 07_PITCH.md                # بعداً کامل می‌شود
│
├── src/                           # سورس کد اصلی
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx           # داشبورد اصلی
│   │   │   ├── chat/
│   │   │   ├── profile/
│   │   │   └── results/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── agent/
│   │   │   └── jobs/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn
│   │   ├── chat/
│   │   ├── resume/
│   │   └── jobs/
│   │
│   ├── lib/
│   │   ├── agent/                 # هسته LangGraph
│   │   │   ├── graph.ts
│   │   │   ├── state.ts
│   │   │   ├── nodes/
│   │   │   └── tools/
│   │   ├── db/
│   │   ├── auth.ts
│   │   └── utils.ts
│   │
│   └── types/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── data/                          # آگهی‌های نمونه برای MVP
│   └── sample_jobs.json
│
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## قوانین کدنویسی این پروژه
- TypeScript strict
- همه stateهای ایجنت با Pydantic/Zod اعتبارسنجی شوند
- هر Node ایجنت قابل تست واحد باشد
- لاگ هزینه LLM در هر مرحله ذخیره شود
- هیچ secretی در کد commit نشود

---
آماده برای شروع پیاده‌سازی روز ۱
