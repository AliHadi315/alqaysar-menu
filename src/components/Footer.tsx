"use client";

import { useLang } from "@/components/LanguageProvider";
import { enquiryUrl } from "@/lib/contact";
import type { Restaurant } from "@/lib/types";

export function Footer({ restaurant }: { restaurant: Restaurant | null }) {
  const { t } = useLang();
  const whatsapp = restaurant ? enquiryUrl(restaurant) : null;
  return (
    <footer id="visit" className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl">{restaurant?.name ?? "Al Qaysr"}</p>
          {restaurant?.tagline && <p className="mt-2 text-sm text-muted">{restaurant.tagline}</p>}
        </div>

        <div className="text-sm">
          <p className="mb-2 font-medium uppercase tracking-wide text-muted">{t("footer.contact")}</p>
          {restaurant?.phone && <p><a className="link-underline" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a></p>}
          {restaurant?.email && <p><a className="link-underline" href={`mailto:${restaurant.email}`}>{restaurant.email}</a></p>}
          {whatsapp && (
            <p>
              <a className="link-underline" href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </p>
          )}
        </div>

        <div className="text-sm">
          <p className="mb-2 font-medium uppercase tracking-wide text-muted">{t("footer.findUs")}</p>
          {restaurant?.address && <p className="whitespace-pre-line">{restaurant.address}</p>}
          {restaurant?.maps_url && (
            <a className="link-underline mt-2 inline-block" href={restaurant.maps_url} target="_blank" rel="noreferrer">
              {t("footer.openMaps")}
            </a>
          )}
        </div>

        <div className="text-sm">
          <p className="mb-2 font-medium uppercase tracking-wide text-muted">{t("footer.hours")}</p>
          {restaurant?.opening_hours && <p className="whitespace-pre-line">{restaurant.opening_hours}</p>}
          <div className="mt-3 flex gap-3">
            {restaurant?.instagram_url && <a className="link-underline" href={restaurant.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
            {restaurant?.facebook_url && <a className="link-underline" href={restaurant.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-line px-4 py-5 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {restaurant?.name ?? "Al Qaysr"}. {t("footer.rights")}
        </p>
        <p>{t("footer.createdBy", { name: "Ali Hadi Meselmani" })}</p>
      </div>
    </footer>
  );
}
