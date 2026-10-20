import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { FILTERS, matchesFilter, STORIES } from "./stories.ts";

const PUBLIC = join(import.meta.dirname, "..", "..", "public");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test("no PDF is ever published from public/", () => {
  const pdfs = walk(PUBLIC).filter((f) => f.toLowerCase().endsWith(".pdf"));
  assert.deepEqual(pdfs, []);
});

test("each issue folder holds only its free pages and one teaser", () => {
  for (const story of STORIES) {
    for (const issue of story.issues) {
      const dir = join(PUBLIC, "stories", story.slug, `issue-${issue.number}`);
      if (!existsSync(dir)) continue;
      const allowed = new Set(["teaser.webp"]);
      for (let p = 1; p <= issue.freePages; p++)
        allowed.add(`page-${String(p).padStart(2, "0")}.webp`);
      const extra = readdirSync(dir).filter((f) => !allowed.has(f));
      assert.deepEqual(
        extra,
        [],
        `${story.slug} issue ${issue.number} has files that must not be public`,
      );
    }
  }
});

test("every live issue has its free pages, teaser, cover and share image", () => {
  for (const story of STORIES) {
    assert.ok(
      existsSync(join(PUBLIC, "stories", story.slug, "cover.webp")),
      `${story.slug}: cover.webp`,
    );
    assert.ok(
      existsSync(join(PUBLIC, "stories", story.slug, "share.jpg")),
      `${story.slug}: share.jpg`,
    );
    for (const issue of story.issues.filter((i) => i.status === "live")) {
      const dir = join(PUBLIC, "stories", story.slug, `issue-${issue.number}`);
      for (let p = 1; p <= issue.freePages; p++) {
        const f = `page-${String(p).padStart(2, "0")}.webp`;
        assert.ok(existsSync(join(dir, f)), `${story.slug} issue ${issue.number}: ${f}`);
      }
      assert.ok(
        existsSync(join(dir, "teaser.webp")),
        `${story.slug} issue ${issue.number}: teaser.webp`,
      );
      assert.ok(
        issue.freePages < issue.totalPages,
        `${story.slug} issue ${issue.number}: something must stay locked`,
      );
    }
  }
});

test("story slugs are unique and URL-safe, and only one story is featured", () => {
  const slugs = STORIES.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(STORIES.filter((s) => s.featured).length <= 1);
});

test("library filters match by kind and tag", () => {
  const danfo = STORIES.find((s) => s.slug === "danfo-13")!;
  assert.ok(matchesFilter(danfo, "comics"));
  assert.ok(matchesFilter(danfo, "lagos"));
  assert.ok(!matchesFilter(danfo, "stories"));
  assert.equal(FILTERS.length, 6);
});
