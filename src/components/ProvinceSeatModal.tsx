import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ModalShell } from './ModalShell';
import { Party, Constituency, ScenarioData, isPartyEligible } from '../data/parliamentData';
import { leadingTie } from '../utils/parliamentUtils';

interface ProvinceSeatModalProps {
  constituency: Constituency | null;
  parties: Party[];
  scenario: ScenarioData;
  isSenado: boolean;
  onClose: () => void;
  onUpdateSeat: (constituencyId: string, partyId: string, value: number) => void;
  onClearProvince: (constituencyId: string) => void;
  tieOrder?: string[];
  onSetTieOrder: (constituencyId: string, order: string[]) => void;
}

export const ProvinceSeatModal: React.FC<ProvinceSeatModalProps> = ({
  constituency,
  parties: allParties,
  scenario,
  isSenado,
  onClose,
  onUpdateSeat,
  onClearProvince,
  tieOrder,
  onSetTieOrder
}) => {
  const [partySearch, setPartySearch] = useState('');
  const [shake, setShake] = useState(0);
  const [drag, setDrag] = useState<{ index: number; dy: number; target: number; h: number } | null>(null);
  const dragRef = useRef<{ startY: number; index: number; h: number } | null>(null);

  const provData = useMemo(() => {
    if (!constituency) return {};
    return scenario[constituency.id] || {};
  }, [scenario, constituency]);

  if (!constituency) return null;

  // Only the parties that actually run in this province
  const parties = allParties.filter((p) => isPartyEligible(isSenado, p.id, constituency.id));

  // Calculate province totals
  let totalAssignedInProv = 0;
  parties.forEach((p) => {
    totalAssignedInProv += provData[p.id] || 0;
  });

  const remainingSeats = constituency.seats - totalAssignedInProv;
  const isComplete = remainingSeats === 0;
  const isOverAllocated = remainingSeats < 0;

  // Filter parties if user searches
  const filteredParties = parties.filter((p) => {
    if (!partySearch.trim()) return true;
    const q = partySearch.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.fullName && p.fullName.toLowerCase().includes(q))
    );
  });

  const handleStep = (partyId: string, delta: number) => {
    const current = provData[partyId] || 0;
    onUpdateSeat(constituency.id, partyId, current + delta);
  };

  const handleInputChange = (partyId: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    onUpdateSeat(constituency.id, partyId, isNaN(parsed) ? 0 : parsed);
  };

  // Tie for the lead: the user ranks the tied parties, and the first one takes the province colour on the map
  const tiedIds = leadingTie(provData, parties);
  const tiedResolved = tiedIds.length > 1 && !!tieOrder && tiedIds.every((id) => tieOrder.includes(id));
  const orderedTied = tiedResolved
    ? [...tiedIds].sort((a, b) => tieOrder!.indexOf(a) - tieOrder!.indexOf(b))
    : tiedIds;
  const commitTie = (ids: string[]) =>
    onSetTieOrder(constituency.id, [...ids, ...(tieOrder || []).filter((id) => !ids.includes(id))]);
  const moveTied = (index: number, delta: number) => {
    const next = [...orderedTied];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    commitTie(next);
  };
  const tiedWinner = tiedResolved ? parties.find((p) => p.id === orderedTied[0]) : undefined;

  // Drag and drop for the tie ranking (touch and mouse); the arrows still work
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
    const last = orderedTied.length - 1;
    const dy = Math.max(-d.index * d.h, Math.min((last - d.index) * d.h, e.clientY - d.startY));
    const target = Math.max(0, Math.min(last, d.index + Math.round(dy / d.h)));
    setDrag({ index: d.index, dy, target, h: d.h });
  };
  const onGripEnd = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && drag && drag.target !== drag.index) {
      const next = [...orderedTied];
      const [moved] = next.splice(drag.index, 1);
      next.splice(drag.target, 0, moved);
      commitTie(next);
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
    <ModalShell
      onClose={onClose}
      labelledBy="modal-title"
      canClose={!(tiedIds.length > 1 && !tiedResolved)}
      onBlockedClose={() => setShake((n) => n + 1)}
    >
      {(close) => (
      <div
        className="relative w-full max-w-[440px] bg-white rounded-2xl border border-[#e9e7e0] shadow-[0_25px_50px_-12px_rgba(20,20,20,0.25)] overflow-hidden flex flex-col max-h-[85vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#fafaf8] border-b border-[#e9e7e0] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 id="modal-title" className="text-xl font-bold tracking-tight text-[#17171a] m-0">
                {constituency.name}
              </h3>
              {isComplete && (
                <span className="text-xs font-bold text-[#2e8b4f] bg-[#eef9f1] px-2 py-0.5 rounded-full">
                  Completa ✓
                </span>
              )}
            </div>
            <p className="text-xs text-[#77756d] m-0 mt-0.5">
              {constituency.seats} escaños en disputa
              {isSenado && ` · Máx. ${constituency.maxPerParty} por partido`}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#77756d] hover:text-[#17171a] hover:bg-black/5 active:scale-95 transition-all cursor-pointer text-lg leading-none"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Mini Seat Distribution Strip */}
        <div className="px-4 py-3 bg-white border-b border-[#e9e7e0]">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-[#17171a] tabular-nums">
              <b>{totalAssignedInProv}</b> de {constituency.seats} asignados
            </span>
            <span
              className={`tabular-nums font-semibold ${
                isOverAllocated
                  ? 'text-[#c4281c]'
                  : isComplete
                  ? 'text-[#2e8b4f]'
                  : 'text-[#77756d]'
              }`}
            >
              {isOverAllocated
                ? `Exceso de ${-remainingSeats}`
                : isComplete
                ? '0 sin asignar'
                : `${remainingSeats} sin asignar`}
            </span>
          </div>

          {/* Color representation bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden bg-[#fafaf8] border border-[#e9e7e0]">
            {parties.map((p) => {
              const count = provData[p.id] || 0;
              if (count === 0) return null;
              const pct = (count / constituency.seats) * 100;
              return (
                <div
                  key={p.id}
                  style={{ width: `${pct}%`, backgroundColor: p.color }}
                  title={`${p.name}: ${count}`}
                  className="h-full transition-all duration-150"
                />
              );
            })}
          </div>
        </div>

        {/* Tie for the lead: ordering decides the colour of the province on the map */}
        {tiedIds.length > 1 && (
          <div
            key={`tie-${shake}`}
            className={`px-4 py-3 border-b border-[#e9e7e0] animate-in-view ${shake > 0 && !tiedResolved ? 'ms-shake ring-2 ring-inset ring-[#c4281c]/50' : ''} ${tiedResolved ? 'bg-[#fafaf8]' : 'bg-[#fff4e8]'}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#17171a]">Empate en cabeza</div>
                <p className="text-[11px] text-[#77756d] m-0 leading-snug">
                  {tiedResolved
                    ? `${tiedWinner?.name} se lleva el color de ${constituency.name} en el mapa. Arrastra para cambiar el orden.`
                    : 'Hay que decidirlo para cerrar: ordénalos arrastrando o con las flechas y el primero se lleva el color de la provincia.'}
                </p>
              </div>
              {!tiedResolved && (
                <button
                  type="button"
                  onClick={() => commitTie(orderedTied)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#17171a] text-white text-[11px] font-semibold hover:bg-[#34343a] active:scale-95 transition-all cursor-pointer"
                >
                  Usar este orden
                </button>
              )}
            </div>
            <ol className="m-0 p-0 list-none flex flex-col gap-1">
              {orderedTied.map((id, i) => {
                const p = parties.find((x) => x.id === id);
                if (!p) return null;
                const first = tiedResolved && i === 0;
                return (
                  <li
                    key={id}
                    style={rowStyle(i)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors bg-white ${
                      first ? 'border-[#2e8b4f]' : 'border-[#e9e7e0]'
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
                    <span className="text-[#77756d] tabular-nums">{provData[id]} {provData[id] === 1 ? 'escaño' : 'escaños'}</span>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveTied(i, -1)}
                        disabled={i === 0}
                        aria-label={`Subir ${p.name}`}
                        className="w-7 h-7 rounded-md border border-[#e9e7e0] text-[#17171a] hover:border-[#a19e93] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTied(i, 1)}
                        disabled={i === orderedTied.length - 1}
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
        )}

        {/* Quick Party Search Input (if list has > 8 items) */}
        {parties.length > 8 && (
          <div className="px-4 pt-3 pb-1 bg-white">
            <input
              type="text"
              placeholder="Filtrar partido..."
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#e9e7e0] bg-[#fafaf8] text-[#17171a] placeholder-[#77756d] focus:outline-none focus:border-[#17171a] transition-all"
            />
          </div>
        )}

        {/* Scrollable Party List (avoids overly long popups) */}
        <div className="p-3 overflow-y-auto max-h-[300px] scrollbar-thin divide-y divide-[#e9e7e0]/70 flex-1">
          {filteredParties.map((p, idx) => {
            const currentVal = provData[p.id] || 0;
            const hasSeats = currentVal > 0;
            const canIncrement = remainingSeats > 0 && currentVal < constituency.maxPerParty;
            const canDecrement = currentVal > 0;

            return (
              <div
                key={p.id}
                style={{ animationDelay: `${Math.min(idx, 9) * 24 + 90}ms` }}
                className={`ms-row py-2 px-2 flex items-center justify-between gap-3 rounded-lg transition-colors ${
                  hasSeats ? 'bg-[#fafaf8]' : 'hover:bg-[#fafaf8]/60'
                }`}
              >
                {/* Party identity */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#17171a] truncate">
                      {p.name}
                    </div>
                    {p.fullName && (
                      <div className="text-[11px] text-[#77756d] truncate">
                        {p.fullName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper Input */}
                <div
                  className="inline-flex items-center rounded-lg border border-[#e9e7e0] p-0.5 bg-white transition-all focus-within:border-[#17171a] focus-within:ring-2 focus-within:ring-[#17171a]/10 shrink-0"
                  style={{
                    backgroundColor: hasSeats ? `${p.color}14` : '#ffffff',
                    borderColor: hasSeats ? `${p.color}55` : undefined
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={!canDecrement}
                    onClick={() => handleStep(p.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-[#77756d] hover:text-[#17171a] hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={`Restar un escaño a ${p.name}`}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={Math.min(constituency.maxPerParty, currentVal + Math.max(0, remainingSeats))}
                    value={currentVal > 0 ? currentVal : ''}
                    placeholder="0"
                    onChange={(e) => handleInputChange(p.id, e.target.value)}
                    className="w-8 text-center text-xs font-bold text-[#17171a] tabular-nums bg-transparent border-0 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={!canIncrement}
                    onClick={() => handleStep(p.id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-[#77756d] hover:text-[#17171a] hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={`Añadir un escaño a ${p.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
          {filteredParties.length === 0 && (
            <div className="py-6 text-center text-xs text-[#77756d]">
              No se encontraron partidos con ese nombre.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#fafaf8] border-t border-[#e9e7e0] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onClearProvince(constituency.id)}
            disabled={totalAssignedInProv === 0}
            className="text-xs font-medium text-[#c4281c] hover:bg-[#fdf1ef] px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Vaciar circunscripción
          </button>
          <button
            type="button"
            onClick={close}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#17171a] text-white hover:bg-[#34343a] active:scale-95 transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
      )}
    </ModalShell>
  );
};
