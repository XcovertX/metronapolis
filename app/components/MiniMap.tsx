function MiniMap({ scene }: { scene: string }) {
  const grid = useMemo(() => {
    // Build a 3x3 around the current scene using exits.
    // Diagonals are left blank (unless you later add pathfinding).
    const center = scene as any;

    const n = getExit(center, "n");
    const s = getExit(center, "s");
    const e = getExit(center, "e");
    const w = getExit(center, "w");

    const up = getExit(center, "up");
    const down = getExit(center, "down");

    // Second ring (optional): look one more step out for better “neighborhood” feel
    const nn = n ? getExit(n as any, "n") : null;
    const ss = s ? getExit(s as any, "s") : null;
    const ee = e ? getExit(e as any, "e") : null;
    const ww = w ? getExit(w as any, "w") : null;

    const cell = (id: any | null) => {
      if (!id) return null;
      const def = getScene(id);
      return { id: String(id), title: def?.title ?? String(id) };
    };

    return {
      // 3x3 core
      nw: null,
      n: cell(n),
      ne: null,

      w: cell(w),
      c: cell(center),
      e: cell(e),

      sw: null,
      s: cell(s),
      se: null,

      // second ring hints (shown as tiny pips along edges)
      nn: cell(nn),
      ss: cell(ss),
      ee: cell(ee),
      ww: cell(ww),

      // vertical
      up: cell(up),
      down: cell(down),
    };
  }, [scene]);

  const truncate = (t: string, max = 12) =>
    t.length > max ? t.slice(0, max - 1) + "…" : t;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
      {/* Map */}
      <div
        style={{
          position: "relative",
          width: 220,
          height: 150,
          borderRadius: 12,
          border: "1px solid rgba(0,255,210,0.28)",
          background:
            "linear-gradient(180deg, rgba(0,20,18,0.85), rgba(0,0,0,0.85))",
          boxShadow:
            "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 18px rgba(0,255,210,0.10)",
          overflow: "hidden",
        }}
      >
        {/* faint grid */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,210,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            opacity: 0.55,
            mixBlendMode: "screen",
          }}
        />

        {/* 3x3 tiles */}
        <div
          style={{
            position: "absolute",
            inset: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <MapTile data={grid.nw} />
          <MapTile data={grid.n} />
          <MapTile data={grid.ne} />

          <MapTile data={grid.w} />
          <MapTile data={grid.c} isCenter />
          <MapTile data={grid.e} />

          <MapTile data={grid.sw} />
          <MapTile data={grid.s} />
          <MapTile data={grid.se} />
        </div>

        {/* second ring pips */}
        <SecondRingPip show={!!grid.nn} x="50%" y="6%" />
        <SecondRingPip show={!!grid.ss} x="50%" y="94%" />
        <SecondRingPip show={!!grid.ee} x="94%" y="50%" />
        <SecondRingPip show={!!grid.ww} x="6%" y="50%" />

        {/* up/down chips */}
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            display: "flex",
            gap: 6,
            opacity: 0.95,
          }}
        >
          <Chip active={!!grid.up} text="UP" />
          <Chip active={!!grid.down} text="DN" />
        </div>

        {/* labels */}
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            fontSize: 10,
            opacity: 0.65,
            letterSpacing: 1,
          }}
        >
          LOCAL GRID
        </div>

        {/* vignette */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 42px rgba(0,0,0,0.75)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* tiny legend */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 10, opacity: 0.65, letterSpacing: 1.1 }}>
          CENTER: YOU
        </div>
        <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: 1.1 }}>
          {grid.c?.title ? truncate(grid.c.title, 18) : ""}
        </div>
      </div>
    </div>
  );
}

function MapTile({
  data,
  isCenter,
}: {
  data: { id: string; title: string } | null;
  isCenter?: boolean;
}) {
  const title = data?.title ?? "";
  const text = title.length > 12 ? title.slice(0, 11) + "…" : title;

  return (
    <div
      title={title}
      style={{
        borderRadius: 10,
        border: "1px solid rgba(0,255,210,0.22)",
        background: isCenter
          ? "rgba(255,200,90,0.10)"
          : data
          ? "rgba(0,0,0,0.55)"
          : "rgba(0,0,0,0.25)",
        boxShadow: isCenter
          ? "0 0 14px rgba(255,200,90,0.18), inset 0 0 0 1px rgba(255,200,90,0.10)"
          : data
          ? "inset 0 0 0 1px rgba(0,255,210,0.06)"
          : "none",
        color: isCenter
          ? "rgba(255,200,90,0.95)"
          : "rgba(210,255,245,0.88)",
        fontSize: 10,
        letterSpacing: 0.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4px 6px",
        opacity: data || isCenter ? 1 : 0.35,
      }}
    >
      {isCenter ? "YOU" : data ? text : ""}
    </div>
  );
}

function SecondRingPip({
  show,
  x,
  y,
}: {
  show: boolean;
  x: string;
  y: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: 8,
        height: 8,
        borderRadius: 3,
        border: "1px solid rgba(0,255,210,0.30)",
        background: show ? "rgba(0,255,210,0.28)" : "rgba(255,255,255,0.06)",
        boxShadow: show ? "0 0 10px rgba(0,255,210,0.18)" : "none",
        opacity: show ? 0.95 : 0.25,
      }}
    />
  );
}
