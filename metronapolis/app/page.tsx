import PixiStage from "@/components/PixiStage";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <header className="p-4 border-b border-neutral-800">
        <h1 className="text-xl font-semibold">Metronapolis</h1>
      </header>

      <section className="flex-1">
        {/* Fixed height example; you can also use flex and have it fill the page */}
        <div style={{ width: "100%", height: "calc(100vh - 64px)" }}>
          <PixiStage background={0x111111} />
        </div>
      </section>
    </main>
  );
}
