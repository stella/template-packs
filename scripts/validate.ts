#!/usr/bin/env bun
/**
 * Validate every pack under packs/:
 *
 * - pack.json conforms to schema/pack.schema.json (strict, additionalProperties false)
 * - pack id equals its directory name; LICENSE file present; license is an allowed SPDX id
 * - every declared template has a directory with the DOCX and README; every
 *   templates/<slug> directory is declared (no orphans)
 * - every DOCX carries the Stella template manifest (custom XML part, namespace
 *   urn:stella:template:v1) with at least one field, and the set of manifest
 *   fields equals the set of `{{placeholders}}` in the document
 *
 * Prints a table and exits non-zero on any failure.
 */

import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  inspectDocx,
  listPackDirs,
  listTemplateDirs,
  PACKS_DIR,
  readPackJson,
  REPO_ROOT,
} from "./lib/packs.ts";

type Row = { pack: string; template: string; fields: string; status: string };

const rows: Row[] = [];
const failures: string[] = [];

const fail = (message: string): void => {
  failures.push(message);
};

const setEquals = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const validateTemplateDocx = async (
  packId: string,
  templateSlug: string,
  docxPath: string,
): Promise<string> => {
  const inspection = await inspectDocx(await readFile(docxPath));
  const problems: string[] = [];
  if (inspection.manifestFields === null) {
    problems.push("no Stella manifest");
  } else if (inspection.manifestFields.length === 0) {
    problems.push("manifest has no fields");
  } else {
    const manifest = [...inspection.manifestFields].sort();
    if (!setEquals(manifest, inspection.placeholders)) {
      const missingInDoc = manifest.filter((f) => !inspection.placeholders.includes(f));
      const missingInManifest = inspection.placeholders.filter((f) => !manifest.includes(f));
      if (missingInDoc.length > 0) {
        problems.push(`manifest fields without marker: ${missingInDoc.join(", ")}`);
      }
      if (missingInManifest.length > 0) {
        problems.push(`markers without manifest field: ${missingInManifest.join(", ")}`);
      }
    }
    if (new Set(inspection.manifestFields).size !== inspection.manifestFields.length) {
      problems.push("duplicate manifest field paths");
    }
  }
  for (const problem of problems) {
    fail(`${packId}/${templateSlug}: ${problem}`);
  }
  rows.push({
    pack: packId,
    template: templateSlug,
    fields: String(inspection.manifestFields?.length ?? 0),
    status: problems.length === 0 ? "ok" : "FAIL",
  });
  return problems.length === 0 ? "ok" : "FAIL";
};

const validatePack = async (packId: string): Promise<void> => {
  const packDir = join(PACKS_DIR, packId);
  const result = await readPackJson(packDir);
  if (!result.ok) {
    for (const error of result.errors) {
      fail(`${packId}: ${error}`);
    }
    rows.push({ pack: packId, template: "-", fields: "-", status: "FAIL" });
    return;
  }
  const { manifest } = result;

  if (manifest.id !== packId) {
    fail(`${packId}: pack.json id "${manifest.id}" does not match directory name`);
  }
  const licensePath = join(packDir, "LICENSE");
  if (!existsSync(licensePath) || statSync(licensePath).size === 0) {
    fail(`${packId}: LICENSE file missing or empty`);
  }

  const declaredSlugs = manifest.templates.map((t) => t.slug);
  if (new Set(declaredSlugs).size !== declaredSlugs.length) {
    fail(`${packId}: duplicate template slugs in pack.json`);
  }
  const presentDirs = listTemplateDirs(packDir);
  for (const dir of presentDirs) {
    if (!declaredSlugs.includes(dir)) {
      fail(`${packId}: templates/${dir} exists but is not declared in pack.json`);
    }
  }

  for (const template of manifest.templates) {
    const expectedDir = `templates/${template.slug}/`;
    if (!template.file.startsWith(expectedDir) || !template.readme.startsWith(expectedDir)) {
      fail(`${packId}/${template.slug}: file and readme must live under ${expectedDir}`);
    }
    const docxPath = join(packDir, template.file);
    const readmePath = join(packDir, template.readme);
    const missing: string[] = [];
    if (!existsSync(docxPath)) {
      missing.push(relative(REPO_ROOT, docxPath));
    }
    if (!existsSync(readmePath)) {
      missing.push(relative(REPO_ROOT, readmePath));
    }
    if (missing.length > 0) {
      fail(`${packId}/${template.slug}: missing ${missing.join(", ")}`);
      rows.push({ pack: packId, template: template.slug, fields: "-", status: "FAIL" });
      continue;
    }
    await validateTemplateDocx(packId, template.slug, docxPath);
  }
};

const printTable = (): void => {
  const headers: Row = { pack: "pack", template: "template", fields: "fields", status: "status" };
  const all = [headers, ...rows];
  const width = (key: keyof Row) => Math.max(...all.map((r) => r[key].length));
  const line = (r: Row) =>
    `${r.pack.padEnd(width("pack"))}  ${r.template.padEnd(width("template"))}  ${r.fields.padStart(width("fields"))}  ${r.status}`;
  console.log(line(headers));
  console.log("-".repeat(line(headers).length));
  for (const row of rows) {
    console.log(line(row));
  }
};

const main = async (): Promise<void> => {
  const packIds = listPackDirs();
  if (packIds.length === 0) {
    fail("no packs found under packs/");
  }
  for (const packId of packIds) {
    await validatePack(packId);
  }
  printTable();
  if (failures.length > 0) {
    console.error(`\n${failures.length} problem(s):`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  console.log(`\n${rows.length} template(s) in ${packIds.length} pack(s): all checks passed`);
};

await main();
