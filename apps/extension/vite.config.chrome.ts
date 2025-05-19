import { resolve } from "path";
import { mergeConfig, defineConfig, loadEnv, ConfigEnv } from "vite";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import baseConfig from "./vite.config.base";

const outDir = resolve(__dirname, "dist_chrome");

export default defineConfig((config: ConfigEnv) => {
  const base = baseConfig(config);
  const env = loadEnv(config.mode, process.cwd(), "VITE_");
  const baseManifest = JSON.parse(base.define?.baseManifest || "{}");

  return mergeConfig(base, {
    plugins: [
      crx({
        manifest: {
          ...baseManifest,
          background: {
            service_worker: "src/pages/background/index.ts",
            type: "module",
          },
        } as ManifestV3Export,
        browser: "chrome",
        contentScripts: {
          injectCss: true,
        },
      }),
    ],
    build: {
      ...(base.build || {}),
      outDir,
    },
  });
});
