"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  Eye,
  FileText,
  Globe,
  Hammer,
  Megaphone,
  Printer,
  Video,
  type LucideIcon,
} from "lucide-react";

export type Status = "briefing" | "inProgress" | "review" | "done";
export type Kind = "campaign" | "video" | "web" | "print";
export type Accent = "indigo" | "teal" | "orange" | "pink";
export type Appearance = "system" | "light" | "dark";

export const STATUSES: Status[] = ["briefing", "inProgress", "review", "done"];
export const KINDS: Kind[] = ["campaign", "video", "web", "print"];
export const ACCENTS: Accent[] = ["indigo", "teal", "orange", "pink"];
export const APPEARANCES: Appearance[] = ["system", "light", "dark"];

export const STATUS_META: Record<Status, { label: string; color: string; icon: LucideIcon }> = {
  briefing: { label: "Briefing", color: "var(--gray)", icon: FileText },
  inProgress: { label: "In Progress", color: "var(--blue)", icon: Hammer },
  review: { label: "In Review", color: "var(--orange)", icon: Eye },
  done: { label: "Done", color: "var(--green)", icon: BadgeCheck },
};

export const KIND_META: Record<Kind, { label: string; icon: LucideIcon }> = {
  campaign: { label: "Campaign", icon: Megaphone },
  video: { label: "Video", icon: Video },
  web: { label: "Web", icon: Globe },
  print: { label: "Print", icon: Printer },
};

export type Project = {
  id: string;
  name: string;
  client: string;
  kind: Kind;
  status: Status;
  /** Local calendar date, YYYY-MM-DD */
  due: string;
  progress: number;
  notes: string;
  starred: boolean;
};

export type Settings = {
  accent: Accent;
  appearance: Appearance;
  notificationsOn: boolean;
  haptics: boolean;
  userName: string;
};

type State = Settings & { projects: Project[] };

export { STORAGE_KEY } from "./constants";
import { STORAGE_KEY } from "./constants";

// ---------- dates ----------

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function relativeDue(iso: string): string {
  return relative.format(daysUntil(iso), "day");
}

// ---------- data ----------

function sampleProjects(): Project[] {
  const p = (
    id: string,
    name: string,
    client: string,
    kind: Kind,
    status: Status,
    days: number,
    progress: number,
    notes: string,
    starred = false,
  ): Project => ({ id, name, client, kind, status, due: daysFromToday(days), progress, notes, starred });

  return [
    p("s1", "Spring Launch Banners", "Felycin", "campaign", "inProgress", 3, 0.6, "12 sizes, two headlines in rotation.", true),
    p("s2", "Brand Story Video", "ShowSheen", "video", "review", 5, 0.85, "60s cut plus 15s social edit."),
    p("s3", "Landing Page Refresh", "Wavelength", "web", "briefing", 14, 0.1, "Waiting on final messaging hierarchy."),
    p("s4", "Pet Parent Kit", "CareCredit", "print", "inProgress", 9, 0.4, "Stylescape approved. Moving to layouts.", true),
    p("s5", "Conference Booth", "Astaria", "campaign", "briefing", 21, 0.05, "Positioning reset before concepts."),
    p("s6", "Q3 Social Toolkit", "Honest to Goodness", "campaign", "done", -4, 1, "Delivered and approved."),
  ];
}

function defaults(): State {
  return {
    projects: sampleProjects(),
    accent: "indigo",
    appearance: "system",
    notificationsOn: true,
    haptics: true,
    userName: "Derek",
  };
}

// ---------- store ----------

type Store = {
  state: State;
  addProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleStar: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProjects: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  // Load from localStorage once on the client. Rendering waits for this, so
  // nothing time- or storage-dependent runs during prerender.
  useEffect(() => {
    let loaded = defaults();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = { ...loaded, ...JSON.parse(raw) };
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded);
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Apply theme + accent to <html>.
  const appearance = state?.appearance;
  const accent = state?.accent;
  useEffect(() => {
    if (!appearance || !accent) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", `var(--${accent})`);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      root.classList.toggle("dark", appearance === "dark" || (appearance === "system" && media.matches));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance, accent]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => (s ? fn(s) : s)), []);

  const store = useMemo<Store | null>(
    () =>
      state && {
        state,
        addProject: (p) =>
          update((s) => ({ ...s, projects: [{ ...p, id: crypto.randomUUID() }, ...s.projects] })),
        updateProject: (id, patch) =>
          update((s) => ({
            ...s,
            projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        deleteProject: (id) => update((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) })),
        toggleStar: (id) =>
          update((s) => ({
            ...s,
            projects: s.projects.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p)),
          })),
        updateSettings: (patch) => update((s) => ({ ...s, ...patch })),
        resetProjects: () => update((s) => ({ ...s, projects: sampleProjects() })),
      },
    [state, update],
  );

  if (!store) return null;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}

export function useDerived() {
  const { state } = useStore();
  return useMemo(() => {
    const active = state.projects.filter((p) => p.status !== "done");
    return {
      active,
      starred: state.projects.filter((p) => p.starred),
      dueThisWeek: active
        .filter((p) => daysUntil(p.due) <= 7)
        .sort((a, b) => a.due.localeCompare(b.due)),
      count: (status: Status) => state.projects.filter((p) => p.status === status).length,
    };
  }, [state.projects]);
}
