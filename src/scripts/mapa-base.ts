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
    maxBounds: limites.pad(0.1),
    maxBoundsViscosity: 1,
    zoomSnap: 0,
    zoomDelta: 0.5,
    // Por defecto Leaflet no baja de zoom 0 (1 px de imagen = 1 px de pantalla); para que quepa la
    // ilustración entera hace falta permitir zoom negativo. Tras encajarla se fija el mínimo real.
    minZoom: -5,
    attributionControl: false,
  });
  L.imageOverlay(ilustracion.imagen, limites).addTo(mapa);
  mapa.fitBounds(limites);
  mapa.setMinZoom(mapa.getZoom());
  mapa.setMaxZoom(mapa.getZoom() + 3);
  return mapa;
}

export function iconoMural(): L.DivIcon {
  return L.divIcon({ className: 'marcador-mural', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
}
