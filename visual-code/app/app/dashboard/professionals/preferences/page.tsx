import { redirect } from "next/navigation";

export default function LegacyCommunicationPreferencesPage() {
  redirect("/dashboard/settings/communication");
}
