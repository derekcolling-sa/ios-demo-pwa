import { App } from "@/components/app";

export default function Page() {
  return (
    // Full-screen on phones; a phone-sized frame on larger screens.
    <main className="flex h-full items-center justify-center">
      <div
        id="phone"
        className="relative h-dvh w-full overflow-hidden sm:h-[min(874px,calc(100dvh-48px))] sm:w-[402px] sm:rounded-[48px] sm:shadow-[0_0_0_10px_#1c1c1e,0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <App />
        <div id="overlay-root" className="pointer-events-none absolute inset-0 z-50 *:pointer-events-auto" />
      </div>
    </main>
  );
}
