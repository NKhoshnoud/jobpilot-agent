# مستندات فنی و زیرساخت — JobPilot Agent

**مسابقه buildX | مسئله ۲: همراه کاریابی برای یک مسیر شغلی**

---

## ۱. خلاصه محصول
JobPilot یک همراه ایجنتیک کاریابی برای مسیر Junior Frontend است.  
کاربر ثبت‌نام می‌کند، پروفایل/رزومه می‌سازد، با ایجنت گفتگو می‌کند، آگهی‌های مناسب با توضیح تناسب دریافت می‌کند، بازخورد می‌دهد، رزومه را بهبود می‌دهد، مسیر درخواست آماده (کاور لتر + چک‌لیست) می‌گیرد و در صورت نیاز تمرین مصاحبه انجام می‌دهد.

قلب محصول **ایجنت تصمیم‌گیر** است (نه یک قابلیت فرعی).

---

## ۲. معماری کلی

```
Browser (Next.js UI)
    │
    ▼
Next.js App Router
  ├── Auth (NextAuth Credentials)
  ├── Profile API
  └── Agent Chat API
         │
         ▼
    Agent Core (State Machine)
      ├── Matcher (امتیاز تناسب + توضیح)
      ├── Resume Builder (۴ مرحله)
      ├── Application Package (کاور لتر)
      └── Interview Practice
         │
         ▼
    PostgreSQL-compatible via SQLite (Prisma)
```

### جریان ایجنت
1. `gathering_info` — آشنایی و استخراج اطلاعات  
2. `matching` — پیشنهاد آگهی با امتیاز و دلیل  
3. `refining` — اعمال بازخورد کاربر  
4. `resume_build` — ساخت رزومه سوال‌به‌سوال  
5. `application` — بسته درخواست برای یک آگهی  
6. `interview` — تمرین مصاحبه + ارزیابی  
7. `final` — جمع‌بندی و شانس استخدام  

---

## ۳. مدل‌ها و ابزارها

| بخش | تکنولوژی |
|-----|----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth | NextAuth.js (Credentials + JWT) |
| Database | Prisma + SQLite (قابل تعویض با PostgreSQL/Neon) |
| Agent Core | State machine سفارشی (منطق تصمیم‌گیری در `src/lib/agent/`) |
| Validation | Zod |
| Password | bcryptjs |
| Deploy پیشنهادی | Vercel + (اختیاری) Neon PostgreSQL |

> طبق قوانین مسابقه از سایت‌ساز، n8n و ایجنت‌ساز آماده استفاده نشده است.  
> LLM محلی استفاده نشده است. هسته فعلی rule-based + explainable matching است و آماده اتصال به Provider (OpenAI/Anthropic) برای تولید متن پیشرفته‌تر است.

---

## ۴. مدل داده (Prisma)

- **User**: id, name, email, passwordHash  
- **Profile**: skills (JSON), level, preferences (JSON), resumeData (JSON)  

---

## ۵. منابع داده
- آگهی‌های نمونه Junior Frontend در `data/sample_jobs.json` (۱۰ آگهی با مهارت، حقوق، نوع، لوکیشن)  
- پروفایل واقعی کاربر از دیتابیس  

---

## ۶. راه‌اندازی محلی

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

فایل `.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## ۷. دیپلوی روی سرور (پیشنهادی: Vercel)

1. ریپو را به GitHub پوش کنید  
2. در Vercel پروژه را Import کنید  
3. متغیرهای محیطی را تنظیم کنید  
4. برای production بهتر است `DATABASE_URL` را به Neon/Supabase PostgreSQL تغییر دهید و provider را در `schema.prisma` به `postgresql` عوض کنید  
5. `NEXTAUTH_URL` را برابر دامنه نهایی قرار دهید  

---

## ۸. هزینه‌ها و محدودیت‌های فنی (MVP)

| مورد | وضعیت |
|------|--------|
| هاست Vercel Hobby | رایگان برای MVP |
| SQLite محلی | رایگان؛ برای multi-instance محدود است |
| Neon Free | مناسب production سبک |
| LLM Provider | در این نسخه اجباری نیست؛ در صورت اتصال هزینه per-token |

**محدودیت‌های آگاهانه MVP:**  
- جست‌وجوی زنده از Jobinja/LinkedIn پیاده‌سازی نشده (ریسک حقوقی/فنی)  
- Session ایجنت در حافظه سرور است (با ریستارت پاک می‌شود؛ پروفایل در DB ماندگار است)  
- فراموشی رمز و پرداخت خارج از دامنه است  

---

## ۹. تست کارکردی پوشش‌داده‌شده
- ثبت‌نام / ورود / خروج  
- ساخت و ذخیره پروفایل  
- ساخت رزومه تعاملی + ذخیره در DB  
- پیشنهاد آگهی + توضیح تناسب  
- بازخورد (ریموت / حقوق)  
- مسیر درخواست آماده  
- تمرین مصاحبه + رد متن نامفهوم  
- نتیجه نهایی + شانس استخدام  

---

## ۱۰. ساختار پوشه‌های مهم
```
src/lib/agent/core.ts      # قلب ایجنت
src/lib/agent/matcher.ts   # امتیازدهی و توضیح
src/app/api/agent/chat/    # API گفتگو
src/app/(dashboard)/chat/  # UI چت
data/sample_jobs.json      # داده آگهی
```
