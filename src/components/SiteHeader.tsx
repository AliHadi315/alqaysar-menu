"use client";

import Link from "next/link";
import { LanguageToggle, useLang } from "@/components/LanguageProvider";

export function SiteHeader({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const { t } = useLang();
  return (
    <header className="border-b border-line bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="brand flex items-center gap-2.5">
          {logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt="" className="brand-logo h-10 w-10 object-contain" />
          )}
          <span className="brand-name font-display text-xl tracking-wide">{name}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/menu" className="link-underline">{t("nav.menu")}</Link>
          <Link href="/#visit" className="link-underline">{t("nav.visit")}</Link>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
