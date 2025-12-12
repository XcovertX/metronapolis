// app/components/scenes/BoyStreet.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useDialog } from "../DialogContext";

export default function BoyStreet() {
  const {
    flags,
    advanceTime,
    goToScene,
    inventory,
    removeItem,
    setFlags,
  } = useLoopState();
  const { startDialog } = useDialog();

  const { bikeStolen, bikeReturned } = flags;

  const hasStolenBike = inventory.some((item) => item.id === "stolen-bike");

  const crossCarelessly = () => {
    advanceTime(5);
    goToScene("death-reset");
  };

  const keepWalking = () => {
    advanceTime(5);
    goToScene("static-corner");
  };

  const talkToBoy = () => {
    startDialog("boy.intro.1");
  };

  const returnBike = () => {
    // Give the bike back in this loop:
    removeItem("stolen-bike");
    setFlags((prev) => ({
      ...prev,
      bikeReturned: true,
      bikeStolen: false,
    }));
    advanceTime(5);
    // Stay on the same scene; the text and options will update based on flags
    goToScene("boy-street");
  };

  return (
    <section>
      <h1>Relay Street – Midday Crowd</h1>

      {/* WORLD TEXT BRANCHES BASED ON FLAGS + INVENTORY */}

      {!bikeStolen && !bikeReturned && (
        <>
          <p style={{ marginTop: "1rem" }}>
            The crowd parts just enough for the kid to rocket past you on his
            bike, tires hissing on wet asphalt. He nearly clips your knee and
            doesn&apos;t bother to apologize. Just laughs and vanishes into the
            traffic.
          </p>
          <p>
            You watch him go. For a second you imagine what would&apos;ve
            happened if that bike never left the rack. Then the moment is gone,
            chewed up by engines and rain.
          </p>
        </>
      )}

      {bikeStolen && !bikeReturned && hasStolenBike && (
        <>
          <p style={{ marginTop: "1rem" }}>
            The kid stands in the middle of the sidewalk, eyes red, cheeks wet,
            staring at an empty patch of railing like it personally betrayed
            him.
          </p>
          <p>
            The weight of the stolen bike at your side suddenly feels heavier
            than metal has any right to be. You could keep it. Or you could
            decide to be a different kind of person, just for this loop.
          </p>
        </>
      )}

      {bikeStolen && !bikeReturned && !hasStolenBike && (
        <>
          <p style={{ marginTop: "1rem" }}>
            The kid stands in the middle of the sidewalk, eyes raw, scanning
            the racks like the bike might respawn if he stares hard enough.
          </p>
          <p>
            You already ditched the evidence somewhere else. All that&apos;s
            left here is the echo of a bad decision.
          </p>
        </>
      )}

      {bikeReturned && (
        <>
          <p style={{ marginTop: "1rem" }}>
            The kid&apos;s still here, but now he&apos;s straddling the bike,
            fingers tight on the handlebars like he expects the street itself to
            yank it away again.
          </p>
          <p>
            He keeps glancing your way, confusion and gratitude wrestling in his
            face. You&apos;re not sure which one you deserve.
          </p>
        </>
      )}

      <p style={{ marginTop: "1rem" }}>
        Traffic roars. Your Retinaband pulses softly at the edge of your vision,
        burning the same five-minute intervals into your skull. The city moves
        on schedule whether you do or not.
      </p>

      {/* OPTIONS CHANGE BASED ON ITEMS + FLAGS */}

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        {/* Can only return the bike if: you stole it, haven't returned it yet, and still have it */}
        {bikeStolen && !bikeReturned && hasStolenBike && (
          <button onClick={returnBike}>
            Wheel the bike back to him.
          </button>
        )}

        {/* Talking to the boy only really makes sense if the bike was involved */}
        {(bikeStolen || bikeReturned) && (
          <button onClick={talkToBoy}>
            Talk to the boy.
          </button>
        )}

        <button onClick={crossCarelessly}>
          Cross the street without waiting for a gap.
        </button>
        <button onClick={keepWalking}>
          Drift with the crowd and circle the block.
        </button>
      </div>
    </section>
  );
}
