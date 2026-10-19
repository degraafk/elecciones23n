export interface Party {
  id: string;
  name: string;
  color: string;
  fullName?: string;
}

export interface Constituency {
  id: string;
  name: string;
  seats: number;
  maxPerParty: number;
}

export type ScenarioData = Record<string, Record<string, number>>;

const P_PP: Party = { id: 'PP', name: 'PP', color: '#0b5ea8', fullName: 'Partido Popular' };
const P_PSOE: Party = { id: 'PSOE', name: 'PSOE', color: '#e30613', fullName: 'Partido Socialista Obrero Español' };
const P_VOX: Party = { id: 'Vox', name: 'Vox', color: '#5fb02e' };
const P_FA: Party = { id: 'FA', name: 'FA', color: '#ff5a00', fullName: 'Frente Amplio' };
const P_PODEMOS: Party = { id: 'Podemos', name: 'Podemos', color: '#8f63f0' };
const P_ERC: Party = { id: 'ERC', name: 'ERC', color: '#f5a623' };
const P_JUNTS: Party = { id: 'Junts', name: 'Junts', color: '#1ec1b0' };
const P_BILDU: Party = { id: 'EH Bildu', name: 'EH Bildu', color: '#c8d82a' };
const P_PNV: Party = { id: 'PNV', name: 'PNV', color: '#0f6b3a' };
const P_BNG: Party = { id: 'BNG', name: 'BNG', color: '#7fb2e5' };
const P_CC: Party = { id: 'CC', name: 'CC', color: '#ffd800' };
const P_AA: Party = { id: 'AA', name: 'AA', color: '#8fdb98', fullName: 'Adelante Andalucía' };
const P_AHI: Party = { id: 'AHI', name: 'AHI', color: '#7a4fa3', fullName: 'Agrupación Herreña Independiente' };
const P_ASG: Party = { id: 'ASG', name: 'ASG', color: '#d9528a', fullName: 'Agrupación Socialista Gomera' };

// Coalitions
const P_UPN_PP: Party = { id: 'UPN-PP', name: 'UPN-PP', color: '#2b4c7e', fullName: 'Coalición UPN y PP (Navarra)' };
const P_CFV: Party = { id: 'C-FV', name: 'C-FV', color: '#d9480f', fullName: 'Compromís-Front Valencià (FA + Compromís + Podemos)' };
const P_UPC: Party = { id: 'UPC', name: 'UPC', color: '#c2255c', fullName: 'Unidad del Pueblo Canario (FA + Nueva Canarias + Podemos)' };
const P_SAUNIO: Party = { id: 'Sa Unió', name: 'Sa Unió', color: '#0e9aa7', fullName: 'Sa Unió (coalición local con el PP en Formentera)' };
const P_SDP: Party = { id: 'SdP', name: 'SdP', color: '#b5121b', fullName: 'Senado de Progreso' };

export const PARTIES_CONGRESO: Party[] = [
  P_PP, P_PSOE, P_VOX, P_FA, P_PODEMOS, P_ERC, P_JUNTS, P_BILDU, P_PNV, P_BNG, P_CC, P_AA,
  P_UPN_PP, P_CFV, P_UPC
];

export const PARTIES_SENADO: Party[] = [
  P_PP, P_PSOE, P_SDP, P_VOX, P_FA, P_PODEMOS, P_ERC, P_JUNTS, P_BILDU, P_PNV, P_BNG, P_CC, P_AA,
  P_UPN_PP, P_SAUNIO, P_AHI, P_ASG, P_UPC
];

/** Suggested coalitions shown in the coalition maker (ids missing in a chamber are ignored). */
const LEFT = ['PSOE', 'SdP', 'FA', 'Podemos', 'C-FV', 'UPC', 'ERC', 'EH Bildu', 'BNG', 'AA', 'ASG'];
export const BLOCS: { id: string; name: string; parties: string[] }[] = [
  { id: 'derecha', name: 'Bloque de derechas', parties: ['PP', 'Vox', 'UPN-PP', 'Sa Unió'] },
  { id: 'izquierda', name: 'Bloque de izquierdas', parties: LEFT },
  { id: 'sanchez', name: 'Coalición Sánchez', parties: [...LEFT, 'Junts', 'PNV', 'CC'] }
];

// ---------------------------------------------------------------------------
// Where each party runs
// ---------------------------------------------------------------------------
const VALENCIAN_COMMUNITY = ['Valencia', 'Alicante', 'Castellón'];
const CANARY_ISLANDS = ['Las_Palmas', 'Santa_Cruz_de_Tenerife']; // Congreso provinces
const NAVARRA = ['Navarra'];
const CATALONIA = ['Barcelona', 'Girona', 'Lleida', 'Tarragona'];
const BASQUE_COUNTRY = ['Álava', 'Bizkaia', 'Gipuzkoa'];
const GALICIA = ['A_Coruña', 'Lugo', 'Ourense', 'Pontevedra'];
const ANDALUSIA = ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'];

// Senado circunscripciones
const EXTREMADURA = ['Badajoz', 'Cáceres'];
const SENADO_CANARIAS = ['Gran_Canaria', 'Tenerife', 'Lanzarote', 'Fuerteventura', 'La_Palma', 'El_Hierro', 'La_Gomera'];
const SENADO_CANARIAS_SIN_GOMERA = SENADO_CANARIAS.filter((id) => id !== 'La_Gomera');
// Where SdP does not run and the left goes separately
const SDP_FUERA = [...CATALONIA, ...EXTREMADURA, 'Sevilla', ...SENADO_CANARIAS_SIN_GOMERA];

/** Parties that only run in these provinces. */
const ONLY_IN: Record<string, string[]> = {
  'C-FV': VALENCIAN_COMMUNITY,
  UPC: CANARY_ISLANDS,
  'UPN-PP': NAVARRA,
  ERC: CATALONIA,
  Junts: CATALONIA,
  PNV: BASQUE_COUNTRY,
  'EH Bildu': [...BASQUE_COUNTRY, ...NAVARRA],
  BNG: GALICIA,
  CC: CANARY_ISLANDS,
  AA: ANDALUSIA
};

/** Parties that run everywhere except in these provinces (their coalition runs instead). */
const NOT_IN: Record<string, string[]> = {
  FA: [...VALENCIAN_COMMUNITY, ...CANARY_ISLANDS],
  Podemos: [...VALENCIAN_COMMUNITY, ...CANARY_ISLANDS],
  PP: NAVARRA
};

const ONLY_IN_SENADO: Record<string, string[]> = {
  'UPN-PP': NAVARRA,
  'Sa Unió': ['Formentera'],
  ERC: CATALONIA,
  Junts: CATALONIA,
  PNV: BASQUE_COUNTRY,
  'EH Bildu': [...BASQUE_COUNTRY, ...NAVARRA],
  BNG: GALICIA,
  CC: SENADO_CANARIAS,
  AA: ANDALUSIA,
  AHI: ['El_Hierro'],
  ASG: ['La_Gomera'],
  // inside SdP everywhere else
  PSOE: SDP_FUERA,
  FA: [...CATALONIA, ...EXTREMADURA, 'Sevilla'],
  UPC: SENADO_CANARIAS_SIN_GOMERA
};

const NOT_IN_SENADO: Record<string, string[]> = {
  SdP: SDP_FUERA,
  Podemos: [...VALENCIAN_COMMUNITY, ...SENADO_CANARIAS],
  PP: [...NAVARRA, 'Formentera']
};

export const isPartyEligible = (isSenado: boolean, partyId: string, constituencyId: string): boolean => {
  const only = (isSenado ? ONLY_IN_SENADO : ONLY_IN)[partyId];
  if (only) return only.includes(constituencyId);
  const not = (isSenado ? NOT_IN_SENADO : NOT_IN)[partyId];
  if (not) return !not.includes(constituencyId);
  return true;
};

/** Short note shown where a party does not run. */
export const ineligibleReason = (partyId: string, isSenado = false, constituencyId?: string): string => {
  if (partyId === 'Sa Unió') return 'Solo se presenta en Formentera';
  if (isSenado && partyId === 'PP' && constituencyId === 'Formentera') return 'En Formentera concurre como Sa Unió';
  if (isSenado && partyId === 'SdP') return 'Aquí la izquierda va por separado';
  if (isSenado && ['PSOE', 'FA', 'UPC'].includes(partyId)) return 'Aquí concurre dentro de Senado de Progreso (SdP)';
  if (partyId === 'AHI') return 'Solo se presenta en El Hierro';
  if (partyId === 'ASG') return 'Solo se presenta en La Gomera';
  if (partyId === 'C-FV') return 'Solo se presenta en la Comunitat Valenciana';
  if (partyId === 'UPC') return 'Solo se presenta en Canarias';
  if (partyId === 'UPN-PP') return 'Solo se presenta en Navarra';
  if (partyId === 'PP') return 'En Navarra concurre como UPN-PP';
  if (partyId === 'ERC' || partyId === 'Junts') return 'Solo se presenta en Cataluña';
  if (partyId === 'PNV') return 'Solo se presenta en Euskadi';
  if (partyId === 'EH Bildu') return 'Solo se presenta en Euskadi y Navarra';
  if (partyId === 'BNG') return 'Solo se presenta en Galicia';
  if (partyId === 'CC') return 'Solo se presenta en Canarias';
  if (partyId === 'AA') return 'Solo se presenta en Andalucía';
  return 'Aquí concurre dentro de una coalición';
};

const REMOVED_PARTIES = ['Compromís', 'UPN', 'Otros'];

function migrateScenario(scenario: ScenarioData, isSenado: boolean): ScenarioData {
  const constituencies = isSenado ? PROVINCIAS_SENADO : PROVINCIAS_CONGRESO;
  const byId = new Map(constituencies.map((c) => [c.id, c]));
  const out: ScenarioData = {};

  Object.entries(scenario || {}).forEach(([provId, seats]) => {
    const c = byId.get(provId);
    if (!c) return;
    const target: Record<string, number> = {};

    Object.entries(seats || {}).forEach(([pid, n]) => {
      if (!n) return;
      let id = pid;
      if (NAVARRA.includes(provId) && ['PP', 'UPN'].includes(pid)) id = 'UPN-PP';
      else if (isSenado && provId === 'Formentera' && pid === 'PP') id = 'Sa Unió';
      else if (isSenado) {
        if (['PSOE', 'FA', 'C-FV', 'UPC', 'Compromís'].includes(pid) && isPartyEligible(true, 'SdP', provId)) id = 'SdP';
      } else if (VALENCIAN_COMMUNITY.includes(provId) && ['FA', 'Podemos', 'Compromís'].includes(pid)) id = 'C-FV';
      else if (CANARY_ISLANDS.includes(provId) && ['FA', 'Podemos'].includes(pid)) id = 'UPC';

      if (REMOVED_PARTIES.includes(id) || !isPartyEligible(isSenado, id, provId)) return;
      target[id] = (target[id] || 0) + n;
    });

    // keep the province within its seats and the per-party cap
    let used = 0;
    Object.keys(target).forEach((id) => {
      const n = Math.min(target[id], c.maxPerParty, c.seats - used);
      if (n > 0) {
        target[id] = n;
        used += n;
      } else delete target[id];
    });
    if (used > 0) out[provId] = target;
  });
  return out;
}

/** Converts a saved Congreso scenario to the current party list and rules. */
export const migrateCongresoScenario = (scenario: ScenarioData): ScenarioData => migrateScenario(scenario, false);

/** Converts a saved Senado scenario (PSOE/FA become SdP where it runs, UPN/PP become UPN-PP in Navarra...). */
export const migrateSenadoScenario = (scenario: ScenarioData): ScenarioData => migrateScenario(scenario, true);

export const PROVINCIAS_CONGRESO: Constituency[] = [
  { id: 'A_Coruña', name: 'A Coruña', seats: 8, maxPerParty: 8 },
  { id: 'Álava', name: 'Álava', seats: 4, maxPerParty: 4 },
  { id: 'Albacete', name: 'Albacete', seats: 4, maxPerParty: 4 },
  { id: 'Alicante', name: 'Alicante', seats: 12, maxPerParty: 12 },
  { id: 'Almería', name: 'Almería', seats: 6, maxPerParty: 6 },
  { id: 'Asturias', name: 'Asturias', seats: 7, maxPerParty: 7 },
  { id: 'Ávila', name: 'Ávila', seats: 3, maxPerParty: 3 },
  { id: 'Badajoz', name: 'Badajoz', seats: 5, maxPerParty: 5 },
  { id: 'Barcelona', name: 'Barcelona', seats: 32, maxPerParty: 32 },
  { id: 'Bizkaia', name: 'Bizkaia', seats: 8, maxPerParty: 8 },
  { id: 'Burgos', name: 'Burgos', seats: 4, maxPerParty: 4 },
  { id: 'Cáceres', name: 'Cáceres', seats: 4, maxPerParty: 4 },
  { id: 'Cádiz', name: 'Cádiz', seats: 8, maxPerParty: 8 },
  { id: 'Cantabria', name: 'Cantabria', seats: 5, maxPerParty: 5 },
  { id: 'Castellón', name: 'Castellón', seats: 5, maxPerParty: 5 },
  { id: 'Ceuta', name: 'Ceuta', seats: 1, maxPerParty: 1 },
  { id: 'Ciudad_Real', name: 'Ciudad Real', seats: 5, maxPerParty: 5 },
  { id: 'Córdoba', name: 'Córdoba', seats: 6, maxPerParty: 6 },
  { id: 'Cuenca', name: 'Cuenca', seats: 3, maxPerParty: 3 },
  { id: 'Gipuzkoa', name: 'Gipuzkoa', seats: 6, maxPerParty: 6 },
  { id: 'Girona', name: 'Girona', seats: 6, maxPerParty: 6 },
  { id: 'Granada', name: 'Granada', seats: 7, maxPerParty: 7 },
  { id: 'Guadalajara', name: 'Guadalajara', seats: 3, maxPerParty: 3 },
  { id: 'Huelva', name: 'Huelva', seats: 5, maxPerParty: 5 },
  { id: 'Huesca', name: 'Huesca', seats: 3, maxPerParty: 3 },
  { id: 'Baleares', name: 'Illes Balears', seats: 8, maxPerParty: 8 },
  { id: 'Jaén', name: 'Jaén', seats: 5, maxPerParty: 5 },
  { id: 'La_Rioja', name: 'La Rioja', seats: 4, maxPerParty: 4 },
  { id: 'Las_Palmas', name: 'Las Palmas', seats: 8, maxPerParty: 8 },
  { id: 'León', name: 'León', seats: 4, maxPerParty: 4 },
  { id: 'Lleida', name: 'Lleida', seats: 4, maxPerParty: 4 },
  { id: 'Lugo', name: 'Lugo', seats: 4, maxPerParty: 4 },
  { id: 'Madrid', name: 'Madrid', seats: 38, maxPerParty: 38 },
  { id: 'Málaga', name: 'Málaga', seats: 11, maxPerParty: 11 },
  { id: 'Melilla', name: 'Melilla', seats: 1, maxPerParty: 1 },
  { id: 'Murcia', name: 'Murcia', seats: 10, maxPerParty: 10 },
  { id: 'Navarra', name: 'Navarra', seats: 5, maxPerParty: 5 },
  { id: 'Ourense', name: 'Ourense', seats: 4, maxPerParty: 4 },
  { id: 'Palencia', name: 'Palencia', seats: 3, maxPerParty: 3 },
  { id: 'Pontevedra', name: 'Pontevedra', seats: 7, maxPerParty: 7 },
  { id: 'Salamanca', name: 'Salamanca', seats: 4, maxPerParty: 4 },
  { id: 'Santa_Cruz_de_Tenerife', name: 'Santa Cruz de Tenerife', seats: 7, maxPerParty: 7 },
  { id: 'Segovia', name: 'Segovia', seats: 3, maxPerParty: 3 },
  { id: 'Sevilla', name: 'Sevilla', seats: 12, maxPerParty: 12 },
  { id: 'Soria', name: 'Soria', seats: 2, maxPerParty: 2 },
  { id: 'Tarragona', name: 'Tarragona', seats: 6, maxPerParty: 6 },
  { id: 'Teruel', name: 'Teruel', seats: 3, maxPerParty: 3 },
  { id: 'Toledo', name: 'Toledo', seats: 6, maxPerParty: 6 },
  { id: 'Valencia', name: 'Valencia', seats: 16, maxPerParty: 16 },
  { id: 'Valladolid', name: 'Valladolid', seats: 5, maxPerParty: 5 },
  { id: 'Zamora', name: 'Zamora', seats: 3, maxPerParty: 3 },
  { id: 'Zaragoza', name: 'Zaragoza', seats: 7, maxPerParty: 7 }
];

export const PROVINCIAS_SENADO: Constituency[] = [
  { id: 'A_Coruña', name: 'A Coruña', seats: 4, maxPerParty: 3 },
  { id: 'Álava', name: 'Álava', seats: 4, maxPerParty: 3 },
  { id: 'Albacete', name: 'Albacete', seats: 4, maxPerParty: 3 },
  { id: 'Alicante', name: 'Alicante', seats: 4, maxPerParty: 3 },
  { id: 'Almería', name: 'Almería', seats: 4, maxPerParty: 3 },
  { id: 'Asturias', name: 'Asturias', seats: 4, maxPerParty: 3 },
  { id: 'Ávila', name: 'Ávila', seats: 4, maxPerParty: 3 },
  { id: 'Badajoz', name: 'Badajoz', seats: 4, maxPerParty: 3 },
  { id: 'Barcelona', name: 'Barcelona', seats: 4, maxPerParty: 3 },
  { id: 'Bizkaia', name: 'Bizkaia', seats: 4, maxPerParty: 3 },
  { id: 'Burgos', name: 'Burgos', seats: 4, maxPerParty: 3 },
  { id: 'Cáceres', name: 'Cáceres', seats: 4, maxPerParty: 3 },
  { id: 'Cádiz', name: 'Cádiz', seats: 4, maxPerParty: 3 },
  { id: 'Cantabria', name: 'Cantabria', seats: 4, maxPerParty: 3 },
  { id: 'Castellón', name: 'Castellón', seats: 4, maxPerParty: 3 },
  { id: 'Ceuta', name: 'Ceuta', seats: 2, maxPerParty: 2 },
  { id: 'Ciudad_Real', name: 'Ciudad Real', seats: 4, maxPerParty: 3 },
  { id: 'Córdoba', name: 'Córdoba', seats: 4, maxPerParty: 3 },
  { id: 'Cuenca', name: 'Cuenca', seats: 4, maxPerParty: 3 },
  { id: 'El_Hierro', name: 'El Hierro', seats: 1, maxPerParty: 1 },
  { id: 'Formentera', name: 'Formentera', seats: 1, maxPerParty: 1 },
  { id: 'Fuerteventura', name: 'Fuerteventura', seats: 1, maxPerParty: 1 },
  { id: 'Gipuzkoa', name: 'Gipuzkoa', seats: 4, maxPerParty: 3 },
  { id: 'Girona', name: 'Girona', seats: 4, maxPerParty: 3 },
  { id: 'Gran_Canaria', name: 'Gran Canaria', seats: 3, maxPerParty: 2 },
  { id: 'Granada', name: 'Granada', seats: 4, maxPerParty: 3 },
  { id: 'Guadalajara', name: 'Guadalajara', seats: 4, maxPerParty: 3 },
  { id: 'Huelva', name: 'Huelva', seats: 4, maxPerParty: 3 },
  { id: 'Huesca', name: 'Huesca', seats: 4, maxPerParty: 3 },
  { id: 'Ibiza', name: 'Ibiza', seats: 1, maxPerParty: 1 },
  { id: 'Jaén', name: 'Jaén', seats: 4, maxPerParty: 3 },
  { id: 'La_Gomera', name: 'La Gomera', seats: 1, maxPerParty: 1 },
  { id: 'La_Palma', name: 'La Palma', seats: 1, maxPerParty: 1 },
  { id: 'La_Rioja', name: 'La Rioja', seats: 4, maxPerParty: 3 },
  { id: 'Lanzarote', name: 'Lanzarote', seats: 1, maxPerParty: 1 },
  { id: 'León', name: 'León', seats: 4, maxPerParty: 3 },
  { id: 'Lleida', name: 'Lleida', seats: 4, maxPerParty: 3 },
  { id: 'Lugo', name: 'Lugo', seats: 4, maxPerParty: 3 },
  { id: 'Madrid', name: 'Madrid', seats: 4, maxPerParty: 3 },
  { id: 'Málaga', name: 'Málaga', seats: 4, maxPerParty: 3 },
  { id: 'Mallorca', name: 'Mallorca', seats: 3, maxPerParty: 2 },
  { id: 'Melilla', name: 'Melilla', seats: 2, maxPerParty: 2 },
  { id: 'Menorca', name: 'Menorca', seats: 1, maxPerParty: 1 },
  { id: 'Murcia', name: 'Murcia', seats: 4, maxPerParty: 3 },
  { id: 'Navarra', name: 'Navarra', seats: 4, maxPerParty: 3 },
  { id: 'Ourense', name: 'Ourense', seats: 4, maxPerParty: 3 },
  { id: 'Palencia', name: 'Palencia', seats: 4, maxPerParty: 3 },
  { id: 'Pontevedra', name: 'Pontevedra', seats: 4, maxPerParty: 3 },
  { id: 'Salamanca', name: 'Salamanca', seats: 4, maxPerParty: 3 },
  { id: 'Segovia', name: 'Segovia', seats: 4, maxPerParty: 3 },
  { id: 'Sevilla', name: 'Sevilla', seats: 4, maxPerParty: 3 },
  { id: 'Soria', name: 'Soria', seats: 4, maxPerParty: 3 },
  { id: 'Tarragona', name: 'Tarragona', seats: 4, maxPerParty: 3 },
  { id: 'Tenerife', name: 'Tenerife', seats: 3, maxPerParty: 2 },
  { id: 'Teruel', name: 'Teruel', seats: 4, maxPerParty: 3 },
  { id: 'Toledo', name: 'Toledo', seats: 4, maxPerParty: 3 },
  { id: 'Valencia', name: 'Valencia', seats: 4, maxPerParty: 3 },
  { id: 'Valladolid', name: 'Valladolid', seats: 4, maxPerParty: 3 },
  { id: 'Zamora', name: 'Zamora', seats: 4, maxPerParty: 3 },
  { id: 'Zaragoza', name: 'Zaragoza', seats: 4, maxPerParty: 3 }
];

export const BASE_CONGRESO: ScenarioData = {
  A_Coruña: { PP: 4, PSOE: 2, FA: 1, BNG: 1 },
  Pontevedra: { PP: 4, PSOE: 3 },
  Lugo: { PP: 3, PSOE: 1 },
  Ourense: { PP: 3, PSOE: 1 },
  Asturias: { PP: 3, PSOE: 2, Vox: 1, FA: 1 },
  Cantabria: { PP: 2, PSOE: 2, Vox: 1 },
  Bizkaia: { PP: 1, PSOE: 2, 'EH Bildu': 2, PNV: 3 },
  Gipuzkoa: { PSOE: 2, 'EH Bildu': 2, PNV: 2 },
  Álava: { PP: 1, PSOE: 1, 'EH Bildu': 1, PNV: 1 },
  Navarra: { PSOE: 2, 'EH Bildu': 1, 'UPN-PP': 2 },
  La_Rioja: { PP: 2, PSOE: 2 },
  Burgos: { PP: 2, PSOE: 1, Vox: 1 },
  Palencia: { PP: 2, PSOE: 1 },
  León: { PP: 2, PSOE: 1, Vox: 1 },
  Zamora: { PP: 2, PSOE: 1 },
  Valladolid: { PP: 2, PSOE: 2, Vox: 1 },
  Segovia: { PP: 2, PSOE: 1 },
  Soria: { PP: 1, PSOE: 1 },
  Salamanca: { PP: 2, PSOE: 1, Vox: 1 },
  Ávila: { PP: 1, PSOE: 1, Vox: 1 },
  Huesca: { PP: 1, PSOE: 1, Vox: 1 },
  Zaragoza: { PP: 3, PSOE: 2, Vox: 2 },
  Teruel: { PP: 1, PSOE: 1, Vox: 1 },
  Lleida: { PSOE: 2, ERC: 1, Junts: 1 },
  Girona: { PSOE: 2, Vox: 1, ERC: 1, Junts: 2 },
  Tarragona: { PP: 1, PSOE: 2, Vox: 1, ERC: 1, Junts: 1 },
  Barcelona: { PP: 5, PSOE: 12, Vox: 4, FA: 4, ERC: 4, Junts: 3 },
  Castellón: { PP: 2, PSOE: 2, Vox: 1 },
  Guadalajara: { PP: 1, PSOE: 1, Vox: 1 },
  Cuenca: { PP: 1, PSOE: 1, Vox: 1 },
  Toledo: { PP: 2, PSOE: 2, Vox: 2 },
  Cáceres: { PP: 2, PSOE: 1, Vox: 1 },
  Badajoz: { PP: 2, PSOE: 2, Vox: 1 },
  Ciudad_Real: { PP: 2, PSOE: 2, Vox: 1 },
  Albacete: { PP: 2, PSOE: 1, Vox: 1 },
  Madrid: { PP: 15, PSOE: 10, Vox: 8, FA: 4, Podemos: 1 },
  Valencia: { PP: 5, PSOE: 5, Vox: 4, 'C-FV': 2 },
  Alicante: { PP: 4, PSOE: 4, Vox: 3, 'C-FV': 1 },
  Murcia: { PP: 4, PSOE: 2, Vox: 4 },
  Baleares: { PP: 3, PSOE: 2, Vox: 2, FA: 1 },
  Sevilla: { PP: 4, PSOE: 4, Vox: 3, FA: 1 },
  Huelva: { PP: 2, PSOE: 2, Vox: 1 },
  Córdoba: { PP: 3, PSOE: 2, Vox: 1 },
  Jaén: { PP: 2, PSOE: 2, Vox: 1 },
  Málaga: { PP: 4, PSOE: 3, Vox: 3, FA: 1 },
  Cádiz: { PP: 3, PSOE: 3, Vox: 2 },
  Granada: { PP: 3, PSOE: 2, Vox: 2 },
  Almería: { PP: 3, PSOE: 1, Vox: 2 },
  Ceuta: { PP: 1 },
  Melilla: { PP: 1 },
  Santa_Cruz_de_Tenerife: { PP: 3, PSOE: 3, CC: 1 },
  Las_Palmas: { PP: 3, PSOE: 3, Vox: 2 }
};

const RAW_BASE_SENADO: ScenarioData = {
  A_Coruña: { PP: 3, PSOE: 1 },
  Pontevedra: { PP: 3, PSOE: 1 },
  Lugo: { PP: 3, PSOE: 1 },
  Ourense: { PP: 3, PSOE: 1 },
  Asturias: { PP: 3, PSOE: 1 },
  León: { PP: 3, PSOE: 1 },
  Cantabria: { PP: 3, PSOE: 1 },
  Palencia: { PP: 3, PSOE: 1 },
  Burgos: { PP: 3, PSOE: 1 },
  La_Rioja: { PP: 3, PSOE: 1 },
  Bizkaia: { PNV: 3, 'EH Bildu': 1 },
  Gipuzkoa: { 'EH Bildu': 3, PNV: 1 },
  Álava: { PSOE: 3, 'EH Bildu': 1 },
  Navarra: { UPN: 3, PSOE: 1 },
  Huesca: { PP: 3, PSOE: 1 },
  Lleida: { ERC: 2, PSOE: 2 },
  Girona: { ERC: 2, PSOE: 1, Junts: 1 },
  Barcelona: { PSOE: 3, ERC: 1 },
  Tarragona: { PSOE: 3, ERC: 1 },
  Zamora: { PP: 3, PSOE: 1 },
  Valladolid: { PP: 3, PSOE: 1 },
  Soria: { PP: 3, PSOE: 1 },
  Zaragoza: { PP: 3, PSOE: 1 },
  Segovia: { PP: 3, PSOE: 1 },
  Guadalajara: { PP: 3, PSOE: 1 },
  Teruel: { PP: 3, PSOE: 1 },
  Salamanca: { PP: 3, PSOE: 1 },
  Ávila: { PP: 3, PSOE: 1 },
  Madrid: { PP: 3, PSOE: 1 },
  Castellón: { PP: 3, PSOE: 1 },
  Toledo: { PP: 3, PSOE: 1 },
  Cuenca: { PP: 3, PSOE: 1 },
  Cáceres: { PP: 3, PSOE: 1 },
  Valencia: { PP: 3, PSOE: 1 },
  Ciudad_Real: { PP: 3, PSOE: 1 },
  Albacete: { PP: 3, PSOE: 1 },
  Alicante: { PP: 3, PSOE: 1 },
  Badajoz: { PP: 3, PSOE: 1 },
  Córdoba: { PP: 3, PSOE: 1 },
  Jaén: { PP: 3, PSOE: 1 },
  Murcia: { PP: 3, Vox: 1 },
  Huelva: { PP: 3, PSOE: 1 },
  Sevilla: { PP: 3, PSOE: 1 },
  Granada: { PP: 3, PSOE: 1 },
  Almería: { PP: 3, Vox: 1 },
  Málaga: { PP: 3, PSOE: 1 },
  Cádiz: { PP: 3, PSOE: 1 },
  Mallorca: { PSOE: 1, PP: 2 },
  Menorca: { PP: 1 },
  La_Palma: { PP: 1 },
  El_Hierro: { AHI: 1 },
  La_Gomera: { ASG: 1 },
  Tenerife: { PP: 1, PSOE: 2 },
  Gran_Canaria: { PP: 1, PSOE: 2 },
  Fuerteventura: { PSOE: 1 },
  Lanzarote: { PSOE: 1 },
  Ceuta: { PP: 1, Vox: 1 },
  Melilla: { PP: 2 },
  Ibiza: { PP: 1 }
};

export const BASE_SENADO: ScenarioData = migrateSenadoScenario(RAW_BASE_SENADO);

export const ALIASES: Record<string, string> = {
  vizcaya: 'bizkaia',
  biscay: 'bizkaia',
  guipuzcoa: 'gipuzkoa',
  baleares: 'illesbalears',
  balearicislands: 'illesbalears',
  seville: 'sevilla',
  lacoruna: 'acoruna',
  coruna: 'acoruna',
  navarre: 'navarra',
  araba: 'alava',
  gerona: 'girona',
  lerida: 'lleida',
  orense: 'ourense',
  alacant: 'alicante',
  castello: 'castellon',
  tenerife: 'santacruzdetenerife',
  santacruz: 'santacruzdetenerife',
  eivissa: 'ibiza',
  grancanaria: 'grancanaria',
  elhierro: 'elhierro'
};
