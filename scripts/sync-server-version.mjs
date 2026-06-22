// Keep server.json's version in sync with package.json. Runs from the npm
// `version` lifecycle hook (during `npm version` / `npm run release`), so the
// synced server.json lands in the same version commit + tag.
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const server = JSON.parse(fs.readFileSync("server.json", "utf8"));

server.version = pkg.version;
if (Array.isArray(server.packages) && server.packages[0]) {
  server.packages[0].version = pkg.version;
}
fs.writeFileSync("server.json", JSON.stringify(server, null, 2) + "\n");
console.log(`synced server.json -> ${pkg.version}`);
