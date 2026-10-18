import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Popover that opens right where the user clicked.
 *
 * No fixed positioning, no screen centring, no scroll locking: the panel is
 * placed in PAGE coordinates next to the last click, then kept inside the page
 * (and inside the visible window when the page scrolls). That is the one
 * placement that works everywhere: normal tab, iframe, Google Sites, mobile.
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

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ onClose, labelledBy, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [page, setPage] = useState(pageSize);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const place = () => {
      const p = pageSize();
      setPage(p);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const cx = lastPress ? lastPress.x : p.w / 2;
      const cy = lastPress ? lastPress.y : window.scrollY + window.innerHeight / 2;

      // visible part of the page (whole page when the window is as tall as the page)
      const visTop = window.scrollY;
      const visBottom = Math.min(window.scrollY + window.innerHeight, p.h);

      const left = Math.min(Math.max(cx - w / 2, 12), Math.max(12, p.w - w - 12));
      let top = cy - h / 2;
      top = Math.min(top, visBottom - h - 12);
      top = Math.max(top, visTop + 12, 12);
      setPos({ top, left });
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

  return createPortal(
    <div
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: page.h, zIndex: 1000 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={labelledBy}
        style={{
          position: 'absolute',
          top: pos ? pos.top : 0,
          left: pos ? pos.left : 0,
          width: 'min(440px, calc(100vw - 24px))',
          visibility: pos ? 'visible' : 'hidden',
          boxShadow: '0 0 0 1px rgba(23,23,26,.08), 0 30px 70px -10px rgba(23,23,26,.45)',
          borderRadius: 16
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
