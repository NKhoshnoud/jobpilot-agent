"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COMMON_SKILLS = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Git",
  "REST API",
  "Redux",
  "Framer Motion",
  "Testing Library",
];

export default function ProfilePage() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [level, setLevel] = useState<"Intern" | "Junior" | "">("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(true);
  const [salaryMin, setSalaryMin] = useState<number | "">("");
  const [jobType, setJobType] = useState("تمام‌وقت");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setSkills(data.skills || []);
        setLevel(data.level || "");
        setLocation(data.preferences?.location || "");
        setRemote(data.preferences?.remote ?? true);
        setSalaryMin(data.preferences?.salaryMin ?? "");
        setJobType(data.preferences?.jobType || "تمام‌وقت");
        setSummary(data.resumeData?.summary || "");
      } catch {
        setError("خطا در بارگذاری پروفایل");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          level: level || null,
          preferences: {
            location,
            remote,
            salaryMin: salaryMin === "" ? undefined : Number(salaryMin),
            jobType,
          },
          resumeData: {
            summary,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "خطا در ذخیره");
        setSaving(false);
        return;
      }

      setMessage("پروفایل با موفقیت ذخیره شد");
      setSaving(false);
    } catch {
      setError("خطا در ارتباط با سرور");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">در حال بارگذاری پروفایل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl text-slate-800">
            JobPilot Agent
          </Link>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            بازگشت به داشبورد
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">پروفایل من</h1>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Level */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">سطح تجربه</h2>
            <div className="flex gap-3">
              {(["Intern", "Junior"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition ${
                    level === l
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {l === "Intern" ? "کارآموز (Intern)" : "جونیور (Junior)"}
                </button>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">مهارت‌ها</h2>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    skills.includes(skill)
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {skills.length > 0 && (
              <p className="mt-3 text-sm text-slate-500">
                انتخاب‌شده: {skills.join("، ")}
              </p>
            )}
          </section>

          {/* Preferences */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-slate-800 mb-2">ترجیحات شغلی</h2>

            <div>
              <label className="block text-sm text-slate-600 mb-1">شهر / لوکیشن</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="تهران، ریموت، ..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remote"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remote" className="text-sm text-slate-700">
                امکان کار ریموت را دارم
              </label>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">
                حداقل حقوق مورد انتظار (میلیون تومان)
              </label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) =>
                  setSalaryMin(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="مثلاً ۲۵"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">نوع قرارداد</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="تمام‌وقت">تمام‌وقت</option>
                <option value="پاره‌وقت">پاره‌وقت</option>
                <option value="کارآموزی">کارآموزی</option>
                <option value="پروژه‌ای">پروژه‌ای</option>
              </select>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">خلاصه رزومه (اختیاری)</h2>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="چند خط درباره خودتان، پروژه‌ها و هدف شغلی بنویسید..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </section>

          {message && (
            <div className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
              {message}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {saving ? "در حال ذخیره..." : "ذخیره پروفایل"}
          </button>
        </form>
      </main>
    </div>
  );
}
