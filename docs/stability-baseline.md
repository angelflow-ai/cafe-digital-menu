# Stability Baseline

This document captures the current code architecture before any future feature work.
It is a reference snapshot of the live implementation in `client/src/App.jsx` and related client helpers.

## Current Routes

The top-level router is custom and lives in `client/src/App.jsx`.

- `/owner` opens the owner app.
- `/owner/forgot-password` opens the owner forgot-password view.
- `/owner/inventory` opens the owner app on the Inventory tab.
- `/owner/categories` opens the owner app on the Categories tab.
- `/owner/stock` opens the owner app on the Add Stock tab.
- `/owner/recipes` opens the owner app on the Recipe Mapping tab.
- `/owner/lowstock` opens the owner app on the Low Stock tab.
- `/owner/reports` opens the owner app on the Reports tab.
- `/owner/history` opens the owner app on the Order History tab.
- `/admin` and `/admin/*` redirect to `/owner` and the matching owner subpath.
- `/customer` falls through to the customer app.
- `/order` and `/order/` open the customer app.
- `/order/:id` opens order tracking.
- `/order/owner` opens the owner app.
- `/order/biller` opens the biller app.
- `/biller` opens the biller app.
- `/biller/forgot-password` opens the biller forgot-password view.
- `/counter` opens the customer app in counter mode.

## Current LocalStorage Keys

The current client code uses these persistent storage keys:

- `subCategories` - active subcategory config by parent category id.
- `subCategoriesDeleted` - deleted subcategories by parent category id.
- `inventoryItems` - owner-local inventory records.
- `infusion-cart` - customer cart storage key used by `cartHelpers`.
- `infusion-orders` - persisted orders used by order sync/demo fallback.
- `infusion-inventory` - persisted inventory used by `sync.js` helpers.
- `demo-categories` - demo/offline fallback category storage used by `demoMode.js`.

Notes:
- `cartHelpers` accepts a custom key, but the app currently uses the default `infusion-cart`.
- The code also reads `infusion-orders` in multiple places for order persistence and demo fallback.

## Current Owner, Customer, and Biller Data Sources

### Owner App

Owner authentication comes from `authService.me()`, which uses the API session, not localStorage.

Owner dashboard data is loaded from these sources:

- `menuService.getCategories()` for active categories.
- `menuService.getMenu({ includeInactive: true })` for menu items.
- `menuService.getCategories({ includeDeleted: true })` for deleted categories.
- `menuService.getMenu({ includeInactive: true, includeDeleted: true })` for deleted menu items.
- `orderService.listCocRequests()` for COC requests.
- `menuService.getRecipes()` for recipe mapping.
- `menuService.getReports()` for reports.
- `ordersStore.loadOrders()` and `ordersStore.getOrders()` for orders.
- `inventoryStore.loadInventory()` and `inventoryStore.getInventory()` for backend inventory.
- `loadSubcategoryConfig()` and `loadDeletedSubcategoryConfig()` for subcategory state.
- `loadLocalInventoryItems()` for owner-local inventory items.

### Customer App

Customer app data comes from the API and local cart storage:

- `api("/categories")` for categories.
- `api("/menu")` for menu items.
- `loadCartFromStorage()` / `saveCartToStorage()` for cart persistence.
- `orderService` and `paymentService` for order/payment actions.
- `ownerDataUpdated` and `storage` events refresh category/subcategory data when owner edits change.

### Biller App

Biller app data comes from the API plus centralized order store:

- `authService.me()` for session-based biller login.
- `orderService.listCocRequests()` for COC requests.
- `menuService.getMenu({ includeInactive: true })` for menu items.
- `menuService.getCategories()` for categories.
- `ordersStore.loadOrders()` and `ordersStore.getOrders()` for live orders.
- `EventSource(${API}/orders/stream)` keeps biller updates live.

## Current Recently Deleted Flow

Recently Deleted is rendered in the owner dashboard from the `deleted` tab in `Dashboard`.

Current deleted sources:

- Deleted items come from `deletedItems`.
- Deleted categories come from `deletedCategories`.
- Deleted subcategories come from `deletedSubcategories`.
- Deleted inventory items come from `localInventoryItems` where `isDeleted === true`.

Current restore/delete behavior:

- Item restore uses `menuService.restoreMenuItem(id)`.
- Category restore uses `menuService.restoreCategory(id)`.
- Subcategory restore uses `restoreDeletedSubcategory(parentId, name)`.
- Inventory restore flips `isDeleted` back to `false` in local storage.
- Permanent delete routes use the pending-delete dialog and the relevant service/helper.

The Recently Deleted badge count is computed from:

- deleted items
- deleted categories
- deleted subcategories
- deleted inventory items

The badge is updated through `ownerDataUpdated`, `storage`, `inventoryUpdated`, and component state refreshes.

## Current Category / Subcategory Flow

### Category Flow

- Category create is handled in `CategoryAdmin` and calls `menuService.createCategory()`.
- Category delete uses `menuService.deleteCategory()`.
- Category restore uses `menuService.restoreCategory()`.
- Category permanent delete uses `menuService.permanentlyDeleteCategory()`.
- Category state displayed in the owner dashboard comes from the `categories` state in `Dashboard`.
- Category chips in the customer app also use the same top-level categories state.

### Subcategory Flow

- Subcategories are stored in localStorage under `subCategories`.
- Deleted subcategories are stored separately under `subCategoriesDeleted`.
- `loadSubcategoryConfig()` merges defaults from `subcategoryConfig`, active stored values, and deleted exclusions.
- `submitSubcategory()` in `CategoryAdmin` creates a subcategory.
- `confirmDeletion()` in `CategoryAdmin` soft-deletes a subcategory into the deleted map.
- `restoreDeletedSubcategory()` restores a subcategory by moving it back into the active map.
- `permanentlyDeleteSubcategory()` removes the deleted entry from the deleted map.

### Update Mechanics

- `dispatchOwnerDataUpdated()` broadcasts owner data changes.
- `ownerDataUpdated` listeners reload owner, customer, and category views.
- `storage` listeners refresh subcategory and inventory state.

## Stability Notes

- The app uses a single-file route switch in `client/src/App.jsx` rather than a router library.
- `ownerDataUpdated` is the main internal refresh signal for cross-panel updates.
- Category persistence is API-backed, while subcategory persistence is localStorage-backed.
- Inventory persistence is also split between API-backed inventory and owner-local inventory storage.
- This baseline should be treated as the reference point before adding new behavior.
