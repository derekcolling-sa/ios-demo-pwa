"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Plus,
  Search,
  Share,
  Smartphone,
  Star,
  StarOff,
  Sun,
  Trash2,
  Vibrate,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  ACCENTS,
  APPEARANCES,
  KINDS,
  KIND_META,
  STATUSES,
  STATUS_META,
  daysFromToday,
  isoDate,
  relativeDue,
  useDerived,
  useStore,
  type Kind,
  type Project,
  type Status,
} from "@/lib/store";
import {
  ActionSheet,
  BackButton,
  IconTile,
  ProgressBar,
  Row,
  Screen,
  Section,
  Segmented,
  SheetHeader,
  Slider,
  SwipeRow,
  Toggle,
} from "./ios";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------- Home ----------

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function HomeScreen({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { state } = useStore();
  const { dueThisWeek, starred, count } = useDerived();

  return (
    <Screen
      title={`${greeting()}, ${state.userName}`}
      trailing={
        <button
          aria-label="New project"
          onClick={onNew}
          className="flex size-[30px] items-center justify-center rounded-full bg-accent text-white transition-transform duration-600 ease-spring active:scale-85"
        >
          <Plus size={20} strokeWidth={2.8} />
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {STATUSES.map((s) => {
          const meta = STATUS_META[s];
          return (
            <div key={s} className="rounded-2xl bg-cell p-4">
              <meta.icon size={22} strokeWidth={2} style={{ color: meta.color }} />
              <div className="mt-2 font-rounded text-[34px] font-bold leading-none tabular-nums">{count(s)}</div>
              <div className="mt-2 text-[15px] text-label2">{meta.label}</div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-7 px-4 pb-2.5 text-[20px] font-semibold tracking-[0.38px]">Due this week</h2>
      {dueThisWeek.length === 0 ? (
        <div className="mx-4 flex flex-col items-center rounded-[14px] bg-cell py-8 text-label2">
          <Sun size={34} />
          <p className="mt-2 text-[17px] font-semibold text-label">Nothing due</p>
          <p className="text-[15px]">Clear week ahead.</p>
        </div>
      ) : (
        <div className="px-4">
          <AnimatePresence initial={false}>
            {dueThisWeek.map((p) => {
              const meta = STATUS_META[p.status];
              const Icon = KIND_META[p.kind].icon;
              return (
                <motion.div
                  key={p.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, visualDuration: 0.32 }}
                >
                  <button
                    onClick={() => onOpen(p.id)}
                    className="mb-2.5 flex w-full items-center gap-3.5 rounded-[14px] bg-cell p-3 text-left transition-[transform,opacity] duration-600 ease-spring active:scale-[0.98] active:opacity-80"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 15%, transparent)` }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-medium">{p.name}</span>
                      <span className="block text-[12px] text-label2">{p.client}</span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-label2">{relativeDue(p.due)}</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {starred.length > 0 && (
        <>
          <h2 className="mt-7 px-4 pb-2.5 text-[20px] font-semibold tracking-[0.38px]">Starred</h2>
          <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {starred.map((p) => {
              const Icon = KIND_META[p.kind].icon;
              return (
                <button
                  key={p.id}
                  onClick={() => onOpen(p.id)}
                  className="flex h-[170px] w-[190px] shrink-0 snap-start flex-col rounded-[20px] p-4 text-left text-white transition-transform duration-600 ease-spring active:scale-[0.95]"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 62%, white))",
                  }}
                >
                  <Icon size={26} />
                  <span className="mt-auto line-clamp-2 text-[17px] font-semibold leading-[22px]">{p.name}</span>
                  <span className="mt-2">
                    <ProgressBar value={p.progress} color="#fff" track="rgba(255,255,255,0.3)" />
                  </span>
                  <span className="mt-1.5 text-[12px] opacity-85">
                    {Math.round(p.progress * 100)}% · {p.client}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Screen>
  );
}

// ---------- Projects ----------

export function ProjectsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, deleteProject, toggleStar } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.projects.filter(
      (p) =>
        (filter === null || p.status === filter) &&
        (!q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)),
    );
  }, [state.projects, search, filter]);

  const chips: { value: Status | null; label: string }[] = [
    { value: null, label: "All" },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
  ];

  return (
    <Screen title="Projects">
      <div className="px-4 pb-1">
        <label className="flex h-9 items-center gap-1.5 rounded-[10px] bg-fill3 px-2 text-label2">
          <Search size={17} strokeWidth={2.4} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients"
            className="min-w-0 flex-1 bg-transparent text-[17px] text-label outline-none placeholder:text-label2"
            enterKeyHint="search"
          />
          {search && (
            <button
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="flex size-4 items-center justify-center rounded-full bg-label3 text-cell"
            >
              <X size={11} strokeWidth={3.5} />
            </button>
          )}
        </label>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
        {chips.map((c) => {
          const on = filter === c.value;
          return (
            <button
              key={c.label}
              onClick={() => setFilter(c.value)}
              className={`shrink-0 rounded-full px-3.5 py-[7px] text-[15px] font-medium transition-[background-color,color,transform] duration-600 ease-spring active:scale-95 ${
                on ? "bg-accent text-white" : "bg-fill3 text-label"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-20 flex flex-col items-center px-10 text-center text-label2">
          <Search size={44} />
          <p className="mt-3 text-[22px] font-bold text-label">
            {search ? `No Results for “${search}”` : "No Projects"}
          </p>
          <p className="mt-1 text-[15px]">
            {search ? "Check the spelling or try a new search." : "Nothing in this status."}
          </p>
        </div>
      ) : (
        <Section tight footer="Swipe right to star, left to delete.">
          <AnimatePresence initial={false}>
            {visible.map((p) => (
              <SwipeRow
                key={p.id}
                leading={{
                  label: p.starred ? "Unstar" : "Star",
                  icon: p.starred ? <StarOff size={20} /> : <Star size={20} fill="currentColor" />,
                  color: "var(--yellow)",
                  onAction: () => toggleStar(p.id),
                }}
                trailing={{
                  label: "Delete",
                  icon: <Trash2 size={20} />,
                  color: "var(--red)",
                  destructive: true,
                  onAction: () => deleteProject(p.id),
                }}
              >
                <ProjectRow project={p} onClick={() => onOpen(p.id)} />
              </SwipeRow>
            ))}
          </AnimatePresence>
        </Section>
      )}
    </Screen>
  );
}

function ProjectRow({ project: p, onClick }: { project: Project; onClick: () => void }) {
  const meta = STATUS_META[p.status];
  const Icon = KIND_META[p.kind].icon;
  return (
    <button onClick={onClick} className="flex w-full items-stretch pl-4 text-left active:bg-fill3">
      <span className="mr-3 flex w-7 shrink-0 items-center justify-center" style={{ color: meta.color }}>
        <Icon size={20} />
      </span>
      <span className="flex flex-1 items-center gap-2 py-2.5 pr-4 shadow-[inset_0_-0.5px_0_var(--sys-sep)] group-last/cell:shadow-none">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-[17px] font-medium">{p.name}</span>
            {p.starred && <Star size={11} fill="var(--yellow)" stroke="var(--yellow)" className="shrink-0" />}
          </span>
          <span className="block text-[12px] text-label2">{p.client}</span>
          <span className="mt-1.5 block">
            <ProgressBar value={p.progress} color={meta.color} />
          </span>
        </span>
        <ChevronRight size={18} strokeWidth={2.4} className="-mr-1 shrink-0 text-label3" />
      </span>
    </button>
  );
}

// ---------- Detail ----------

export function DetailScreen({ id, backLabel, onBack }: { id: string; backLabel: string; onBack: () => void }) {
  const { state, updateProject } = useStore();
  const p = state.projects.find((x) => x.id === id);

  if (!p) {
    return (
      <Screen title="" large={false} leading={<BackButton label={backLabel} onClick={onBack} />}>
        <p className="mt-32 text-center text-[17px] text-label2">Project removed</p>
      </Screen>
    );
  }

  const meta = STATUS_META[p.status];
  const kind = KIND_META[p.kind];
  const set = (patch: Partial<Project>) => updateProject(p.id, patch);

  return (
    <Screen title={p.name} leading={<BackButton label={backLabel} onClick={onBack} />}>
      <Section>
        <div className="space-y-2 px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: meta.color }}>
            <kind.icon size={17} /> {kind.label}
          </div>
          <div className="text-[20px] text-label2">{p.client}</div>
          <div className="flex items-center justify-between pt-1 text-[13px] text-label2">
            <span>Progress</span>
            <span className="tabular-nums">{Math.round(p.progress * 100)}%</span>
          </div>
          <ProgressBar value={p.progress} color={meta.color} />
        </div>
      </Section>

      <Section header="Status">
        <div className="group/cell px-4 py-2 shadow-[inset_0_-0.5px_0_var(--sys-sep)]">
          <Segmented
            label="Status"
            value={p.status}
            onChange={(status) => set(status === "done" ? { status, progress: 1 } : { status })}
            options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))}
          />
        </div>
        <Row label="Progress">
          <div className="w-[55%]">
            <Slider label="Progress" value={p.progress} onChange={(progress) => set({ progress })} />
          </div>
        </Row>
        <Row label="Due">
          <input
            type="date"
            aria-label="Due date"
            value={p.due}
            onChange={(e) => e.target.value && set({ due: e.target.value })}
            className="ios-date"
          />
        </Row>
        <Row label="Starred">
          <Toggle label="Starred" checked={p.starred} onChange={(starred) => set({ starred })} />
        </Row>
      </Section>

      <Section header="Notes">
        <textarea
          aria-label="Notes"
          value={p.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={4}
          className="block w-full resize-none bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-label3"
          placeholder="Notes"
        />
      </Section>
    </Screen>
  );
}

// ---------- New project ----------

export function NewProjectForm({ onClose }: { onClose: () => void }) {
  const { addProject } = useStore();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [kind, setKind] = useState<Kind>("campaign");
  const [due, setDue] = useState(() => daysFromToday(7));
  const [notes, setNotes] = useState("");
  const [starred, setStarred] = useState(false);

  const canSave = name.trim() !== "" && client.trim() !== "";
  const input = "w-full bg-transparent text-[17px] outline-none placeholder:text-label3";

  return (
    <>
      <SheetHeader
        title="New Project"
        onCancel={onClose}
        confirmLabel="Add"
        confirmDisabled={!canSave}
        onConfirm={() => {
          addProject({
            name: name.trim(),
            client: client.trim(),
            kind,
            status: "briefing",
            due,
            progress: 0,
            notes,
            starred,
          });
          onClose();
        }}
      />
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <Section header="Basics">
          <Row>
            <input
              className={input}
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Row>
          <Row>
            <input className={input} placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
          </Row>
        </Section>

        <Section header="Type">
          {KINDS.map((k) => {
            const meta = KIND_META[k];
            return (
              <Row
                key={k}
                icon={<meta.icon size={20} className="text-accent" />}
                label={meta.label}
                onClick={() => setKind(k)}
              >
                {kind === k && <Check size={20} strokeWidth={2.8} className="text-accent" />}
              </Row>
            );
          })}
        </Section>

        <Section header="Schedule">
          <Row label="Due date">
            <input
              type="date"
              aria-label="Due date"
              min={isoDate(new Date())}
              value={due}
              onChange={(e) => e.target.value && setDue(e.target.value)}
              className="ios-date"
            />
          </Row>
          <Row label="Star this project">
            <Toggle label="Star this project" checked={starred} onChange={setStarred} />
          </Row>
        </Section>

        <Section header="Notes">
          <textarea
            aria-label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="What's the ask?"
            className="block w-full resize-none bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-label3"
          />
        </Section>
      </div>
    </>
  );
}

// ---------- Settings ----------

function useInstalled() {
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalled(standalone);
  }, []);
  return installed;
}

export function SettingsScreen() {
  const { state, updateSettings, resetProjects } = useStore();
  const { active } = useDerived();
  const [confirmReset, setConfirmReset] = useState(false);
  const installed = useInstalled();

  return (
    <Screen title="Settings">
      <Section>
        <div className="flex items-center gap-3.5 px-4 py-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-[26px] font-bold text-white">
            {(state.userName.trim()[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <input
              aria-label="Name"
              value={state.userName}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              className="w-full bg-transparent text-[20px] font-semibold outline-none"
            />
            <div className="text-[15px] text-label2">{active.length} active projects</div>
          </div>
        </div>
      </Section>

      <Section header="Appearance">
        <div className="px-4 py-2 shadow-[inset_0_-0.5px_0_var(--sys-sep)]">
          <Segmented
            label="Theme"
            value={state.appearance}
            onChange={(appearance) => updateSettings({ appearance })}
            options={APPEARANCES.map((a) => ({ value: a, label: cap(a) }))}
          />
        </div>
        <Row label="Accent">
          <div className="flex gap-2.5" role="radiogroup" aria-label="Accent color">
            {ACCENTS.map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={state.accent === a}
                aria-label={cap(a)}
                onClick={() => updateSettings({ accent: a })}
                className="flex size-7 items-center justify-center rounded-full text-white transition-transform duration-600 ease-spring active:scale-80"
                style={{ background: `var(--${a})` }}
              >
                {state.accent === a && <Check size={15} strokeWidth={3.5} />}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section header="Preferences">
        <Row
          icon={
            <IconTile color="var(--red)">
              <Bell size={17} fill="currentColor" />
            </IconTile>
          }
          label="Due-date reminders"
        >
          <Toggle
            label="Due-date reminders"
            checked={state.notificationsOn}
            onChange={(notificationsOn) => updateSettings({ notificationsOn })}
          />
        </Row>
        <Row
          icon={
            <IconTile color="var(--purple)">
              <Vibrate size={17} />
            </IconTile>
          }
          label="Haptics"
        >
          <Toggle label="Haptics" checked={state.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        </Row>
      </Section>

      <Section
        header="About"
        footer={
          installed ? null : (
            <span className="inline-flex flex-wrap items-center gap-1">
              To install: in Safari tap <Share size={13} className="inline" /> then “Add to Home Screen.”
            </span>
          )
        }
      >
        <Row label="Version" detail="1.0 (1)" />
        <Row
          icon={
            <IconTile color="var(--blue)">
              <Smartphone size={17} />
            </IconTile>
          }
          label="Running as"
          detail={installed ? "Home Screen app" : "Web page"}
        />
      </Section>

      <Section>
        <Row label="Reset Demo Data" destructive onClick={() => setConfirmReset(true)} />
      </Section>

      <ActionSheet
        open={confirmReset}
        title="Reset all projects to the sample set?"
        actionLabel="Reset"
        onAction={resetProjects}
        onClose={() => setConfirmReset(false)}
      />
    </Screen>
  );
}
