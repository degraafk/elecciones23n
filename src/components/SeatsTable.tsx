import React, { useState, useMemo } from 'react';
import { Party, Constituency, ScenarioData, isPartyEligible, ineligibleReason } from '../data/parliamentData';

interface SeatsTableProps {
  constituencies: Constituency[];
  parties: Party[];
  scenario: ScenarioData;
  isSenado: boolean;
  totalChamberSeats: number;
  unassignedSeats: number;
  partyTotals: Record<string, number>;
  hoveredConstituencyId: string | null;
  onHoverConstituency: (id: string | null) => void;
  onSelectConstituency?: (id: string) => void;
  onOpenAddParty?: () => void;
  onUpdateSeat: (constituencyId: string, partyId: string, value: number) => void;
  onBulkPaste: (startConstituencyId: string, startPartyIndex: number, text: string) => void;
}

export const SeatsTable: React.FC<SeatsTableProps> = ({
  constituencies,
  parties,
  scenario,
  isSenado,
  totalChamberSeats,
  unassignedSeats,
  partyTotals,
  hoveredConstituencyId,
  onHoverConstituency,
  onSelectConstituency,
  onOpenAddParty,
  onUpdateSeat,
  onBulkPaste
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Filtered constituencies list based on search
  const visibleConstituencies = useMemo(() => {
    if (!filterQuery.trim()) return constituencies;
    const q = filterQuery.toLowerCase().trim();
    return constituencies.filter((c) => c.name.toLowerCase().includes(q));
  }, [constituencies, filterQuery]);

  const handleStep = (constituencyId: string, partyId: string, delta: number) => {
    const current = scenario[constituencyId]?.[partyId] || 0;
    onUpdateSeat(constituencyId, partyId, current + delta);
  };

  const handleInputChange = (
    constituencyId: string,
    partyId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseInt(e.target.value, 10);
    onUpdateSeat(constituencyId, partyId, isNaN(val) ? 0 : val);
  };

  const handlePaste = (
    constituencyId: string,
    partyIndex: number,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    const text = e.clipboardData.getData('text');
    if (/[\t\n]/.test(text.trim())) {
      e.preventDefault();
      onBulkPaste(constituencyId, partyIndex, text);
    }
  };

  return (
    <div className="bg-white border border-[#e9e7e0] rounded-[20px] shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)] overflow-hidden">
      {/* Table Toolbar & Search */}
      <div className="p-4 border-b border-[#e9e7e0] flex items-center justify-between gap-3 bg-[#fafaf8]">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <input
            type="text"
            placeholder={`Buscar ${isSenado ? 'circunscripción' : 'provincia'}...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#e9e7e0] bg-white text-[#17171a] placeholder-[#77756d] focus:outline-2 focus:outline-[#17171a] focus:border-transparent transition-all"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-xs px-2 py-1 text-[#77756d] hover:text-[#17171a] cursor-pointer"
            >
              Borrar
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onOpenAddParty && (
            <button
              type="button"
              onClick={onOpenAddParty}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e9e7e0] bg-white text-[#17171a] hover:bg-[#fafaf8] hover:border-[#17171a] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Añadir partido</span>
            </button>
          )}
          <div className="text-xs text-[#77756d] tabular-nums hidden sm:block">
            Mostrando {visibleConstituencies.length} de {constituencies.length}
          </div>
        </div>
      </div>

      {/* High-Performance Table Container */}
      <div className="overflow-auto max-h-[72vh] scrollbar-thin">
        <table className="w-full border-collapse border-spacing-0 text-xs">
          <thead>
            {/* Header row 1: Names and party headers */}
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-[#fafaf8] p-2 text-left font-semibold text-[#77756d] border-b border-[#e9e7e0] min-w-[170px] pl-4">
                {isSenado ? 'Circunscripción' : 'Provincia'}
              </th>
              <th className="sticky top-0 z-20 bg-[#fafaf8] p-2 text-center font-semibold text-[#77756d] border-b border-[#e9e7e0] min-w-[60px]">
                Esc.
              </th>
              {isSenado && (
                <th
                  className="sticky top-0 z-20 bg-[#fafaf8] p-2 text-center font-semibold text-[#77756d] border-b border-[#e9e7e0] min-w-[55px]"
                  title="Máximo de escaños por partido"
                >
                  Máx.
                </th>
              )}
              {parties.map((p) => (
                <th
                  key={p.id}
                  className="sticky top-0 z-20 bg-[#fafaf8] p-2 text-center font-semibold text-[#77756d] border-b border-[#e9e7e0] min-w-[90px]"
                  title={p.fullName || p.name}
                >
                  <div>{p.name}</div>
                  <span
                    className="block h-[3px] rounded-full mx-auto mt-1 w-[70%]"
                    style={{ backgroundColor: p.color }}
                  />
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-[#fafaf8] p-2 text-center font-semibold text-[#77756d] border-b border-[#e9e7e0] min-w-[90px]">
                Sin asignar
              </th>
            </tr>

            {/* Header row 2: Summary Totals */}
            <tr className="bg-[#fafaf8] font-bold text-[#17171a] tabular-nums border-b-2 border-[#e9e7e0]">
              <th className="sticky left-0 top-[38px] z-30 bg-[#fafaf8] p-2 text-left font-bold text-[#17171a] border-b border-[#e9e7e0] pl-4">
                Total
              </th>
              <th className="sticky top-[38px] z-20 bg-[#fafaf8] p-2 text-center border-b border-[#e9e7e0]">
                {totalChamberSeats}
              </th>
              {isSenado && <th className="sticky top-[38px] z-20 bg-[#fafaf8] p-2 border-b border-[#e9e7e0]" />}
              {parties.map((p) => (
                <th key={p.id} className="sticky top-[38px] z-20 bg-[#fafaf8] p-2 text-center border-b border-[#e9e7e0]">
                  {partyTotals[p.id] || 0}
                </th>
              ))}
              <th className="sticky top-[38px] z-20 bg-[#fafaf8] p-2 text-center text-[#77756d] border-b border-[#e9e7e0]">
                {unassignedSeats}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e9e7e0]">
            {visibleConstituencies.map((c) => {
              const provData = scenario[c.id] || {};
              let sum = 0;
              parties.forEach((p) => {
                sum += provData[p.id] || 0;
              });

              const left = c.seats - sum;
              const isFull = left === 0;
              const isOver = left < 0;
              const isHovered = hoveredConstituencyId === c.id;

              return (
                <tr
                  key={c.id}
                  onMouseEnter={() => onHoverConstituency(c.id)}
                  onMouseLeave={() => onHoverConstituency(null)}
                  className={`transition-colors duration-100 ${
                    isOver
                      ? 'bg-[#fdf1ef] hover:bg-[#fbe6e2]'
                      : isFull
                      ? 'bg-[#fafaf8] hover:bg-[#efefeb]'
                      : isHovered
                      ? 'bg-[#f4f4f1]'
                      : 'bg-white hover:bg-[#f4f4f1]'
                  }`}
                >
                  {/* Constituency Name (sticky col) */}
                  <td
                    onClick={() => onSelectConstituency?.(c.id)}
                    className="sticky left-0 z-10 bg-inherit p-2 font-medium text-[#17171a] pl-4 whitespace-nowrap border-r border-[#e9e7e0] cursor-pointer hover:underline"
                    title={`Ver distribución de ${c.name}`}
                  >
                    <span>{c.name}</span>
                    {isFull && <span className="ml-2 text-[#2e8b4f] font-bold">✓</span>}
                  </td>

                  {/* Constituency Seat Capacity */}
                  <td className="p-2 text-center tabular-nums text-[#77756d] font-medium">
                    {c.seats}
                  </td>

                  {/* Max per party (Senado) */}
                  {isSenado && (
                    <td className="p-2 text-center tabular-nums text-[#77756d]">
                      {c.maxPerParty}
                    </td>
                  )}

                  {/* Stepper Cells per Party */}
                  {parties.map((p, pIdx) => {
                    const currentVal = provData[p.id] || 0;
                    const canIncrement = left > 0 && currentVal < c.maxPerParty;
                    const canDecrement = currentVal > 0;
                    const hasValue = currentVal > 0;

                    if (!isPartyEligible(isSenado, p.id, c.id)) {
                      return (
                        <td key={p.id} className="p-1.5 text-center whitespace-nowrap select-none">
                          <div
                            className="inline-flex items-center justify-center w-[76px] h-[32px] rounded-lg border border-[#d6d4cb] text-[#a19e93] text-xs font-semibold cursor-not-allowed"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(135deg, #e9e7e0 0 5px, #f6f5f1 5px 10px)'
                            }}
                            title={`${p.name} no se presenta en ${c.name}. ${ineligibleReason(p.id, isSenado)}`}
                            aria-label={`${p.name} no se presenta en ${c.name}`}
                          >
                            –
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={p.id} className="p-1.5 text-center whitespace-nowrap">
                        <div
                          className="inline-flex items-center rounded-lg border border-[#e9e7e0] p-0.5 transition-all focus-within:border-[#17171a] focus-within:ring-2 focus-within:ring-[#17171a]/10"
                          style={{
                            backgroundColor: hasValue ? `${p.color}18` : '#ffffff',
                            borderColor: hasValue ? `${p.color}55` : undefined
                          }}
                        >
                          <button
                            type="button"
                            tabIndex={-1}
                            disabled={!canDecrement}
                            onClick={() => handleStep(c.id, p.id, -1)}
                            className="w-5 h-6 rounded flex items-center justify-center text-[#77756d] hover:text-[#17171a] hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label={`Quitar escaño a ${p.name} en ${c.name}`}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={Math.min(c.maxPerParty, currentVal + Math.max(0, left))}
                            value={currentVal > 0 ? currentVal : ''}
                            placeholder="0"
                            onChange={(e) => handleInputChange(c.id, p.id, e)}
                            onPaste={(e) => handlePaste(c.id, pIdx, e)}
                            className="w-7 text-center font-semibold text-[#17171a] tabular-nums bg-transparent border-0 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            disabled={!canIncrement}
                            onClick={() => handleStep(c.id, p.id, 1)}
                            className="w-5 h-6 rounded flex items-center justify-center text-[#77756d] hover:text-[#17171a] hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label={`Añadir escaño a ${p.name} en ${c.name}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    );
                  })}

                  {/* Remaining / Unassigned */}
                  <td
                    className={`p-2 text-center tabular-nums font-semibold ${
                      isOver
                        ? 'text-[#c4281c]'
                        : isFull
                        ? 'text-[#2e8b4f]'
                        : 'text-[#77756d]'
                    }`}
                  >
                    {left}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
