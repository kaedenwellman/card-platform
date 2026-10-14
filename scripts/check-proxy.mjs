// Fails the build if a page under src/app/(app) isn't covered by the Clerk proxy matcher in
// src/proxy.ts. Those pages share a layout that uses Clerk, so without the proxy they show an error.
import fs from "node:fs";

const proxy = fs.readFileSync("src/proxy.ts", "utf8");
const routesIn = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("("))
    .map((d) => d.name);
const routes = [...routesIn("src/app/(app)"), ...routesIn("src/app/(app)/(signed-in)")];
const missing = routes.filter((r) => !proxy.includes(`"/${r}/:path*"`) && !proxy.includes(`"/${r}"`));
if (missing.length) {
  console.error(`src/proxy.ts matcher is missing routes: ${missing.map((r) => "/" + r).join(", ")}`);
  process.exit(1);
}
console.log(`Proxy matcher covers all ${routes.length} app routes`);
