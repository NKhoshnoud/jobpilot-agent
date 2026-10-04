export type AgentPhase =
  | "gathering_info"
  | "matching"
  | "refining"
  | "application"
  | "interview"
  | "final";

export interface UserProfile {
  skills: string[];
  level: "Intern" | "Junior" | null;
  preferences: {
    location?: string;
    remote?: boolean;
    salaryMin?: number;
    jobType?: string;
  };
  resumeData: {
    summary?: string;
    experience?: any[];
    education?: any[];
  };
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  type: string;
  required_skills: string[];
  nice_to_have: string[];
  experience_level: string;
  description: string;
  matchScore: number;
  matchReason: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  improvementTip?: string;
}

export interface AgentState {
  userId: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  profile: UserProfile;
  jobMatches: JobMatch[];
  feedbackHistory: { jobId?: string; text: string; type: string }[];
  currentPhase: AgentPhase;
  selectedJobId?: string;
  initialChance?: number;
  nextAction?: string;
}
