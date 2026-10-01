import test from "node:test";
import assert from "node:assert/strict";
process.env.NEXT_PUBLIC_SITE_URL = "https://www.pixinia.web.id";
const { authRedirectUrl } = await import("../src/lib/auth-redirect.ts?auth-redirect-test");

test("production confirmation links use the canonical public hostname", () => {
  assert.equal(authRedirectUrl("/auth/callback", "https://www.pixinia.web.id"), "https://www.pixinia.web.id/auth/callback");
  assert.equal(authRedirectUrl("/auth/callback?next=/reset-password", "https://pixinia.web.id"), "https://www.pixinia.web.id/auth/callback?next=/reset-password");
  assert.equal(authRedirectUrl("/auth/callback", "http://localhost:3100"), "http://localhost:3100/auth/callback");
  assert.equal(authRedirectUrl("//other.example", "http://localhost:3100"), "http://localhost:3100/");
});
