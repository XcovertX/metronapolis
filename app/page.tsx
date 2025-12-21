// app/page.tsx
"use client";

import { LoopStateProvider } from "./components/LoopStateContext";
import { DialogProvider } from "./components/DialogContext";
import { ExamineProvider } from "./components/ExamineContext";
import { OptionsProvider } from "./components/OptionsContext";
import StoryRoot from "./components/StoryRoot";
import { dialogNodes } from "./game/events";
import { ExamineModeProvider } from "./components/ExamineModeContext";
import { InteractionModeProvider } from "./components/InteractionModeContext";

export default function Page() {
  return (
    <LoopStateProvider>
      <DialogProvider nodes={dialogNodes}>
        <ExamineProvider>
          <InteractionModeProvider>
            <ExamineModeProvider>
              <OptionsProvider>
                <StoryRoot />
              </OptionsProvider>
            </ExamineModeProvider>
          </InteractionModeProvider>
        </ExamineProvider>
      </DialogProvider>
    </LoopStateProvider>
  );
}
