// app/components/scenes/Lobby.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useDialog } from "../DialogContext";

export default function Lobby() {
  const { advanceTime, goToScene } = useLoopState();
  const { startDialog } = useDialog();

  const goStreet = () => {
    advanceTime(5);
    goToScene("street");
  };

  const goApartment = () => {
    advanceTime(5);
    goToScene("apt-living");
  };

  const talkToRhea = () => {
    // no time advance here; responses handle time
    startDialog("rhea.intro.1");
  };

  return (
    <section>
      <h1>Building Lobby</h1>
      <p style={{ marginTop: "1rem" }}>
        The lobby smells like burnt coffee and recycled air. A flickering panel
        pretends to show building alerts, but it hasn&apos;t updated in months.
      </p>
      <p>
        Rhea is leaning against the bank of dead mailboxes, one boot pressed to
        the metal, a paper cup cooling in her hand. She watches you like she&apos;s
        already seen this part.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button onClick={talkToRhea}>Talk to Rhea.</button>
        <button onClick={goStreet}>Step out onto the street.</button>
        <button onClick={goApartment}>Go back up to the apartment.</button>
      </div>
    </section>
  );
}
