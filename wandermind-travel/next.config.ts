import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * `better-sqlite3` is an *optional* native module: we never install it by default, because
 * on a new Node it would have to be compiled (Python + MSVC) and that is the single most
 * common way this project fails to start on Windows. The app runs on Node's built-in
 * `node:sqlite` instead — see lib/sqlite.ts.
 *
 * Because the package is usually absent, the bundler would otherwise warn
 * "Module not found: Can't resolve 'better-sqlite3'" on every request. Aliasing it to an
 * empty module when it isn't installed keeps the terminal clean; when it *is* installed
 * (`npm run enable-native-sqlite`) the real package is used.
 */
const hasNativeSqlite = existsSync(join(process.cwd(), "node_modules", "better-sqlite3", "package.json"));

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  webpack: (config) => {
    if (!hasNativeSqlite) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = { ...(config.resolve.alias ?? {}), "better-sqlite3": false };
    }
    return config;
  },
};

export default nextConfig;
