import React from "react";
import { Filter, Coffee, CupSoda, Sandwich, Utensils, CakeSlice } from "lucide-react";

const icons = {
  Coffee,
  CupSoda,
  Sandwich,
  Utensils,
  CakeSlice
};

export function CategoryChips({ categories, active, setActive }) {
  return (
    <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1 sm:gap-3">
      <Chip active={active === "all"} onClick={() => setActive("all")} icon={Filter} label="All" />
      {categories.map((category) => {
        const IconComponent = icons[category.icon] || Utensils;
        return (
          <Chip
            key={category.id}
            active={active === category.id}
            onClick={() => setActive(category.id)}
            icon={IconComponent}
            label={category.name}
          />
        );
      })}
    </div>
  );
}

export function SubcategoryChips({ options, active, setActive }) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 sm:gap-2.5">
      {options.map((subcategory) => (
        <SubcategoryChip
          key={subcategory}
          active={active === subcategory}
          onClick={() => setActive(subcategory)}
          label={subcategory}
        />
      ))}
    </div>
  );
}

function SubcategoryChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 shrink-0 items-center justify-center rounded-full border px-3.5 py-2.5 text-xs font-black leading-none transition-all duration-300 ease-out sm:min-h-11 sm:px-4 ${active ? "border-[#4A0006] bg-[#4A0006] text-[#FFF8F4]" : "border-[#ECE8E3] bg-[#FFFFFF] text-[#1F1F1F] shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-[#D9D3CC]"}`}
    >
      <span>{label}</span>
    </button>
  );
}

function Chip({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-black leading-none transition-all duration-300 ease-out sm:min-h-12 sm:px-4 ${active ? "border-[#4A0006] bg-[#4A0006] text-[#FFF8F4]" : "border-[#ECE8E3] bg-[#FFFFFF] text-[#1F1F1F] shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-[#D9D3CC]"}`}
    >
      <Icon size={17} />
      <span>{label}</span>
    </button>
  );
}
