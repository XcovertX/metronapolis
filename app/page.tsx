// app/page.tsx
"use client";

import { LoopStateProvider } from "./components/LoopStateContext";
import { DialogProvider } from "./components/DialogContext";
import { ExamineProvider } from "./components/ExamineContext";
import StoryRoot from "./components/StoryRoot";

export default function Page() {
  return (
    <LoopStateProvider>
      <DialogProvider>
        <ExamineProvider>
          <StoryRoot />
        </ExamineProvider>
      </DialogProvider>
    </LoopStateProvider>
  );
}