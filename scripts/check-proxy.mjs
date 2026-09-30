// Fails the build if a signed-in page isn't covered by the Clerk proxy matcher in src/proxy.ts.
// Without it, auth() on that page throws and the page shows an error.
import fs from "node:fs";

const dir = "src/app/(app)/(signed-in)";
const proxy = fs.readFileSync("src/proxy.ts", "utf8");
const routes = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const missing = routes.filter((r) => !proxy.includes(`"/${r}/:path*"`) && !proxy.includes(`"/${r}"`));
if (missing.length) {
  console.error(`src/proxy.ts matcher is missing signed-in routes: ${missing.map((r) => "/" + r).join(", ")}`);
  process.exit(1);
}
console.log(`Proxy matcher covers all ${routes.length} signed-in routes`);
