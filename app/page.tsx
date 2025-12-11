// app/page.tsx
import { LoopStateProvider } from "./components/LoopStateContext";
import StoryRoot from "./components/StoryRoot";

export default function Page() {
  return (
    <LoopStateProvider>
      <StoryRoot />
    </LoopStateProvider>
  );
}
