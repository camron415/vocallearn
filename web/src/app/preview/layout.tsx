import { Suspense } from "react";
import { AskShellProvider } from "@/components/AskShell";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AskShellProvider lab>{children}</AskShellProvider>;
}
