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
    // Some margin so markers and popups next to the edge fit when panning.
    maxBounds: bounds.pad(0.15),
    maxBoundsViscosity: 1,
    zoomSnap: 0,
    zoomDelta: 0.5,
    // By default Leaflet does not go below zoom 0 (1 image px = 1 screen px); the illustration is usually
    // larger than the screen, so negative zoom is needed. The real minimum is set below.
    minZoom: -5,
    attributionControl: false,
  });
  L.imageOverlay(illustration.image, bounds).addTo(map);

  // Zoom at which the illustration covers the whole container. On desktop the container has the same
  // aspect ratio as the image, so it shows it whole; on mobile (taller container) you pan by dragging.
  const coverZoom = () => {
    const { x, y } = map.getSize();
    return Math.log2(Math.max(x / illustration.width, y / illustration.height));
  };
  const updateMinZoom = () => {
    const min = coverZoom();
    map.setMinZoom(min);
    map.setMaxZoom(min + 3);
  };
  updateMinZoom();
  map.setView(bounds.getCenter(), coverZoom());
  map.on('resize', updateMinZoom);
  return map;
}

/** Plain point (calibration tool). */
export function pointIcon(): L.DivIcon {
  return L.divIcon({ className: 'point-marker', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
}
