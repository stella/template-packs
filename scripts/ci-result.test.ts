import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Workflow = {
  on?: Record<string, unknown>;
  jobs?: Record<string, { if?: string; needs?: string | string[] }>;
};

const root = resolve(import.meta.dir, "..");

function readWorkflow(path: string): Workflow {
  return Bun.YAML.parse(readFileSync(resolve(root, path), "utf8")) as Workflow;
}

describe("aggregate CI result", () => {
  const workflow = readWorkflow(".github/workflows/validate.yml");

  test("CI handles merge queue requests", () => {
    expect(workflow.on?.merge_group).toEqual({ types: ["checks_requested"] });
  });

  test("ci-result always covers every other job", () => {
    const jobs = workflow.jobs ?? {};
    const aggregate = jobs["ci-result"];
    expect(aggregate).toBeDefined();
    expect(aggregate?.if).toBe("always()");

    const needs = Array.isArray(aggregate?.needs)
      ? aggregate.needs
      : aggregate?.needs
        ? [aggregate.needs]
        : [];
    const validationJobs = Object.keys(jobs).filter((name) => name !== "ci-result");

    expect(needs.toSorted()).toEqual(validationJobs.toSorted());
  });

  test("CLA handles merge queue requests when configured", () => {
    const claPath = resolve(root, ".github/workflows/cla.yml");
    if (!Bun.file(claPath).size) return;

    const cla = readWorkflow(".github/workflows/cla.yml");
    expect(cla.on?.merge_group).toEqual({ types: ["checks_requested"] });
  });
});
