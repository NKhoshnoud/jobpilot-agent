# راهنمای قدم‌به‌قدم تحویل مسابقه JobPilot

این فایل را از بالا به پایین انجام بده. اگر جایی گیر کردی همان مرحله را بگو.

---

## مرحله ۰ — چیزهایی که لازم داری (حساب رایگان)

1. حساب **GitHub**: https://github.com/signup
2. حساب **Vercel**: https://vercel.com/signup (با GitHub وارد شو)
3. حساب **Neon**: https://console.neon.tech (با GitHub/Google)

ویدیو را بعد از اینکه سایت آنلاین شد ضبط می‌کنی.

---

## مرحله ۱ — دیتابیس رایگان Neon (۵ دقیقه)

1. برو https://console.neon.tech و وارد شو
2. **Create Project** بزن
   - اسم: `jobpilot`
   - Region: یکی نزدیک (مثلاً Frankfurt یا Singapore)
3. بعد از ساخته شدن، روی **Connection string** یا **Dashboard** برو
4. رشته‌ای شبیه این کپی کن (حالت **URI**):

```
postgresql://neondb_owner:xxxxx@ep-xxxxx.aws.neon.tech/neondb?sslmode=require
```

این همان `DATABASE_URL` است. جایی امن نگه دار.

---

## مرحله ۲ — کد را به GitHub بفرست

### اگر Git بلد نیستی (ساده‌ترین راه):

1. برو https://github.com/new
2. Repository name: `jobpilot-agent`
3. Public بگذار → Create repository
4. روی سیستم خودت:

```bash
cd Desktop/JobPilot-Agent
```

اگر از zip جدید استفاده می‌کنی، اول unzip کن و داخل پوشه برو.

سپس:

```bash
git init
git add .
git commit -m "JobPilot Agent for buildX"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jobpilot-agent.git
git push -u origin main
```

`YOUR_USERNAME` را با نام کاربری GitHub خودت عوض کن.  
اگر ازت username/password خواست، از **Personal Access Token** استفاده کن:
GitHub → Settings → Developer settings → Personal access tokens

### نکته مهم
فایل `.env` را push نکن (در gitignore هست). فقط `.env.example` می‌رود.

---

## مرحله ۳ — دیپلوی روی Vercel

1. برو https://vercel.com → **Add New…** → **Project**
2. ریپوی `jobpilot-agent` را **Import** کن
3. قبل از Deploy، بخش **Environment Variables** را باز کن و این سه تا را اضافه کن:

| Name | Value |
|------|--------|
| `DATABASE_URL` | همان connection string از Neon |
| `NEXTAUTH_SECRET` | یک متن تصادفی بلند (مثلاً `jobpilot-secret-buildx-2026-xyz123`) |
| `NEXTAUTH_URL` | فعلاً بگذار `http://localhost:3000` — بعد از اولین دیپلوی عوض می‌کنیم |

4. **Deploy** بزن و صبر کن تا سبز شود
5. یک لینک می‌گیری شبیه: `https://jobpilot-agent-xxxx.vercel.app`

---

## مرحله ۴ — ساخت جدول‌های دیتابیس

بعد از اولین دیپلوی موفق:

### روش آسان (از روی سیستم خودت):

1. در پوشه پروژه یک فایل `.env` بساز:

```
DATABASE_URL="همان_رشته_Neon"
NEXTAUTH_SECRET="همان_سکرت"
NEXTAUTH_URL="https://jobpilot-agent-xxxx.vercel.app"
```

2. اجرا کن:

```bash
npx prisma db push
```

باید پیام موفقیت ببینی. جداول User و Profile ساخته می‌شوند.

### سپس در Vercel:
1. Project → Settings → Environment Variables
2. مقدار `NEXTAUTH_URL` را به آدرس واقعی Vercel عوض کن  
   مثال: `https://jobpilot-agent-xxxx.vercel.app`
3. Deployments → روی آخرین دیپلوی → **Redeploy**

---

## مرحله ۵ — تست لینک آنلاین (اجباری)

در مرورگر لینک Vercel را باز کن و این مسیر را کامل برو:

1. ثبت‌نام با ایمیل جدید
2. ورود
3. پروفایل یا ساخت رزومه در چت
4. پیشنهاد آگهی
5. شماره آگهی ۱ یا ۲
6. نتیجه نهایی

اگر خطا دیدی، متن خطا را کپی کن و بفرست.

لینک نهایی را اینجا ذخیره کن و در فایل  
`docs/submission/00_PRODUCT_LINK.txt`  
بنویس.

---

## مرحله ۶ — ویدیوی ۵ دقیقه‌ای

### با چه ابزاری؟
- Windows: **Xbox Game Bar** (`Win + G`) یا نرم‌افزار **OBS** (رایگان)
- یا گوشی از صفحه مانیتور فیلم بگیر (کیفیت کمتر)

### سناریوی دقیق صحبت (حدود ۵ دقیقه)

| زمان | چه کار کن / چه بگو |
|------|---------------------|
| ۰:۰۰ | «من JobPilot را برای مسئله ۲ مسابقه buildX ساختم: همراه کاریابی جونیور فرانت‌اند» |
| ۰:۲۰ | «مشکل: کارجو بین آگهی نامرتبط و رزومه ناتمام سردرگم است» |
| ۰:۴۰ | «قلب محصول ایجنت است؛ فقط یک فیلتر ساده نیست» |
| ۱:۰۰ | صفحه لینک آنلاین را باز کن → ثبت‌نام |
| ۱:۲۰ | ورود |
| ۱:۴۰ | چت → ساخت رزومه (۴ سوال را سریع جواب بده) |
| ۲:۳۰ | پیشنهاد آگهی → توضیح تناسب را نشان بده |
| ۳:۱۰ | بگو «شماره آگهی ۱» → کاور لتر و چک‌لیست |
| ۳:۵۰ | تمرین مصاحبه یا بهبود رزومه (یکی کافی است) |
| ۴:۲۰ | نتیجه نهایی و شانس استخدام |
| ۴:۴۵ | «کاربر بدون کمک ما از ثبت‌نام تا درخواست آماده می‌رسد» |

ویدیو را در **YouTube (Unlisted)** یا **Google Drive (Anyone with link)** آپلود کن.  
لینک را در `docs/submission/04_VIDEO_LINK.txt` بنویس.

---

## مرحله ۷ — ساخت zip نهایی تحویل

یک پوشه به اسم `JobPilot-Final-Submission` بساز و داخلش بگذار:

```
JobPilot-Final-Submission/
├── 00_PRODUCT_LINK.txt      ← لینک Vercel
├── 04_VIDEO_LINK.txt        ← لینک ویدیو
├── 01_TECHNICAL_DOCS.md
├── 02_BUSINESS_PLAN.md
├── 03_PITCH.md
└── source/                  ← کل سورس (بدون node_modules)
```

سپس کل پوشه را zip کن و همان را در سامانه مسابقه آپلود کن.

---

## اگر خطا دیدی

| خطا | کار |
|-----|-----|
| Prisma / database | `DATABASE_URL` و `prisma db push` را چک کن |
| NextAuth error | `NEXTAUTH_URL` باید دقیقاً همان دامنه Vercel باشد |
| Build failed | لاگ Vercel را باز کن؛ معمولاً env جا افتاده |
| ثبت‌نام ۵۰۰ | جداول ساخته نشده → دوباره `db push` |

هر خطا را با اسکرین یا متن کامل بفرست تا همانجا رفع کنیم.
