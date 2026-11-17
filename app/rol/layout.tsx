import type { ReactNode } from "react";
import { Alegreya, Cinzel } from "next/font/google";
import { SiteShell } from "@/components/site-shell";

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rol-display",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-rol-body",
});

interface RoleLayoutProps {
  children: ReactNode;
}

export default function RoleLayout({ children }: RoleLayoutProps) {
  return (
    <div
      className={`
        ${cinzel.variable}
        ${alegreya.variable}
        rol-typography
        font-(family-name:--font-rol-body)
      `}
    >
      <SiteShell>{children}</SiteShell>
    </div>
  );
}
