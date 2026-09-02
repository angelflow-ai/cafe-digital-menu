import mongoose from "mongoose";
import { Outlet } from "../db.js";
import { createEmptyWebsiteContent as createClientEmptyWebsiteContent, normalizeWebsiteContentPayload as normalizeClientPayload } from "../../../client/src/services/websiteContentService.js";

const websiteContentSchema = new mongoose.Schema(
  {
    outletId: { type: String, required: true, index: true },
    hero: { type: Object, default: {} },
    about: { type: Object, default: {} },
    whatWeServe: { type: Array, default: [] },
    bestFor: { type: Array, default: [] },
    visualMoments: { type: Array, default: [] },
    customerReviews: { type: Array, default: [] },
    gallery: { type: Array, default: [] },
    videos: { type: Array, default: [] },
    socialLinks: { type: Object, default: {} },
    support: { type: Object, default: {} },
    fssai: { type: Object, default: {} },
    draftContent: { type: Object, default: {} },
    publishedContent: { type: Object, default: {} },
    publishedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    createdAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const WebsiteContent = mongoose.model("WebsiteContent", websiteContentSchema);

export function createEmptyWebsiteContent(outletId = "") {
  return createClientEmptyWebsiteContent(outletId);
}

export function normalizeWebsiteContentPayload(payload = {}, outletId = "") {
  return normalizeClientPayload(payload, outletId);
}

async function resolveOutletId(outletRef) {
  const normalized = String(outletRef || "").trim();
  if (!normalized) return "";
  const outlet = await Outlet.findOne({ $or: [{ _id: normalized }, { id: normalized }, { slug: normalized }] }).lean().catch(() => null);
  return outlet?._id ? String(outlet._id) : normalized;
}

export async function getWebsiteContentForOutlet(outletRef, options = {}) {
  const normalizedOutletId = await resolveOutletId(outletRef);
  if (!normalizedOutletId) return createEmptyWebsiteContent();

  const record = await WebsiteContent.findOne({ outletId: normalizedOutletId }).lean();
  if (!record) return createEmptyWebsiteContent(normalizedOutletId);

  const publishedContent = normalizeWebsiteContentPayload(record.publishedContent || record.content || {}, normalizedOutletId);
  const draftContent = normalizeWebsiteContentPayload(record.draftContent || record.publishedContent || record.content || {}, normalizedOutletId);

  const response = {
    ...publishedContent,
    draftContent,
    publishedContent,
    publishedAt: record.publishedAt ? new Date(record.publishedAt).toISOString() : ""
  };

  if (options.mode === "draft") return { ...response, ...draftContent };
  return response;
}

export async function saveWebsiteContentDraftForOutlet(outletRef, payload) {
  const normalizedOutletId = await resolveOutletId(outletRef);
  if (!normalizedOutletId) throw new Error("Outlet ID is required.");

  const normalizedPayload = normalizeWebsiteContentPayload(payload, normalizedOutletId);
  const now = new Date();
  const update = {
    outletId: normalizedOutletId,
    draftContent: normalizedPayload,
    updatedAt: now,
    createdAt: now
  };

  await WebsiteContent.findOneAndUpdate(
    { outletId: normalizedOutletId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return getWebsiteContentForOutlet(normalizedOutletId, { mode: "draft" });
}

export async function publishWebsiteContentForOutlet(outletRef, payload) {
  const normalizedOutletId = await resolveOutletId(outletRef);
  if (!normalizedOutletId) throw new Error("Outlet ID is required.");

  const normalizedPayload = normalizeWebsiteContentPayload(payload, normalizedOutletId);
  const now = new Date();
  await WebsiteContent.findOneAndUpdate(
    { outletId: normalizedOutletId },
    {
      $set: {
        outletId: normalizedOutletId,
        draftContent: normalizedPayload,
        publishedContent: normalizedPayload,
        publishedAt: now,
        updatedAt: now
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return getWebsiteContentForOutlet(normalizedOutletId);
}

export async function deleteWebsiteMediaForOutlet(outletRef, key) {
  const normalizedOutletId = await resolveOutletId(outletRef);
  if (!normalizedOutletId) throw new Error("Outlet ID is required.");

  const record = await WebsiteContent.findOne({ outletId: normalizedOutletId });
  if (!record) return createEmptyWebsiteContent(normalizedOutletId);

  const draftContent = normalizeWebsiteContentPayload(record.draftContent || record.publishedContent || {}, normalizedOutletId);
  const publishedContent = normalizeWebsiteContentPayload(record.publishedContent || {}, normalizedOutletId);

  if (key === "fssai") {
    draftContent.fssai = createEmptyWebsiteContent(normalizedOutletId).fssai;
    publishedContent.fssai = createEmptyWebsiteContent(normalizedOutletId).fssai;
  }

  await WebsiteContent.findOneAndUpdate(
    { outletId: normalizedOutletId },
    { $set: { draftContent, publishedContent, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  return getWebsiteContentForOutlet(normalizedOutletId);
}
