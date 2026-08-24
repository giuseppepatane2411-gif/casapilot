export type CaseTask = {
  id: string;
  title: string;
  category: string;
  phase: string | null;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: number;
  due_at: string | null;
  assigned_to: "owner" | "guimmia" | "professional";
  action_url: string | null;
  why_it_matters: string | null;
};

export function progressPercent(tasks: CaseTask[]) {
  if (!tasks.length) return 0;
  const done = tasks.filter((x) => x.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export function nextTask(tasks: CaseTask[]) {
  return tasks.find((x) => x.status === "in_progress") ?? tasks.find((x) => x.status === "blocked") ?? tasks.find((x) => x.status === "todo") ?? null;
}
