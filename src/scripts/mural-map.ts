/**
 * Home page: mural markers, detail panel and year and artist filters synced with the URL.
 */
import L from 'leaflet';
import { filterMurals, type Filter } from '../domain/murals.ts';
import type { MapData } from '../map/client-data.ts';
import { createIllustratedMap, pixelToLatLng } from './base-map.ts';
import { createMuralMarker, setActive } from './mural-marker.ts';
import { createMuralPanel } from './mural-panel.ts';

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

  let active: string | null = null;
  const select = (slug: string | null) => {
    if (active) setActive(markers.get(active)!, false);
    active = slug;
    if (active) setActive(markers.get(active)!, true);
  };
  const panel = createMuralPanel(() => select(null));

  const markers = new Map(
    data.points.map((point, i) => {
      const marker = createMuralMarker(point, i, pixelToLatLng(point.pixel));
      marker.on('click', () => {
        select(point.slug);
        panel.open(point);
      });
      return [point.slug, marker];
    }),
  );

  const yearSelect = root.querySelector<HTMLSelectElement>('[data-year-filter]')!;
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
    if (active && !visible.has(active)) panel.close();
    else if (active) setActive(markers.get(active)!, true);

    yearSelect.value = filter.year === undefined ? '' : String(filter.year);
    artistSelect.value = filter.artist ?? '';
    clearButton.hidden = filter.year === undefined && filter.artist === undefined;
    counter.textContent = `${visible.size} ${visible.size === 1 ? 'mural' : 'murales'} en el mapa`;
    writeFilter(filter);
  }

  yearSelect.addEventListener('change', () => {
    filter = { ...filter, year: yearSelect.value ? Number(yearSelect.value) : undefined };
    apply();
  });
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
