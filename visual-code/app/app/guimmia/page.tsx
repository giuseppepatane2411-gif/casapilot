import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GuimmiaAssistantAlias({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const source = await searchParams;
  const params = new URLSearchParams();
  params.set("brand", "guimmia");

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  }

  redirect(`/pilot?${params.toString()}`);
}
