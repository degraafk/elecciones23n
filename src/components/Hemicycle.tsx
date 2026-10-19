import React, { useMemo, useRef, useState } from 'react';
import { Party } from '../data/parliamentData';
import { computeHemicycle, seatOwners } from '../utils/hemicycle';

interface HemicycleProps {
  parties: Party[];
  partyTotals: Record<string, number>;
  totalSeats: number;
  targetSeats: number;
  majorityName: string;
  selectedParties: Set<string>;
}

const CSS = `
@keyframes hcSeat { from { opacity: 0; transform: scale(.2); } to { transform: none; } }
.hc-seat { transform-box: fill-box; transform-origin: center; animation: hcSeat 420ms cubic-bezier(.16,1,.3,1) backwards; transition: fill 200ms ease, opacity 200ms ease; cursor: default; }
@keyframes hcTip { from { opacity: 0; transform: translate(-50%, -100%) translateY(4px) scale(.96); } to { opacity: 1; transform: translate(-50%, -100%) translateY(-8px); } }
.hc-tip { animation: hcTip 120ms cubic-bezier(.16,1,.3,1) both; }
@media (prefers-reduced-motion: reduce) { .hc-seat, .hc-tip { animation: none; } }
`;

export const Hemicycle: React.FC<HemicycleProps> = ({
  parties,
  partyTotals,
  totalSeats,
  targetSeats,
  majorityName,
  selectedParties
}) => {
  const layout = useMemo(() => computeHemicycle(totalSeats, 300), [totalSeats]);
  const owners = useMemo(
    () => seatOwners(totalSeats, parties, partyTotals),
    [totalSeats, parties, partyTotals]
  );
  const byId = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties]);
  const assigned = owners.filter((o) => o !== null).length;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string | null; x: number; y: number } | null>(null);

  const move = (e: React.PointerEvent, id: string | null) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ id, x: e.clientX - box.left, y: e.clientY - box.top });
  };

  // hovering a party highlights it; otherwise the selected coalition is highlighted
  const focus: Set<string> | null = hover && hover.id ? new Set([hover.id]) : selectedParties.size > 0 ? selectedParties : null;

  const hoverParty = hover?.id ? byId.get(hover.id) : undefined;
  const hoverCount = hover?.id ? partyTotals[hover.id] || 0 : totalSeats - assigned;

  return (
    <section className="p-5 rounded-[20px] border border-[#e9e7e0] bg-white shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)]">
      <style>{CSS}</style>
      <div className="mb-2">
        <h2 className="text-lg font-bold tracking-tight text-[#17171a] m-0">Hemiciclo</h2>
        <p className="text-xs text-[#77756d] m-0 leading-normal">
          Un punto por escaño. Pasa el ratón por encima para ver cada partido.
        </p>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full max-w-[760px] mx-auto"
        style={{ containerType: 'inline-size' }}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height + 4}`}
          className="w-full h-auto block"
          role="img"
          aria-label={`Hemiciclo con ${assigned} de ${totalSeats} escaños asignados`}
        >
          {layout.seats.map((s, i) => {
            const owner = owners[i];
            const party = owner ? byId.get(owner) : undefined;
            const faded = focus !== null && !(owner && focus.has(owner));
            return (
              <circle
                key={i}
                className="hc-seat"
                cx={s.x}
                cy={s.y}
                r={layout.dot}
                fill={party ? party.color : '#e6e4dc'}
                opacity={faded ? 0.16 : 1}
                style={{ animationDelay: `${Math.min(i, 350) * 1.6}ms` }}
                onPointerEnter={(e) => move(e, owner)}
                onPointerMove={(e) => move(e, owner)}
              />
            );
          })}
        </svg>

        {/* Centre counter: scales with the chart so it always fits inside the arc */}
        <div
          className="absolute left-0 right-0 flex flex-col items-center text-center pointer-events-none"
          style={{ bottom: '3%' }}
        >
          <b
            className="font-bold tracking-tight tabular-nums text-[#17171a] leading-none"
            style={{ fontSize: 'clamp(30px, 9.5cqw, 68px)' }}
          >
            {assigned}
          </b>
          <span className="text-[#77756d] leading-tight mt-1" style={{ fontSize: 'clamp(11px, 2.5cqw, 16px)' }}>
            de {totalSeats} escaños
          </span>
          <span className="text-[#77756d] leading-tight" style={{ fontSize: 'clamp(10px, 2.2cqw, 14px)' }}>
            {majorityName}: {targetSeats}
          </span>
        </div>

        {hover && (
          <div
            className="hc-tip absolute z-10 pointer-events-none px-3 py-2 rounded-xl bg-[#17171a] text-white shadow-lg whitespace-nowrap"
            style={{ left: hover.x, top: hover.y }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                style={{ backgroundColor: hoverParty ? hoverParty.color : '#e6e4dc' }}
              />
              <span className="text-sm font-bold">{hoverParty ? hoverParty.name : 'Sin asignar'}</span>
              <span className="text-sm tabular-nums text-white/80">
                {hoverCount} {hoverCount === 1 ? 'escaño' : 'escaños'}
              </span>
            </div>
            {hoverParty?.fullName && <div className="text-[11px] text-white/60 mt-0.5">{hoverParty.fullName}</div>}
          </div>
        )}
      </div>
    </section>
  );
};
