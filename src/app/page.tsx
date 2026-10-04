import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm">
            JP
          </span>
          JobPilot
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ثبت‌نام
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-6">
            همراه هوشمند کاریابی
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight">
            از سردرگمی آگهی‌ها
            <br />
            <span className="text-blue-600">خلاصت می‌کنیم</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
            ایجنت JobPilot سوابق و ترجیحات شما را می‌شناسد، فرصت‌های مناسب Junior Frontend را پیدا می‌کند،
            علت تناسب را توضیح می‌دهد و با بازخورد شما جست‌وجو و رزومه را بهبود می‌دهد.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200/60"
            >
              شروع رایگان
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition"
            >
              ورود به حساب
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            { title: "شناخت پروفایل", desc: "مهارت‌ها، سطح و ترجیحات شما را دقیق می‌فهمد" },
            { title: "توضیح تناسب", desc: "برای هر آگهی دلیل تناسب یا عدم‌تناسب را می‌گوید" },
            { title: "بهبود رزومه", desc: "با بازخورد شما رزومه را استاندارد و قوی‌تر می‌کند" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/70 backdrop-blur rounded-2xl border border-white/80 p-5 text-center shadow-sm"
            >
              <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6">
        ساخته‌شده برای مسابقه buildX — مسئله ۲
      </footer>
    </div>
  );
}
