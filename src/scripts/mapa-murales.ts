/**
 * Página de inicio: marcadores de murales + filtros por año y artista sincronizados con la URL.
 */
import L from 'leaflet';
import { filtrarMurales, type Filtro } from '../domain/murales.ts';
import type { DatosMapa, PuntoMapa } from '../map/datos-cliente.ts';
import { crearMapaIlustrado, iconoMural, pixelALatLng } from './mapa-base.ts';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...hijos: Node[]) {
  const nodo = Object.assign(document.createElement(tag), props);
  nodo.append(...hijos);
  return nodo;
}

function contenidoPopup(punto: PuntoMapa): HTMLElement {
  return el(
    'div',
    { className: 'popup-mural' },
    el('img', { src: punto.portada, alt: punto.titulo, width: 240, height: 160 }),
    el('strong', { textContent: punto.titulo }),
    el('span', { textContent: `${punto.year} · ${punto.nombresArtistas.join(', ')}` }),
    el('span', { className: 'direccion', textContent: punto.direccion }),
    el(
      'span',
      { className: 'enlaces' },
      el('a', { href: `/murales/${punto.slug}/`, textContent: 'Ver mural' }),
      el('a', { href: punto.googleMapsUrl, textContent: 'Abrir en Google Maps', target: '_blank', rel: 'noopener' }),
    ),
  );
}

function leerFiltro(datos: DatosMapa): Filtro {
  const params = new URLSearchParams(location.search);
  const year = Number(params.get('year'));
  const artista = params.get('artista') ?? undefined;
  return {
    year: datos.puntos.some((p) => p.year === year) ? year : undefined,
    artista: datos.puntos.some((p) => artista && p.artistas.includes(artista)) ? artista : undefined,
  };
}

function escribirFiltro(filtro: Filtro) {
  const params = new URLSearchParams();
  if (filtro.year !== undefined) params.set('year', String(filtro.year));
  if (filtro.artista !== undefined) params.set('artista', filtro.artista);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function iniciar(raiz: HTMLElement) {
  const datos: DatosMapa = JSON.parse(raiz.querySelector('script[type="application/json"]')!.textContent!);
  const mapa = crearMapaIlustrado(raiz.querySelector<HTMLElement>('.mapa')!, datos);
  const capa = L.layerGroup().addTo(mapa);
  const marcadores = new Map(
    datos.puntos.map((punto) => [
      punto.slug,
      L.marker(pixelALatLng(punto.pixel), { icon: iconoMural(), title: punto.titulo }).bindPopup(() =>
        contenidoPopup(punto),
      ),
    ]),
  );

  const botonesYear = raiz.querySelectorAll<HTMLButtonElement>('[data-filtro-year]');
  const selectorArtista = raiz.querySelector<HTMLSelectElement>('[data-filtro-artista]')!;
  const botonLimpiar = raiz.querySelector<HTMLButtonElement>('[data-limpiar]')!;
  const contador = raiz.querySelector<HTMLElement>('[data-contador]')!;
  const elementosLista = document.querySelectorAll<HTMLElement>('[data-lista-murales] > li');

  let filtro = leerFiltro(datos);

  function aplicar() {
    const visibles = new Set(filtrarMurales(datos.puntos, filtro).map((p) => p.slug));
    capa.clearLayers();
    for (const [slug, marcador] of marcadores) if (visibles.has(slug)) capa.addLayer(marcador);
    for (const li of elementosLista) li.hidden = !visibles.has(li.dataset.slug!);

    for (const boton of botonesYear) {
      const year = boton.dataset.filtroYear ? Number(boton.dataset.filtroYear) : undefined;
      boton.setAttribute('aria-pressed', String(year === filtro.year));
    }
    selectorArtista.value = filtro.artista ?? '';
    botonLimpiar.hidden = filtro.year === undefined && filtro.artista === undefined;
    contador.textContent = visibles.size === 1 ? '1 mural' : `${visibles.size} murales`;
    escribirFiltro(filtro);
  }

  for (const boton of botonesYear) {
    boton.addEventListener('click', () => {
      filtro = { ...filtro, year: boton.dataset.filtroYear ? Number(boton.dataset.filtroYear) : undefined };
      aplicar();
    });
  }
  selectorArtista.addEventListener('change', () => {
    filtro = { ...filtro, artista: selectorArtista.value || undefined };
    aplicar();
  });
  botonLimpiar.addEventListener('click', () => {
    filtro = {};
    aplicar();
  });

  aplicar();
}

document.querySelectorAll<HTMLElement>('[data-mapa-murales]').forEach(iniciar);
