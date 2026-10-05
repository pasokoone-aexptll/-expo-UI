import { useMemo } from 'react';
import { getMapArea } from '@/mocks/map-data';
import type { AreaId } from '@/types';
export function useArea(areaId: AreaId) {
  return useMemo(() => getMapArea(areaId), [areaId]);
}
