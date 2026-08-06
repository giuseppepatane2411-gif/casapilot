import ServiceCategory from "@/components/professional-os/ServiceCategory";

export default async function CategoriaServiziPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  return <ServiceCategory categoryId={categoryId} />;
}
