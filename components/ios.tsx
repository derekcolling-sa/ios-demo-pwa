"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, motion, useTransform, type MotionValue, type Transition } from "motion/react";

/** Shared springs. `visualDuration` = time to visually arrive; `bounce` = overshoot. */
export const PUSH: Transition = { type: "spring", bounce: 0, visualDuration: 0.42 };
export const SHEET_OPEN: Transition = { type: "spring", bounce: 0.14, visualDuration: 0.5 };
export const SHEET_CLOSE: Transition = { type: "spring", bounce: 0, visualDuration: 0.36 };
const ROW: Transition = { type: "spring", bounce: 0, visualDuration: 0.32 };

const TAB_BAR_SPACE = "pb-[calc(49px+env(safe-area-inset-bottom)+32px)]";

/** Scrollable screen with an iOS nav bar that collapses its large title on scroll. */
export function Screen({
  title,
  large = true,
  leading,
  trailing,
  children,
}: {
  title: string;
  large?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(!large);

  return (
    <div
      className={`no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain bg-grouped ${TAB_BAR_SPACE}`}
      onScroll={(e) => large && setCollapsed(e.currentTarget.scrollTop > 40)}
    >
      <header
        className={`sticky top-0 z-20 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200 ${
          collapsed ? "material shadow-[0_0.5px_0_var(--sys-sep)]" : ""
        }`}
      >
        <div className="relative flex h-11 items-center justify-between px-4">
          <div className="z-10 flex min-w-0 items-center">{leading}</div>
          <div
            className={`pointer-events-none absolute inset-x-24 truncate text-center text-[17px] font-semibold transition-opacity duration-200 ${
              collapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </div>
          <div className="z-10 flex items-center gap-4">{trailing}</div>
        </div>
      </header>
      {large && <h1 className="px-4 pb-2 pt-0.5 text-[34px] font-bold leading-[41px] tracking-[0.37px]">{title}</h1>}
      {children}
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-2.5 flex items-center text-[17px] text-accent active:opacity-40">
      <ChevronLeft size={30} strokeWidth={2.2} className="-mr-0.5" />
      {label}
    </button>
  );
}

/** Inset-grouped list section. */
export function Section({
  header,
  footer,
  tight,
  children,
}: {
  header?: string;
  footer?: ReactNode;
  /** Sits right under other content instead of starting a new group. */
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={tight ? "mt-2" : "mt-[35px] first:mt-3"}>
      {header && <h2 className="px-8 pb-[7px] text-[13px] uppercase tracking-[-0.08px] text-label2">{header}</h2>}
      <div className="mx-4 overflow-hidden rounded-[10px] bg-cell">{children}</div>
      {footer && <p className="px-8 pt-[7px] text-[13px] leading-[18px] tracking-[-0.08px] text-label2">{footer}</p>}
    </section>
  );
}

/** One cell in a Section. Draws its own inset separator, hidden on the last row. */
export function Row({
  icon,
  label,
  detail,
  chevron,
  onClick,
  destructive,
  children,
}: {
  icon?: ReactNode;
  label?: ReactNode;
  detail?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  children?: ReactNode;
}) {
  const body = (
    <>
      {icon && <div className="mr-3 flex shrink-0 items-center">{icon}</div>}
      <div className="flex min-h-11 flex-1 items-center gap-3 py-[7px] pr-4 shadow-[inset_0_-0.5px_0_var(--sys-sep)] group-last/cell:shadow-none">
        {label !== undefined && (
          <span className={`flex-1 text-left text-[17px] ${destructive ? "text-ios-red" : ""}`}>{label}</span>
        )}
        {children}
        {detail !== undefined && <span className="text-[17px] text-label2">{detail}</span>}
        {chevron && <ChevronRight size={18} strokeWidth={2.4} className="-mr-1 text-label3" />}
      </div>
    </>
  );
  const cls = "group/cell flex w-full items-stretch pl-4";
  return onClick ? (
    <button onClick={onClick} className={`${cls} active:bg-fill3`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Colored rounded-square icon used in Settings rows. */
export function IconTile({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="flex size-[29px] items-center justify-center rounded-[7px] text-white"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-ios-green" : "bg-fill"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-transform duration-600 ease-spring ${
          checked ? "translate-x-[20px]" : ""
        }`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid h-8 w-full rounded-[9px] bg-fill3 p-[2px]"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        aria-hidden
        className="absolute bottom-[2px] left-[2px] top-[2px] rounded-[7px] bg-segment shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] transition-transform duration-800 ease-spring-soft"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 truncate px-1 text-[13px] tracking-[-0.08px] ${
            o.value === value ? "font-semibold" : "font-medium"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={1}
      step={0.05}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ios-slider"
      style={{ "--p": `${value * 100}%` } as CSSProperties}
    />
  );
}

export function ProgressBar({ value, color, track }: { value: number; color: string; track?: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: track ?? "var(--sys-fill)" }}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-ios"
        style={{ width: `${value * 100}%`, background: color }}
      />
    </div>
  );
}

// ---------- presentation ----------

/** Keeps something mounted long enough to animate out. */
function usePresence(open: boolean, ms: number) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);

  return { mounted, visible };
}

function OverlayPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById("overlay-root"));
  }, []);
  return target ? createPortal(children, target) : null;
}

type SheetDrag = Pick<
  HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "onClickCapture"
>;
const SheetDragContext = createContext<SheetDrag>({});

/**
 * Card-style modal sheet driven by `progress` (0 closed → 1 open).
 * The grabber and SheetHeader are drag handles: pull down to dismiss, flick to throw it away.
 */
export function Sheet({
  open,
  progress,
  onRequestClose,
  children,
}: {
  open: boolean;
  progress: MotionValue<number>;
  onRequestClose: (velocity: number) => void;
  children: ReactNode;
}) {
  const y = useTransform(progress, (p) => `${(1 - Math.min(p, 1.04)) * 100}%`);
  const dim = useTransform(progress, [0, 1], [0, 0.4]);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef({ y: 0, height: 1, active: false, dragged: false });

  const handlers: SheetDrag = {
    onPointerDown: (e) => {
      drag.current = {
        y: e.clientY,
        height: panel.current?.getBoundingClientRect().height ?? 1,
        active: true,
        dragged: false,
      };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d.active) return;
      const dy = e.clientY - d.y;
      if (!d.dragged) {
        if (Math.abs(dy) < 4) return;
        d.dragged = true;
        progress.stop();
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      // Free movement downward, heavy resistance upward.
      progress.set(dy >= 0 ? 1 - dy / d.height : 1 + (-dy * 0.15) / d.height);
    },
    onPointerUp: () => {
      const d = drag.current;
      d.active = false;
      if (!d.dragged) return;
      const velocity = progress.getVelocity();
      if (progress.get() < 0.75 || velocity < -1.2) onRequestClose(velocity);
      else animate(progress, 1, { ...SHEET_OPEN, velocity });
    },
    onClickCapture: (e) => {
      // A drag that started on Cancel/Add shouldn't count as a tap.
      if (drag.current.dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
  handlers.onPointerCancel = handlers.onPointerUp;

  if (!open) return null;
  return (
    <OverlayPortal>
      <div className="absolute inset-0 z-40">
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: dim }} onClick={() => onRequestClose(0)} />
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          style={{ y }}
          className="absolute inset-x-0 -bottom-10 top-[calc(env(safe-area-inset-top)+4%+12px)] flex flex-col overflow-hidden rounded-t-[12px] bg-grouped pb-10"
        >
          <div className="shrink-0 touch-none pt-[5px]" {...handlers}>
            <div className="mx-auto h-[5px] w-9 rounded-full bg-label3" />
          </div>
          <SheetDragContext.Provider value={handlers}>{children}</SheetDragContext.Provider>
        </motion.div>
      </div>
    </OverlayPortal>
  );
}

export function SheetHeader({
  title,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDisabled,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
}) {
  const drag = useContext(SheetDragContext);
  return (
    <div className="relative flex h-[50px] shrink-0 touch-none items-center justify-between px-4" {...drag}>
      <button onClick={onCancel} className="text-[17px] text-accent active:opacity-40">
        Cancel
      </button>
      <span className="absolute inset-x-24 text-center text-[17px] font-semibold">{title}</span>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className="text-[17px] font-semibold text-accent active:opacity-40 disabled:text-label3"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

/** Bottom action sheet (confirmation dialog). */
export function ActionSheet({
  open,
  title,
  actionLabel,
  onAction,
  onClose,
}: {
  open: boolean;
  title: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
}) {
  const { mounted, visible } = usePresence(open, 400);
  if (!mounted) return null;
  return (
    <OverlayPortal>
      <div className="absolute inset-0 z-50">
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />
        <div
          role="alertdialog"
          aria-label={title}
          className={`absolute inset-x-2 bottom-[max(8px,env(safe-area-inset-bottom))] space-y-2 transition-transform duration-800 ease-spring-soft ${
            visible ? "translate-y-0" : "translate-y-[calc(100%+40px)]"
          }`}
        >
          <div className="material overflow-hidden rounded-[14px]">
            <p className="px-4 py-[13px] text-center text-[13px] font-semibold text-label2">{title}</p>
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="h-[57px] w-full text-[20px] text-ios-red shadow-[inset_0_0.5px_0_var(--sys-sep)] active:bg-fill3"
            >
              {actionLabel}
            </button>
          </div>
          <button
            onClick={onClose}
            className="h-[57px] w-full rounded-[14px] bg-cell text-[20px] font-semibold text-accent active:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </OverlayPortal>
  );
}

// ---------- gestures ----------

type SwipeAction = {
  label: string;
  icon: ReactNode;
  color: string;
  onAction: () => void;
  /** Leave the row open so it collapses with the button (delete). */
  destructive?: boolean;
};

const ACTION_WIDTH = 78;

/** List row with iOS-style swipe actions (leading and/or trailing). */
export function SwipeRow({
  leading,
  trailing,
  children,
}: {
  leading?: SwipeAction;
  trailing?: SwipeAction;
  children: ReactNode;
}) {
  const [offset, setOffsetState] = useState(0);
  const [dragging, setDragging] = useState(false);
  const g = useRef({ active: false, x: 0, y: 0, base: 0, axis: null as "x" | "y" | null, moved: false });
  // Pointer events can arrive faster than renders; read the live value from a ref.
  const live = useRef(0);
  const setOffset = (v: number) => {
    live.current = v;
    setOffsetState(v);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    g.current = { active: true, x: e.clientX, y: e.clientY, base: live.current, axis: null, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const s = g.current;
    if (!s.active) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s.axis === "x") {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (s.axis !== "x") return;
    s.moved = true;
    let next = s.base + dx;
    if (!leading) next = Math.min(next, 0);
    if (!trailing) next = Math.max(next, 0);
    // rubber-band past the action width
    const limit = ACTION_WIDTH;
    if (Math.abs(next) > limit) next = Math.sign(next) * (limit + (Math.abs(next) - limit) * 0.35);
    setOffset(next);
  };

  const onPointerUp = () => {
    g.current.active = false;
    if (g.current.axis !== "x") return;
    setDragging(false);
    const at = live.current;
    if (at < -ACTION_WIDTH / 2) setOffset(-ACTION_WIDTH);
    else if (at > ACTION_WIDTH / 2) setOffset(ACTION_WIDTH);
    else setOffset(0);
  };

  const run = (a: SwipeAction) => {
    if (!a.destructive) setOffset(0);
    a.onAction();
  };

  return (
    // Used inside <AnimatePresence>: rows grow in when added and fold shut when removed.
    <motion.div
      className="group/cell relative overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={ROW}
    >
      {leading && (
        <button
          aria-label={leading.label}
          onClick={() => run(leading)}
          className="absolute inset-y-0 left-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden text-[13px] text-white"
          style={{ width: Math.max(offset, 0), background: leading.color }}
        >
          {leading.icon}
          {leading.label}
        </button>
      )}
      {trailing && (
        <button
          aria-label={trailing.label}
          onClick={() => run(trailing)}
          className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden text-[13px] text-white"
          style={{ width: Math.max(-offset, 0), background: trailing.color }}
        >
          {trailing.icon}
          {trailing.label}
        </button>
      )}
      <div
        className={`relative select-none bg-cell ${dragging ? "" : "transition-transform duration-300 ease-ios"}`}
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // A drag, or a tap while actions are open, shouldn't trigger the row.
          if (g.current.moved || live.current !== 0) {
            e.preventDefault();
            e.stopPropagation();
            g.current.moved = false;
            if (!dragging) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

/**
 * A pushed navigation layer that follows `progress` (0 on screen → 1 off to the right).
 * Drag from the left edge to go back; release past a third, or flick, to pop.
 */
export function PushedLayer({
  progress,
  onPop,
  onSettle,
  children,
}: {
  progress: MotionValue<number>;
  onPop: (velocity: number) => void;
  onSettle: (velocity: number) => void;
  children: ReactNode;
}) {
  const x = useTransform(progress, (p) => `${p * 100}%`);
  const shadow = useTransform(progress, (p) => `-10px 0 30px rgba(0,0,0,${0.14 * (1 - p)})`);
  const drag = useRef<{ x: number; width: number } | null>(null);

  return (
    <motion.div
      className="absolute inset-0 z-10"
      style={{ x, boxShadow: shadow, touchAction: "pan-y" }}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX - rect.left > 24) return;
        progress.stop();
        drag.current = { x: e.clientX, width: rect.width };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        progress.set(Math.min(1, Math.max(0, (e.clientX - drag.current.x) / drag.current.width)));
      }}
      onPointerUp={() => {
        if (!drag.current) return;
        drag.current = null;
        const velocity = progress.getVelocity();
        if (progress.get() > 0.35 || velocity > 1.2) onPop(velocity);
        else onSettle(velocity);
      }}
      onPointerCancel={() => {
        if (!drag.current) return;
        drag.current = null;
        onSettle(0);
      }}
    >
      {children}
    </motion.div>
  );
}
