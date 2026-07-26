import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyWebsiteContent, normalizeWebsiteContentPayload } from "./websiteContentService.js";

test("creates a default website content structure for an outlet", () => {
  const content = createEmptyWebsiteContent("outlet-1");

  assert.equal(content.outletId, "outlet-1");
  assert.equal(content.hero.title, "");
  assert.deepEqual(content.whatWeServe, []);
  assert.deepEqual(content.socialLinks, {
    instagram: "",
    facebook: "",
    x: "",
    youtube: "",
    whatsapp: "",
    googleMaps: "",
    googleReviewUrl: "",
    website: ""
  });
});

test("normalizes nested payloads while preserving values", () => {
  const payload = {
    hero: { title: "Welcome", description: "A cozy cafe" },
    whatWeServe: [{ title: "Coffee", description: "Fresh brew" }],
    bestFor: [],
    socialLinks: { instagram: "https://instagram.com/example" }
  };

  const normalized = normalizeWebsiteContentPayload(payload, "outlet-2");

  assert.equal(normalized.hero.title, "Welcome");
  assert.equal(normalized.hero.description, "A cozy cafe");
  assert.equal(normalized.whatWeServe[0].title, "Coffee");
  assert.equal(normalized.socialLinks.instagram, "https://instagram.com/example");
  assert.equal(normalized.outletId, "outlet-2");
});
