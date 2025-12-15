// app/page.tsx
// app/page.tsx
"use client";

import { LoopStateProvider } from "./components/LoopStateContext";
import { DialogProvider } from "./components/DialogContext";
import { ExamineProvider } from "./components/ExamineContext";
import { OptionsProvider } from "./components/OptionsContext";
import StoryRoot from "./components/StoryRoot";
import { dialogNodes } from "./game/events"; // ✅ use merged event nodes
import { ExamineModeProvider } from "./components/ExamineModeContext";

export default function Page() {
  return (
    <LoopStateProvider>
      <ExamineModeProvider>
        <DialogProvider nodes={dialogNodes}>
          <ExamineProvider>
            <OptionsProvider>
              <StoryRoot />
            </OptionsProvider>
          </ExamineProvider>
        </DialogProvider>
      </ExamineModeProvider>
    </LoopStateProvider>
  );
}