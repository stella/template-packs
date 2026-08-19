/**
 * Shared pack reading for validate.ts and build-index.ts.
 *
 * Reads packs/<id>/pack.json, validates it against schema/pack.schema.json,
 * and inspects each template DOCX (Stella manifest fields, `{{placeholders}}`,
 * sha256). Pure functions over the filesystem; no Stella dependency.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import JSZip from "jszip";

import schema from "../../schema/pack.schema.json" with { type: "json" };

export const REPO_ROOT = resolve(import.meta.dir, "../..");
export const PACKS_DIR = join(REPO_ROOT, "packs");
export const INDEX_PATH = join(REPO_ROOT, "index.json");

/** Namespace of the Stella template manifest custom XML part. */
export const MANIFEST_NS = "urn:stella:template:v1";

export type Jurisdiction = { country: string; subdivision?: string };
export type Author = {
  name: string;
  organization?: string;
  url?: string;
  role: "drafter" | "reviewer" | "converter";
  date?: string;
};
export type TemplateEntry = {
  slug: string;
  title: string;
  file: string;
  readme: string;
  jurisdictions?: Jurisdiction[];
  languages?: string[];
  legalArea?: string;
  license?: string;
};
export type PackManifest = {
  id: string;
  name: string;
  version: string;
  description: string;
  license: string;
  licenseUrl: string;
  source: { name: string; url: string; retrievedAt: string };
  authors: Author[];
  jurisdictions: Jurisdiction[];
  languages: string[];
  legalAreas: string[];
  lastReviewedAt: string;
  disclaimer: string;
  templates: TemplateEntry[];
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validatePackJson = ajv.compile<PackManifest>(schema);

export const formatSchemaErrors = (errors: ErrorObject[] | null | undefined): string[] =>
  (errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim());

export type PackJsonResult =
  | { ok: true; manifest: PackManifest }
  | { ok: false; errors: string[] };

export const readPackJson = async (packDir: string): Promise<PackJsonResult> => {
  const path = join(packDir, "pack.json");
  if (!existsSync(path)) {
    return { ok: false, errors: ["pack.json missing"] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`pack.json is not valid JSON: ${String(error)}`] };
  }
  if (!validatePackJson(parsed)) {
    return { ok: false, errors: formatSchemaErrors(validatePackJson.errors) };
  }
  return { ok: true, manifest: parsed };
};

export const listPackDirs = (): string[] => {
  if (!existsSync(PACKS_DIR)) {
    return [];
  }
  return readdirSync(PACKS_DIR)
    .filter((name) => !name.startsWith(".") && statSync(join(PACKS_DIR, name)).isDirectory())
    .sort();
};

export const listTemplateDirs = (packDir: string): string[] => {
  const dir = join(packDir, "templates");
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => !name.startsWith(".") && statSync(join(dir, name)).isDirectory())
    .sort();
};

// ── DOCX inspection ───────────────────────────────────────

const CONTENT_PART_RE = /^word\/(?:document|header\d+|footer\d+)\.xml$/u;
// Same marker grammar as Stella's placeholderPattern (@stll/template-conditions).
const PLACEHOLDER_RE = /\{\{\s*(?<name>[\p{L}\p{N}_.@:-]+)\s*\}\}/gu;
const TEXT_OR_PARA_END_RE = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:t(?:\s[^>]*)?\/>|<\/w:p>/gu;

const decodeXml = (s: string): string =>
  s
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&#(\d+);/gu, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/gu, (_, h: string) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&amp;/gu, "&");

/** Concatenate `w:t` text per paragraph and collect `{{name}}` markers. */
const scanPlaceholders = (xml: string, into: Map<string, number>): void => {
  let paragraph = "";
  const flush = () => {
    for (const match of paragraph.matchAll(PLACEHOLDER_RE)) {
      const name = match.groups?.["name"];
      if (!name || name.startsWith("@")) {
        continue;
      }
      into.set(name, (into.get(name) ?? 0) + 1);
    }
    paragraph = "";
  };
  for (const match of xml.matchAll(TEXT_OR_PARA_END_RE)) {
    if (match[0] === "</w:p>") {
      flush();
      continue;
    }
    paragraph += decodeXml(match[1] ?? "");
  }
  flush();
};

export type DocxInspection = {
  sha256: string;
  /** Field paths declared in the Stella manifest, or null when no manifest part exists. */
  manifestFields: string[] | null;
  /** Unique `{{name}}` markers found in body, headers and footers. */
  placeholders: string[];
};

export const inspectDocx = async (buffer: Buffer): Promise<DocxInspection> => {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const zip = await JSZip.loadAsync(buffer);

  let manifestFields: string[] | null = null;
  for (const path of Object.keys(zip.files).filter((p) => /^customXml\/item\d+\.xml$/u.test(p)).sort()) {
    const xml = await zip.file(path)!.async("string");
    if (!xml.includes(MANIFEST_NS)) {
      continue;
    }
    const fields: string[] = [];
    for (const match of xml.matchAll(/<(?:[\w.-]+:)?field\b[^>]*?\bpath="([^"]*)"/gu)) {
      fields.push(decodeXml(match[1] ?? ""));
    }
    manifestFields = fields;
    break;
  }

  const counts = new Map<string, number>();
  for (const path of Object.keys(zip.files).filter((p) => CONTENT_PART_RE.test(p)).sort()) {
    scanPlaceholders(await zip.file(path)!.async("string"), counts);
  }

  return {
    sha256,
    manifestFields,
    placeholders: [...counts.keys()].sort(),
  };
};

// ── Index shape ───────────────────────────────────────────

export type IndexTemplate = {
  slug: string;
  title: string;
  file: string;
  license: string;
  jurisdictions: Jurisdiction[];
  languages: string[];
  legalArea: string | null;
  fields: string[];
  sha256: string;
};

export type IndexPack = {
  id: string;
  name: string;
  version: string;
  license: string;
  jurisdictions: Jurisdiction[];
  languages: string[];
  legalAreas: string[];
  authors: Author[];
  templateCount: number;
  templates: IndexTemplate[];
};

export const buildIndexEntry = async (
  packDir: string,
  manifest: PackManifest,
): Promise<IndexPack> => {
  const templates: IndexTemplate[] = [];
  for (const template of manifest.templates) {
    const buffer = await readFile(join(packDir, template.file));
    const inspection = await inspectDocx(buffer);
    templates.push({
      slug: template.slug,
      title: template.title,
      file: template.file,
      license: template.license ?? manifest.license,
      jurisdictions: template.jurisdictions ?? manifest.jurisdictions,
      languages: template.languages ?? manifest.languages,
      legalArea: template.legalArea ?? null,
      fields: inspection.manifestFields ?? [],
      sha256: inspection.sha256,
    });
  }
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    license: manifest.license,
    jurisdictions: manifest.jurisdictions,
    languages: manifest.languages,
    legalAreas: manifest.legalAreas,
    authors: manifest.authors,
    templateCount: templates.length,
    templates,
  };
};

export const renderIndex = (packs: IndexPack[]): string => `${JSON.stringify(packs, null, 2)}\n`;
