import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Job = { if?: string; needs?: string | string[] };
type Workflow = {
  on?: Record<string, unknown>;
  jobs?: Record<string, Job>;
};

const root = resolve(import.meta.dir, "..");

function readWorkflow(path: string): Workflow {
  return Bun.YAML.parse(readFileSync(resolve(root, path), "utf8")) as Workflow;
}

function needsOf(job: Job | undefined): string[] {
  const needs = job?.needs;
  if (needs === undefined) return [];
  return typeof needs === "string" ? [needs] : [...needs];
}

describe("aggregate CI result", () => {
  const workflow = readWorkflow(".github/workflows/validate.yml");

  test("CI handles merge queue requests", () => {
    expect(workflow.on?.["merge_group"]).toEqual({ types: ["checks_requested"] });
  });

  test("ci-result always covers every other job", () => {
    const jobs = workflow.jobs ?? {};
    const aggregate = jobs["ci-result"];
    expect(aggregate).toBeDefined();
    expect(aggregate?.if).toBe("always()");

    const validationJobs = Object.keys(jobs).filter((name) => name !== "ci-result");
    expect(needsOf(aggregate).toSorted()).toEqual(validationJobs.toSorted());
  });

  test("CLA handles merge queue requests when configured", () => {
    const claPath = ".github/workflows/cla.yml";
    if (!existsSync(resolve(root, claPath))) return;

    const cla = readWorkflow(claPath);
    expect(cla.on?.["merge_group"]).toEqual({ types: ["checks_requested"] });
  });
});
