// app/components/scenes/AptBedroom.tsx
"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { useOptions } from "../OptionsContext";
import { getCatLocation } from "../../game/cat";

export default function AptBedroom() {
  const {
    advanceTime,
    goToScene,
    timeMinutes,
    flags,
    setFlags,
  } = useLoopState();
  const { openExamine } = useExamine();
  const { setOptions, clearOptions } = useOptions();

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";
  const showWakeText = !flags.hasWokenUp;

  useEffect(() => {
    const goLiving = () => {
      // Mark wake text as "consumed" only when leaving bedroom the first time
      if (!flags.hasWokenUp) {
        setFlags((prev) => ({ ...prev, hasWokenUp: true }));
      }

      advanceTime(5);
      goToScene("apt-living");
    };

    const lookAtCat = () => {
      openExamine({
        id: "cat-basic",
        title: "The Cat",
        body:
          "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before.",
      });
    };

    const opts = [
      {
        id: "bedroom-to-living",
        label: "Step into the living room.",
        onSelect: goLiving,
      },
      ...(catHere
        ? [
            {
              id: "bedroom-look-cat",
              label: "Look at the cat.",
              onSelect: lookAtCat,
            },
          ]
        : []),
    ];

    setOptions(opts);
    return () => clearOptions();
  }, [
    advanceTime,
    goToScene,
    openExamine,
    setOptions,
    clearOptions,
    catHere,
    flags.hasWokenUp,
    setFlags,
  ]);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Image
        src="/rooms/apt-bedroom.png"
        alt="Apartment Bedroom"
        fill
        priority
        style={{
          objectFit: "cover",
          imageRendering: "pixelated",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: 600,
          background: "rgba(0,0,0,0.55)",
          padding: "1rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(0,255,255,0.3)",
          backdropFilter: "blur(3px)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Apartment – Bedroom</h1>

        {showWakeText ? (
          <>
            <p>
              You wake to the hum of cheap circuitry and pale slotted beams of light
              cutting across the room from the blinds.
            </p>
            <p>
              The Retinaband stutters to life, burning the time into your vision like
              it’s done this before.
            </p>
          </>
        ) : (
          <p>
            Light spills through the slotted blinds in hard stripes, carving the room
            into quiet sections of shadow and glare.
          </p>
        )}

        {catHere && (
          <p>
            The cat is here—still, alert, watching you from the edge of the light.
          </p>
        )}
      </div>
    </section>
  );
}
