import { createContext, useContext, useEffect, useMemo, useState } from "react";
import outletStore from "../outletStore";

const OutletContext = createContext({
  currentOutlet: null,
  availableOutlets: [],
  loading: false,
  loadOutlets: outletStore.loadOutlets,
  selectOutlet: outletStore.selectOutlet,
  refreshOutlet: outletStore.refreshOutlet
});

export function OutletProvider({ children }) {
  const [state, setState] = useState(outletStore.getState());

  useEffect(() => outletStore.subscribe(setState), []);

  const value = useMemo(() => ({
    ...state,
    loadOutlets: outletStore.loadOutlets,
    selectOutlet: outletStore.selectOutlet,
    refreshOutlet: outletStore.refreshOutlet
  }), [state]);

  return (
    <OutletContext.Provider value={value}>
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  return useContext(OutletContext);
}

export default OutletContext;
