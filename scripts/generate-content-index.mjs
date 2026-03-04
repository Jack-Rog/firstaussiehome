import { promises as fs } from "node:fs";
import path from "node:path";

async function walk(target) {
  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(target, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }
      return fullPath.endsWith(".mdx") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

const files = await walk(path.join(process.cwd(), "content", "learn"));
console.log(`Found ${files.length} MDX content files.`);
