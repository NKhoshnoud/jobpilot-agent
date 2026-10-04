import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  skills: z.array(z.string()).max(30).optional(),
  level: z.enum(["Intern", "Junior"]).optional().nullable(),
  preferences: z
    .object({
      location: z.string().optional(),
      remote: z.boolean().optional(),
      salaryMin: z.number().optional(),
      jobType: z.string().optional(),
    })
    .optional(),
  resumeData: z
    .object({
      summary: z.string().optional(),
      experience: z.array(z.any()).optional(),
      education: z.array(z.any()).optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json({
      skills: [],
      level: null,
      preferences: {},
      resumeData: {},
    });
  }

  return NextResponse.json({
    skills: JSON.parse(profile.skills || "[]"),
    level: profile.level,
    preferences: JSON.parse(profile.preferences || "{}"),
    resumeData: JSON.parse(profile.resumeData || "{}"),
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "داده‌های پروفایل معتبر نیست", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        skills: JSON.stringify(data.skills ?? []),
        level: data.level ?? null,
        preferences: JSON.stringify(data.preferences ?? {}),
        resumeData: JSON.stringify(data.resumeData ?? {}),
      },
      update: {
        ...(data.skills !== undefined && { skills: JSON.stringify(data.skills) }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.preferences !== undefined && {
          preferences: JSON.stringify(data.preferences),
        }),
        ...(data.resumeData !== undefined && {
          resumeData: JSON.stringify(data.resumeData),
        }),
      },
    });

    return NextResponse.json({
      skills: JSON.parse(updated.skills || "[]"),
      level: updated.level,
      preferences: JSON.parse(updated.preferences || "{}"),
      resumeData: JSON.parse(updated.resumeData || "{}"),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "خطا در ذخیره پروفایل" },
      { status: 500 }
    );
  }
}
