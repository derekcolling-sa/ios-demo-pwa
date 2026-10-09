"use client";

import { useRef, useState, type ReactNode } from "react";
import { House, LayoutGrid, Settings, type LucideIcon } from "lucide-react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { StoreProvider } from "@/lib/store";
import { PUSH, PushedLayer, SHEET_CLOSE, SHEET_OPEN, Sheet } from "./ios";
import { DetailScreen, HomeScreen, NewProjectForm, ProjectsScreen, SettingsScreen } from "./screens";

type Tab = "home" | "projects" | "settings";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "projects", label: "Projects", icon: LayoutGrid },
  { id: "settings", label: "Settings", icon: Settings },
];

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

/**
 * One level of push navigation. `progress` drives everything:
 * 0 = detail on screen, 1 = detail off to the right (root fully visible).
 */
function useStack() {
  const [id, setId] = useState<string | null>(null);
  const progress = useMotionValue(1);
  const generation = useRef(0);

  const push = (next: string) => {
    generation.current++;
    setId(next);
    progress.jump(1);
    animate(progress, 0, PUSH);
  };
  const pop = (velocity = 0) => {
    const g = ++generation.current;
    animate(progress, 1, { ...PUSH, velocity }).then(() => {
      if (generation.current === g) setId(null);
    });
  };
  const settle = (velocity = 0) => animate(progress, 0, { ...PUSH, velocity });

  return { id, progress, push, pop, settle };
}

type Stack = ReturnType<typeof useStack>;

function NavStack({ stack, root, backLabel }: { stack: Stack; root: ReactNode; backLabel: string }) {
  // The root slides a quarter-width left and dims while covered, tracking the gesture exactly.
  const rootX = useTransform(stack.progress, (p) => `${(p - 1) * 25}%`);
  const dim = useTransform(stack.progress, [0, 1], [0.1, 0]);

  return (
    <>
      <motion.div className="absolute inset-0" style={{ x: stack.id ? rootX : 0 }}>
        {root}
        {stack.id && (
          <motion.div className="pointer-events-none absolute inset-0 z-30 bg-black" style={{ opacity: dim }} />
        )}
      </motion.div>
      {stack.id && (
        <PushedLayer key={stack.id} progress={stack.progress} onPop={stack.pop} onSettle={stack.settle}>
          <DetailScreen id={stack.id} backLabel={backLabel} onBack={() => stack.pop()} />
        </PushedLayer>
      )}
    </>
  );
}

/** Modal sheet state. `progress`: 0 closed → 1 open. The app behind scales with it. */
function useSheet() {
  const [open, setOpen] = useState(false);
  const progress = useMotionValue(0);
  const generation = useRef(0);

  const show = () => {
    generation.current++;
    setOpen(true);
    animate(progress, 1, SHEET_OPEN);
  };
  const hide = (velocity = 0) => {
    const g = ++generation.current;
    animate(progress, 0, { ...SHEET_CLOSE, velocity }).then(() => {
      if (generation.current === g) setOpen(false);
    });
  };

  return { open, progress, show, hide };
}

function Shell() {
  const [tab, setTab] = useState<Tab>("home");
  const home = useStack();
  const projects = useStack();
  const sheet = useSheet();

  const selectTab = (t: Tab) => {
    // Tapping the active tab pops back to its root, like iOS.
    const stack = t === "home" ? home : t === "projects" ? projects : null;
    if (t === tab && stack?.id) stack.pop();
    setTab(t);
  };

  return (
    <div className="absolute inset-0 bg-black">
      <ScaledBehindSheet progress={sheet.progress}>
        {(["home", "projects", "settings"] as Tab[]).map((t) => (
          <div
            key={t}
            className={`absolute inset-0 overflow-hidden ${t === tab ? "" : "pointer-events-none invisible"}`}
            aria-hidden={t !== tab}
          >
            {t === "home" && (
              <NavStack stack={home} backLabel="Home" root={<HomeScreen onNew={sheet.show} onOpen={home.push} />} />
            )}
            {t === "projects" && (
              <NavStack stack={projects} backLabel="Projects" root={<ProjectsScreen onOpen={projects.push} />} />
            )}
            {t === "settings" && <SettingsScreen />}
          </div>
        ))}

        <nav className="material absolute inset-x-0 bottom-0 z-30 flex pb-[env(safe-area-inset-bottom)] shadow-[0_-0.5px_0_var(--sys-sep)]">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = id === tab;
            return (
              <button
                key={id}
                onClick={() => selectTab(id)}
                aria-current={on ? "page" : undefined}
                className={`flex h-[49px] flex-1 flex-col items-center justify-center gap-[3px] pt-1 ${
                  on ? "text-accent" : "text-[#999]"
                }`}
              >
                <Icon size={24} strokeWidth={on ? 2.3 : 1.8} />
                <span className="text-[10px] font-medium tracking-[0.1px]">{label}</span>
              </button>
            );
          })}
        </nav>
      </ScaledBehindSheet>

      <Sheet open={sheet.open} progress={sheet.progress} onRequestClose={sheet.hide}>
        <NewProjectForm onClose={() => sheet.hide()} />
      </Sheet>
    </div>
  );
}

/** App content that shrinks back and rounds its corners as a sheet comes up. */
function ScaledBehindSheet({ progress, children }: { progress: MotionValue<number>; children: ReactNode }) {
  const scale = useTransform(progress, [0, 1], [1, 0.92]);
  const radius = useTransform(progress, [0, 1], [0, 12]);
  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-grouped" style={{ scale, borderRadius: radius }}>
      {children}
    </motion.div>
  );
}
