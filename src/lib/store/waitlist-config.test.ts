import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeNigerianWhatsapp } from "./waitlist-config.ts";

test("accepts local 0803… numbers", () => {
  assert.equal(normalizeNigerianWhatsapp("08031234567"), "+2348031234567");
  assert.equal(normalizeNigerianWhatsapp("0803 123 4567"), "+2348031234567");
  assert.equal(normalizeNigerianWhatsapp("0703-123-4567"), "+2347031234567");
  assert.equal(normalizeNigerianWhatsapp("0905 123 4567"), "+2349051234567");
});

test("accepts +234 and 234 numbers", () => {
  assert.equal(normalizeNigerianWhatsapp("+2348031234567"), "+2348031234567");
  assert.equal(normalizeNigerianWhatsapp("+234 803 123 4567"), "+2348031234567");
  assert.equal(normalizeNigerianWhatsapp("2348031234567"), "+2348031234567");
  assert.equal(normalizeNigerianWhatsapp("+234 (0) 803 123 4567"), "+2348031234567");
});

test("rejects numbers that are not Nigerian mobiles", () => {
  assert.equal(normalizeNigerianWhatsapp(""), null);
  assert.equal(normalizeNigerianWhatsapp("0803123456"), null);
  assert.equal(normalizeNigerianWhatsapp("080312345678"), null);
  assert.equal(normalizeNigerianWhatsapp("+447911123456"), null);
  assert.equal(normalizeNigerianWhatsapp("0123 456 7890"), null);
  assert.equal(normalizeNigerianWhatsapp("hello"), null);
});
