/**
 * Leaflet map over the illustration, in pixel coordinates (L.CRS.Simple).
 * All the Leaflet dependency lives here and in the modules that use it; to move from a single image to
 * tiles you only need to change the layer in `createIllustratedMap`.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';

export interface IllustrationConfig {
  image: string;
  width: number;
  height: number;
}

/** In CRS.Simple, lat = -y and lng = x (the image y axis grows downwards). */
export function pixelToLatLng([x, y]: [number, number]): L.LatLng {
  return L.latLng(-y, x);
}

export function latLngToPixel(latlng: L.LatLng): [number, number] {
  return [Math.round(latlng.lng), Math.round(-latlng.lat)];
}

export function createIllustratedMap(container: HTMLElement, illustration: IllustrationConfig): L.Map {
  const bounds = L.latLngBounds(pixelToLatLng([0, illustration.height]), pixelToLatLng([illustration.width, 0]));
  const map = L.map(container, {
    crs: L.CRS.Simple,
    maxBounds: bounds.pad(0.1),
    maxBoundsViscosity: 1,
    zoomSnap: 0,
    zoomDelta: 0.5,
    // By default Leaflet does not go below zoom 0 (1 image px = 1 screen px); to fit the whole
    // illustration negative zoom must be allowed. The real minimum is set after fitting it.
    minZoom: -5,
    attributionControl: false,
  });
  L.imageOverlay(illustration.image, bounds).addTo(map);
  map.fitBounds(bounds);
  map.setMinZoom(map.getZoom());
  map.setMaxZoom(map.getZoom() + 3);
  return map;
}

export function muralIcon(): L.DivIcon {
  return L.divIcon({ className: 'mural-marker', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
}
