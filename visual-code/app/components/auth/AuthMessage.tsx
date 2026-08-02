import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function AuthMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];

  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${styles}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
