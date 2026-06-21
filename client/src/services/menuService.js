import { api } from "./apiClient";

function menuItemPath(id, suffix = "") {
  return `/menu/${encodeURIComponent(id)}${suffix}`;
}

export async function getCategories(opts = {}) {
  const qs = opts.includeDeleted ? "?includeDeleted=true" : "";
  return api(`/categories${qs}`);
}

export async function getMenu(opts = {}) {
  const searchParams = new URLSearchParams();
  if (opts.includeInactive) searchParams.set("includeInactive", "true");
  if (opts.includeDeleted) searchParams.set("includeDeleted", "true");
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return api(`/menu${qs}`);
}

export async function createMenuItem(payload) {
  return api("/menu", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateMenuItem(id, payload) {
  return api(menuItemPath(id), { method: "PATCH", body: JSON.stringify(payload) });
}

export async function setMenuItemActive(id, active) {
  return api(menuItemPath(id, "/active"), { method: "PATCH", body: JSON.stringify({ active }) });
}

export async function deleteMenuItem(id) {
  return api(menuItemPath(id), { method: "DELETE" });
}

export async function restoreMenuItem(id) {
  return api(menuItemPath(id, "/restore"), { method: "PATCH" });
}

export async function permanentlyDeleteMenuItem(id) {
  return api(menuItemPath(id, "?permanent=true"), { method: "DELETE" });
}

export async function uploadPhoto(formData) {
  return api(`/uploads`, { method: "POST", body: formData });
}

export async function createCategory(payload) {
  return api(`/categories`, { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteCategory(id) {
  return api(`/categories/${id}`, { method: "DELETE" });
}

export async function restoreCategory(id) {
  return api(`/categories/${id}/restore`, { method: "PATCH" });
}

export async function permanentlyDeleteCategory(id) {
  return api(`/categories/${id}?permanent=true`, { method: "DELETE" });
}

export async function getRecipes() {
  return api(`/recipes`);
}

export async function getReports() {
  return api(`/reports`);
}

export async function createRecipe(payload) {
  return api(`/recipes`, { method: "POST", body: JSON.stringify(payload) });
}

export async function patchRecipe(id, payload) {
  return api(`/recipes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteRecipe(id) {
  return api(`/recipes/${id}`, { method: "DELETE" });
}

export async function syncDefaultRecipes() {
  return api(`/recipes/sync-defaults`, { method: "POST", body: JSON.stringify({}) });
}

export default { getCategories, getMenu, createMenuItem, updateMenuItem, setMenuItemActive, deleteMenuItem, restoreMenuItem, permanentlyDeleteMenuItem, uploadPhoto, createCategory, deleteCategory, restoreCategory, permanentlyDeleteCategory, getRecipes, getReports, createRecipe, patchRecipe, deleteRecipe, syncDefaultRecipes };
