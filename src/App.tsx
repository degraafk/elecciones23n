import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  PARTIES_CONGRESO,
  PARTIES_SENADO,
  PROVINCIAS_CONGRESO,
  PROVINCIAS_SENADO,
  BASE_CONGRESO,
  BASE_SENADO,
  isPartyEligible,
  migrateCongresoScenario,
  migrateSenadoScenario,
  ScenarioData,
  Party,
  Constituency
} from './data/parliamentData';
import { ParliamentMap } from './components/ParliamentMap';
import { CoalitionMaker } from './components/CoalitionMaker';
import { SummarySidebar } from './components/SummarySidebar';
import { SeatsTable } from './components/SeatsTable';
import { Hemicycle } from './components/Hemicycle';
import { ProvinceSeatModal } from './components/ProvinceSeatModal';
import { AddPartyModal } from './components/AddPartyModal';
import {
  exportToCsv,
  exportToXlsx,
  downloadFile,
  parseSpreadsheetFile
} from './utils/parliamentUtils';
import { encodeShare, decodeShare, SharedState } from './utils/share';
import { makeShareImage, serializeMapSvg } from './utils/shareImage';

const CREST_CONGRESO = `${import.meta.env.BASE_URL}crest-congreso.png`;
const CREST_SENADO = `${import.meta.env.BASE_URL}crest-senado.png`;

const LS_CONGRESO = 'congreso-tabla-v2';
const LS_SENADO = 'senado-tabla-v1';
const LS_MODE = 'congreso-modo';
const LS_CUSTOM_C = 'congreso-custom-parties-v1';
const LS_CUSTOM_S = 'senado-custom-parties-v1';

// Scenario opened from a shared link (#v1/...), parsed once
const SHARED: SharedState | null =
  typeof window !== 'undefined' ? decodeShare(window.location.hash) : null;

export default function App() {
  const [sharedView, setSharedView] = useState<boolean>(!!SHARED);

  // Mode selection
  const [mode, setMode] = useState<'c' | 's'>(() => {
    if (SHARED) return SHARED.mode;
    try {
      const saved = localStorage.getItem(LS_MODE);
      return saved === 's' ? 's' : 'c';
    } catch {
      return 'c';
    }
  });

  // Congreso and Senado scenarios
  const [congresoScenario, setCongresoScenario] = useState<ScenarioData>(() => {
    if (SHARED && SHARED.mode === 'c') return SHARED.scenario;
    try {
      const raw = localStorage.getItem(LS_CONGRESO);
      if (raw) return migrateCongresoScenario(JSON.parse(raw));
    } catch {}
    return JSON.parse(JSON.stringify(BASE_CONGRESO));
  });

  const [senadoScenario, setSenadoScenario] = useState<ScenarioData>(() => {
    if (SHARED && SHARED.mode === 's') return SHARED.scenario;
    try {
      const raw = localStorage.getItem(LS_SENADO);
      if (raw) return migrateSenadoScenario(JSON.parse(raw));
    } catch {}
    return JSON.parse(JSON.stringify(BASE_SENADO));
  });

  // User-created custom parties
  const [customPartiesCongreso, setCustomPartiesCongreso] = useState<Party[]>(() => {
    if (SHARED && SHARED.mode === 'c') return SHARED.custom;
    try {
      const raw = localStorage.getItem(LS_CUSTOM_C);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [customPartiesSenado, setCustomPartiesSenado] = useState<Party[]>(() => {
    if (SHARED && SHARED.mode === 's') return SHARED.custom;
    try {
      const raw = localStorage.getItem(LS_CUSTOM_S);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const isCongreso = mode === 'c';
  const customParties = isCongreso ? customPartiesCongreso : customPartiesSenado;
  const setCustomParties = isCongreso ? setCustomPartiesCongreso : setCustomPartiesSenado;

  // Active parties and constituencies based on mode and custom additions
  const parties: Party[] = useMemo(() => {
    const base = isCongreso ? PARTIES_CONGRESO : PARTIES_SENADO;
    const custom = isCongreso ? customPartiesCongreso : customPartiesSenado;
    if (custom.length === 0) return base;

    return [...base, ...custom];
  }, [isCongreso, customPartiesCongreso, customPartiesSenado]);

  const constituencies: Constituency[] = isCongreso ? PROVINCIAS_CONGRESO : PROVINCIAS_SENADO;
  const activeScenario = isCongreso ? congresoScenario : senadoScenario;
  const setActiveScenario = isCongreso ? setCongresoScenario : setSenadoScenario;

  const totalChamberSeats = isCongreso ? 350 : 209;
  const targetMajoritySeats = isCongreso ? 176 : 133;
  const majorityName = isCongreso ? 'Mayoría absoluta' : 'Mayoría de 3/5';
  const unitLabel = isCongreso ? 'provincias' : 'circunscripciones';
  const fileNamePrefix = isCongreso ? 'congreso' : 'senado';
  const sheetName = isCongreso ? 'Congreso' : 'Senado';

  // Interactive UI state
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());
  const [hoveredConstituencyId, setHoveredConstituencyId] = useState<string | null>(null);
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<string | null>(null);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Selected constituency object for pop-up modal
  const activeSelectedConstituency = useMemo(() => {
    if (!selectedConstituencyId) return null;
    return constituencies.find((c) => c.id === selectedConstituencyId) || null;
  }, [constituencies, selectedConstituencyId]);

  // Debounced save to localStorage
  useEffect(() => {
    if (sharedView) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LS_MODE, mode);
        localStorage.setItem(LS_CONGRESO, JSON.stringify(congresoScenario));
        localStorage.setItem(LS_SENADO, JSON.stringify(senadoScenario));
        localStorage.setItem(LS_CUSTOM_C, JSON.stringify(customPartiesCongreso));
        localStorage.setItem(LS_CUSTOM_S, JSON.stringify(customPartiesSenado));
      } catch (e) {
        console.error('Error saving scenario:', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [sharedView, mode, congresoScenario, senadoScenario, customPartiesCongreso, customPartiesSenado]);

  // Reset selected coalition chips and active modal when switching mode
  const handleSetMode = (newMode: 'c' | 's') => {
    setMode(newMode);
    setSelectedParties(new Set());
    setHoveredConstituencyId(null);
    setSelectedConstituencyId(null);
    setStatusMessage('');
  };

  // Add party handler
  const handleAddParty = (newP: { name: string; abbreviation: string; color: string }) => {
    const party: Party = {
      id: newP.abbreviation,
      name: newP.abbreviation,
      fullName: newP.name !== newP.abbreviation ? newP.name : undefined,
      color: newP.color
    };
    setCustomParties((prev) => [...prev, party]);
    setStatusMessage(`Partido "${party.name}" añadido.`);
  };

  const handleDeleteCustomParty = (partyId: string) => {
    setCustomParties((prev) => prev.filter((p) => p.id !== partyId));
    setStatusMessage('Partido eliminado.');
  };

  // Compute party totals and unassigned seats
  const { partyTotals, unassignedSeats, fullConstituenciesCount } = useMemo(() => {
    const totals: Record<string, number> = {};
    parties.forEach((p) => {
      totals[p.id] = 0;
    });

    let totalAssigned = 0;
    let fullCount = 0;

    constituencies.forEach((c) => {
      const provSeats = activeScenario[c.id] || {};
      let provSum = 0;

      parties.forEach((p) => {
        const count = provSeats[p.id] || 0;
        totals[p.id] += count;
        provSum += count;
      });

      totalAssigned += provSum;
      if (provSum === c.seats) {
        fullCount++;
      }
    });

    const unassigned = Math.max(0, totalChamberSeats - totalAssigned);

    return {
      partyTotals: totals,
      unassignedSeats: unassigned,
      fullConstituenciesCount: fullCount
    };
  }, [parties, constituencies, activeScenario, totalChamberSeats]);

  // Totals of the base scenario, to show how far the current one moved
  const baseTotals = useMemo(() => {
    const base = isCongreso ? BASE_CONGRESO : BASE_SENADO;
    const totals: Record<string, number> = {};
    Object.values(base).forEach((row) => {
      Object.entries(row).forEach(([id, n]) => {
        totals[id] = (totals[id] || 0) + n;
      });
    });
    return totals;
  }, [isCongreso]);

  // Selected coalition summary (used for sharing)
  const coalition = useMemo(() => {
    const members = parties
      .filter((p) => selectedParties.has(p.id) && (partyTotals[p.id] || 0) > 0)
      .sort((a, b) => (partyTotals[b.id] || 0) - (partyTotals[a.id] || 0));
    const seats = members.reduce((sum, p) => sum + (partyTotals[p.id] || 0), 0);
    return { names: members.map((p) => p.name), ids: members.map((p) => p.id), seats };
  }, [parties, selectedParties, partyTotals]);

  // Link people can open. In production it goes through /s, which gives X the preview image
  // of this exact scenario and then opens the simulator with it loaded.
  const buildShareUrl = () => {
    const hash = encodeShare(mode, constituencies, activeScenario, customParties);
    if (import.meta.env.DEV) return `${window.location.origin}${window.location.pathname}${hash}`;
    const k = coalition.ids.length ? `&k=${encodeURIComponent(coalition.ids.join(','))}` : '';
    return `${window.location.origin}/s?d=${encodeURIComponent(hash.slice(1))}${k}`;
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setStatusMessage('Enlace copiado. Quien lo abra verá tu escenario.');
    } catch {
      window.prompt('Copia este enlace:', url);
    }
  };

  const buildImage = () =>
    makeShareImage({
      title: 'Mi predicción para el 29-N',
      label: isCongreso ? 'Congreso de los Diputados' : 'Senado de España',
      crestSrc: isCongreso ? CREST_CONGRESO : CREST_SENADO,
      mapSvg: svgRef.current ? serializeMapSvg(svgRef.current) : null,
      parties,
      partyTotals,
      totalSeats: totalChamberSeats,
      targetSeats: targetMajoritySeats,
      majorityName,
      highlight: selectedParties,
      coalitionText: coalition.names.length
        ? `${coalition.names.join(' + ')} suman ${coalition.seats}` +
          (coalition.seats >= targetMajoritySeats
            ? ` (${majorityName.toLowerCase()})`
            : ` (faltan ${targetMajoritySeats - coalition.seats})`)
        : null,
      coalitionWins: coalition.seats >= targetMajoritySeats,
      url: window.location.href
    });

  const handleDownloadImage = async () => {
    try {
      const blob = await buildImage();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `mi_prediccion_${fileNamePrefix}_29N.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setStatusMessage('Tu predicción se ha descargado (PNG de alta resolución).');
    } catch (err) {
      setStatusMessage('No se pudo generar la imagen.');
    }
  };

  const handleCopyImage = async () => {
    try {
      const item = new ClipboardItem({ 'image/png': buildImage() });
      await navigator.clipboard.write([item]);
      setStatusMessage('Imagen copiada. Ya puedes pegarla donde quieras.');
    } catch {
      await handleDownloadImage();
      setStatusMessage('Tu navegador no deja copiar imágenes, así que la he descargado.');
    }
  };

  const canNativeShare = useMemo(() => {
    try {
      return (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })
      );
    } catch {
      return false;
    }
  }, []);

  const handleNativeShare = async () => {
    try {
      const blob = await buildImage();
      const file = new File([blob], `mi_prediccion_${fileNamePrefix}_29N.png`, { type: 'image/png' });
      await navigator.share({ files: [file], text: 'Mi predicción para el 29-N', url: buildShareUrl() });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatusMessage('No se pudo compartir la imagen.');
    }
  };

  const handleKeepShared = () => {
    setSharedView(false);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setStatusMessage('Escenario guardado en tu navegador.');
  };

  const handleLeaveShared = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.location.reload();
  };

  // Update a single constituency party seat count with boundary enforcement
  const handleUpdateSeat = useCallback(
    (constituencyId: string, partyId: string, rawVal: number) => {
      const c = constituencies.find((x) => x.id === constituencyId);
      if (!c) return;
      if (!isPartyEligible(!isCongreso, partyId, constituencyId)) return;

      const provData = activeScenario[constituencyId] || {};
      let otherSum = 0;
      parties.forEach((p) => {
        if (p.id !== partyId) {
          otherSum += provData[p.id] || 0;
        }
      });

      const maxAllowed = Math.min(c.maxPerParty, Math.max(0, c.seats - otherSum));
      const clamped = Math.max(0, Math.min(rawVal, maxAllowed));

      setActiveScenario((prev) => {
        const next = { ...prev };
        next[constituencyId] = {
          ...(next[constituencyId] || {}),
          [partyId]: clamped
        };
        return next;
      });
    },
    [constituencies, activeScenario, parties, setActiveScenario, isCongreso]
  );

  // Toggle party in coalition builder
  const handleToggleParty = (partyId: string) => {
    setSelectedParties((prev) => {
      const next = new Set(prev);
      if (next.has(partyId)) {
        next.delete(partyId);
      } else {
        next.add(partyId);
      }
      return next;
    });
  };

  const handleClearParties = () => {
    setSelectedParties(new Set());
  };

  const handleSetParties = (ids: string[]) => {
    setSelectedParties(new Set(ids));
  };

  // Bulk paste from spreadsheet clipboard
  const handleBulkPaste = useCallback(
    (startConstituencyId: string, startPartyIndex: number, text: string) => {
      const r0 = constituencies.findIndex((c) => c.id === startConstituencyId);
      if (r0 < 0) return;

      const lines = text
        .replace(/\r/g, '')
        .split('\n')
        .filter((l) => l.length > 0);

      setActiveScenario((prev) => {
        const next = { ...prev };

        lines.forEach((line, lineIdx) => {
          let cells = line.split('\t');
          if (cells.length > 1 && isNaN(Number(cells[0].trim()))) {
            cells = cells.slice(1);
          }

          const targetConst = constituencies[r0 + lineIdx];
          if (!targetConst) return;

          const provData = { ...(next[targetConst.id] || {}) };

          cells.forEach((cellVal, colIdx) => {
            const pIdx = startPartyIndex + colIdx;
            if (
              pIdx < parties.length &&
              isPartyEligible(!isCongreso, parties[pIdx].id, targetConst.id) &&
              cellVal.trim() !== '' &&
              !isNaN(Number(cellVal))
            ) {
              const val = Math.max(0, parseInt(cellVal, 10) || 0);
              provData[parties[pIdx].id] = Math.min(val, targetConst.maxPerParty);
            }
          });

          // Enforce seat limit on pasted row
          let runningSum = 0;
          parties.forEach((p) => {
            const current = provData[p.id] || 0;
            const allowed = Math.max(0, targetConst.seats - runningSum);
            provData[p.id] = Math.min(current, allowed);
            runningSum += provData[p.id];
          });

          next[targetConst.id] = provData;
        });

        return next;
      });

      setStatusMessage('Datos pegados desde el portapapeles.');
    },
    [constituencies, parties, setActiveScenario, isCongreso]
  );

  // Action handlers
  const handleRestoreBase = () => {
    const base = isCongreso ? BASE_CONGRESO : BASE_SENADO;
    setActiveScenario(JSON.parse(JSON.stringify(base)));
    setStatusMessage('Escenario base restaurado.');
  };

  const handleClearTable = () => {
    if (window.confirm('¿Vaciar toda la tabla?')) {
      setActiveScenario({});
      setStatusMessage('Tabla vaciada.');
    }
  };

  const handleClearProvince = useCallback(
    (constituencyId: string) => {
      setActiveScenario((prev) => {
        const next = { ...prev };
        delete next[constituencyId];
        return next;
      });
      const c = constituencies.find((x) => x.id === constituencyId);
      if (c) {
        setStatusMessage(`Escaños de ${c.name} vaciados.`);
      }
    },
    [constituencies, setActiveScenario]
  );

  const handleExportXlsx = () => {
    exportToXlsx(
      fileNamePrefix,
      sheetName,
      constituencies,
      parties,
      activeScenario,
      !isCongreso
    );
    setStatusMessage('Archivo Excel (.xlsx) generado.');
  };

  const handleExportCsv = () => {
    exportToCsv(
      fileNamePrefix,
      constituencies,
      parties,
      activeScenario,
      !isCongreso
    );
    setStatusMessage('Archivo CSV generado.');
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloned.setAttribute('viewBox', '30 90 870 790'); // always export the whole map, even when zoomed in

    // Insert white background rect
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '30');
    bgRect.setAttribute('y', '90');
    bgRect.setAttribute('width', '870');
    bgRect.setAttribute('height', '790');
    bgRect.setAttribute('fill', '#ffffff');
    cloned.insertBefore(bgRect, cloned.firstChild);

    const svgXml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(cloned);
    downloadFile(`mapa_${fileNamePrefix}.svg`, svgXml, 'image/svg+xml;charset=utf-8');
    setStatusMessage('Mapa SVG descargado.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { newScenario, rowCount, warnings } = await parseSpreadsheetFile(
        file,
        constituencies,
        parties
      );
      const cleaned: ScenarioData = {};
      Object.entries(newScenario).forEach(([provId, seats]) => {
        cleaned[provId] = Object.fromEntries(
          Object.entries(seats).filter(([pid]) => isPartyEligible(!isCongreso, pid, provId))
        );
      });
      setActiveScenario(cleaned);
      let msg = `Importadas ${rowCount} circunscripciones.`;
      if (warnings.length) {
        msg += ` ${warnings.join(' ')}`;
      }
      setStatusMessage(msg);
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage(`Error al importar: ${error.message || 'formato no válido'}`);
    }

    e.target.value = '';
  };

  return (
    <main className="max-w-[1360px] mx-auto py-10 px-5 sm:px-8 pb-20 animate-in-view">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 mb-10">
      <div className="flex items-center gap-4">
        <img
          key={mode}
          src={isCongreso ? CREST_CONGRESO : CREST_SENADO}
          alt={isCongreso ? 'Escudo del Congreso de los Diputados' : 'Escudo del Senado de España'}
          className="h-14 sm:h-[72px] w-auto shrink-0 animate-in-view"
        />
        <div>
          <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#77756d]">
            Simulador 29-N 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17171a] leading-tight m-0">
            {isCongreso ? 'Congreso de los Diputados' : 'Senado de España'}
          </h1>
        </div>
      </div>


      {/* Mode Switcher Tabs */}
      <div className="inline-flex gap-1 p-1 rounded-2xl bg-[#f4f3ee]" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isCongreso}
          onClick={() => handleSetMode('c')}
          className={`inline-flex items-center gap-2 py-2 px-5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            isCongreso
              ? 'bg-[#17171a] text-white shadow-xs'
              : 'text-[#77756d] hover:bg-black/5 hover:text-[#17171a]'
          }`}
        >
          <img src={CREST_CONGRESO} alt="" className="h-5 w-auto" />
          Congreso
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCongreso}
          onClick={() => handleSetMode('s')}
          className={`inline-flex items-center gap-2 py-2 px-5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            !isCongreso
              ? 'bg-[#17171a] text-white shadow-xs'
              : 'text-[#77756d] hover:bg-black/5 hover:text-[#17171a]'
          }`}
        >
          <img src={CREST_SENADO} alt="" className="h-5 w-auto" />
          Senado
        </button>
      </div>

      </header>

      {sharedView && (
        <div className="flex flex-wrap items-center gap-3 mb-6 px-4 py-3 rounded-2xl border border-[#e9e7e0] bg-[#fafaf8] text-sm text-[#17171a] animate-in-view">
          <span className="flex-1 min-w-[220px]">
            Estás viendo un escenario compartido. Tus cambios aquí no se guardan en tu navegador.
          </span>
          <button
            type="button"
            onClick={handleKeepShared}
            className="px-3.5 py-1.5 rounded-lg bg-[#17171a] text-white text-xs font-semibold hover:bg-[#34343a] active:scale-95 transition-all cursor-pointer"
          >
            Guardar como mío
          </button>
          <button
            type="button"
            onClick={handleLeaveShared}
            className="px-3.5 py-1.5 rounded-lg border border-[#e9e7e0] bg-white text-xs font-medium hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer"
          >
            Volver a lo mío
          </button>
        </div>
      )}

      {/* Main Grid: Map + Coalition Maker (Left) vs Summary Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-x-12 gap-y-12 items-start mb-12">
        <div className="flex flex-col gap-12">
          <ParliamentMap
            mode={mode}
            parties={parties}
            constituencies={constituencies}
            scenario={activeScenario}
            hoveredConstituencyId={hoveredConstituencyId}
            onHoverConstituency={setHoveredConstituencyId}
            onSelectConstituency={setSelectedConstituencyId}
            selectedParties={selectedParties}
            svgRef={svgRef}
          />
          <Hemicycle
            parties={parties}
            partyTotals={partyTotals}
            totalSeats={totalChamberSeats}
            selectedParties={selectedParties}
            onToggleParty={handleToggleParty}
          />
          <CoalitionMaker
            parties={parties}
            partyTotals={partyTotals}
            selectedParties={selectedParties}
            onToggleParty={handleToggleParty}
            onClearParties={handleClearParties}
            onSetParties={handleSetParties}
            targetSeats={targetMajoritySeats}
            totalChamberSeats={totalChamberSeats}
            majorityName={majorityName}
          />
        </div>

        <SummarySidebar
          totalChamberSeats={totalChamberSeats}
          unassignedSeats={unassignedSeats}
          fullConstituenciesCount={fullConstituenciesCount}
          totalConstituencies={constituencies.length}
          parties={parties}
          partyTotals={partyTotals}
          targetSeats={targetMajoritySeats}
          majorityName={majorityName}
          unitLabel={unitLabel}
          baseTotals={baseTotals}
          onCopyLink={handleCopyLink}
          onDownloadImage={handleDownloadImage}
          onCopyImage={handleCopyImage}
          onNativeShare={canNativeShare ? handleNativeShare : undefined}
          onOpenAddParty={() => setIsAddPartyModalOpen(true)}
          onExportXlsx={handleExportXlsx}
          onExportCsv={handleExportCsv}
          onExportSvg={handleExportSvg}
          onImportFile={handleImportFile}
          onRestoreBase={handleRestoreBase}
          onClearTable={handleClearTable}
        />
      </div>

      {/* Status & Feedback Toast Message */}
      {statusMessage && (
        <div className="text-xs text-[#77756d] min-h-[20px] mb-3 px-1 transition-opacity">
          {statusMessage}
        </div>
      )}

      {/* High-Performance Editable Seats Table */}
      <SeatsTable
        constituencies={constituencies}
        parties={parties}
        scenario={activeScenario}
        isSenado={!isCongreso}
        totalChamberSeats={totalChamberSeats}
        unassignedSeats={unassignedSeats}
        partyTotals={partyTotals}
        hoveredConstituencyId={hoveredConstituencyId}
        onHoverConstituency={setHoveredConstituencyId}
        onSelectConstituency={setSelectedConstituencyId}
        onOpenAddParty={() => setIsAddPartyModalOpen(true)}
        onUpdateSeat={handleUpdateSeat}
        onBulkPaste={handleBulkPaste}
      />

      {/* Province Seat Distribution Pop-up Modal */}
      <ProvinceSeatModal
        constituency={activeSelectedConstituency}
        parties={parties}
        scenario={activeScenario}
        isSenado={!isCongreso}
        onClose={() => setSelectedConstituencyId(null)}
        onUpdateSeat={handleUpdateSeat}
        onClearProvince={handleClearProvince}
      />

      {/* Add Custom Party Modal */}
      <AddPartyModal
        isOpen={isAddPartyModalOpen}
        onClose={() => setIsAddPartyModalOpen(false)}
        onAddParty={handleAddParty}
        existingParties={parties}
        customParties={customParties}
        onDeleteCustomParty={handleDeleteCustomParty}
      />
    </main>
  );
}
