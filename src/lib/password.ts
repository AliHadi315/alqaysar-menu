/**
 * Rules for the admin's own password change. Kept free of imports so
 * `npm run check` can exercise it without React or a Supabase client.
 *
 * Returns null when the three fields are acceptable, otherwise the one thing
 * to tell the owner. Empty fields stay quiet: the form should not scold
 * someone who is still typing.
 */
export function passwordProblem(current: string, next: string, confirm: string): string | null {
  if (next && next.length < 8) return "Use at least 8 characters.";
  if (confirm && next !== confirm) return "The two new passwords do not match.";
  if (current && next && current === next) return "That is already the current password.";
  return null;
}
