import LeadDetail from "@/components/professional-os/LeadDetail";

export default async function DettaglioLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <LeadDetail leadId={leadId} />;
}
