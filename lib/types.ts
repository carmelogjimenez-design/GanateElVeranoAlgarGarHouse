export type Team = { id: string; name: string; emoji: string; color: string; created_at: string };
export type Kid = {
  id: string; name: string; emoji: string; color: string; team_id: string | null;
  total_points: number; study_enabled: boolean; active: boolean; created_at: string; pin?: string;
  weekly_goal: number; can_tutor: boolean; app_access: boolean; avatar: string;
};
export type Task = {
  id: string; title: string; description: string; category: string; frequency: string;
  difficulty: string; points: number; priority: string; photo_required: boolean; active: boolean; created_at: string;
};
export type Assignment = {
  id: string; task_id: string | null; kid_id: string; team_id: string | null; title: string;
  points: number; photo_required: boolean; due_date: string | null;
  status: "todo" | "pending" | "approved" | "rejected";
  photo_url: string | null; note: string | null; completed_at: string | null; validated_at: string | null; created_at: string;
};
export type Reward = { id: string; title: string; description: string; emoji: string; cost: number; active: boolean; created_at: string };
export type Redemption = {
  id: string; kid_id: string; reward_id: string | null; title: string; cost: number;
  status: "pending" | "approved" | "rejected"; created_at: string; resolved_at: string | null;
};
export type Gift = {
  id: string; from_kid: string; to_kid: string; points: number; reason: string;
  status: "pending" | "approved" | "rejected"; created_at: string; resolved_at: string | null;
};
export type Subject = { id: string; kid_id: string; name: string; level: string; total_seconds: number; active: boolean; created_at: string };
export type StudySession = { id: string; kid_id: string; subject_id: string; seconds: number; day: string; created_at: string };
export type PointEvent = { id: string; kid_id: string; delta: number; reason: string; type: string; ref_id: string | null; created_at: string };

export type Settings = { id: number; team_goal: number; challenge_label: string; challenge_until: string | null; weekly_goal_default: number; study_reward_points: number; study_goal_seconds: number };
export type StudyReward = { id: string; kid_id: string; day: string; seconds: number; points: number; status: string; created_at: string; resolved_at: string | null };
export type TaskTarget = { id: string; task_id: string; kid_id: string; created_at: string };
export type Badge = { code: string; name: string; description: string; icon: string; color: string; sort: number };
export type KidBadge = { id: string; kid_id: string; badge_code: string; earned_at: string };

export type DB = {
  teams: Team[]; kids: Kid[]; tasks: Task[]; assignments: Assignment[];
  rewards: Reward[]; redemptions: Redemption[]; gifts: Gift[];
  subjects: Subject[]; study_sessions: StudySession[]; point_events: PointEvent[];
  task_targets: TaskTarget[]; settings: Settings | null;
  badges_catalog: Badge[]; kid_badges: KidBadge[]; study_rewards: StudyReward[];
};

export type Screen = "lobby" | "kid" | "admin";

export type Ctx = {
  db: DB;
  refresh: () => Promise<void>;
  flash: (m: string) => void;
  setScreen: (s: Screen) => void;
  setKid: (k: Kid | null) => void;
  kid: Kid | null;
  isAdmin: boolean;
  session: unknown;
  logout: () => Promise<void>;
};
