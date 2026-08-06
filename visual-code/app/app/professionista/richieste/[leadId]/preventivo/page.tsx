import QuoteBuilder from "@/components/professional-os/QuoteBuilder";

export default async function PreventivoLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <QuoteBuilder leadId={leadId} />;
}
