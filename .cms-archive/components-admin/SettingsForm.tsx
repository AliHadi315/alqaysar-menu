"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { saveSettings } from "@/app/admin/actions";
import type { Restaurant } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-gold";

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    const res = await saveSettings(restaurant.id, formData);
    setBusy(false);
    setMessage(res?.error ?? "Saved.");
  }

  const text = (name: keyof Restaurant, label: string, type = "text") => (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} defaultValue={(restaurant[name] as string) ?? ""} className={field} />
    </label>
  );

  return (
    <form action={onSubmit} className="max-w-2xl space-y-5">
      {text("name", "Restaurant name")}
      {text("tagline", "Tagline")}

      <label className="block text-sm">
        About
        <textarea
          name="description"
          rows={3}
          defaultValue={restaurant.description ?? ""}
          className="mt-1 w-full rounded-lg border border-line p-3 outline-none focus:border-gold"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        {text("currency", "Currency symbol")}
        {text("phone", "Phone", "tel")}
        {text("email", "Email", "email")}
        {text("maps_url", "Google Maps link", "url")}
        {text("instagram_url", "Instagram", "url")}
        {text("facebook_url", "Facebook", "url")}
      </div>

      <label className="block text-sm">
        Address
        <textarea
          name="address"
          rows={2}
          defaultValue={restaurant.address ?? ""}
          className="mt-1 w-full rounded-lg border border-line p-3 outline-none focus:border-gold"
        />
      </label>

      <label className="block text-sm">
        Opening hours
        <textarea
          name="opening_hours"
          rows={2}
          defaultValue={restaurant.opening_hours ?? ""}
          className="mt-1 w-full rounded-lg border border-line p-3 outline-none focus:border-gold"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="text-sm">
          Logo
          <div className="mt-1">
            <ImageUpload name="logo_url" initialUrl={restaurant.logo_url} />
          </div>
        </div>
        <div className="text-sm">
          Hero image
          <div className="mt-1">
            <ImageUpload name="hero_image_url" initialUrl={restaurant.hero_image_url} />
          </div>
        </div>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}

      <button type="submit" disabled={busy} className="rounded-lg bg-ink px-6 py-3 text-sm text-ivory disabled:opacity-60">
        {busy ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
