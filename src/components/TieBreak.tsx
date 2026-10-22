import React, { useRef, useState } from 'react';
import { Party } from '../data/parliamentData';

interface TieBreakProps {
  title: string; // "Empate por el 1.º puesto"
  seats: number;
  members: string[]; // tied party ids, in the current order
  parties: Party[];
  resolved: boolean;
  winnerNote?: string; // shown once resolved
  shake: number; // changes every time the user tries to close while unresolved
  onCommit: (order: string[]) => void;
}

/** One tie group: rank the tied parties by dragging them or with the arrows. */
export const TieBreak: React.FC<TieBreakProps> = ({
  title,
  seats,
  members,
  parties,
  resolved,
  winnerNote,
  shake,
  onCommit
}) => {
  const [drag, setDrag] = useState<{ index: number; dy: number; target: number; h: number } | null>(null);
  const dragRef = useRef<{ startY: number; index: number; h: number } | null>(null);

  const move = (index: number, delta: number) => {
    const next = [...members];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onCommit(next);
  };

  const onGripDown = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    const li = e.currentTarget.closest('li') as HTMLElement | null;
    if (!li) return;
    const h = li.getBoundingClientRect().height + 4;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, index, h };
    setDrag({ index, dy: 0, target: index, h });
  };
  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const last = members.length - 1;
    const dy = Math.max(-d.index * d.h, Math.min((last - d.index) * d.h, e.clientY - d.startY));
    const target = Math.max(0, Math.min(last, d.index + Math.round(dy / d.h)));
    setDrag({ index: d.index, dy, target, h: d.h });
  };
  const onGripEnd = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && drag && drag.target !== drag.index) {
      const next = [...members];
      const [moved] = next.splice(drag.index, 1);
      next.splice(drag.target, 0, moved);
      onCommit(next);
    }
    setDrag(null);
  };
  const rowStyle = (i: number): React.CSSProperties | undefined => {
    if (!drag) return undefined;
    if (i === drag.index) {
      return {
        position: 'relative',
        zIndex: 2,
        transform: `translateY(${drag.dy}px)`,
        transition: 'none',
        boxShadow: '0 10px 24px -8px rgba(23,23,26,.35)'
      };
    }
    let shift = 0;
    if (drag.index < drag.target && i > drag.index && i <= drag.target) shift = -drag.h;
    if (drag.index > drag.target && i < drag.index && i >= drag.target) shift = drag.h;
    return { position: 'relative', transform: `translateY(${shift}px)`, transition: 'transform 150ms ease' };
  };

  return (
    <div
      key={`tie-${shake}`}
      className={`px-4 py-3 border-b border-[#e9e7e0] animate-in-view ${
        shake > 0 && !resolved ? 'ms-shake ring-2 ring-inset ring-[#c4281c]/50' : ''
      } ${resolved ? 'bg-[#fafaf8]' : 'bg-[#fff4e8]'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#17171a]">
            {title} <span className="font-medium text-[#77756d]">({seats} {seats === 1 ? 'escaño' : 'escaños'} cada uno)</span>
          </div>
          <p className="text-[11px] text-[#77756d] m-0 leading-snug">
            {resolved
              ? winnerNote || 'Orden decidido. Arrastra para cambiarlo.'
              : 'Hay que decidirlo para poder cerrar: ordénalos arrastrando o con las flechas.'}
          </p>
        </div>
        {!resolved && (
          <button
            type="button"
            onClick={() => onCommit(members)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#17171a] text-white text-[11px] font-semibold hover:bg-[#34343a] active:scale-95 transition-all cursor-pointer"
          >
            Usar este orden
          </button>
        )}
      </div>
      <ol className="m-0 p-0 list-none flex flex-col gap-1">
        {members.map((id, i) => {
          const p = parties.find((x) => x.id === id);
          if (!p) return null;
          return (
            <li
              key={id}
              style={rowStyle(i)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors bg-white ${
                resolved && i === 0 ? 'border-[#2e8b4f]' : 'border-[#e9e7e0]'
              }`}
            >
              <button
                type="button"
                aria-label={`Arrastrar ${p.name}`}
                title="Arrastra para cambiar el orden"
                onPointerDown={(e) => onGripDown(e, i)}
                onPointerMove={onGripMove}
                onPointerUp={onGripEnd}
                onPointerCancel={onGripEnd}
                className="-ml-1 w-5 h-7 flex items-center justify-center text-[#a19e93] hover:text-[#17171a] cursor-grab active:cursor-grabbing touch-none select-none"
              >
                <svg viewBox="0 0 10 16" className="w-2.5 h-4 fill-current" aria-hidden="true">
                  <circle cx="2.5" cy="3" r="1.4" /><circle cx="7.5" cy="3" r="1.4" />
                  <circle cx="2.5" cy="8" r="1.4" /><circle cx="7.5" cy="8" r="1.4" />
                  <circle cx="2.5" cy="13" r="1.4" /><circle cx="7.5" cy="13" r="1.4" />
                </svg>
              </button>
              <span className="w-4 text-center font-bold tabular-nums text-[#77756d]">{i + 1}</span>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="font-semibold text-[#17171a]">{p.name}</span>
              <span className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir ${p.name}`}
                  className="w-7 h-7 rounded-md border border-[#e9e7e0] text-[#17171a] hover:border-[#a19e93] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === members.length - 1}
                  aria-label={`Bajar ${p.name}`}
                  className="w-7 h-7 rounded-md border border-[#e9e7e0] text-[#17171a] hover:border-[#a19e93] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ▼
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
