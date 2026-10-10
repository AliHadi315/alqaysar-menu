import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { MenuSelector } from "@/components/MenuSelector";
import { VisitSection } from "@/components/VisitSection";
import { RestaurantJsonLd } from "@/components/StructuredData";
import { T } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";
import { getFeatured, getRestaurant } from "@/lib/menu";
import { formatPrice } from "@/lib/format";

export default function HomePage() {
  const restaurant = getRestaurant();
  const featured = getFeatured();
  const currency = restaurant.currency;
  const heroImages = restaurant.hero_images?.length
    ? restaurant.hero_images
    : restaurant.hero_image_url
      ? [restaurant.hero_image_url]
      : [];

  return (
    <>
      <RestaurantJsonLd restaurant={restaurant} />
      <SiteHeader name={restaurant.name} logoUrl={restaurant.logo_url} />

      {/*
        Brand band, deliberately short. This is a menu people reach by scanning a
        code at the table, so the Take Away / Tables choice has to be on screen
        without scrolling on a phone — the name and tagline get one band, no more.
      */}
      <section className="relative isolate overflow-hidden bg-ink text-ivory">
        {heroImages.length > 0 && (
          <>
            {/* A strip of the kitchen's own photography rather than one plate. */}
            <div className="absolute inset-0 -z-20 grid grid-cols-1 sm:grid-cols-3">
              {heroImages.map((src, i) => (
                /* One photo fills a phone; the strip only makes sense once it is wide. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`h-full w-full object-cover ${i > 0 ? "hidden sm:block" : ""}`}
                />
              ))}
            </div>
            {/* Scrim: the photos are bright, the hero type has to stay readable. */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/88 via-ink/78 to-ink/92" />
          </>
        )}
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:py-14">
          {restaurant.established && (
            <Reveal index={0}>
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-soft">{restaurant.established}</p>
            </Reveal>
          )}
          <Reveal index={1}>
            <h1 className="font-display text-4xl leading-tight sm:text-6xl">{restaurant.name}</h1>
          </Reveal>
          {restaurant.tagline && (
            <Reveal index={2}>
              <p className="mx-auto mt-3 max-w-xl text-base text-ivory/85 sm:text-lg">{restaurant.tagline}</p>
            </Reveal>
          )}
          {restaurant.badges.length > 0 && (
            <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.2em] text-ivory/70">
              {restaurant.badges.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/*
        The menu itself, directly under the band. No heading above it: two cards
        reading "Take Away" and "Tables" do not need a question introducing them,
        and the line cost 72px of the first screen.
      */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:py-16">
        <MenuSelector restaurant={restaurant} />
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-14 lg:pb-20">
          <Reveal blur={false}>
            <h2 className="mb-5 font-display text-2xl sm:text-3xl"><T k="home.favourites" /></h2>
          </Reveal>
          {/* Swipes on a phone, fills the width as a grid once there is room. */}
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {featured.map((item) => (
              <article
                key={item.slug}
                className="w-56 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface sm:w-auto"
              >
                <div className="aspect-[4/3] bg-line">
                  {item.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted/40">AQ</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base">{item.name}</h3>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(item.price, currency)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {restaurant?.description && (
        /* Container matches every other section; the paragraph itself stays
           narrow, because a 1152px line is unreadable. */
        <section className="mx-auto max-w-6xl px-4 pb-10 text-center sm:pb-14 lg:pb-20">
          <Reveal>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-ink-soft">{restaurant.description}</p>
          </Reveal>
        </section>
      )}

      <VisitSection restaurant={restaurant} />

      <Footer restaurant={restaurant} />
    </>
  );
}
