import { api } from "./apiClient";

export function getAllOutlets() {
  return api("/outlets");
}

export function getOutletBySlug(slug) {
  return api(`/outlets/slug/${encodeURIComponent(slug)}`);
}

export function getOutletById(id) {
  return api(`/outlets/${encodeURIComponent(id)}`);
}

export default {
  getAllOutlets,
  getOutletBySlug,
  getOutletById
};
