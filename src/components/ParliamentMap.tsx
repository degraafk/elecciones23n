import React, { useMemo } from 'react';
import { Party, Constituency, ScenarioData } from '../data/parliamentData';
import { CONGRESO_SEATS, SENADO_SEATS, SeatCircle } from '../data/seatCoordinates';
import { ALL_PROVINCE_PATHS, PATH_INDICES_BY_CONGRESO, PATH_INDICES_BY_SENADO } from '../data/provincePaths';
import { getProvinceFill } from '../utils/parliamentUtils';

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

  return (
    <div className="bg-white border border-[#e9e7e0] rounded-[20px] p-3.5 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-12px_rgba(20,20,20,0.08)] overflow-hidden transition-all duration-200">
      <svg
        ref={svgRef}
        viewBox="30 90 870 790"
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
                Madrid · 38
              </text>
              <text x={834} y={238}>
                Barcelona · 32
              </text>
              <text x={795} y={422}>
                Illes Balears · 8
              </text>
              <text x={200} y={762}>
                Santa Cruz de Tenerife · 7
              </text>
              <text x={318} y={832}>
                Las Palmas · 8
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
    </div>
  );
};
