import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">
              JP
            </span>
            JobPilot
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600 hidden sm:inline">
              {session.user?.name || session.user?.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-red-500 hover:text-red-600 transition"
            >
              خروج
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            سلام{session.user?.name ? `، ${session.user.name}` : ""} 👋
          </h1>
          <p className="text-slate-500">
            پروفایل را کامل کن و با ایجنت گفتگو کن تا فرصت‌های مناسب را پیدا کند.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mb-4 text-lg transition">
              👤
            </div>
            <h2 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition">
              تکمیل پروفایل
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              مهارت‌ها، سطح تجربه و ترجیحات شغلی‌ات را مشخص کن تا پیشنهادها دقیق‌تر شوند.
            </p>
          </Link>

          <Link
            href="/chat"
            className="group rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 text-lg transition">
              🤖
            </div>
            <h2 className="font-semibold text-blue-800 mb-1">
              گفتگو با ایجنت
            </h2>
            <p className="text-sm text-blue-700/80 leading-relaxed">
              ایجنت آگهی‌های مناسب را پیدا می‌کند، دلیل تناسب را توضیح می‌دهد و با بازخورد تو اصلاح می‌کند.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
