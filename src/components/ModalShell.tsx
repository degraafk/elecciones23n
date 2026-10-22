import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Popover that opens right where the user clicked.
 *
 * - Placed in PAGE coordinates next to the last click, kept inside the page and
 *   the visible window. Works in a normal tab, in an iframe and on mobile.
 * - Opens with a quick "grow out of the click" animation and closes with a
 *   short fade. Children receive a `close` function that plays the exit
 *   animation before calling `onClose`.
 */

let lastPress: { x: number; y: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPress = { x: e.pageX, y: e.pageY };
    },
    true
  );
}

const pageSize = () => ({
  w: Math.max(document.documentElement.clientWidth, 320),
  h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
});

const EXIT_MS = 130;

const CSS = `
@keyframes msPanelIn {
  from { opacity: 0; transform: translateY(10px) scale(.92); }
  to   { opacity: 1; transform: none; }
}
@keyframes msPanelOut {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(6px) scale(.97); }
}
@keyframes msDimIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes msDimOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes msRowIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: none; }
}
@keyframes msShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}
.ms-shake { animation: msShake 380ms cubic-bezier(.36,.07,.19,.97) both; }
.ms-row { animation: msRowIn 260ms cubic-bezier(.16,1,.3,1) backwards; }
@media (prefers-reduced-motion: reduce) {
  .ms-panel, .ms-dim, .ms-row, .ms-shake { animation: none !important; }
}
`;

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  /** When false, every attempt to close (X, Escape, backdrop...) calls onBlockedClose instead. */
  canClose?: boolean;
  onBlockedClose?: () => void;
  children: (close: () => void) => React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  labelledBy,
  canClose = true,
  onBlockedClose,
  children
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; ox: number; oy: number } | null>(null);
  const [pageH, setPageH] = useState(() => pageSize().h);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const posRef = useRef<{ top: number; left: number; ox: number; oy: number } | null>(null);

  const close = useCallback(() => {
    if (!canClose) {
      onBlockedClose?.();
      return;
    }
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose, canClose, onBlockedClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const place = () => {
      const p = pageSize();
      setPageH(p.h);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const visTop = window.scrollY;
      const visBottom = Math.min(window.scrollY + window.innerHeight, p.h);
      const prev = posRef.current;

      let next: { top: number; left: number; ox: number; oy: number };
      if (!prev) {
        // first placement: next to where the user clicked
        const cx = lastPress ? lastPress.x : p.w / 2;
        const cy = lastPress ? lastPress.y : window.scrollY + window.innerHeight / 2;
        const left = Math.min(Math.max(cx - w / 2, 12), Math.max(12, p.w - w - 12));
        let top = cy - h / 2;
        top = Math.min(top, visBottom - h - 12);
        top = Math.max(top, visTop + 12, 12);
        next = { top, left, ox: Math.round(cx - left), oy: Math.round(cy - top) };
      } else {
        // afterwards the popup stays put (editing seats or reordering changes its height);
        // it only moves up if it would otherwise run off the visible area
        const left = Math.min(prev.left, Math.max(12, p.w - w - 12));
        let top = Math.min(prev.top, visBottom - h - 12);
        top = Math.max(top, visTop + 12, 12);
        next = { ...prev, top, left };
      }
      if (!prev || next.top !== prev.top || next.left !== prev.left) {
        posRef.current = next;
        setPos(next);
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener('resize', place);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
    };
  }, []);

  const ease = 'cubic-bezier(.16,1,.3,1)';

  return createPortal(
    <div
      className="ms-dim"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: pageH,
        zIndex: 1000,
        background: 'rgba(23,23,26,.14)',
        animation: pos ? `${closing ? 'msDimOut' : 'msDimIn'} ${closing ? EXIT_MS : 180}ms ease forwards` : undefined,
        opacity: pos ? undefined : 0
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <style>{CSS}</style>
      <div
        ref={panelRef}
        className="ms-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={{
          position: 'absolute',
          top: pos ? pos.top : 0,
          left: pos ? pos.left : 0,
          width: 'min(440px, calc(100vw - 24px))',
          visibility: pos ? 'visible' : 'hidden',
          transformOrigin: pos ? `${pos.ox}px ${pos.oy}px` : undefined,
          boxShadow: '0 0 0 1px rgba(23,23,26,.08), 0 30px 70px -10px rgba(23,23,26,.45)',
          borderRadius: 16,
          animation: pos
            ? closing
              ? `msPanelOut ${EXIT_MS}ms ease-in forwards`
              : `msPanelIn 240ms ${ease} both`
            : undefined
        }}
      >
        {children(close)}
      </div>
    </div>,
    document.body
  );
};
