import { PROVINCE_PATHS_BATCH_1, ProvincePathItem } from './provincePaths1';
import { PROVINCE_PATHS_BATCH_2 } from './provincePaths2';
import { PROVINCE_PATHS_BATCH_3 } from './provincePaths3';
import { PROVINCE_PATHS_BATCH_4 } from './provincePaths4';

export { type ProvincePathItem } from './provincePaths1';

export const ALL_PROVINCE_PATHS: ProvincePathItem[] = [
  ...PROVINCE_PATHS_BATCH_1,
  ...PROVINCE_PATHS_BATCH_2,
  ...PROVINCE_PATHS_BATCH_3,
  ...PROVINCE_PATHS_BATCH_4
];

// Map of province ID -> array of path indices for rapid O(1) lookups
export const PATH_INDICES_BY_CONGRESO: Record<string, number[]> = {};
export const PATH_INDICES_BY_SENADO: Record<string, number[]> = {};

ALL_PROVINCE_PATHS.forEach((item, index) => {
  if (!PATH_INDICES_BY_CONGRESO[item.p]) {
    PATH_INDICES_BY_CONGRESO[item.p] = [];
  }
  PATH_INDICES_BY_CONGRESO[item.p].push(index);

  if (!PATH_INDICES_BY_SENADO[item.s]) {
    PATH_INDICES_BY_SENADO[item.s] = [];
  }
  PATH_INDICES_BY_SENADO[item.s].push(index);
});
