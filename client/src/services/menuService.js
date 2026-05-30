import { api } from "./apiClient";

export async function getCategories() {
  return api("/categories");
}

export async function getMenu(opts = {}) {
  const qs = opts.includeInactive ? "?includeInactive=true" : "";
  return api(`/menu${qs}`);
}

export async function createMenuItem(payload) {
  return api("/menu", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteMenuItem(id) {
  return api(`/menu/${id}`, { method: "DELETE" });
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

export default { getCategories, getMenu, createMenuItem, deleteMenuItem, uploadPhoto, createCategory, deleteCategory, getRecipes, getReports };
