"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatLbp, formatPrice } from "@/lib/format";
import { checkoutProblem, deliveryFeeFor, needsAddress, orderTotals } from "@/lib/checkout";
import type { CustomerDetails } from "@/lib/checkout";
import { loadDetails, orderTotal, orderUrl, saveDetails } from "@/lib/order";
import type { OrderLine } from "@/lib/order";
import type { StringKey } from "@/lib/i18n";
import type { MenuType, Restaurant } from "@/lib/types";

/**
 * Collects the name, phone and — for delivery — area and address, then hands
 * the whole thing to WhatsApp.
 *
 * The confirm control is a real link rather than a button that navigates:
 * mobile browsers block window.open outside a direct user gesture, and a link
 * also lets someone long-press to open WhatsApp Web instead.
 */
export function CheckoutSheet({
  open,
  lines,
  restaurant,
  menuType,
  onClose,
}: {
  open: boolean;
  lines: OrderLine[];
  restaurant: Restaurant;
  menuType: MenuType;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [details, setDetails] = useState<CustomerDetails>({ name: "", phone: "", zone: "", address: "" });
  const [touched, setTouched] = useState(false);

  // Read storage on open, not on mount: the sheet renders during SSR too, and
  // localStorage is not there yet.
  useEffect(() => {
    if (open) setDetails(loadDetails());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const zones = restaurant.delivery_zones ?? [];
  const wantsAddress = needsAddress(menuType);
  const problem = checkoutProblem(menuType, details, zones);

  const subtotal = orderTotal(lines);
  const fee = wantsAddress ? deliveryFeeFor(zones, details.zone) : 0;
  const { total } = orderTotals(subtotal, fee);

  const money = (n: number) => {
    const lbp = formatLbp(n, restaurant.lbp_rate);
    return formatPrice(n, restaurant.currency) + (lbp ? ` · ${lbp}` : "");
  };

  const set = (patch: Partial<CustomerDetails>) => setDetails({ ...details, ...patch });
  const href = problem ? null : orderUrl(restaurant, menuType, lines, details);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("checkout.title")}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl sm:p-6"
      >
        <h2 className="font-display text-2xl">{t("checkout.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("checkout.intro")}</p>

        <div className="mt-5 space-y-4">
          <label className="block text-sm">
            {t("checkout.name")}
            <input
              type="text"
              autoComplete="name"
              value={details.name}
              onChange={(e) => set({ name: e.target.value })}
              className="a-input mt-1"
            />
          </label>

          <label className="block text-sm">
            {t("checkout.phone")}
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={details.phone}
              onChange={(e) => set({ phone: e.target.value })}
              className="a-input mt-1"
            />
          </label>

          {wantsAddress && zones.length > 0 && (
            <label className="block text-sm">
              {t("checkout.zone")}
              <select
                value={details.zone ?? ""}
                onChange={(e) => set({ zone: e.target.value })}
                className="a-input mt-1"
              >
                <option value="">{t("checkout.zonePick")}</option>
                {zones.map((z) => (
                  <option key={z.name} value={z.name}>
                    {z.name}
                    {z.fee > 0 ? ` — ${formatPrice(z.fee, restaurant.currency)}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {wantsAddress && (
            <label className="block text-sm">
              {t("checkout.address")}
              <textarea
                rows={2}
                autoComplete="street-address"
                placeholder={t("checkout.addressHint")}
                value={details.address ?? ""}
                onChange={(e) => set({ address: e.target.value })}
                className="a-input mt-1 py-2"
              />
            </label>
          )}
        </div>

        <dl className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
          {fee > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">{t("checkout.subtotal")}</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("checkout.deliveryFee")}</dt>
                <dd>{money(fee)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between font-semibold">
            <dt>{t("checkout.total")}</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>

        {touched && problem && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {t(problem as StringKey)}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={() => saveDetails(details)}
              className="send-btn flex-1 rounded-full bg-[#25D366] px-6 py-3 text-center text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {t("checkout.confirm")}
            </a>
          ) : (
            /* Not disabled: a disabled control gives no reason. This shows the
               first missing field the moment they try. */
            <button
              type="button"
              onClick={() => setTouched(true)}
              className="send-btn flex-1 rounded-full bg-[#25D366] px-6 py-3 text-center text-sm font-medium text-ink opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {t("checkout.confirm")}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-6 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t("checkout.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
