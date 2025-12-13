// app/components/OptionsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from "react";

export type OptionKind = "move" | "action";

export type PlayerOption = {
  id: string;
  label: string;
  onSelect: () => void;

  /** "move" shows on the RIGHT panel, "action" shows on the LEFT panel */
  kind?: OptionKind;

  /** optional - useful later for keybinds / UI icons */
  dir?: "n" | "e" | "s" | "w" | "up" | "down";
};

type OptionsContextValue = {
  options: PlayerOption[];
  setOptions: (opts: PlayerOption[]) => void;
  clearOptions: () => void;
};

const OptionsContext = createContext<OptionsContextValue | undefined>(undefined);

export function OptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptionsState] = useState<PlayerOption[]>([]);

  const setOptions = useCallback((opts: PlayerOption[]) => {
    setOptionsState(opts);
  }, []);

  const clearOptions = useCallback(() => {
    setOptionsState([]);
  }, []);

  return (
    <OptionsContext.Provider value={{ options, setOptions, clearOptions }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const ctx = useContext(OptionsContext);
  if (!ctx) {
    throw new Error("useOptions must be used within an OptionsProvider");
  }
  return ctx;
}
