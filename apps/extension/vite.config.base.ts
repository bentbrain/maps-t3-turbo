import { ManifestV3Export } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { BuildOptions, defineConfig, loadEnv, ConfigEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { crxI18n, stripDevIcons } from "./custom-vite-plugins";
import devManifest from "./manifest.dev.json";
import manifest from "./manifest.json";
import pkg from "./package.json";

export default defineConfig((config: ConfigEnv) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(config.mode, process.cwd(), "VITE_");
  const isDev = process.env.__DEV__ === "true";
  const localize = false;

  // Process manifest with environment variables
  const processManifest = (manifest: any): ManifestV3Export => {
    const processed = JSON.parse(
      JSON.stringify(manifest, (_, value) => {
        if (typeof value === "string" && value.startsWith("$VITE_")) {
          // Extract just the environment variable name without any URL patterns
          const envVar = value.match(/\$VITE_[A-Z_]+/)?.[0].slice(1);
          if (!envVar) return value;

          const envValue = env[envVar];
          if (!envValue) {
            throw new Error(`Environment variable ${envVar} is not defined`);
          }

          // Replace only the env var part, keeping any URL patterns
          return value.replace(`$${envVar}`, envValue);
        }
        return value;
      })
    );
    return processed;
  };

  const baseManifest = {
    ...processManifest(manifest),
    version: pkg.version,
    ...(isDev ? devManifest : ({} as ManifestV3Export)),
    ...(localize
      ? {
          name: "__MSG_extName__",
          description: "__MSG_extDescription__",
          default_locale: "en",
        }
      : {}),
  } as ManifestV3Export;

  const baseBuildOptions: BuildOptions = {
    sourcemap: isDev,
    emptyOutDir: !isDev,
  };

  return {
    define: {
      // Expose env variables to client-side code
      ...Object.fromEntries(
        Object.entries(env).map(([key, value]) => [
          `import.meta.env.${key}`,
          JSON.stringify(value),
        ])
      ),
      // Expose the processed manifest to other configs
      baseManifest: JSON.stringify(baseManifest),
    },
    build: baseBuildOptions,
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      react(),
      stripDevIcons(isDev),
      crxI18n({ localize, src: "./src/locales" }),
    ],
    publicDir: resolve(__dirname, "public"),
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
});
