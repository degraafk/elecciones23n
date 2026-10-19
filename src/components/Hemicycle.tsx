import React, { useMemo } from 'react';
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
.hc-seat { transform-box: fill-box; transform-origin: center; animation: hcSeat 420ms cubic-bezier(.16,1,.3,1) backwards; transition: fill 220ms ease, opacity 220ms ease; }
@media (prefers-reduced-motion: reduce) { .hc-seat { animation: none; } }
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
  const dim = selectedParties.size > 0;

  // radial tick between seat #target and #target+1 (counted from the left)
  const a = (layout.seats[targetSeats - 1]?.angle ?? Math.PI / 2);
  const b = (layout.seats[targetSeats]?.angle ?? a);
  const tick = (a + b) / 2;
  const x1 = layout.cx + (layout.rInner - 14) * Math.cos(tick);
  const y1 = layout.cy - (layout.rInner - 14) * Math.sin(tick);
  const x2 = layout.cx + (layout.rOuter + 8) * Math.cos(tick);
  const y2 = layout.cy - (layout.rOuter + 8) * Math.sin(tick);

  return (
    <section className="p-5 rounded-[20px] border border-[#e9e7e0] bg-white shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)]">
      <style>{CSS}</style>
      <div className="flex justify-between items-start gap-3 mb-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#17171a] m-0">Hemiciclo</h2>
          <p className="text-xs text-[#77756d] m-0 leading-normal">
            Un punto por escaño. {dim ? 'Se resalta tu coalición.' : 'Marca partidos abajo para resaltarlos.'}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${layout.width} ${layout.height + 4}`}
        className="w-full h-auto block max-w-[760px] mx-auto"
        role="img"
        aria-label={`Hemiciclo con ${assigned} de ${totalSeats} escaños asignados`}
      >
        {layout.seats.map((s, i) => {
          const owner = owners[i];
          const party = owner ? byId.get(owner) : undefined;
          const faded = dim && !(owner && selectedParties.has(owner));
          return (
            <circle
              key={i}
              className="hc-seat"
              cx={s.x}
              cy={s.y}
              r={layout.dot}
              fill={party ? party.color : '#e6e4dc'}
              opacity={faded ? 0.18 : 1}
              style={{ animationDelay: `${Math.min(i, 350) * 1.6}ms` }}
            >
              <title>{party ? `${party.name}: ${partyTotals[party.id]} escaños` : 'Sin asignar'}</title>
            </circle>
          );
        })}

        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#17171a" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <text x={x2} y={y2 - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#17171a">
          {targetSeats}
        </text>

        <text x={layout.cx} y={layout.cy - 50} textAnchor="middle" fontSize="62" fontWeight="700" fill="#17171a" className="tabular-nums">
          {assigned}
        </text>
        <text x={layout.cx} y={layout.cy - 22} textAnchor="middle" fontSize="15" fill="#77756d">
          de {totalSeats} escaños
        </text>
        <text x={layout.cx} y={layout.cy} textAnchor="middle" fontSize="13" fill="#77756d">
          {majorityName}: {targetSeats}
        </text>
      </svg>
    </section>
  );
};
