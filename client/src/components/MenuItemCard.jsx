import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { imageUrl } from "../utils/imageHelper";

const serveOptionsByItemId = {
  "infusion-heritage-coffee": ["Kulhad", "Glass", "Cup"],
  "personal-blend-chai": ["Kulhad", "Glass"],
  "signature-infusion-chai": ["Kulhad", "Glass"],
  "hot-chocolate": ["Kulhad", "Glass", "Cup"],
  "core-coffee": ["Kulhad", "Glass", "Cup"],
  "black-coffee": ["Kulhad", "Glass", "Cup"]
};

function getServeOptions(item) {
  return serveOptionsByItemId[item.id] || [];
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

export default function MenuItemCard({ item, onDetail, onAdd }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const serveOptions = getServeOptions(item);
  const [serveType, setServeType] = useState(serveOptions[0] || "");

  useEffect(() => {
    const currentSizes = item?.sizes?.length
      ? item.sizes
      : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
    setSizeId(currentSizes[0]?.id);
    setServeType(getServeOptions(item)[0] || "");
  }, [item.id, item.sizes, item.price]);

  return (
    <article className="glass-card group flex min-h-[300px] flex-col justify-between p-3">
      <button onClick={onDetail} className="text-left">
        <div className="relative mx-auto -mt-2 aspect-square w-[92%]">
          <img src={imageUrl(item.image)} alt="" className="h-full w-full rounded-full object-cover drop-shadow-2xl transition group-hover:scale-105" />
        </div>
        <h3 className="mt-2 text-base font-black leading-tight">{item.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-9 text-xs font-semibold text-stone-600">{item.description}</p>
      </button>
      <div className="mt-3 space-y-3">
        {sizes.length > 1 && <SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} compact />}
        {serveOptions.length > 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white/85 p-3 text-sm">
            <p className="font-black text-stone-700">Choose Your Serve</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {serveOptions.map((option) => (
                <button key={option} type="button" onClick={() => setServeType(option)} className={`rounded-full px-3 py-2 text-xs font-black transition ${serveType === option ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black">{priceText(item, sizeId)}</span>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white shadow-lg" onClick={() => onAdd(item, sizeId, 1, serveType)} aria-label={`Add ${item.name}`}>
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}

function SizeSelector({ sizes, value, setValue }) {
  return (
    <div className="grid gap-1 rounded-full bg-white/45 p-1" style={{ gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` }}>
      {sizes.map((size) => (
        <button key={size.id} onClick={() => setValue(size.id)} className={`rounded-full px-2 py-2 text-xs font-black transition ${value === size.id ? "bg-black text-white" : "text-stone-700 hover:bg-white/55"}`}>
          {size.label}
        </button>
      ))}
    </div>
  );
}
