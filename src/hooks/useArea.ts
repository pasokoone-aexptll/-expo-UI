import { useMemo } from 'react';
import { getMapArea } from '@/mocks/map-data';
import type { AreaId } from '@/types';
export function useArea(areaId: AreaId) {
  return useMemo(() => {
    const area = getMapArea(areaId);
    const users = area.zones.flatMap(zone => zone.people.map(person => ({ ...person, electricId: zone.electricId, color: zone.color })));
    return { ...area, users };
  }, [areaId]);
}
