import { redirect } from "next/navigation";

export default async function LegacyPreview({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  redirect(view === "chat" ? "/preview?view=chat" : "/preview");
}
