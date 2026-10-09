"use client";

import { useRef, useState, type ReactNode } from "react";
import { House, LayoutGrid, Settings, type LucideIcon } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { PushedLayer, Sheet } from "./ios";
import { DetailScreen, HomeScreen, NewProjectForm, ProjectsScreen, SettingsScreen } from "./screens";

type Tab = "home" | "projects" | "settings";
type StackTab = Exclude<Tab, "settings">;

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "projects", label: "Projects", icon: LayoutGrid },
  { id: "settings", label: "Settings", icon: Settings },
];

const BACK_LABEL: Record<StackTab, string> = { home: "Home", projects: "Projects" };

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("home");
  const [pushed, setPushed] = useState<Record<StackTab, string | null>>({ home: null, projects: null });
  const [leaving, setLeaving] = useState<StackTab | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (t: StackTab) => (id: string) => setPushed((s) => ({ ...s, [t]: id }));
  const pop = (t: StackTab) => {
    if (leaving) return;
    setLeaving(t);
    clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => {
      setPushed((s) => ({ ...s, [t]: null }));
      setLeaving(null);
    }, 350);
  };

  const selectTab = (t: Tab) => {
    // Tapping the active tab pops back to its root, like iOS.
    if (t === tab && t !== "settings" && pushed[t]) pop(t);
    setTab(t);
  };

  const stack = (t: StackTab, root: ReactNode) => {
    const id = pushed[t];
    const covered = id !== null && leaving !== t;
    return (
      <>
        <div
          className={`absolute inset-0 transition-[transform,filter] duration-350 ease-ios ${
            covered ? "-translate-x-1/4 brightness-[0.92]" : ""
          }`}
        >
          {root}
        </div>
        {id && (
          <PushedLayer key={id} leaving={leaving === t} onSwipeBack={() => pop(t)}>
            <DetailScreen id={id} backLabel={BACK_LABEL[t]} onBack={() => pop(t)} />
          </PushedLayer>
        )}
      </>
    );
  };

  return (
    <div className="absolute inset-0 bg-black">
      {/* App content — shrinks back like iOS when a card sheet is presented */}
      <div
        className={`absolute inset-0 overflow-hidden bg-grouped transition-[transform,border-radius] duration-500 ease-ios ${
          newOpen ? "scale-[0.92] rounded-[12px]" : ""
        }`}
      >
        {(["home", "projects", "settings"] as Tab[]).map((t) => (
          <div
            key={t}
            className={`absolute inset-0 overflow-hidden ${t === tab ? "" : "pointer-events-none invisible"}`}
            aria-hidden={t !== tab}
          >
            {t === "home" && stack("home", <HomeScreen onNew={() => setNewOpen(true)} onOpen={push("home")} />)}
            {t === "projects" && stack("projects", <ProjectsScreen onOpen={push("projects")} />)}
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
      </div>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)}>
        <NewProjectForm onClose={() => setNewOpen(false)} />
      </Sheet>
    </div>
  );
}
