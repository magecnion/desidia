/**
 * Home page: mural markers + year and artist filters synced with the URL.
 */
import L from 'leaflet';
import { filterMurals, type Filter } from '../domain/murals.ts';
import type { MapData, MapPoint } from '../map/client-data.ts';
import { createIllustratedMap, muralIcon, pixelToLatLng } from './base-map.ts';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: Node[]) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function popupContent(point: MapPoint): HTMLElement {
  return el(
    'div',
    { className: 'mural-popup' },
    el('img', { src: point.cover, alt: point.title, width: 240, height: 160 }),
    el('strong', { textContent: point.title }),
    el('span', { textContent: `${point.year} · ${point.artistNames.join(', ')}` }),
    el('span', { className: 'address', textContent: point.address }),
    el(
      'span',
      { className: 'links' },
      el('a', { href: `/murales/${point.slug}/`, textContent: 'Ver mural' }),
      el('a', { href: point.googleMapsUrl, textContent: 'Abrir en Google Maps', target: '_blank', rel: 'noopener' }),
    ),
  );
}

function readFilter(data: MapData): Filter {
  const params = new URLSearchParams(location.search);
  const year = Number(params.get('year'));
  const artist = params.get('artista') ?? undefined;
  return {
    year: data.points.some((p) => p.year === year) ? year : undefined,
    artist: data.points.some((p) => artist && p.artists.includes(artist)) ? artist : undefined,
  };
}

function writeFilter(filter: Filter) {
  const params = new URLSearchParams();
  if (filter.year !== undefined) params.set('year', String(filter.year));
  if (filter.artist !== undefined) params.set('artista', filter.artist);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function init(root: HTMLElement) {
  const data: MapData = JSON.parse(root.querySelector('script[type="application/json"]')!.textContent!);
  const map = createIllustratedMap(root.querySelector<HTMLElement>('.map')!, data);
  const layer = L.layerGroup().addTo(map);
  const markers = new Map(
    data.points.map((point) => [
      point.slug,
      L.marker(pixelToLatLng(point.pixel), { icon: muralIcon(), title: point.title }).bindPopup(() =>
        popupContent(point),
      ),
    ]),
  );

  const yearButtons = root.querySelectorAll<HTMLButtonElement>('[data-year-filter]');
  const artistSelect = root.querySelector<HTMLSelectElement>('[data-artist-filter]')!;
  const clearButton = root.querySelector<HTMLButtonElement>('[data-clear]')!;
  const counter = root.querySelector<HTMLElement>('[data-counter]')!;
  const listItems = document.querySelectorAll<HTMLElement>('[data-mural-list] > li');

  let filter = readFilter(data);

  function apply() {
    const visible = new Set(filterMurals(data.points, filter).map((p) => p.slug));
    layer.clearLayers();
    for (const [slug, marker] of markers) if (visible.has(slug)) layer.addLayer(marker);
    for (const li of listItems) li.hidden = !visible.has(li.dataset.slug!);

    for (const button of yearButtons) {
      const year = button.dataset.yearFilter ? Number(button.dataset.yearFilter) : undefined;
      button.setAttribute('aria-pressed', String(year === filter.year));
    }
    artistSelect.value = filter.artist ?? '';
    clearButton.hidden = filter.year === undefined && filter.artist === undefined;
    counter.textContent = visible.size === 1 ? '1 mural' : `${visible.size} murales`;
    writeFilter(filter);
  }

  for (const button of yearButtons) {
    button.addEventListener('click', () => {
      filter = { ...filter, year: button.dataset.yearFilter ? Number(button.dataset.yearFilter) : undefined };
      apply();
    });
  }
  artistSelect.addEventListener('change', () => {
    filter = { ...filter, artist: artistSelect.value || undefined };
    apply();
  });
  clearButton.addEventListener('click', () => {
    filter = {};
    apply();
  });

  apply();
}

document.querySelectorAll<HTMLElement>('[data-mural-map]').forEach(init);
