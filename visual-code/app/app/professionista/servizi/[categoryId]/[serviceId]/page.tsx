import ServiceSetupWizard from "@/components/professional-os/ServiceSetupWizard";

export default async function ConfigurazioneServizioPage({
  params,
}: {
  params: Promise<{
    categoryId: string;
    serviceId: string;
  }>;
}) {
  const { categoryId, serviceId } = await params;
  return (
    <ServiceSetupWizard
      categoryId={categoryId}
      serviceId={serviceId}
    />
  );
}
