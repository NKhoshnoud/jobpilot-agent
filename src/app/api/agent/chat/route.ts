import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInitialState, processUserMessage } from "@/lib/agent/core";
import { AgentState, UserProfile } from "@/types/agent";
import { z } from "zod";

const sessionStore = new Map<string, AgentState>();

const bodySchema = z.object({
  message: z.string().max(2000).optional().default(""),
  reset: z.boolean().optional().default(false),
});

async function loadProfile(userId: string): Promise<UserProfile> {
  const dbProfile = await prisma.profile.findUnique({ where: { userId } });
  return {
    skills: JSON.parse(dbProfile?.skills || "[]"),
    level: (dbProfile?.level as "Intern" | "Junior" | null) || null,
    preferences: JSON.parse(dbProfile?.preferences || "{}"),
    resumeData: JSON.parse(dbProfile?.resumeData || "{}"),
  };
}

async function saveProfile(userId: string, profile: UserProfile) {
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      skills: JSON.stringify(profile.skills || []),
      level: profile.level,
      preferences: JSON.stringify(profile.preferences || {}),
      resumeData: JSON.stringify(profile.resumeData || {}),
    },
    update: {
      skills: JSON.stringify(profile.skills || []),
      level: profile.level,
      preferences: JSON.stringify(profile.preferences || {}),
      resumeData: JSON.stringify(profile.resumeData || {}),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }

    const { message, reset } = parsed.data;
    const profile = await loadProfile(userId);

    let state = sessionStore.get(userId);

    if (!state || reset) {
      state = createInitialState(userId, profile);
      sessionStore.set(userId, state);

      if (!message.trim()) {
        return NextResponse.json({
          messages: state.messages,
          phase: state.currentPhase,
          jobMatches: state.jobMatches,
        });
      }
    }

    // keep latest DB profile unless mid resume-build
    const inResumeBuild = !!(state as any).resumeStep;
    if (!inResumeBuild) {
      state = { ...state, profile };
    }

    const newState = processUserMessage(state, message);

    // persist profile when agent updated it (resume build complete or enrich)
    const profileChanged =
      JSON.stringify(newState.profile) !== JSON.stringify(state.profile) ||
      (newState as any)._persistProfile === true;

    if (profileChanged || (newState as any)._persistProfile) {
      try {
        await saveProfile(userId, newState.profile);
      } catch (e) {
        console.error("Failed to save profile from agent:", e);
      }
    }

    sessionStore.set(userId, newState);

    return NextResponse.json({
      messages: newState.messages,
      phase: newState.currentPhase,
      jobMatches: newState.jobMatches,
      profileSaved: profileChanged,
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش پیام ایجنت" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const state = sessionStore.get(userId);

  if (!state) {
    return NextResponse.json({ messages: [], phase: null, jobMatches: [] });
  }

  return NextResponse.json({
    messages: state.messages,
    phase: state.currentPhase,
    jobMatches: state.jobMatches,
  });
}
