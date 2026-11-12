import { defineConfig } from "astro/config";
import mediaIntegration from "./scripts/media-integration.mjs";

export default defineConfig({
  integrations: [mediaIntegration()],
  vite: {
    plugins: [
      {
        name: "cms-directory-index",
        configureServer(server) {
          // Vite serves public files verbatim but does not resolve directory indexes.
          server.middlewares.use((request, _response, next) => {
            if (request.url?.split("?")[0] === "/admin/") {
              request.url = request.url.replace("/admin/", "/admin/index.html");
            }
            next();
          });
        },
      },
    ],
  },
});
