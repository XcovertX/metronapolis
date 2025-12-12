// app/page.tsx
import { DialogProvider } from "./components/DialogContext";
import { LoopStateProvider } from "./components/LoopStateContext";
import StoryRoot from "./components/StoryRoot";
import { dialogNodes } from "./dialog";

export default function Page() {
  return (
    <LoopStateProvider>
      <DialogProvider nodes={dialogNodes}>
        <StoryRoot />
    </DialogProvider>
    </LoopStateProvider>
  );
}
