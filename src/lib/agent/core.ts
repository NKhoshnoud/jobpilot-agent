import { AgentState, UserProfile, JobMatch } from "@/types/agent";
import { matchJobs, getJobById } from "./matcher";

function calcChance(profile: UserProfile, topScore?: number): number {
  let chance = 35;
  const skills = profile.skills || [];
  if (skills.length >= 3) chance += 10;
  if (skills.length >= 5) chance += 10;
  if (skills.length >= 7) chance += 5;
  if (profile.level === "Junior") chance += 10;
  if (profile.level === "Intern") chance += 5;
  if (profile.resumeData?.summary && profile.resumeData.summary.length > 40) chance += 8;
  if (skills.some((s) => /react|next/i.test(s))) chance += 10;
  if (topScore && topScore >= 70) chance += 12;
  else if (topScore && topScore >= 50) chance += 6;
  return Math.min(95, chance);
}

export function createInitialState(userId: string, profile: UserProfile): AgentState {
  const skills = profile.skills || [];
  const hasSkills = skills.length >= 2;
  const hasLevel = !!profile.level;
  const initialChance = calcChance(profile);

  let welcome = "سلام، من JobPilot هستم.\n\n";

  if (hasSkills && hasLevel) {
    welcome +=
      "پروفایلت را دیدم: سطح " + profile.level +
      " با مهارت‌هایی مثل " + skills.slice(0, 5).join("، ") + ".\n" +
      "شانس استخدام تخمینی فعلی‌ات حدود " + initialChance + "٪ است.\n\n" +
      "از کجا شروع کنیم؟\n" +
      "• پیشنهاد آگهی\n" +
      "• ساخت رزومه (سوال‌به‌سوال)\n" +
      "• بهبود رزومه\n" +
      "یا هر ترجیحی که داری.";
  } else {
    welcome +=
      "برای کمک دقیق‌تر بهتر است اول پروفایل یا رزومه‌ات را بسازیم.\n\n" +
      "می‌توانی بگویی:\n" +
      "• ساخت رزومه ← قدم‌به‌قدم ازت سوال می‌پرسم\n" +
      "• پیشنهاد آگهی\n" +
      "• یا مهارت‌ها و سطحت را همین‌جا بنویسی.";
  }

  return {
    userId,
    messages: [{ role: "assistant", content: welcome }],
    profile,
    jobMatches: [],
    feedbackHistory: [],
    currentPhase: "gathering_info",
    initialChance,
  };
}

function wantsFinal(t: string) {
  const x = t.toLowerCase();
  return x.includes("نتیجه نهایی") || x.includes("بسته نهایی") || x === "نهایی" || x.includes("تموم") || x.includes("پایان");
}
function wantsJobs(t: string) {
  const x = t.toLowerCase().trim();
  if (detectJobNumber(t) !== null) return false;
  return (
    x.includes("پیشنهاد آگهی") ||
    x === "پیشنهاد" ||
    x.includes("لیست آگهی") ||
    x.includes("فرصت‌ها") ||
    (x.includes("پیشنهاد") && !x.includes("رزومه"))
  );
}
function wantsResumeBuild(t: string) {
  const x = t.toLowerCase();
  return (
    x.includes("ساخت رزومه") ||
    x.includes("بساز رزومه") ||
    x.includes("رزومه بساز") ||
    x === "ساخت رزومه"
  );
}
function wantsResumeImprove(t: string) {
  const x = t.toLowerCase();
  return x.includes("بهبود رزومه") || (x.includes("رزومه") && x.includes("بهبود"));
}
function wantsInterview(t: string) {
  const x = t.toLowerCase();
  return x.includes("مصاحبه") || x.includes("تمرین مصاحبه");
}
function isFeedback(t: string) {
  const x = t.toLowerCase();
  return (
    x.includes("حقوق") || x.includes("ریموت") || x.includes("remote") ||
    x.includes("تهران") || x.includes("مشهد") || x.includes("نمیخوام") ||
    x.includes("نمی‌خوام") || x.includes("فقط") || x.includes("ترجیح") ||
    x.includes("پایین") || x.includes("بالا")
  );
}

function detectJobNumber(text: string): number | null {
  const patterns = [
    /(?:شماره\s*)?آگهی\s*([1-5۱-۵])/,
    /(?:شماره\s*)?([1-5۱-۵])\s*(?:را\s*)?(?:انتخاب|میخوام|می‌خوام)?/,
    /^([1-5۱-۵])$/,
  ];
  const map: Record<string, number> = {
    "1": 1, "۱": 1, "2": 2, "۲": 2, "3": 3, "۳": 3, "4": 4, "۴": 4, "5": 5, "۵": 5,
  };
  for (const p of patterns) {
    const m = text.trim().match(p);
    if (m && map[m[1]]) return map[m[1]];
  }
  return null;
}

function looksLikeGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 6) return true;

  const letters = t.replace(/\s/g, "");
  const persianChars = t.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = t.match(/[a-zA-Z]/g) || [];
  const persian = persianChars.length;
  const latin = latinChars.length;
  const spaces = (t.match(/\s+/g) || []).length;

  // repeated same char
  if (/(.)\1{4,}/.test(letters)) return true;

  // Latin mash without real tech/interview words
  if (latin > 8 && persian < 3) {
    const realEn =
      /project|react|html|css|javascript|typescript|because|interest|frontend|component|state|props|challenge|problem|solved|experience|learn|git|next|tailwind|hello|name|i am|my/i;
    if (!realEn.test(t)) return true;
    const vowels = (t.match(/[aeiouAEIOU]/g) || []).length;
    if (latin > 12 && vowels / latin < 0.18) return true;
  }

  // Persian: must contain at least one meaningful word from common set
  if (persian >= 5) {
    const realFa =
      /سلام|من|هستم|علاقه|چون|پروژه|ساختم|کار|تجربه|یاد|مشکل|حل|سایت|فرانت|اند|ریکت|جی|اس|اچ|تی|ام|ال|سی|اس|اس|ریموت|تهران|جونیور|کارآموز|مهارت|رزومه|توسعه|برنامه|نویس|وب|اپ|چالش|رابط|کاربری|مسئول|علاقه‌مند|انتخاب|کردم|دارم|بود|شد|می|خواهم|می‌خواهم|دوست|دارم|یادگیری|html|css|js|react|git/i;
    const hasReal = realFa.test(t);
    // long persian without spaces and without real words = keyboard mash
    if (!hasReal && spaces === 0 && persian >= 8) return true;
    // short-ish persian without any real word
    if (!hasReal && persian >= 6 && persian <= 40 && spaces <= 1) return true;
    // many persian chars but almost no real words and few spaces
    if (!hasReal && persian > 15 && spaces < 2) return true;
  }

  // only 1-2 random short tokens
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length <= 2 && t.length < 25) {
    const realAny =
      /سلام|من|هستم|علاقه|پروژه|react|git|html|css|junior|intern|ریموت|تهران|جونیور|کارآموز|مهارت|javascript|typescript/i;
    if (!realAny.test(t)) return true;
  }

  return false;
}

export function processUserMessage(state: AgentState, userMessage: string): AgentState {
  const trimmed = userMessage.trim();
  if (!trimmed) return state;

  const newMessages = [...state.messages, { role: "user" as const, content: trimmed }];

  // --- resume building multi-step (highest priority when in that flow)
  if (state.currentPhase === "resume_build" as any || (state as any).resumeStep) {
    return handleResumeBuildStep(state, trimmed, newMessages);
  }

  if (wantsFinal(trimmed)) {
    const matches = state.jobMatches.length > 0 ? state.jobMatches : matchJobs(state.profile, 5);
    return {
      ...state,
      messages: [...newMessages, { role: "assistant", content: buildFinalMessage(state, matches) }],
      jobMatches: matches,
      currentPhase: "final",
    };
  }

  const jobNum = detectJobNumber(trimmed);
  if (jobNum !== null) {
    const matches = state.jobMatches.length > 0 ? state.jobMatches : matchJobs(state.profile, 5);
    const selected = matches[jobNum - 1];
    if (selected) {
      return {
        ...state,
        selectedJobId: selected.id,
        jobMatches: matches,
        currentPhase: "application",
        messages: [...newMessages, { role: "assistant", content: buildApplicationPackage(selected, state.profile) }],
      };
    }
  }

  if (wantsResumeBuild(trimmed)) {
    return startResumeBuild(state, newMessages);
  }

  if (wantsResumeImprove(trimmed)) {
    return {
      ...state,
      currentPhase: "refining",
      messages: [...newMessages, { role: "assistant", content: buildResumeAdvice(state) }],
    };
  }

  if (wantsInterview(trimmed)) {
    const job = state.selectedJobId
      ? getJobById(state.selectedJobId)
      : state.jobMatches[0]
      ? getJobById(state.jobMatches[0].id)
      : null;
    return {
      ...state,
      currentPhase: "interview",
      messages: [...newMessages, { role: "assistant", content: buildInterviewQuestions(job) }],
    };
  }

  if (wantsJobs(trimmed)) {
    const matches = matchJobs(state.profile, 5);
    return {
      ...state,
      jobMatches: matches,
      currentPhase: "matching",
      messages: [...newMessages, { role: "assistant", content: buildMatchesMessage(matches) }],
    };
  }

  if ((state.currentPhase === "matching" || state.currentPhase === "refining") && isFeedback(trimmed)) {
    const updatedProfile = applyFeedbackToProfile(state.profile, trimmed);
    const matches = matchJobs(updatedProfile, 5);
    const note = buildSmartFeedbackNote(trimmed);
    return {
      ...state,
      profile: updatedProfile,
      jobMatches: matches,
      feedbackHistory: [...state.feedbackHistory, { text: trimmed, type: "feedback" }],
      currentPhase: "refining",
      messages: [...newMessages, { role: "assistant", content: note + "\n\n" + buildMatchesMessage(matches) }],
    };
  }

  if (state.currentPhase === "interview") {
    return {
      ...state,
      messages: [...newMessages, { role: "assistant", content: buildInterviewFeedback(trimmed) }],
    };
  }

  if (state.currentPhase === "gathering_info") {
    const updatedProfile = enrichProfileFromText(state.profile, trimmed);
    const matches = matchJobs(updatedProfile, 5);
    return {
      ...state,
      profile: updatedProfile,
      jobMatches: matches,
      currentPhase: "matching",
      messages: [...newMessages, { role: "assistant", content: "ممنون، اطلاعات را گرفتم.\n\n" + buildMatchesMessage(matches) }],
    };
  }

  return {
    ...state,
    messages: [
      ...newMessages,
      {
        role: "assistant",
        content:
          "بگو چطور کمکت کنم:\n" +
          "• پیشنهاد آگهی\n" +
          "• ساخت رزومه\n" +
          "• بهبود رزومه\n" +
          "• شماره آگهی (مثلاً: شماره آگهی ۲)\n" +
          "• تمرین مصاحبه\n" +
          "• نتیجه نهایی",
      },
    ],
  };
}

// ─── Resume build flow (question by question) ───
function startResumeBuild(state: AgentState, newMessages: any[]): AgentState {
  const s = {
    ...state,
    currentPhase: "resume_build" as any,
    resumeStep: 1,
    resumeDraft: {},
  } as any;
  return {
    ...s,
    messages: [
      ...newMessages,
      {
        role: "assistant",
        content:
          "باشه، رزومه‌ات را قدم‌به‌قدم می‌سازیم.\n\n" +
          "سوال ۱ از ۴:\n" +
          "سطح تجربه‌ات چیست؟ یکی را بنویس:\n" +
          "• Intern (کارآموز)\n" +
          "• Junior (جونیور)\n\n" +
          "فقط یکی را بفرست.",
      },
    ],
  };
}

function handleResumeBuildStep(state: any, answer: string, newMessages: any[]): AgentState {
  const step = state.resumeStep || 1;
  const draft = { ...(state.resumeDraft || {}) };

  if (step === 1) {
    const lower = answer.toLowerCase();
    if (lower.includes("intern") || lower.includes("کارآموز")) draft.level = "Intern";
    else if (lower.includes("junior") || lower.includes("جونیور")) draft.level = "Junior";
    else {
      return {
        ...state,
        resumeStep: 1,
        resumeDraft: draft,
        messages: [
          ...newMessages,
          {
            role: "assistant",
            content:
              "فقط یکی از این دو را بنویس:\n• Intern\n• Junior\n(یا فارسی: کارآموز / جونیور)",
          },
        ],
      } as any;
    }

    return {
      ...state,
      resumeStep: 2,
      resumeDraft: draft,
      messages: [
        ...newMessages,
        {
          role: "assistant",
          content:
            "ثبت شد: " + draft.level + "\n\n" +
            "سوال ۲ از ۴:\n" +
            "مهارت‌های اصلیت را با ویرگول بنویس.\n" +
            "مثال: HTML, CSS, JavaScript, React, Git",
        },
      ],
    } as any;
  }

  if (step === 2) {
    const parts = answer
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const known = /html|css|javascript|typescript|react|next|git|redux|tailwind|vue|angular|node|python|java|sql|docker|figma|js|ts|api|rest|testing|framer/i;
    const validParts = parts.filter((p) => known.test(p) || p.length >= 2 && !looksLikeGibberish(p));
    if (looksLikeGibberish(answer) || validParts.length === 0) {
      return {
        ...state,
        resumeStep: 2,
        resumeDraft: draft,
        messages: [
          ...newMessages,
          {
            role: "assistant",
            content:
              "مهارت‌های واردشده قابل تشخیص نیست.\n" +
              "لطفاً نام مهارت‌های واقعی را با ویرگول بنویس، مثلاً:\n" +
              "HTML, CSS, JavaScript, React, Git",
          },
        ],
      } as any;
    }
    draft.skills = validParts;
    return {
      ...state,
      resumeStep: 3,
      resumeDraft: draft,
      messages: [
        ...newMessages,
        {
          role: "assistant",
          content:
            "مهارت‌ها ثبت شد: " + draft.skills.join("، ") + "\n\n" +
            "سوال ۳ از ۴:\n" +
            "یک پروژه یا تجربه کوتاه بنویس (۲–۴ جمله).\n" +
            "اگر پروژه‌ای نداری، بگو چه چیزی ساخته‌ای یا یاد گرفته‌ای.",
        },
      ],
    } as any;
  }

  if (step === 3) {
    if (looksLikeGibberish(answer) || answer.trim().length < 12) {
      return {
        ...state,
        resumeStep: 3,
        resumeDraft: draft,
        messages: [
          ...newMessages,
          {
            role: "assistant",
            content:
              "این توضیح پروژه قابل قبول نیست؛ نامفهوم یا خیلی کوتاه است.\n\n" +
              "لطفاً ۲ تا ۴ جمله واقعی بنویس. مثال:\n" +
              "«یک لندینگ صفحه با HTML و CSS ساختم. مشکل ریسپانسیو بودن منو را با Flexbox حل کردم.»\n\n" +
              "دوباره بنویس:",
          },
        ],
      } as any;
    }
    draft.experience = answer.trim();
    return {
      ...state,
      resumeStep: 4,
      resumeDraft: draft,
      messages: [
        ...newMessages,
        {
          role: "assistant",
          content:
            "سوال ۴ از ۴:\n" +
            "ترجیح کاری‌ات چیست؟ مثلاً:\n" +
            "• ریموت\n" +
            "• تهران\n" +
            "• حقوق بالای ۳۰ میلیون\n\n" +
            "هر چه دوست داری بنویس.",
        },
      ],
    } as any;
  }

  // step 4 → finish
  draft.preference = answer.trim();
  const skills: string[] = draft.skills || [];
  const level = draft.level || "Junior";
  const summary =
    "توسعه‌دهنده فرانت‌اند " +
    (level === "Intern" ? "کارآموز" : "جونیور") +
    " با مهارت در " +
    skills.slice(0, 5).join("، ") +
    ". " +
    (draft.experience ? draft.experience.slice(0, 120) : "علاقه‌مند به یادگیری و کار روی محصول واقعی.") +
    ".";

  const updatedProfile: UserProfile = {
    ...state.profile,
    skills,
    level,
    preferences: {
      ...state.profile.preferences,
      remote: /ریموت|remote/i.test(draft.preference || ""),
      location: /تهران/.test(draft.preference || "")
        ? "تهران"
        : /مشهد/.test(draft.preference || "")
        ? "مشهد"
        : state.profile.preferences?.location,
      salaryMin: /۳۰|30|بالا/.test(draft.preference || "")
        ? 30
        : state.profile.preferences?.salaryMin,
    },
    resumeData: {
      ...state.profile.resumeData,
      summary,
      experience: draft.experience ? [{ text: draft.experience }] : [],
    },
  };

  const chance = calcChance(updatedProfile);

  const resumeText =
    "رزومه استاندارد آماده‌شده:\n\n" +
    "────────────────\n" +
    "سطح: " + level + "\n" +
    "مهارت‌ها: " + skills.join("، ") + "\n" +
    "خلاصه:\n" + summary + "\n\n" +
    "تجربه / پروژه:\n" + (draft.experience || "—") + "\n\n" +
    "ترجیحات: " + (draft.preference || "—") + "\n" +
    "────────────────\n\n" +
    "شانس استخدام تخمینی با این رزومه: " + chance + "٪\n\n" +
    "این اطلاعات در پروفایل همین جلسه اعمال شد.\n" +
    "حالا می‌توانی بگویی «پیشنهاد آگهی» تا فرصت‌های متناسب را ببینی.";

  return {
    ...state,
    profile: updatedProfile,
    currentPhase: "matching",
    resumeStep: undefined,
    resumeDraft: undefined,
    initialChance: state.initialChance ?? chance,
    _persistProfile: true,
    messages: [
      ...newMessages,
      {
        role: "assistant",
        content:
          resumeText +
          "\n\nتغییرات در پروفایل و رزومه شما ذخیره شد. می‌توانی از صفحه پروفایل هم آن‌ها را ببینی.",
      },
    ],
  } as any;
}

function enrichProfileFromText(profile: UserProfile, text: string): UserProfile {
  const lower = text.toLowerCase();
  const skills = [...(profile.skills || [])];
  const map: Record<string, string> = {
    html: "HTML", css: "CSS", javascript: "JavaScript", js: "JavaScript",
    typescript: "TypeScript", ts: "TypeScript", react: "React",
    "next.js": "Next.js", nextjs: "Next.js", tailwind: "Tailwind CSS",
    redux: "Redux", git: "Git", vue: "Vue.js", angular: "Angular",
  };
  for (const [kw, label] of Object.entries(map)) {
    if (lower.includes(kw) && !skills.some((s) => s.toLowerCase().includes(kw))) {
      skills.push(label);
    }
  }
  let level = profile.level;
  if (lower.includes("intern") || lower.includes("کارآموز")) level = "Intern";
  if (lower.includes("junior") || lower.includes("جونیور")) level = "Junior";
  return { ...profile, skills, level };
}

function applyFeedbackToProfile(profile: UserProfile, text: string): UserProfile {
  const lower = text.toLowerCase();
  const prefs = { ...(profile.preferences || {}) };
  if (lower.includes("ریموت") || lower.includes("remote")) prefs.remote = true;
  if (lower.includes("تهران")) prefs.location = "تهران";
  if (lower.includes("مشهد")) prefs.location = "مشهد";
  if (lower.includes("حقوق") && (lower.includes("بالا") || lower.includes("بیشتر") || lower.includes("زیاد"))) {
    prefs.salaryMin = Math.max(prefs.salaryMin || 0, 35);
  }
  return { ...profile, preferences: prefs };
}

function buildSmartFeedbackNote(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("حقوق") && (lower.includes("پایین") || lower.includes("کم"))) {
    return "فهمیدم. لیست را با تمرکز روی حقوق بالاتر مرتب کردم.";
  }
  if (lower.includes("ریموت") || lower.includes("remote")) {
    return "اولویت را روی موقعیت‌های ریموت گذاشتم.";
  }
  return "بازخوردت را اعمال کردم و لیست را به‌روز کردم.";
}

function buildMatchesMessage(matches: JobMatch[]): string {
  if (matches.length === 0) {
    return "با پروفایل فعلی آگهی مناسبی پیدا نکردم. اول «ساخت رزومه» یا مهارت‌هایت را کامل کن.";
  }

  let msg = "این‌ها نزدیک‌ترین فرصت‌ها به پروفایل تو هستند:\n\n";
  matches.forEach((m, i) => {
    msg +=
      "【 شماره آگهی " + (i + 1) + " 】\n" +
      m.title + " — " + m.company + "\n" +
      m.location + " | " + m.salary_range + " | " + m.type + "\n" +
      "تناسب: " + m.matchScore + "٪\n" +
      m.matchReason + "\n";
    if (m.improvementTip && m.matchScore < 95) {
      msg += m.improvementTip + "\n";
    }
    msg += "\n";
  });

  msg +=
    "برای ساخت درخواست کامل بگو مثلاً: شماره آگهی ۲\n" +
    "یا: ساخت رزومه / بهبود رزومه / تمرین مصاحبه / نتیجه نهایی";

  return msg;
}

function buildResumeAdvice(state: AgentState): string {
  const profile = state.profile;
  const skills = profile.skills || [];
  const level = profile.level || "نامشخص";
  const summary = profile.resumeData?.summary || "";
  const before = state.initialChance ?? calcChance(profile);
  const after = calcChance(profile, state.jobMatches[0]?.matchScore);
  const roleLabel = level === "Intern" ? "کارآموز" : "جونیور";

  const gaps: string[] = [];
  if (!skills.some((s) => /react/i.test(s))) gaps.push("React تقریباً برای اکثر آگهی‌های جونیور ضروری است");
  if (!summary || summary.length < 40) gaps.push("خلاصه رزومه خیلی کوتاه یا عمومی است");
  if (skills.length < 5) gaps.push("لیست مهارت‌ها را با ابزار و پروژه واقعی کامل‌تر کن");

  let msg =
    "رزومه‌ات را بررسی کردم.\n\n" +
    "شانس استخدام: از " + before + "٪ به " + after + "٪\n\n" +
    "سطح: " + level + "\n" +
    "مهارت‌ها: " + (skills.length ? skills.join("، ") : "خالی") + "\n";

  if (summary) msg += "خلاصه: «" + summary.slice(0, 100) + "»\n";
  else msg += "خلاصه: ندارد\n";

  if (gaps.length) {
    msg += "\nنقاط قابل بهبود:\n";
    gaps.forEach((g, i) => {
      msg += (i + 1) + ") " + g + "\n";
    });
  }

  msg +=
    "\nنمونه خلاصه:\n" +
    "«توسعه‌دهنده فرانت‌اند " + roleLabel +
    " با تمرکز روی React و رابط کاربری تمیز. روی پروژه‌های واقعی کار کرده‌ام و به یادگیری مستمر علاقه دارم.»\n\n" +
    "اگر می‌خواهی از صفر بسازیم بگو «ساخت رزومه».";

  return msg;
}

function buildApplicationPackage(job: JobMatch, profile: UserProfile): string {
  const skills = (profile.skills || []).slice(0, 6).join("، ") || "HTML، CSS، JavaScript";
  const level = profile.level === "Intern" ? "کارآموز" : "جونیور";
  const req = (job.required_skills || []).slice(0, 4).join("، ");

  return (
    "درخواست برای «" + job.title + "» در " + job.company + " آماده شد.\n" +
    "تناسب: " + job.matchScore + "٪\n\n" +
    "────────\n" +
    "کاور لتر:\n\n" +
    "با سلام،\n" +
    "من به‌عنوان توسعه‌دهنده فرانت‌اند " + level +
    " با مهارت در " + skills +
    "، برای موقعیت " + job.title + " در " + job.company +
    " درخواست می‌دهم. با توجه به نیاز آگهی به " + req +
    "، آماده‌ام سریع به تیم کمک کنم.\n" +
    "با احترام\n" +
    "────────\n\n" +
    "سه جمله درباره من:\n" +
    "۱. فرانت‌اندکار " + level + " هستم و روی رابط‌های ساده و قابل‌استفاده تمرکز دارم.\n" +
    "۲. با " + skills + " کار کرده‌ام و می‌خواهم در تیم محصول رشد کنم.\n" +
    "۳. دنبال فرصتی هستم که هم یاد بگیرم و هم خروجی مشخص داشته باشم.\n\n" +
    "چک‌لیست ارسال:\n" +
    "• مهارت‌های کلیدی: " + (job.required_skills || []).join("، ") + "\n" +
    "• لینک گیت‌هاب / نمونه کار\n" +
    "• خلاصه هم‌راستا با آگهی\n" +
    "• کاور لتر کوتاه\n" +
    "• ایمیل و شماره تماس درست\n\n" +
    "برای همین آگهی می‌توانی بگویی «تمرین مصاحبه» یا «نتیجه نهایی»."
  );
}

function buildInterviewQuestions(job: any): string {
  const title = job?.title || "Junior Frontend";
  const company = job?.company || "شرکت هدف";
  return (
    "برای «" + title + "» در " + company + " سه سوال می‌پرسم. با مثال واقعی جواب بده.\n\n" +
    "۱) خودت را در یک دقیقه معرفی کن و بگو چرا فرانت‌اند را انتخاب کردی.\n\n" +
    "۲) یک پروژه بگو که در آن از React یا HTML/CSS/JS استفاده کردی. چه مشکلی پیش آمد و چطور حلش کردی؟\n\n" +
    "۳) controlled و uncontrolled component چه فرقی دارند؟ (اگر React بلد نیستی: چرا semantic HTML مهم است؟)\n\n" +
    "جواب‌هایت را اینجا بنویس."
  );
}

function buildInterviewFeedback(answer: string): string {
  if (looksLikeGibberish(answer)) {
    return (
      "این پاسخ قابل ارزیابی نیست؛ شبیه متن تصادفی یا نامفهوم است.\n\n" +
      "در مصاحبه واقعی چنین جوابی امتیاز منفی می‌گیرد.\n" +
      "حداقل برای یکی از سه سوال، ۳–۴ جمله با زبان خودت و یک مثال مشخص بنویس.\n\n" +
      "یا بگو: پیشنهاد آگهی / ساخت رزومه / نتیجه نهایی."
    );
  }

  const text = answer.trim();
  const len = text.length;
  const hasProject = /پروژه|project|ساختم|نوشتم|توسعه|سایت|اپ|وب/i.test(text);
  const hasWhy = /علاقه|دوست|چرا|چون|انتخاب|علاقه‌مند|شخصی/i.test(text);
  const hasReact = /react|controlled|uncontrolled|state|props|کامپوننت/i.test(text);
  const hasChallenge = /مشکل|چالش|سخت|error|باگ|حل|رفع/i.test(text);
  const tooShort = len < 60;
  const veryWeak = len < 30 || (hasWhy && len < 40 && !hasProject);

  let score = 0;
  if (!tooShort) score += 2;
  if (hasWhy) score += 2;
  if (hasProject) score += 3;
  if (hasChallenge) score += 2;
  if (hasReact) score += 2;
  if (len > 120) score += 1;

  let msg = "ارزیابی پاسخ مصاحبه:\n\n";

  if (veryWeak) {
    msg +=
      "سطح پاسخ: ضعیف\n" +
      "فقط اشاره کوتاه کافی نیست. مصاحبه‌گر می‌خواهد ساختار ببیند: معرفی + دلیل + مثال.\n\n" +
      "پیشنهاد ساختار:\n" +
      "«من ... هستم. فرانت‌اند را انتخاب کردم چون .... در پروژه ... مشکل ... پیش آمد و با ... حلش کردم.»\n\n";
  } else if (tooShort) {
    msg +=
      "سطح پاسخ: ناقص\n" +
      "ایده هست اما برای مصاحبه کوتاه است. هر سوال را با ۲–۴ جمله کامل کن.\n\n";
  } else {
    msg += "سطح پاسخ: " + (score >= 8 ? "خوب" : score >= 5 ? "متوسط" : "قابل بهبود") + "\n\n";
    msg += "نقاط قوت:\n";
    if (hasWhy) msg += "• انگیزه/دلیل انتخاب را گفتی\n";
    if (hasProject) msg += "• به تجربه یا پروژه اشاره کردی\n";
    if (hasChallenge) msg += "• به مشکل و حل آن اشاره کردی (خیلی مهم است)\n";
    if (hasReact) msg += "• مفهوم فنی React را آوردی\n";
    if (!hasWhy && !hasProject && !hasReact) msg += "• تلاش برای پاسخ دادن\n";

    msg += "\nبرای قوی‌تر شدن:\n";
    if (!hasWhy) msg += "• یک دلیل مشخص برای انتخاب فرانت‌اند بگو\n";
    if (!hasProject) msg += "• یک پروژه واقعی نام ببر\n";
    if (!hasChallenge) msg += "• یک چالش + راه‌حل کوتاه اضافه کن\n";
    if (!hasReact) msg += "• اگر React بلدی، controlled/uncontrolled را با مثال state بگو\n";
  }

  msg +=
    "\nدر مصاحبه واقعی، جواب حفظی کمتر از داستان کوتاه و صادقانه امتیاز می‌گیرد.\n\n" +
    "می‌توانی دوباره جواب کامل‌تری بفرستی، یا بگویی پیشنهاد آگهی / نتیجه نهایی.";

  return msg;
}

function buildFinalMessage(state: AgentState, matches: JobMatch[]): string {
  const profile = state.profile;
  const top = matches.slice(0, 3);
  const skills = (profile.skills || []).join("، ") || "ثبت نشده";
  const level = profile.level || "نامشخص";
  const loc = profile.preferences?.location || "—";
  const remote = profile.preferences?.remote ? "بله" : "خیر";
  const before = state.initialChance ?? calcChance(profile);
  const after = calcChance(profile, top[0]?.matchScore);

  let msg =
    "جمع‌بندی نهایی\n\n" +
    "پروفایل: " + level + " | " + skills + "\n" +
    "لوکیشن: " + loc + " | ریموت: " + remote + "\n" +
    "شانس استخدام: از " + before + "٪ به " + after + "٪\n\n" +
    "سه فرصت برتر:\n\n";

  if (top.length === 0) msg += "آگهی مناسبی پیدا نشد.";
  else {
    top.forEach((m, i) => {
      msg += (i + 1) + ") " + m.title + " — " + m.company + " (" + m.matchScore + "٪)\n" + m.matchReason + "\n\n";
    });
  }

  msg += "گام بعدی: بگو شماره آگهی (مثلاً شماره آگهی ۲) تا کاور لتر و چک‌لیست ساخته شود.";
  return msg;
}
