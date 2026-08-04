import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { DEFAULT_MENU_IMAGE, imageUrl } from "../utils/imageHelper";

const hiddenServeOptionTeaIds = new Set([
  "black-tea",
  "green-tea",
  "honey-lemon-tea",
  "lemon-tea",
  "tulsi-tea"
]);

const hiddenServeOptionTeaNames = new Set([
  "black tea",
  "green tea",
  "honey lemon tea",
  "lemon tea",
  "tulsi tea"
]);

function getServeOptions(item) {
  if (!item) return [];
  const category = String(item.category || item.categoryId || "").toLowerCase();
  const isHotDrinks = category === "hot-drinks" || category === "hot drinks";
  if (!isHotDrinks) return [];

  const itemId = String(item.id || item._id || item.itemId || "").toLowerCase();
  const name = String(item.name || item.itemName || "").toLowerCase();
  if (hiddenServeOptionTeaIds.has(itemId) || hiddenServeOptionTeaNames.has(name)) return [];

  // Prioritize serveTypes field
  const safeServeTypes = Array.isArray(item.serveTypes) ? item.serveTypes : [];
  if (safeServeTypes.length > 0) return safeServeTypes;

  const safeServeOptions = Array.isArray(item.serveOptions) ? item.serveOptions : [];
  const safeServingOptions = Array.isArray(item.servingOptions) ? item.servingOptions : [];
  const safeItemServeOptions = Array.isArray(item.itemServeOptions) ? item.itemServeOptions : [];

  if (safeServeOptions.length > 0) return safeServeOptions;
  if (safeServingOptions.length > 0) return safeServingOptions;
  if (safeItemServeOptions.length > 0) return safeItemServeOptions;

  const subCategory = String(item.subCategory || item.subcategory || item.subcategoryName || "").toLowerCase();

  const hotCoffeeNames = [
    "black coffee",
    "core coffee",
    "hot chocolate",
    "infusion heritage hot coffee"
  ];
  const chaiNames = [
    "black tea",
    "green tea",
    "tulsi tea",
    "lemon tea",
    "honey lemon tea",
    "personal blend chai",
    "signature infusion chai"
  ];

  if (hotCoffeeNames.includes(name) || subCategory.includes("coffee")) {
    return ["Kulhad", "Glass", "Cup"];
  }
  if (chaiNames.includes(name) || subCategory.includes("chai")) {
    return ["Kulhad", "Glass"];
  }

  return [];
}

function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function priceText(item, selectedSizeId) {
  if (!item?.sizes?.length) return rupees(0);
  if (selectedSizeId) return rupees(item.sizes.find((size) => size.id === selectedSizeId)?.price ?? item.sizes[0].price);
  const prices = item.sizes.map((size) => Number(size.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? rupees(min) : `${rupees(min)} - ${rupees(max)}`;
}

function isCigaretteItem(item) {
  const category = String(item?.category || item?.categoryId || "").toLowerCase();
  const name = String(item?.name || "").toLowerCase();
  return category.includes("cigarette") || name.includes("cigarette");
}

function handleImageError(event) {
  const fallbackSrc = imageUrl(DEFAULT_MENU_IMAGE);
  if (event.currentTarget.src !== fallbackSrc) {
    event.currentTarget.src = fallbackSrc;
  }
}

const MenuItemCard = React.memo(function MenuItemCard({ item, onDetail, onAdd, isTableOrder = false }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const serveOptions = getServeOptions(item);
  const displaySizes = sizes.filter(size => (size.label || size.name || "").toLowerCase() !== "regular");
  const [serveType, setServeType] = useState(serveOptions[0] || "");
  const imageSrc = imageUrl(item?.image, item?.updatedAt || item?.imageUpdatedAt);
  const showCigaretteFallback = isCigaretteItem(item) && !imageSrc;

  useEffect(() => {
    const currentSizes = item?.sizes?.length
      ? item.sizes
      : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
    setSizeId(currentSizes[0]?.id);
    setServeType(getServeOptions(item)[0] || "");
  }, [item.id, item.sizes, item.price]);

  const hasServeOptions = serveOptions.length > 0;

  return (
    <article className={hasServeOptions ? "menu-card-compact glass-card group flex h-full min-h-[300px] flex-col justify-between rounded-[24px] border border-[#ECE8E3] bg-[#FFFFFF] px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:min-h-[330px] sm:px-4 sm:py-4" : "menu-card-compact glass-card group flex h-full min-h-[300px] flex-col rounded-[24px] border border-[#ECE8E3] bg-[#FFFFFF] px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:min-h-[330px] sm:px-4 sm:py-4"}>
      {hasServeOptions ? (
        <>
          <button onClick={onDetail} className="text-left">
            <div className="relative mx-auto aspect-square w-full max-w-[112px] shrink-0 rounded-[24px] p-0 sm:max-w-[124px]">
              {showCigaretteFallback ? (
                <div className="grid h-full w-full place-items-center rounded-full bg-rose-100 text-4xl text-rose-700 shadow-sm ring-1 ring-rose-200">🚬</div>
              ) : (
                <img src={imageSrc || imageUrl(DEFAULT_MENU_IMAGE)} alt="" className="h-full w-full rounded-full object-cover drop-shadow-2xl transition duration-300 group-hover:scale-105" onError={handleImageError} loading="lazy" decoding="async" fetchPriority="low" width={112} height={112} />
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <h3 className="min-h-[2.4rem] max-w-full break-words whitespace-normal text-sm font-bold leading-tight text-[#1F1F1F] sm:text-[16px]">{item.name}</h3>
            </div>
          </button>
          <div className="mt-2 flex flex-1 flex-col gap-2.5">
            {displaySizes.length > 1 && <SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} compact />}
            {serveOptions.length === 1 ? (
              <div className="rounded-[16px] border border-[#ECE8E3] bg-[#FAF8F5] p-3 text-sm text-[#1F1F1F] shadow-none">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#6B6B6B]">Serve</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1F1F1F]">{serveOptions[0]}</p>
              </div>
            ) : serveOptions.length > 1 ? (
              <div className="rounded-[16px] border border-[#ECE8E3] bg-[#FAF8F5] p-3 text-sm text-[#1F1F1F] shadow-none">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#6B6B6B]">Serve</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {serveOptions.map((option) => (
                    <button key={option} type="button" onClick={() => setServeType(option)} className={`rounded-full border px-3 py-2 text-xs font-black transition ${serveType === option ? "border-[#4A0006] bg-[#4A0006] text-[#FFF8F4]" : "border-[#ECE8E3] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#FAF8F5]"}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {isTableOrder ? (
              <div className="mt-auto flex items-center justify-between gap-2 rounded-[16px] border border-[#ECE8E3] bg-[#FAF8F5] px-3 py-2.5 shadow-none">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6B6B]">From</p>
                  <span className="text-[15px] font-black text-[#1F1F1F]">{priceText(item, sizeId)}</span>
                </div>
                <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4A0006] text-[#FFF8F4] shadow-[0_8px_16px_rgba(74,0,6,0.14)] ring-1 ring-white/10 transition hover:-translate-y-0.5" onClick={onDetail} aria-label={`Open ${item.name}`}>
                  <Plus size={20} />
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center">
            <button onClick={onDetail} className="text-left flex flex-col items-center justify-center">
              <div className="relative mx-auto aspect-square w-full max-w-[112px] shrink-0 rounded-[24px] p-0 sm:max-w-[124px]">
                {showCigaretteFallback ? (
                  <div className="grid h-full w-full place-items-center rounded-full bg-rose-100 text-4xl text-rose-700 shadow-sm ring-1 ring-rose-200">🚬</div>
                ) : (
                  <img src={imageSrc || imageUrl(DEFAULT_MENU_IMAGE)} alt="" className="h-full w-full rounded-full object-cover drop-shadow-2xl transition duration-300 group-hover:scale-105" onError={handleImageError} loading="lazy" decoding="async" fetchPriority="low" width={112} height={112} />
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="min-h-[2.4rem] max-w-full break-words whitespace-normal text-sm font-bold leading-tight text-[#1F1F1F] sm:text-[16px]">{item.name}</h3>
              </div>
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            {displaySizes.length > 1 && <SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} compact />}
            {isTableOrder ? (
              <div className="flex items-center justify-between gap-2 rounded-[16px] border border-[#ECE8E3] bg-[#FAF8F5] px-3 py-2.5 shadow-none">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6B6B]">From</p>
                  <span className="text-[15px] font-black text-[#1F1F1F]">{priceText(item, sizeId)}</span>
                </div>
                <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4A0006] text-[#FFF8F4] shadow-[0_8px_16px_rgba(74,0,6,0.14)] ring-1 ring-white/10 transition hover:-translate-y-0.5" onClick={onDetail} aria-label={`Open ${item.name}`}>
                  <Plus size={20} />
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </article>
  );
});

export default MenuItemCard;

const SizeSelector = React.memo(function SizeSelector({ sizes, value, setValue }) {
  const displaySizes = sizes.filter(size => (size.label || size.name || "").toLowerCase() !== "regular");
  if (displaySizes.length === 0) return null;
  
  return (
    <div className="grid gap-1 rounded-full border border-[#ECE8E3] bg-[#FAF8F5] p-1" style={{ gridTemplateColumns: `repeat(${displaySizes.length}, minmax(0, 1fr))` }}>
      {displaySizes.map((size) => (
        <button key={size.id} onClick={() => setValue(size.id)} className={`rounded-full px-2 py-2 text-xs font-black transition ${value === size.id ? "bg-[#4A0006] text-[#FFF8F4]" : "text-[#1F1F1F] hover:bg-[#FFFFFF]"}`}>
          {size.label}
        </button>
      ))}
    </div>
  );
});
