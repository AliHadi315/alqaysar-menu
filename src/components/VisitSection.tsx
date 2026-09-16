"use client";

import { useState } from "react";

import { useLang } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";
import { mapsLinks, enquiryUrl, telUrl } from "@/lib/contact";
import type { Restaurant } from "@/lib/types";

export function VisitSection({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLang();
  const [mapLive, setMapLive] = useState(false);
  const maps = mapsLinks(restaurant);
  const whatsapp = enquiryUrl(restaurant);
  const tel = telUrl(restaurant);

  if (!maps && !whatsapp && !tel) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <Reveal>
        <h2 className="mb-6 font-display text-3xl">{t("visit.find")}</h2>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {maps && (
          <div className="visit-map relative overflow-hidden rounded-2xl border border-line bg-surface" onClick={() => setMapLive(true)}>
            <iframe
              src={maps.embed}
              title={`Map showing ${restaurant.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className={`h-72 w-full border-0 lg:h-full lg:min-h-[320px] ${mapLive ? "" : "pointer-events-none"}`}
            />

            {/* Until it is clicked the map ignores the pointer, so the container can
                show a hover state and the map cannot hijack page scrolling. */}
            {!mapLive && (
              <span className="map-hint pointer-events-none absolute bottom-3 start-3 rounded-full bg-ink/85 px-3 py-1.5 text-xs text-ivory">
                {t("visit.mapHint")}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col justify-center gap-5 rounded-2xl border border-line bg-surface p-6">
          {restaurant.address && (
            <p className="whitespace-pre-line text-lg leading-relaxed">{restaurant.address}</p>
          )}
          {restaurant.opening_hours && (
            <p className="whitespace-pre-line text-sm text-muted">{restaurant.opening_hours}</p>
          )}

          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="send-btn inline-flex min-h-11 items-center rounded-full bg-[#25D366] px-6 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {t("visit.order")}
              </a>
            )}
            {tel && (
              <a href={tel} className="visit-btn inline-flex min-h-11 items-center rounded-full border border-line px-6 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                {t("visit.call", { phone: restaurant.phone ?? "" })}
              </a>
            )}
            {maps && (
              <a
                href={maps.directions}
                target="_blank"
                rel="noreferrer"
                className="visit-btn inline-flex min-h-11 items-center rounded-full border border-line px-6 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {t("visit.directions")}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
