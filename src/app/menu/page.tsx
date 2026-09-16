import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { MenuSelector } from "@/components/MenuSelector";
import { T } from "@/components/LanguageProvider";
import { getRestaurant } from "@/lib/menu";

export const metadata = { title: "Menu - Al Qaysr" };

export default function MenuIndexPage() {
  const restaurant = getRestaurant();
  return (
    <>
      <SiteHeader name={restaurant.name} logoUrl={restaurant.logo_url} />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-2 text-center font-display text-4xl"><T k="menu.title" /></h1>
        <p className="mb-10 text-center text-muted"><T k="menu.choose" /></p>
        <MenuSelector restaurant={restaurant} />
      </main>
      <Footer restaurant={restaurant} />
    </>
  );
}
