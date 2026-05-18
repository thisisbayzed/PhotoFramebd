const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

if (!process.env.RENDER) {
  process.exit(0);
}

const findProjectRoot = () => {
  let dir = __dirname;

  for (let i = 0; i < 4; i += 1) {
    dir = path.dirname(dir);

    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "tsconfig.json"))
    ) {
      return dir;
    }
  }

  return path.join(__dirname, "..");
};

const root = findProjectRoot();

console.log("Render detected: building at", root);

execSync("npm install --include=dev --ignore-scripts", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

execSync("npm run build", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
