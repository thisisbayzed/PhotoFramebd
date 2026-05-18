const fs = require("fs");
const path = require("path");

const rootDist = path.join(__dirname, "..", "dist");
const srcDist = path.join(__dirname, "..", "src", "dist");

if (!fs.existsSync(rootDist)) {
  console.error("Build failed: dist folder was not created. Run tsc first.");
  process.exit(1);
}

fs.rmSync(srcDist, { recursive: true, force: true });
fs.cpSync(rootDist, srcDist, { recursive: true });
console.log("Synced dist/ to src/dist/ for Render compatibility");
