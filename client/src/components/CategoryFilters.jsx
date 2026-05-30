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
    <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
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
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
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
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black shadow-sm backdrop-blur-xl transition ${active ? "bg-black text-white" : "bg-white/45 text-stone-800 hover:bg-white/65"}`}
    >
      <span>{label}</span>
    </button>
  );
}

function Chip({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-black shadow-sm backdrop-blur-xl transition ${active ? "bg-black text-white" : "bg-white/45 text-stone-800 hover:bg-white/65"}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
