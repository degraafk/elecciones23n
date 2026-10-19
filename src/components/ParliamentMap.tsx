import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Party, Constituency, ScenarioData } from '../data/parliamentData';
import { CONGRESO_SEATS, SENADO_SEATS, SeatCircle } from '../data/seatCoordinates';
import { ALL_PROVINCE_PATHS, PATH_INDICES_BY_CONGRESO, PATH_INDICES_BY_SENADO } from '../data/provincePaths';
import { getProvinceFill } from '../utils/parliamentUtils';

const BASE = { x: 30, y: 90, w: 870, h: 790 };
const MAX_ZOOM = 8;

interface ParliamentMapProps {
  mode: 'c' | 's';
  parties: Party[];
  constituencies: Constituency[];
  scenario: ScenarioData;
  hoveredConstituencyId: string | null;
  onHoverConstituency: (id: string | null) => void;
  onSelectConstituency: (id: string) => void;
  selectedParties: Set<string>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const ParliamentMap: React.FC<ParliamentMapProps> = ({
  mode,
  parties,
  constituencies,
  scenario,
  hoveredConstituencyId,
  onHoverConstituency,
  onSelectConstituency,
  selectedParties,
  svgRef
}) => {
  const isCongreso = mode === 'c';
  const seatsData = isCongreso ? CONGRESO_SEATS : SENADO_SEATS;

  // Memoize province winner fills and SVG pattern definitions
  const { provinceFills, patternDefs } = useMemo(() => {
    const fills: Record<string, string> = {};
    const defs: { id: string; colors: string[] }[] = [];
    const recordedDefIds = new Set<string>();

    constituencies.forEach((c) => {
      const { fill, patternDef } = getProvinceFill(c.id, mode, scenario, parties, recordedDefIds);
      fills[c.id] = fill;
      if (patternDef && !recordedDefIds.has(patternDef.id)) {
        recordedDefIds.add(patternDef.id);
        defs.push(patternDef);
      }
    });

    return { provinceFills: fills, patternDefs: defs };
  }, [constituencies, scenario, mode, parties]);

  // Memoize circles data per constituency with party assignments
  const seatsByConstituency = useMemo(() => {
    const result: Record<string, { circle: SeatCircle; partyId?: string; partyColor?: string; partyName?: string }[]> = {};

    constituencies.forEach((c) => {
      const circles = seatsData[c.id] || [];
      const provSeats = scenario[c.id] || {};

      // Build sequence of assigned parties ordered by party index
      const partySeq: { partyId: string; partyColor: string; partyName: string }[] = [];
      parties.forEach((p) => {
        const count = provSeats[p.id] || 0;
        for (let i = 0; i < count; i++) {
          partySeq.push({ partyId: p.id, partyColor: p.color, partyName: p.name });
        }
      });

      result[c.id] = circles.map((circle, idx) => {
        const assignment = partySeq[idx];
        if (assignment) {
          return {
            circle,
            partyId: assignment.partyId,
            partyColor: assignment.partyColor,
            partyName: assignment.partyName
          };
        }
        return { circle };
      });
    });

    return result;
  }, [constituencies, seatsData, scenario, parties]);

  // Memoize paths for the currently hovered constituency to render them on top of all borders
  const hoveredPaths = useMemo(() => {
    if (!hoveredConstituencyId) return [];
    return ALL_PROVINCE_PATHS.filter(
      (item) => (isCongreso ? item.p : item.s) === hoveredConstituencyId
    );
  }, [hoveredConstituencyId, isCongreso]);

  const hasCoalitionFilter = selectedParties.size > 0;

  // ---------------------------------------------------------------------------
  // Zoom and pan. The view is stored in a ref and written straight to the SVG's
  // viewBox, so dragging and pinching never re-render the 300+ map elements.
  // ---------------------------------------------------------------------------
  const wrapRef = useRef<HTMLDivElement>(null);
  const view = useRef({ ...BASE });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const anim = useRef<number | null>(null);
  const shownZoom = useRef(1);
  const [zoom, setZoom] = useState(1);

  const apply = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const v = view.current;
    svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    const z = BASE.w / v.w;
    if (Math.abs(z - shownZoom.current) > 0.005) {
      shownZoom.current = z;
      setZoom(z);
    }
  }, [svgRef]);

  const clampView = () => {
    const v = view.current;
    v.w = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, v.w));
    v.h = (v.w * BASE.h) / BASE.w;
    v.x = Math.min(BASE.x + BASE.w - v.w, Math.max(BASE.x, v.x));
    v.y = Math.min(BASE.y + BASE.h - v.h, Math.max(BASE.y, v.y));
  };

  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const v = view.current;
    return {
      x: v.x + ((clientX - rect.left) / rect.width) * v.w,
      y: v.y + ((clientY - rect.top) / rect.height) * v.h
    };
  };

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const v = view.current;
    const p = toSvg(clientX, clientY);
    const w = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, v.w / factor));
    const k = w / v.w;
    v.x = p.x - (p.x - v.x) * k;
    v.y = p.y - (p.y - v.y) * k;
    v.w = w;
    v.h = (w * BASE.h) / BASE.w;
    clampView();
    apply();
  };

  const animateTo = (target: { x: number; y: number; w: number; h: number }, ms = 240) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const from = { ...view.current };
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const v = view.current;
      v.x = from.x + (target.x - from.x) * e;
      v.y = from.y + (target.y - from.y) * e;
      v.w = from.w + (target.w - from.w) * e;
      v.h = from.h + (target.h - from.h) * e;
      apply();
      if (t < 1) anim.current = requestAnimationFrame(step);
      else anim.current = null;
    };
    anim.current = requestAnimationFrame(step);
  };

  const zoomBy = (factor: number) => {
    const v = view.current;
    const w = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, v.w / factor));
    const h = (w * BASE.h) / BASE.w;
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    animateTo({
      w,
      h,
      x: Math.min(BASE.x + BASE.w - w, Math.max(BASE.x, cx - w / 2)),
      y: Math.min(BASE.y + BASE.h - h, Math.max(BASE.y, cy - h / 2))
    });
  };

  const resetView = useCallback(
    (instant = false) => {
      if (instant) {
        if (anim.current) cancelAnimationFrame(anim.current);
        view.current = { ...BASE };
        apply();
      } else animateTo({ ...BASE });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply]
  );

  // Ctrl/Cmd + wheel (and trackpad pinch, which arrives as ctrl + wheel) zooms; plain wheel still scrolls the page
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      if (anim.current) {
        cancelAnimationFrame(anim.current);
        anim.current = null;
      }
      const sensitivity = Math.abs(e.deltaY) < 40 ? 0.012 : 0.0025;
      zoomAt(Math.exp(-e.deltaY * sensitivity), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switching Congreso/Senado starts from the full map
  useEffect(() => {
    resetView(true);
  }, [mode, resetView]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0) zoomAt(d / pinchDist.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchDist.current = d;
      dragged.current = true;
      return;
    }

    if (pointers.current.size === 1 && BASE.w / view.current.w > 1.001) {
      const s = dragStart.current;
      if (!dragged.current && s && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 5) return;
      if (!dragged.current) {
        dragged.current = true;
        try {
          wrapRef.current?.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      const rect = svgRef.current!.getBoundingClientRect();
      const v = view.current;
      v.x -= ((e.clientX - prev.x) / rect.width) * v.w;
      v.y -= ((e.clientY - prev.y) / rect.height) * v.h;
      clampView();
      apply();
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
    if (pointers.current.size === 0) window.setTimeout(() => (dragged.current = false), 0);
  };

  const zoomed = zoom > 1.01;

  return (
    <div
      ref={wrapRef}
      className="group relative"
      style={{ touchAction: zoomed ? 'none' : 'pan-y', cursor: zoomed ? 'grab' : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        if (dragged.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${BASE.x} ${BASE.y} ${BASE.w} ${BASE.h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-full block select-none"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        <defs>
          {patternDefs.map((def) => {
            const w = 14 * def.colors.length;
            return (
              <pattern
                key={def.id}
                id={def.id}
                patternUnits="userSpaceOnUse"
                width={w}
                height={w}
                patternTransform="rotate(45)"
              >
                {def.colors.map((color, j) => (
                  <rect key={j} x={j * 14} y={0} width={14} height={w} fill={color} />
                ))}
              </pattern>
            );
          })}
        </defs>

        {/* Base Geography Paths */}
        <g id="mapa" stroke="#ffffff" strokeWidth={0.8}>
          {ALL_PROVINCE_PATHS.map((item, idx) => {
            const constId = isCongreso ? item.p : item.s;
            const fill = provinceFills[constId] || '#ece8df';

            return (
              <path
                key={idx}
                d={item.d}
                fill={fill}
                vectorEffect="non-scaling-stroke"
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={() => onHoverConstituency(constId)}
                onMouseLeave={() => onHoverConstituency(null)}
                onClick={() => onSelectConstituency(constId)}
              />
            );
          })}
        </g>

        {/* Hover Highlight Overlay: Rendered on top of all neighbor borders so it never gets clipped */}
        {hoveredPaths.length > 0 && (
          <g id="mapa-hover-overlay" className="pointer-events-none">
            {hoveredPaths.map((item, idx) => (
              <path
                key={`hover-${idx}`}
                d={item.d}
                fill="none"
                stroke="#17171a"
                strokeWidth={1.8}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-opacity duration-150"
              />
            ))}
          </g>
        )}

        {/* Canary Islands Inset Frame matching application design language */}
        <rect
          x={108}
          y={735}
          width={284}
          height={136}
          rx={14}
          fill="#fafaf8"
          fillOpacity={0.35}
          stroke="#e2e0d8"
          strokeWidth={1}
          className="pointer-events-none"
        />

        {/* Ceuta & Melilla callout lines */}
        <g stroke="#a19e93" fill="none" strokeWidth={1} className="pointer-events-none">
          <path d="M331.5,647.2L331.5,665" />
          <path d="M459.1,689.2L459.1,722" />
        </g>
        <g fontSize={13} fill="#77756d" fontWeight={500} textAnchor="middle" className="pointer-events-none">
          <text x={331} y={704}>
            Ceuta
          </text>
          <text x={459} y={761}>
            Melilla
          </text>
        </g>

        {/* Congreso Special Enclave Labels */}
        {isCongreso && (
          <g className="pointer-events-none">
            <g stroke="#a19e93" fill="none" strokeWidth={1}>
              <path d="M170,345L405,330" />
              <path d="M786,282L742,250" />
              <circle cx={405} cy={330} r={2.5} fill="#a19e93" stroke="none" />
              <circle cx={742} cy={250} r={2.5} fill="#a19e93" stroke="none" />
            </g>
            <g fontSize={13} fill="#77756d" fontWeight={500} textAnchor="middle">
              <text x={112} y={300}>
                Madrid (38)
              </text>
              <text x={834} y={238}>
                Barcelona (32)
              </text>
              <text x={795} y={422}>
                Illes Balears (8)
              </text>
              <text x={200} y={762}>
                Santa Cruz de Tenerife (7)
              </text>
              <text x={318} y={832}>
                Las Palmas (8)
              </text>
            </g>
          </g>
        )}

        {/* Seat Circles Layer */}
        <g id="escanos-layer">
          {constituencies.map((c) => {
            const seats = seatsByConstituency[c.id] || [];
            const isHovered = hoveredConstituencyId === c.id;

            return (
              <g
                key={c.id}
                className="cursor-pointer"
                onMouseEnter={() => onHoverConstituency(c.id)}
                onMouseLeave={() => onHoverConstituency(null)}
                onClick={() => onSelectConstituency(c.id)}
              >
                {seats.map((item, idx) => {
                  const isAssigned = !!item.partyId;
                  const inCoalition = isAssigned && selectedParties.has(item.partyId!);

                  // Dim non-coalition seats when a coalition filter is active
                  let opacity = 1;
                  if (hasCoalitionFilter) {
                    opacity = inCoalition ? 1 : 0.18;
                  }

                  const fillColor = isAssigned ? item.partyColor : '#ffffff';
                  const strokeColor = isHovered ? '#17171a' : isAssigned ? '#ffffff' : '#a19e93';
                  const strokeWidth = isHovered ? 1.4 : isAssigned ? 1 : 0.7;

                  return (
                    <circle
                      key={idx}
                      cx={item.circle.cx}
                      cy={item.circle.cy}
                      r={item.circle.r}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      vectorEffect="non-scaling-stroke"
                      opacity={opacity}
                      className="transition-all duration-150 ease-out"
                    >
                      <title>
                        {`${c.name}: ${isAssigned ? item.partyName : 'sin asignar'}`}
                      </title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
      {/* Zoom controls */}
      <div className="absolute top-1 right-1 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => zoomBy(1.6)}
          disabled={zoom >= MAX_ZOOM - 0.01}
          aria-label="Acercar"
          className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur border border-[#e9e7e0] text-lg font-semibold text-[#17171a] hover:border-[#a19e93] active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.6)}
          disabled={!zoomed}
          aria-label="Alejar"
          className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur border border-[#e9e7e0] text-lg font-semibold text-[#17171a] hover:border-[#a19e93] active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
        >
          −
        </button>
        {zoomed && (
          <button
            type="button"
            onClick={() => resetView()}
            aria-label="Restablecer zoom"
            className="h-9 px-2 rounded-xl bg-white/90 backdrop-blur border border-[#e9e7e0] text-[11px] font-semibold tabular-nums text-[#17171a] hover:border-[#a19e93] active:scale-95 transition-all cursor-pointer animate-in-view"
          >
            {zoom.toFixed(1)}×
          </button>
        )}
      </div>
      <div className="pointer-events-none absolute left-1 bottom-1 hidden sm:block text-[11px] text-[#a19e93] opacity-0 group-hover:opacity-100 transition-opacity">
        Ctrl o ⌘ + rueda para hacer zoom. Arrastra para mover.
      </div>
    </div>
  );
};
