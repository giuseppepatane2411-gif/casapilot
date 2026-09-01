import AdminAnalytics from "@/components/professionals/AdminAnalytics";
import { requireAdminAccess } from "@/lib/auth/role-access";

export default async function Page() {
  await requireAdminAccess();
  return <AdminAnalytics />;
}
