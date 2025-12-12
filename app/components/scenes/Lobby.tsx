// app/components/scenes/Lobby.tsx
"use client";

import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useDialog } from "../DialogContext";
import { useOptions } from "../OptionsContext";

export default function Lobby() {
  const { advanceTime, goToScene } = useLoopState();
  const { startDialog } = useDialog();
  const { setOptions, clearOptions } = useOptions();

  useEffect(() => {
    const goStreet = () => {
      advanceTime(5);
      goToScene("street");
    };
    const goApartment = () => {
      advanceTime(5);
      goToScene("apt-living");
    };
    const talkToRhea = () => {
      startDialog("rhea.intro.1");
    };

    const opts = [
      { id: "lobby-talk-rhea", label: "Talk to Rhea.", onSelect: talkToRhea },
      { id: "lobby-street", label: "Step out onto the street.", onSelect: goStreet },
      {
        id: "lobby-apt",
        label: "Go back up to the apartment.",
        onSelect: goApartment,
      },
    ];

    setOptions(opts);
    return () => clearOptions();
  }, [advanceTime, goToScene, startDialog, setOptions, clearOptions]);

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
    </section>
  );
}
