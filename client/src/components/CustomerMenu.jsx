import React from "react";
import MenuItemCard from "./MenuItemCard";

export default function CustomerMenu({
  filteredItems,
  loading,
  appError,
  counterMode,
  onDetail,
  onAdd,
  isTableOrder = false
}) {
  return (
    <section className="w-full">
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[1.05rem] font-black tracking-tight text-[#1F1F1F] sm:text-xl">
              {counterMode ? "Order On Counter" : "Fresh from the cafe"}
            </h2>
            {counterMode && (
              <p className="mt-1 text-sm font-semibold text-[#6B6B6B]">
                This page is for counter billing — place an order for a customer from the counter.
              </p>
            )}
            {appError && (
              <p className="mt-2 rounded-[16px] border border-[#ECE8E3] bg-[#FFFFFF] p-3 text-sm font-bold text-[#1F1F1F] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                {appError}
              </p>
            )}
          </div>
          <span className="inline-flex items-center rounded-full border border-[#ECE8E3] bg-[#FFFFFF] px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-[#1F1F1F] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
            {filteredItems.length} items
          </span>
        </div>
        {loading ? (
          <div className="rounded-[16px] border border-[#ECE8E3] bg-[#FFFFFF] p-6 text-center text-sm font-semibold text-[#1F1F1F] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
            Loading menu...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onDetail={() => onDetail(item)}
                onAdd={onAdd}
                isTableOrder={isTableOrder}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
