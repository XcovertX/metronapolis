// app/components/scenes/BoyStreet.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useDialog } from "../DialogContext";

export default function BoyStreet() {
  const { flags, advanceTime, goToScene } = useLoopState();
  const { startDialog } = useDialog();
  const { bikeStolen } = flags;

  const crossCarelessly = () => {
    advanceTime(5);
    goToScene("death-reset");
  };

  const keepWalking = () => {
    advanceTime(5);
    goToScene("static-corner"); // circle the block within the same loop
  };

  const talkToBoy = () => {
    // no time advance here; each dialog response has its own timeCost
    startDialog("boy_intro_1");
  };

  return (
    <section>
      <h1>Relay Street – Midday Crowd</h1>

      {!bikeStolen ? (
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
      ) : (
        <>
          <p style={{ marginTop: "1rem" }}>
            The kid stands in the middle of the sidewalk, eyes red, cheeks wet,
            staring at an empty patch of railing like it personally betrayed
            him.
          </p>
          <p>
            People flow around him like he&apos;s a piece of broken furniture
            someone forgot to move. He doesn&apos;t seem to notice. Just keeps
            scanning faces, like one of them might be holding his life between
            their hands.
          </p>
          <p>
            He catches your eye for half a heartbeat. You look away first. It&apos;s
            easier that way.
          </p>
        </>
      )}

      <p style={{ marginTop: "1rem" }}>
        Traffic roars. Your Retinaband pulses softly at the edge of your
        vision, burning the same five-minute intervals into your skull. The
        city moves on schedule whether you do or not.
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
        {bikeStolen && (
          <button onClick={talkToBoy}>
            Talk to the boy about his missing bike.
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
