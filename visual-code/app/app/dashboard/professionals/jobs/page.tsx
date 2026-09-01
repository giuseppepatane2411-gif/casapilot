import Jobs from "@/components/professionals/Jobs";
import { requireProfessionalAccess } from "@/lib/auth/role-access";

export default async function Page() {
  await requireProfessionalAccess();
  return <Jobs />;
}
