"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUpload({ name, initialUrl }: { name: string; initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!ALLOWED.includes(file.type)) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setError("Image must be under 5 MB.");

    setBusy(true);
    const supabase = createClient();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = "items/" + crypto.randomUUID() + "." + ext;
    const { error: uploadError } = await supabase.storage
      .from("menu")
      .upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);

    if (uploadError) return setError(uploadError.message);
    setUrl(supabase.storage.from("menu").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      {url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" className="h-40 w-40 rounded-xl border border-line object-cover" />
      )}
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={ALLOWED.join(",")}
          onChange={onFile}
          disabled={busy}
          className="text-sm file:me-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:text-ivory"
        />
        {url && (
          <button type="button" onClick={() => setUrl("")} className="text-sm text-muted underline">
            Remove
          </button>
        )}
      </div>
      {busy && <p className="text-sm text-muted">Uploading...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
