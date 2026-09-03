import { redirect } from "next/navigation";

/** Short public URL for meetups / QR — same as `/preview`, zero API cost. */
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ save?: string }>;
}) {
  const { save } = await searchParams;
  if (save === "1" || save === "demo") {
    redirect("/preview?view=chat&save=1");
  }
  redirect("/preview");
}
