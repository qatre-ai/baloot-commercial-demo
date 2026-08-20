// Cross-platform replacement for the previous Unix-only `cp -r` build step.
// Next.js `output: "standalone"` does not copy static assets or `public/`
// into the standalone bundle, so we do it here in portable Node.
import { cp, access } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standalone))) {
    throw new Error(
      `.next/standalone not found. Ensure next.config.ts sets output: "standalone" and that \`next build\` succeeded.`,
    );
  }

  const copies = [
    { from: join(root, ".next", "static"), to: join(standalone, ".next", "static") },
    { from: join(root, "public"), to: join(standalone, "public") },
  ];

  for (const { from, to } of copies) {
    if (!(await exists(from))) {
      console.warn(`[postbuild] skipped (missing): ${from}`);
      continue;
    }
    await cp(from, to, { recursive: true, force: true });
    console.log(`[postbuild] copied ${from} -> ${to}`);
  }

  console.log("[postbuild] standalone bundle ready");
}

main().catch((err) => {
  console.error("[postbuild] FAILED:", err.message);
  process.exit(1);
});
