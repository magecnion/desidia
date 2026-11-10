/**
 * Mural marker (adapted from the prototype's MuralMarker): a fragment of the photo clipped into an
 * irregular quadrilateral, a number and, on hover / focus / selection, a hand-drawn circle that gets
 * "drawn" (the theme's `sketch-draw` utility) with the handwritten title below.
 *
 * The root element is created by Leaflet (keyboard accessible, with button role); everything inside is decorative.
 */
import L from 'leaflet';
import type { MapPoint } from '../map/client-data.ts';

const CLIP_PATHS = ['polygon(0 6%, 88% 0, 96% 92%, 8% 100%)', 'polygon(6% 10%, 92% 2%, 100% 84%, 14% 98%)'];

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function muralMarkerIcon(point: MapPoint, index: number): L.DivIcon {
  const html = `
    <span class="absolute block -translate-x-1/2 -translate-y-1/2">
      <span class="relative block h-14 w-14 transition-transform duration-500 ease-out group-hover:scale-125 group-focus-visible:scale-125 group-aria-pressed:scale-125 sm:h-20 sm:w-20 md:h-24 md:w-24">
        <img src="${escapeHtml(point.cover)}" alt="" loading="lazy" width="96" height="96"
          class="h-full w-full object-cover shadow-[3px_4px_0_var(--ink)]"
          style="clip-path: ${CLIP_PATHS[index % 2]}" />
        <svg viewBox="0 0 100 100" aria-hidden="true"
          class="pointer-events-none absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] overflow-visible">
          <path d="M12 18 C30 4 72 2 90 16 C102 34 98 72 86 88 C66 100 26 98 10 84 C-2 64 0 34 14 14"
            fill="none" stroke-width="2.2" stroke-linecap="round"
            class="sketch-draw stroke-ink group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] group-aria-pressed:[stroke-dashoffset:0]" />
        </svg>
      </span>
      <span class="font-hand pointer-events-none absolute top-full left-1/2 mt-3 -translate-x-1/2 -rotate-2 whitespace-nowrap bg-paper px-2 text-lg leading-tight text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-xl">${escapeHtml(point.title)}</span>
      <span class="font-display absolute -top-2 -right-1 text-lg text-ink" aria-hidden="true">${index + 1}</span>
    </span>`;
  // No iconSize: the size comes from CSS (it changes per breakpoint) and the content is centred with translate.
  return L.divIcon({ className: 'mural-marker group', html, iconSize: undefined });
}

export function createMuralMarker(point: MapPoint, index: number, latlng: L.LatLng): L.Marker {
  const marker = L.marker(latlng, { icon: muralMarkerIcon(point, index), riseOnHover: true });
  marker.on('add', () => {
    const element = marker.getElement()!;
    element.setAttribute('aria-label', `${point.title}, ${point.year}. Ver mural`);
    element.setAttribute('aria-pressed', 'false');
    // Leaflet gives it a button role but does not activate it from the keyboard: Enter / Space act as a click.
    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      marker.fire('click');
    });
  });
  return marker;
}

export function setActive(marker: L.Marker, active: boolean) {
  marker.getElement()?.setAttribute('aria-pressed', String(active));
  marker.setZIndexOffset(active ? 1000 : 0);
}
