import React from 'react';
import { Party } from '../data/parliamentData';

interface SummarySidebarProps {
  totalChamberSeats: number;
  unassignedSeats: number;
  fullConstituenciesCount: number;
  totalConstituencies: number;
  parties: Party[];
  partyTotals: Record<string, number>;
  targetSeats: number;
  majorityName: string;
  unitLabel: string;
  onOpenAddParty?: () => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  onExportSvg: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRestoreBase: () => void;
  onClearTable: () => void;
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({
  totalChamberSeats,
  unassignedSeats,
  fullConstituenciesCount,
  totalConstituencies,
  parties,
  partyTotals,
  targetSeats,
  majorityName,
  unitLabel,
  onOpenAddParty,
  onExportXlsx,
  onExportCsv,
  onExportSvg,
  onImportFile,
  onRestoreBase,
  onClearTable
}) => {
  const assignedSeats = totalChamberSeats - unassignedSeats;
  const majorityPercentage = (targetSeats / totalChamberSeats) * 100;

  return (
    <aside className="bg-white border border-[#e9e7e0] rounded-[20px] p-5 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)] sticky top-4">
      {/* Big Counter */}
      <div className="flex items-baseline gap-2 mb-1">
        <b className="text-4xl font-bold tracking-tight tabular-nums text-[#17171a]">
          {assignedSeats}
        </b>
        <span className="text-xs text-[#77756d]">de {totalChamberSeats} escaños asignados</span>
      </div>

      <div className="text-xs text-[#77756d] mb-2 font-medium">
        {fullConstituenciesCount} de {totalConstituencies} {unitLabel} completas
      </div>

      {/* Overview Chamber Bar */}
      <div className="flex h-2.5 rounded-full overflow-visible bg-[#fafaf8] border border-[#e9e7e0] my-3 relative">
        {parties.map((p) => {
          const count = partyTotals[p.id] || 0;
          if (count === 0) return null;
          const pct = (count / totalChamberSeats) * 100;

          return (
            <div
              key={p.id}
              className="h-full transition-all duration-200 first:rounded-l-full"
              style={{ width: `${pct}%`, backgroundColor: p.color }}
              title={`${p.name}: ${count}`}
            />
          );
        })}
        {/* Majority line */}
        <span
          className="absolute top-[-4px] bottom-[-4px] w-[2px] rounded-sm bg-[#17171a]"
          style={{ left: `${majorityPercentage}%` }}
          title={`${majorityName}: ${targetSeats}`}
        />
      </div>

      <div className="text-xs text-[#77756d] mb-4">
        La línea marca {majorityName.toLowerCase()} ({targetSeats})
      </div>

      {/* Legend Header with Añadir partido button */}
      <div className="flex items-center justify-between pt-3 border-t border-[#e9e7e0]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#17171a]">
          Partidos
        </span>
        {onOpenAddParty && (
          <button
            type="button"
            onClick={onOpenAddParty}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#e9e7e0] bg-[#fafaf8] text-[#17171a] hover:bg-white hover:border-[#17171a] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Añadir partido</span>
          </button>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 my-2.5 py-1">
        {parties.map((p) => {
          const count = partyTotals[p.id] || 0;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 py-1 text-[13px] transition-opacity ${
                count === 0 ? 'opacity-35' : 'opacity-100'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-inner"
                style={{ backgroundColor: p.color }}
              />
              <span className="truncate text-[#17171a]" title={p.fullName || p.name}>
                {p.name}
              </span>
              <b className="ml-auto font-semibold tabular-nums text-[#17171a]">{count}</b>
            </div>
          );
        })}
        <div className="col-span-2 flex items-center gap-2 pt-2 mt-1 border-t border-[#e9e7e0] text-[13px] font-medium text-[#77756d]">
          <span className="w-3 h-3 rounded-full shrink-0 bg-white border border-[#a19e93]" />
          <span>Sin asignar</span>
          <b className="ml-auto font-semibold tabular-nums text-[#17171a]">{unassignedSeats}</b>
        </div>
      </div>

      <div className="text-xs text-[#77756d] mt-2 mb-4 leading-relaxed">
        El fondo de cada provincia toma el color del partido con más escaños (rayas si hay empate).
      </div>

      {/* Action Buttons (GitHub download button removed) */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <button
          type="button"
          onClick={onExportXlsx}
          className="col-span-2 py-2.5 px-3 rounded-xl border border-[#17171a] bg-[#17171a] text-white text-xs font-semibold hover:bg-[#34343a] hover:border-[#34343a] active:scale-95 transition-all cursor-pointer text-center"
        >
          Descargar Excel (.xlsx)
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          className="py-2.5 px-3 rounded-xl border border-[#e9e7e0] bg-white text-[#17171a] text-xs font-medium hover:bg-[#fafaf8] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer text-center"
        >
          Descargar CSV
        </button>
        <button
          type="button"
          onClick={onExportSvg}
          className="py-2.5 px-3 rounded-xl border border-[#e9e7e0] bg-white text-[#17171a] text-xs font-medium hover:bg-[#fafaf8] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer text-center"
        >
          Descargar SVG
        </button>
        <label className="col-span-2 py-2.5 px-3 rounded-xl border border-[#e9e7e0] bg-white text-[#17171a] text-xs font-medium hover:bg-[#fafaf8] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer text-center block">
          Importar Excel / CSV
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onImportFile} className="hidden" />
        </label>
        <button
          type="button"
          onClick={onRestoreBase}
          className="py-2.5 px-3 rounded-xl border border-[#e9e7e0] bg-white text-[#17171a] text-xs font-medium hover:bg-[#fafaf8] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer text-center"
        >
          Escenario base
        </button>
        <button
          type="button"
          onClick={onClearTable}
          className="py-2.5 px-3 rounded-xl border border-[#e9e7e0] bg-white text-[#c4281c] text-xs font-medium hover:bg-[#fdf1ef] hover:border-[#c4281c] active:scale-95 transition-all cursor-pointer text-center"
        >
          Vaciar tabla
        </button>
      </div>

      <div className="text-xs text-[#77756d] mt-2 leading-relaxed">
        También puedes copiar celdas desde Excel y pegarlas (Ctrl+V) en la tabla, empezando por la celda donde quieras.
      </div>
    </aside>
  );
};
