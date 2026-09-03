"use client";

import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  sub,
  children,
  footer,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="login-stage">
      <div className="login-card auth-card">
        <p className="brand-mark">{APP_NAME}</p>
        <h1 className="login-title">{title}</h1>
        <p className="login-sub">{sub}</p>
        {children}
        {footer ? <div className="login-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
