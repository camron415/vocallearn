import { AppTourGate } from "@/components/AppTourGate";
import { AskShellProvider } from "@/components/AskShell";

const lab = process.env.VERCEL_ENV !== "production";

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return (
    <AskShellProvider lab={lab}>
      <AppTourGate>{children}</AppTourGate>
    </AskShellProvider>
  );
}
