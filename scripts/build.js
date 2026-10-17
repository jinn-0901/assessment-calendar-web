const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const assetsDir = path.join(distDir, "assets");

fs.mkdirSync(assetsDir, { recursive: true });
fs.copyFileSync(
  path.join(root, "client", "index.html"),
  path.join(distDir, "index.html")
);

esbuild.build({
  entryPoints: [path.join(root, "client", "src", "main.jsx")],
  bundle: true,
  minify: true,
  sourcemap: false,
  platform: "browser",
  target: ["es2020"],
  outfile: path.join(assetsDir, "app.js"),
  loader: { ".jsx": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info"
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
