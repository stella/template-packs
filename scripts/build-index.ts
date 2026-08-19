#!/usr/bin/env bun
/**
 * Generate index.json from packs/*.
 *
 *   bun scripts/build-index.ts          # write index.json
 *   bun scripts/build-index.ts --check  # exit 1 if index.json is stale
 *
 * The index is the only file a consumer needs to read to list packs and
 * templates without opening any DOCX; each template entry carries the
 * manifest field names and the sha256 of the DOCX.
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  buildIndexEntry,
  INDEX_PATH,
  listPackDirs,
  PACKS_DIR,
  readPackJson,
  renderIndex,
  REPO_ROOT,
  type IndexPack,
} from "./lib/packs.ts";

const check = process.argv.includes("--check");

const main = async (): Promise<void> => {
  const packs: IndexPack[] = [];
  for (const packId of listPackDirs()) {
    const packDir = join(PACKS_DIR, packId);
    const result = await readPackJson(packDir);
    if (!result.ok) {
      console.error(`${packId}: invalid pack.json (run validate):`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
    packs.push(await buildIndexEntry(packDir, result.manifest));
  }

  const rendered = renderIndex(packs);
  const indexRel = relative(REPO_ROOT, INDEX_PATH);

  if (check) {
    const current = existsSync(INDEX_PATH) ? await readFile(INDEX_PATH, "utf8") : "";
    if (current !== rendered) {
      console.error(`${indexRel} is stale; run \`bun scripts/build-index.ts\` and commit the result`);
      process.exit(1);
    }
    console.log(`${indexRel} is up to date (${packs.length} pack(s))`);
    return;
  }

  await writeFile(INDEX_PATH, rendered);
  console.log(`wrote ${indexRel} (${packs.length} pack(s), ${packs.reduce((n, p) => n + p.templateCount, 0)} template(s))`);
};

await main();
