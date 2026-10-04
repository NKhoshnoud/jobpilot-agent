import { JobMatch, UserProfile } from "@/types/agent";
import sampleJobs from "../../../data/sample_jobs.json";

type RawJob = (typeof sampleJobs)[number];

export interface MatchDetail {
  score: number;
  reason: string;
  matchedRequired: string[];
  missingRequired: string[];
  matchedNice: string[];
  levelMatch: boolean;
  remoteMatch: boolean;
  salaryHint: string;
  improvementTip: string;
}

function calculateMatch(job: RawJob, profile: UserProfile): MatchDetail {
  const userSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const required = (job.required_skills || []).map((s) => s.toLowerCase());
  const nice = (job.nice_to_have || []).map((s) => s.toLowerCase());

  let score = 0;
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  const matchedNice: string[] = [];

  for (const skill of required) {
    if (userSkills.some((us) => us.includes(skill) || skill.includes(us))) {
      matchedRequired.push(skill);
      score += 20;
    } else {
      missingRequired.push(skill);
    }
  }

  for (const skill of nice) {
    if (userSkills.some((us) => us.includes(skill) || skill.includes(us))) {
      matchedNice.push(skill);
      score += 8;
    }
  }

  const level = (profile.level || "").toLowerCase();
  const jobLevel = (job.experience_level || "").toLowerCase();
  let levelMatch = false;
  if (level && jobLevel.includes(level)) {
    score += 15;
    levelMatch = true;
  } else if (level === "intern" && jobLevel.includes("junior")) {
    score += 5;
  }

  const prefs = profile.preferences || {};
  let remoteMatch = false;
  if (
    prefs.remote &&
    (job.location.toLowerCase().includes("ریموت") ||
      job.location.toLowerCase().includes("remote"))
  ) {
    score += 10;
    remoteMatch = true;
  }
  if (prefs.location && job.location.includes(prefs.location)) {
    score += 8;
  }
  if (prefs.jobType && job.type.includes(prefs.jobType)) {
    score += 7;
  }

  score = Math.min(100, Math.max(0, score));

  // Improvement tip
  let improvementTip = "";
  if (missingRequired.length > 0) {
    const first = missingRequired[0];
    const potential = Math.min(100, score + 20);
    improvementTip =
      "اگر مهارت «" +
      first +
      "» را اضافه کنید، امتیاز تناسب شما از " +
      score +
      "٪ به حدود " +
      potential +
      "٪ می‌رسد.";
  } else if (matchedNice.length === 0 && nice.length > 0) {
    improvementTip =
      "با یادگیری «" + nice[0] + "» می‌توانید از بقیه متقاضیان جلو بزنید.";
  } else {
    improvementTip = "پروفایل شما برای این آگهی نسبتاً مناسب است.";
  }

  let salaryHint = "";
  if (prefs.salaryMin && prefs.salaryMin >= 35) {
    salaryHint = "ترجیح حقوق بالای شما در نظر گرفته شد.";
  }

  const parts: string[] = [];
  if (matchedRequired.length > 0) {
    parts.push("مهارت‌های منطبق: " + matchedRequired.join("، "));
  }
  if (matchedNice.length > 0) {
    parts.push("مهارت‌های اضافی: " + matchedNice.join("، "));
  }
  if (missingRequired.length > 0) {
    parts.push("مهارت‌های مورد نیاز که ندارید: " + missingRequired.join("، "));
  }
  if (levelMatch) {
    parts.push("سطح تجربه شما با آگهی همخوانی دارد");
  } else if (level) {
    parts.push("سطح تجربه شما با آگهی کاملاً منطبق نیست");
  }
  if (remoteMatch) {
    parts.push("موقعیت ریموت با ترجیح شما سازگار است");
  }

  if (parts.length === 0) {
    parts.push("تناسب کلی متوسط است");
  }

  const reason =
    (score >= 70
      ? "تناسب بالا (" + score + "٪). "
      : score >= 40
      ? "تناسب متوسط (" + score + "٪). "
      : "تناسب پایین (" + score + "٪). ") + parts.join(". ") + ".";

  return {
    score,
    reason,
    matchedRequired,
    missingRequired,
    matchedNice,
    levelMatch,
    remoteMatch,
    salaryHint,
    improvementTip,
  };
}

export function matchJobs(profile: UserProfile, limit = 5): JobMatch[] {
  const results: JobMatch[] = sampleJobs.map((job) => {
    const detail = calculateMatch(job, profile);
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary_range: job.salary_range,
      type: job.type,
      required_skills: job.required_skills,
      nice_to_have: job.nice_to_have,
      experience_level: job.experience_level,
      description: job.description,
      matchScore: detail.score,
      matchReason: detail.reason,
      // extra explainable fields (stored in reason mostly, but available)
      matchedSkills: detail.matchedRequired,
      missingSkills: detail.missingRequired,
      improvementTip: detail.improvementTip,
    } as JobMatch & {
      matchedSkills: string[];
      missingSkills: string[];
      improvementTip: string;
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

export function getMatchDetail(jobId: string, profile: UserProfile): MatchDetail | null {
  const job = sampleJobs.find((j) => j.id === jobId);
  if (!job) return null;
  return calculateMatch(job, profile);
}

export function getJobById(jobId: string) {
  return sampleJobs.find((j) => j.id === jobId) || null;
}
