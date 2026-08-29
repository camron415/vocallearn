"use client";

import type { ReactNode } from "react";
import { WaterPane } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <div className="login-stage">
      <WaterPane className="login-card">
        <p className="brand-mark">{APP_NAME}</p>
        <h1 className="login-title">{title}</h1>
        <p className="login-sub">{sub}</p>
        {children}
      </WaterPane>
    </div>
  );
}
