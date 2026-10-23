/**
 * One source of truth for the map's crop and the moved Canary Islands group.
 * The map, the zoom, the SVG download and the prediction image all read from here.
 */
export const MAP_VIEW = { x: 40, y: 83, w: 853, h: 690 };

/** Canary Islands (frame, islands, seats and labels) are drawn at 89% and moved to the lower right. */
export const CANARIAS_TRANSFORM = 'translate(532.03 -107.25) scale(0.8902)';

/** Constituency ids of the Canary Islands in both chambers (Congreso provinces and Senado islands). */
export const CANARIAS_IDS = new Set([
  'Las_Palmas',
  'Santa_Cruz_de_Tenerife',
  'Gran_Canaria',
  'Tenerife',
  'Lanzarote',
  'Fuerteventura',
  'La_Palma',
  'El_Hierro',
  'La_Gomera'
]);
