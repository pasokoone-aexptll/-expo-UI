import { router } from 'expo-router';
import { MapScene } from '@/features/map-scene';
export default function MapScreen() {
  return <MapScene onBack={() => router.back()} />;
}
