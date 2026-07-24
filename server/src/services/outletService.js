import { store } from "../db.js";

export async function getAllOutlets(options = {}) {
  return store.outlets(options);
}

export async function getOutletBySlug(slug) {
  return store.outletBySlug(slug);
}

export async function getOutletById(id) {
  return store.outletById(id);
}

export async function createOutlet(payload) {
  return store.createOutlet(payload);
}

export async function updateOutlet(id, payload) {
  return store.updateOutlet(id, payload);
}

export async function deleteOutlet(id) {
  return store.deleteOutlet(id);
}

export default {
  getAllOutlets,
  getOutletBySlug,
  getOutletById,
  createOutlet,
  updateOutlet,
  deleteOutlet
};
