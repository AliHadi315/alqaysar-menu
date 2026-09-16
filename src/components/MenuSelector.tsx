"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";
import { MENU_TYPES } from "@/lib/types";
import type { Restaurant } from "@/lib/types";
import type { StringKey } from "@/lib/i18n";

export function MenuSelector({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLang();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MENU_TYPES.map((m, i) => {
        const image = restaurant.menu_images?.[m.type];
        return (
          <Reveal key={m.slug} index={i}>
          <Link
            href={`/menu/${m.slug}`}
            className="choice-card relative isolate flex min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl border border-line bg-ink text-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image}
                alt=""
                loading="lazy"
                className="choice-img absolute inset-0 -z-20 h-full w-full object-cover"
              />
            )}
            <div className="choice-scrim absolute inset-0 -z-10 bg-gradient-to-t from-ink/92 via-ink/60 to-ink/25" />

            <div className="p-6">
              <p className="font-display text-3xl">{t(`type.${m.type}` as StringKey)}</p>
              <p className="mt-1 text-sm text-ivory/75">{t(`blurb.${m.type}` as StringKey)}</p>
              <p className="choice-cta mt-3 text-sm text-gold">
                {t("home.viewMenu")} →
              </p>
            </div>
          </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
