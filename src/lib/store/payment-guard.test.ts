import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPaymentProof, isLocalHost, testPurchaseAllowed } from "./payment-guard.ts";

const DEV = { NODE_ENV: "development" };
const VERCEL_PROD = { VERCEL: "1", NODE_ENV: "production" };

test("test purchases are refused on Vercel, even with a faked localhost host", () => {
  assert.equal(testPurchaseAllowed("localhost:8080", VERCEL_PROD), false);
  assert.equal(testPurchaseAllowed("localhost", { VERCEL: "1" }), false);
  assert.throws(() => assertPaymentProof({ kind: "local_test", host: "localhost" }, VERCEL_PROD));
});

test("test purchases are refused on the live site and preview hosts", () => {
  assert.equal(testPurchaseAllowed("trycairn.vercel.app", DEV), false);
  assert.equal(testPurchaseAllowed("fieldnotepdf-abc.vercel.app", DEV), false);
  assert.equal(testPurchaseAllowed(undefined, DEV), false);
  assert.throws(() => assertPaymentProof({ kind: "local_test", host: "trycairn.vercel.app" }, DEV));
});

test("test purchases are refused in any production build", () => {
  assert.equal(testPurchaseAllowed("localhost:3000", { NODE_ENV: "production" }), false);
});

test("test purchases are refused once Paystack is set up", () => {
  assert.equal(testPurchaseAllowed("localhost:8080", { ...DEV, PAYSTACK_SECRET_KEY: "sk_live_x" }), false);
});

test("test purchases work only on a developer's own machine", () => {
  assert.equal(testPurchaseAllowed("localhost:8080", DEV), true);
  assert.equal(testPurchaseAllowed("127.0.0.1:8080", DEV), true);
  assert.equal(testPurchaseAllowed("[::1]:8080", DEV), true);
  assert.doesNotThrow(() => assertPaymentProof({ kind: "local_test", host: "localhost:8080" }, DEV));
});

test("an order is never marked paid without proof", () => {
  assert.throws(() => assertPaymentProof(undefined, VERCEL_PROD));
  assert.throws(() => assertPaymentProof({ kind: "paystack_verified", reference: "" }, VERCEL_PROD));
  assert.throws(() => assertPaymentProof({ kind: "transfer_approved", adminUserId: "" }, VERCEL_PROD));
  // @ts-expect-error unknown kinds are refused at runtime too
  assert.throws(() => assertPaymentProof({ kind: "free" }, VERCEL_PROD));
});

test("verified Paystack payments and publisher-approved transfers are accepted", () => {
  assert.doesNotThrow(() => assertPaymentProof({ kind: "paystack_verified", reference: "REF-1" }, VERCEL_PROD));
  assert.doesNotThrow(() => assertPaymentProof({ kind: "transfer_approved", adminUserId: "usr_1" }, VERCEL_PROD));
});

test("isLocalHost ignores ports and case", () => {
  assert.equal(isLocalHost("LOCALHOST:5173"), true);
  assert.equal(isLocalHost("localhost.evil.com"), false);
  assert.equal(isLocalHost("127.0.0.1.nip.io"), false);
});
