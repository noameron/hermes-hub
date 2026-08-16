import Link from "next/link";
import type { ReactNode } from "react";

import { HubNav } from "@/components/hub/nav-client";

export async function HubShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="hub-shell">
      <aside className="hub-sidebar">
        <Link className="hub-brand" href="/">
          <span className="hub-brand-mark">H</span>
          <div>
            <strong>Hermes Hub</strong>
            <p>Personal information home</p>
          </div>
        </Link>

        <HubNav />
      </aside>

      <main className="hub-main">
        <header className="hub-header">
          <div>
            <p className="eyebrow">Hermes personal hub</p>
            <h1>{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
