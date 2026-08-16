"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { hubNavigation } from "@/components/hub/navigation";

export function HubNav() {
  const pathname = usePathname();

  return (
    <nav className="hub-nav" aria-label="Primary">
      {hubNavigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            className={`hub-nav-item${active ? " active" : ""}`}
            href={item.href}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </Link>
        );
      })}
    </nav>
  );
}
