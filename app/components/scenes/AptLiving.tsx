// app/components/scenes/AptLiving.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function AptLiving() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Apartment – Living Room</h1>
      <p style={{ marginTop: "1rem" }}>
        The living room is a museum of bad decisions: unwashed cups, a dying
        holoscreen cycling static ads, a coat thrown over the back of a chair
        days ago or loops ago—you&apos;re not sure anymore.
      </p>

      <h2 style={{ marginTop: "2rem" }}>Where do you go?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("apt-kitchen");
          }}
        >
          Check the kitchen.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("lobby");
          }}
        >
          Leave the apartment and head to the lobby.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("apt-bedroom");
          }}
        >
          Go back to the bedroom.
        </button>
      </div>
    </section>
  );
}
