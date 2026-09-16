import { SettingsForm } from "@/components/admin/SettingsForm";
import { getRestaurant } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const restaurant = await getRestaurant();

  if (!restaurant) {
    return (
      <p className="text-muted">
        No restaurant row found. Run <code>supabase/seed.sql</code> once to create it.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Restaurant settings</h1>
      <SettingsForm restaurant={restaurant} />
    </div>
  );
}
