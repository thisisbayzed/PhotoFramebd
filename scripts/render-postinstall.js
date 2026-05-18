if (!process.env.RENDER) {
  process.exit(0);
}

const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

console.log("Render detected: running production build...");
execSync("npm run build", { cwd: root, stdio: "inherit" });
