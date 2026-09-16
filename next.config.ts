import type { NextConfig } from "next";

const config: NextConfig = {
  // Pure static site: `npm run build` emits ./out, deployable to any host.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default config;
