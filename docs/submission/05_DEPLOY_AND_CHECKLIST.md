# راهنمای دیپلوی و چک‌لیست تحویل مسابقه

## الف) دیپلوی سریع روی Vercel

1. کد را در GitHub قرار دهید (بدون node_modules و .env)
2. vercel.com → New Project → Import
3. Environment Variables:
   - DATABASE_URL  (برای شروع می‌توانید از SQLite در محیط‌های خاص استفاده نکنید؛ بهتر است Neon)
   - NEXTAUTH_SECRET  (یک رشته تصادفی بلند)
   - NEXTAUTH_URL  (آدرس نهایی مثلاً https://jobpilot.vercel.app)
4. برای PostgreSQL:
   - در schema.prisma: provider = "postgresql"
   - DATABASE_URL از Neon/Supabase
   - بعد از دیپلوی: prisma db push (یا در build script)
5. لینک عمومی را تست کنید: ثبت‌نام → ورود → جریان کامل

## ب) فایل‌های الزامی در zip نهایی مسابقه

- [ ] لینک محصول دیپلوی‌شده (در یک فایل txt یا در README)
- [ ] لینک ویدیوی ۵ دقیقه‌ای (docs/submission/04_VIDEO_LINK.txt)
- [ ] مستندات فنی (01_TECHNICAL_DOCS.md)
- [ ] بیزینس پلن (02_BUSINESS_PLAN.md)
- [ ] پیچ (03_PITCH.md)
- [ ] سورس کد کامل

## ج) لینک محصول

وضعیت: []

مثال:
https://jobpilot-agent.vercel.app
