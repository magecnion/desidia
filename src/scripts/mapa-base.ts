/**
 * Mapa Leaflet sobre la ilustración, en coordenadas de píxel (L.CRS.Simple).
 * Toda la dependencia de Leaflet está aquí y en los módulos que la usan; para pasar de imagen única a
 * teselas solo hay que cambiar la capa en `crearMapaIlustrado`.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/mapa.css';

export interface ConfigIlustracion {
  imagen: string;
  ancho: number;
  alto: number;
}

/** En CRS.Simple, lat = -y y lng = x (el eje y de la imagen crece hacia abajo). */
export function pixelALatLng([x, y]: [number, number]): L.LatLng {
  return L.latLng(-y, x);
}

export function latLngAPixel(latlng: L.LatLng): [number, number] {
  return [Math.round(latlng.lng), Math.round(-latlng.lat)];
}

export function crearMapaIlustrado(contenedor: HTMLElement, ilustracion: ConfigIlustracion): L.Map {
  const limites = L.latLngBounds(pixelALatLng([0, ilustracion.alto]), pixelALatLng([ilustracion.ancho, 0]));
  const mapa = L.map(contenedor, {
    crs: L.CRS.Simple,
    // Un poco de margen para que los marcadores y popups junto al borde quepan al desplazarse.
    maxBounds: limites.pad(0.15),
    maxBoundsViscosity: 1,
    zoomSnap: 0,
    zoomDelta: 0.5,
    // Por defecto Leaflet no baja de zoom 0 (1 px de imagen = 1 px de pantalla); la ilustración suele
    // ser mayor que la pantalla, así que hace falta zoom negativo. El mínimo real se fija abajo.
    minZoom: -5,
    attributionControl: false,
  });
  L.imageOverlay(ilustracion.imagen, limites).addTo(mapa);

  // Zoom con el que la ilustración cubre todo el contenedor. En escritorio el contenedor tiene la misma
  // proporción que la imagen y equivale a verla entera; en móvil (contenedor más alto) se recorre arrastrando.
  const zoomCubrir = () => {
    const { x, y } = mapa.getSize();
    return Math.log2(Math.max(x / ilustracion.ancho, y / ilustracion.alto));
  };
  const ajustarZoomMinimo = () => {
    const minimo = zoomCubrir();
    mapa.setMinZoom(minimo);
    mapa.setMaxZoom(minimo + 3);
  };
  ajustarZoomMinimo();
  mapa.setView(limites.getCenter(), zoomCubrir());
  mapa.on('resize', ajustarZoomMinimo);
  return mapa;
}

/** Punto simple (herramienta de calibración). */
export function iconoPunto(): L.DivIcon {
  return L.divIcon({ className: 'marcador-punto', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
}
