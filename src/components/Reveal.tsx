"use client";

import { useEffect, useRef } from "react";

/**
 * Fades, un-blurs and lifts its children into view the first time they appear.
 * Effect adapted from "Reveal" by asanshay on 21st.dev, which uses motion/react;
 * this is the same animation with an IntersectionObserver and a CSS transition,
 * so the site ships no animation runtime.
 *
 * The hiding styles are scoped to `html.js` (set by the boot script in layout),
 * so with JavaScript off nothing is ever invisible.
 */
let observer: IntersectionObserver | null = null;

function watch(el: Element) {
  if (typeof IntersectionObserver === "undefined") {
    el.classList.add("is-visible");
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        }
      }
    },
    // threshold must stay 0: a menu section is taller than the viewport, so a
    // fractional threshold can never be met and the section would never appear.
    { threshold: 0, rootMargin: "0px 0px -80px 0px" }
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

export function Reveal({
  children,
  index = 0,
  blur = true,
  className = "",
}: {
  children: React.ReactNode;
  /** Position in a group — each step delays the animation by 90ms. */
  index?: number;
  /** Blur costs GPU on big subtrees; turn it off for whole menu sections. */
  blur?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Anything already on screen reveals on the next frame. The observer is only
    // needed for content further down, and this way a missed observer callback
    // can never leave visible content stuck at opacity 0.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      const frame = requestAnimationFrame(() => el.classList.add("is-visible"));
      return () => cancelAnimationFrame(frame);
    }

    return watch(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${blur ? "" : "reveal-noblur"} ${className}`}
      style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
