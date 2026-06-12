import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { imageUrl } from "../utils/imageHelper";

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

export default function MenuItemCard({ item, onDetail, onAdd }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const serveOptions = getServeOptions(item);
  const displaySizes = sizes.filter(size => (size.label || size.name || "").toLowerCase() !== "regular");
  const [serveType, setServeType] = useState(serveOptions[0] || "");
  const imageSrc = imageUrl(item?.image);
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
    <article className={hasServeOptions ? "menu-card-compact glass-card group flex h-full min-h-[285px] flex-col justify-between p-2.5 sm:min-h-[300px] sm:p-3" : "menu-card-compact glass-card group flex h-full min-h-[285px] flex-col p-2.5 sm:min-h-[300px] sm:p-3"}>
      {hasServeOptions ? (
        <>
          <button onClick={onDetail} className="text-left">
            <div className="relative mx-auto aspect-square w-[88%] max-w-[96px] shrink-0 sm:max-w-[104px]">
              {showCigaretteFallback ? (
                <div className="grid h-full w-full place-items-center rounded-full bg-rose-100 text-4xl text-rose-700 shadow-sm ring-1 ring-rose-200">🚬</div>
              ) : (
                <img src={imageSrc} alt="" className="h-full w-full rounded-full object-cover drop-shadow-2xl transition group-hover:scale-105" />
              )}
            </div>
            <h3 className="mt-2 min-h-[2.4rem] text-center text-sm font-black leading-tight sm:text-[15px]">{item.name}</h3>
          </button>
          <div className="mt-2 flex flex-1 flex-col gap-2.5">
            {displaySizes.length > 1 && <SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} compact />}
            {serveOptions.length === 1 ? (
              <div className="rounded-3xl border border-stone-200 bg-white/85 p-3 text-sm">
                <p className="font-black text-stone-700">Serve Option</p>
                <p className="mt-2 text-stone-600">{serveOptions[0]}</p>
              </div>
            ) : serveOptions.length > 1 ? (
              <div className="rounded-3xl border border-stone-200 bg-white/85 p-3 text-sm">
                <p className="font-black text-stone-700">Choose Your Serve</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {serveOptions.map((option) => (
                    <button key={option} type="button" onClick={() => setServeType(option)} className={`rounded-full px-3 py-2 text-xs font-black transition ${serveType === option ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-sm font-black">{priceText(item, sizeId)}</span>
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white shadow-lg" onClick={onDetail} aria-label={`Open ${item.name}`}>
                <Plus size={20} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center">
            <button onClick={onDetail} className="text-left flex flex-col items-center justify-center">
              <div className="relative mx-auto aspect-square w-[88%] max-w-[96px] shrink-0 sm:max-w-[104px]">
                {showCigaretteFallback ? (
                  <div className="grid h-full w-full place-items-center rounded-full bg-rose-100 text-4xl text-rose-700 shadow-sm ring-1 ring-rose-200">🚬</div>
                ) : (
                  <img src={imageSrc} alt="" className="h-full w-full rounded-full object-cover drop-shadow-2xl transition group-hover:scale-105" />
                )}
              </div>
              <h3 className="mt-2 min-h-[2.4rem] text-center text-sm font-black leading-tight sm:text-[15px]">{item.name}</h3>
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            {displaySizes.length > 1 && <SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} compact />}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black">{priceText(item, sizeId)}</span>
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white shadow-lg" onClick={onDetail} aria-label={`Open ${item.name}`}>
                <Plus size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function SizeSelector({ sizes, value, setValue }) {
  const displaySizes = sizes.filter(size => (size.label || size.name || "").toLowerCase() !== "regular");
  if (displaySizes.length === 0) return null;
  
  return (
    <div className="grid gap-1 rounded-full bg-white/45 p-1" style={{ gridTemplateColumns: `repeat(${displaySizes.length}, minmax(0, 1fr))` }}>
      {displaySizes.map((size) => (
        <button key={size.id} onClick={() => setValue(size.id)} className={`rounded-full px-2 py-2 text-xs font-black transition ${value === size.id ? "bg-black text-white" : "text-stone-700 hover:bg-white/55"}`}>
          {size.label}
        </button>
      ))}
    </div>
  );
}
