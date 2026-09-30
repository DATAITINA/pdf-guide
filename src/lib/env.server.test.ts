import assert from "node:assert/strict";
import test from "node:test";
import { isDemoCheckoutEnabled } from "./env.server.ts";

test("demo checkout is blocked outside local runtimes", () => {
  assert.equal(isDemoCheckoutEnabled({ NODE_ENV: "development" }), true);
  assert.equal(isDemoCheckoutEnabled({}), true);
  assert.equal(isDemoCheckoutEnabled({ NODE_ENV: "production" }), false);
  assert.equal(isDemoCheckoutEnabled({ VERCEL: "1" }), false);
  assert.equal(isDemoCheckoutEnabled({ VERCEL_ENV: "preview" }), false);
  assert.equal(isDemoCheckoutEnabled({ GROK_PROJECT_ID: "wdp_test" }), false);
});
