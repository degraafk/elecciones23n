import React, { useEffect, useRef, useState } from 'react';
import { Party } from '../data/parliamentData';

interface CoalitionMakerProps {
  parties: Party[];
  partyTotals: Record<string, number>;
  selectedParties: Set<string>;
  onToggleParty: (partyId: string) => void;
  onClearParties: () => void;
  targetSeats: number;
  totalChamberSeats: number;
  majorityName: string;
}

export const CoalitionMaker: React.FC<CoalitionMakerProps> = ({
  parties,
  partyTotals,
  selectedParties,
  onToggleParty,
  onClearParties,
  targetSeats,
  totalChamberSeats,
  majorityName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevWinRef = useRef<boolean>(false);

  // Calculate total selected coalition seats
  const coalitionSeats = parties.reduce((sum, p) => {
    if (selectedParties.has(p.id)) {
      return sum + (partyTotals[p.id] || 0);
    }
    return sum;
  }, 0);

  // Progressive fluidity for the displayed number counter
  const [displayedSeats, setDisplayedSeats] = useState(coalitionSeats);
  const prevSeatsRef = useRef(coalitionSeats);

  useEffect(() => {
    const startVal = prevSeatsRef.current;
    const endVal = coalitionSeats;
    prevSeatsRef.current = coalitionSeats;
    if (startVal === endVal) return;

    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 450; // ms

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // smooth easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayedSeats(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [coalitionSeats]);

  const isWin = coalitionSeats >= targetSeats;

  // Confetti burst on reaching majority
  useEffect(() => {
    if (isWin && !prevWinRef.current) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        prevWinRef.current = true;
        return;
      }

      const box = containerRef.current;
      if (!box) return;

      const activeColors = parties
        .filter((p) => selectedParties.has(p.id))
        .map((p) => p.color);
      const cols = activeColors.length ? activeColors : ['#2e8b4f'];

      for (let k = 0; k < 36; k++) {
        const el = document.createElement('span');
        el.className = 'absolute top-[-12px] w-2 h-3 rounded-sm pointer-events-none animate-fall';
        const xOffset = (Math.random() - 0.5) * 160;
        const rotate = Math.random() * 720;
        const delay = Math.random() * 0.25;

        el.style.left = `${Math.random() * 100}%`;
        el.style.backgroundColor = cols[k % cols.length];
        el.style.setProperty('--x', `${xOffset}px`);
        el.style.setProperty('--r', `${rotate}deg`);
        el.style.animationDelay = `${delay}s`;

        box.appendChild(el);
        setTimeout(() => el.remove(), 1900);
      }
    }
    prevWinRef.current = isWin;
  }, [isWin, parties, selectedParties]);

  // Status badge text
  let statusText = 'Elige partidos';
  if (coalitionSeats > 0) {
    if (isWin) {
      const diff = coalitionSeats - targetSeats;
      statusText = diff === 0 ? `${majorityName} · justo` : `${majorityName} · +${diff}`;
    } else {
      statusText = `Faltan ${targetSeats - coalitionSeats}`;
    }
  }

  const majorityPercentage = (targetSeats / totalChamberSeats) * 100;

  return (
    <section
      ref={containerRef}
      className={`relative overflow-hidden p-5 rounded-[20px] border border-[#e9e7e0] transition-all duration-300 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)] ${
        isWin
          ? 'border-[#2e8b4f] bg-gradient-to-b from-[#eef9f1] to-white'
          : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-3.5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#17171a] m-0">Coalition maker</h2>
          <p className="text-xs text-[#77756d] m-0 leading-normal">
            Marca los partidos que quieres juntar y comprueba si suman {majorityName.toLowerCase()} ({targetSeats}).
          </p>
        </div>
        <button
          type="button"
          onClick={onClearParties}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e9e7e0] bg-white text-[#17171a] hover:bg-[#fafaf8] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer"
        >
          Limpiar
        </button>
      </div>

      {/* Party Chips */}
      <div className="flex flex-wrap gap-2 min-h-[38px] mb-4">
        {parties.map((p) => {
          const count = partyTotals[p.id] || 0;
          if (count === 0) return null;
          const isSelected = selectedParties.has(p.id);

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggleParty(p.id)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-opacity-15 shadow-xs'
                  : 'bg-[#fafaf8] border-[#e9e7e0] text-[#17171a] hover:border-[#a19e93]'
              }`}
              style={{
                borderColor: isSelected ? p.color : undefined,
                backgroundColor: isSelected ? `${p.color}1c` : undefined,
                color: isSelected ? '#17171a' : undefined
              }}
              title={p.fullName || p.name}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.name}</span>
              <b className={`font-bold tabular-nums ${isSelected ? 'text-[#17171a]' : 'text-[#77756d]'}`}>
                {count}
              </b>
            </button>
          );
        })}
      </div>

      {/* Coalition Meter Numbers */}
      <div className="flex items-baseline gap-2 flex-wrap mb-2">
        <b
          className={`text-4xl font-bold tracking-tight tabular-nums leading-none transition-transform duration-300 ${
            isWin ? 'text-[#2e8b4f] scale-105' : 'text-[#17171a]'
          }`}
        >
          {displayedSeats}
        </b>
        <span className="text-xs text-[#77756d]">/ {targetSeats} escaños</span>
        <em
          className={`not-italic text-xs font-semibold ml-auto px-3 py-1 rounded-full transition-colors duration-300 ${
            isWin ? 'bg-[#2e8b4f] text-white' : 'bg-[#fafaf8] text-[#77756d]'
          }`}
        >
          {statusText}
        </em>
      </div>

      {/* Coalition Progress Bar with progressive fluidity from 0 to seat count */}
      <div className="flex h-3.5 rounded-full bg-[#fafaf8] border border-[#e9e7e0] relative overflow-hidden my-3">
        {parties.map((p) => {
          const count = partyTotals[p.id] || 0;
          if (count === 0) return null;
          const isSelected = selectedParties.has(p.id);
          const pct = (count / totalChamberSeats) * 100;

          return (
            <div
              key={p.id}
              className="h-full shrink-0 overflow-hidden"
              style={{
                width: isSelected ? `${pct}%` : '0%',
                opacity: isSelected ? 1 : 0,
                backgroundColor: p.color,
                transition:
                  'width 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title={`${p.name}: ${count} escaños (${pct.toFixed(1)}%)`}
            />
          );
        })}
        {/* Majority threshold tick */}
        <span
          className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#17171a] rounded-sm pointer-events-none z-10"
          style={{ left: `${majorityPercentage}%` }}
          title={`${majorityName}: ${targetSeats}`}
        />
      </div>

      {/* Fluid breakdown of selected coalition parties */}
      {selectedParties.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-2.5 border-t border-[#e9e7e0]/70 text-xs">
          {parties
            .filter((p) => selectedParties.has(p.id))
            .map((p) => {
              const count = partyTotals[p.id] || 0;
              const partyPctOfCoalition =
                coalitionSeats > 0 ? ((count / coalitionSeats) * 100).toFixed(0) : '0';
              return (
                <div key={p.id} className="flex items-center gap-2 py-0.5 animate-in fade-in duration-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-semibold text-[#17171a]">{p.name}</span>
                  <div className="w-14 h-1.5 rounded-full bg-[#f0eee8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        width: `${Math.min(100, (count / targetSeats) * 100)}%`,
                        backgroundColor: p.color
                      }}
                    />
                  </div>
                  <span className="font-bold tabular-nums text-[#17171a]">{count}</span>
                  <span className="text-[10px] text-[#77756d]">({partyPctOfCoalition}%)</span>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
};
