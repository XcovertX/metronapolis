// app/components/ExamineContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ExaminePayload = {
  id?: string;
  title: string;
  body: string;
  image?: string;
};

type ExamineContextValue = {
  active: ExaminePayload | null;
  openExamine: (payload: ExaminePayload) => void;
  closeExamine: () => void;
};

const ExamineContext = createContext<ExamineContextValue | undefined>(
  undefined
);

export function ExamineProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ExaminePayload | null>(null);

  const openExamine = (payload: ExaminePayload) => {
    setActive(payload);
  };

  const closeExamine = () => {
    setActive(null);
  };

  return (
    <ExamineContext.Provider value={{ active, openExamine, closeExamine }}>
      {children}
    </ExamineContext.Provider>
  );
}

export function useExamine() {
  const ctx = useContext(ExamineContext);
  if (!ctx) {
    throw new Error("useExamine must be used within an ExamineProvider");
  }
  return ctx;
}
