/**
 * Marcador de mural (adaptado de MuralMarker del prototipo): fragmento de la foto recortado en un
 * cuadrilátero irregular, número y, al pasar el ratón / enfocar / seleccionar, un círculo a mano que se
 * "dibuja" (utilidad `sketch-draw` del tema) y el título manuscrito debajo.
 *
 * El elemento raíz lo crea Leaflet (accesible con teclado y rol de botón); dentro todo es decorativo.
 */
import L from 'leaflet';
import type { PuntoMapa } from '../map/datos-cliente.ts';

const RECORTES = ['polygon(0 6%, 88% 0, 96% 92%, 8% 100%)', 'polygon(6% 10%, 92% 2%, 100% 84%, 14% 98%)'];

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function iconoMarcadorMural(punto: PuntoMapa, indice: number): L.DivIcon {
  const html = `
    <span class="absolute block -translate-x-1/2 -translate-y-1/2">
      <span class="relative block h-14 w-14 transition-transform duration-500 ease-out group-hover:scale-125 group-focus-visible:scale-125 group-aria-pressed:scale-125 sm:h-20 sm:w-20 md:h-24 md:w-24">
        <img src="${escapar(punto.portada)}" alt="" loading="lazy" width="96" height="96"
          class="h-full w-full object-cover shadow-[3px_4px_0_var(--ink)]"
          style="clip-path: ${RECORTES[indice % 2]}" />
        <svg viewBox="0 0 100 100" aria-hidden="true"
          class="pointer-events-none absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] overflow-visible">
          <path d="M12 18 C30 4 72 2 90 16 C102 34 98 72 86 88 C66 100 26 98 10 84 C-2 64 0 34 14 14"
            fill="none" stroke-width="2.2" stroke-linecap="round"
            class="sketch-draw stroke-ink group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] group-aria-pressed:[stroke-dashoffset:0]" />
        </svg>
      </span>
      <span class="font-hand pointer-events-none absolute top-full left-1/2 mt-3 -translate-x-1/2 -rotate-2 whitespace-nowrap bg-paper px-2 text-lg leading-tight text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-xl">${escapar(punto.titulo)}</span>
      <span class="font-display absolute -top-2 -right-1 text-lg text-ink" aria-hidden="true">${indice + 1}</span>
    </span>`;
  // Sin iconSize: el tamaño lo da el CSS (cambia por breakpoint) y el contenido se centra con translate.
  return L.divIcon({ className: 'marcador-mural group', html, iconSize: undefined });
}

export function crearMarcadorMural(punto: PuntoMapa, indice: number, latlng: L.LatLng): L.Marker {
  const marcador = L.marker(latlng, { icon: iconoMarcadorMural(punto, indice), riseOnHover: true });
  marcador.on('add', () => {
    const elemento = marcador.getElement()!;
    elemento.setAttribute('aria-label', `${punto.titulo}, ${punto.year}. Ver mural`);
    elemento.setAttribute('aria-pressed', 'false');
    // Leaflet le da rol de botón pero no lo activa con el teclado: Enter / Espacio equivalen a un clic.
    elemento.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      marcador.fire('click');
    });
  });
  return marcador;
}

export function marcarActivo(marcador: L.Marker, activo: boolean) {
  marcador.getElement()?.setAttribute('aria-pressed', String(activo));
  marcador.setZIndexOffset(activo ? 1000 : 0);
}
