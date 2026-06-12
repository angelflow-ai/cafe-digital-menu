import React from "react";
import MenuItemCard from "./MenuItemCard";

export default function CustomerMenu({ 
  filteredItems, 
  loading, 
  appError, 
  counterMode, 
  onDetail, 
  onAdd 
}) {
  return (
    <section className="grid gap-3">
      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {counterMode ? "Order On Counter" : "Fresh from the cafe"}
            </h2>
            {counterMode && (
              <p className="text-sm font-semibold text-stone-600">
                This page is for counter billing — place an order for a customer from the counter.
              </p>
            )}
            {appError && (
              <p className="rounded-3xl bg-red-50 p-3 text-sm font-bold text-red-700">
                {appError}
              </p>
            )}
          </div>
          <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-stone-700 backdrop-blur">
            {filteredItems.length} items
          </span>
        </div>
        {loading ? (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 p-6 text-center text-sm font-semibold text-stone-500">
            Loading menu...
          </div>
        ) : (
          <div className="menu-grid-compact grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <MenuItemCard 
                key={item.id} 
                item={item} 
                onDetail={() => onDetail(item)} 
                onAdd={onAdd} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
