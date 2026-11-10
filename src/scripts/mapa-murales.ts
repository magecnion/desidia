/**
 * Página de inicio: marcadores de murales, panel de detalle y filtros por año y artista sincronizados
 * con la URL.
 */
import L from 'leaflet';
import { filtrarMurales, type Filtro } from '../domain/murales.ts';
import type { DatosMapa } from '../map/datos-cliente.ts';
import { crearMapaIlustrado, pixelALatLng } from './mapa-base.ts';
import { crearMarcadorMural, marcarActivo } from './marcador-mural.ts';
import { crearPanelMural } from './panel-mural.ts';

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

  let activo: string | null = null;
  const seleccionar = (slug: string | null) => {
    if (activo) marcarActivo(marcadores.get(activo)!, false);
    activo = slug;
    if (activo) marcarActivo(marcadores.get(activo)!, true);
  };
  const panel = crearPanelMural(() => seleccionar(null));

  const marcadores = new Map(
    datos.puntos.map((punto, i) => {
      const marcador = crearMarcadorMural(punto, i, pixelALatLng(punto.pixel));
      marcador.on('click', () => {
        seleccionar(punto.slug);
        panel.abrir(punto);
      });
      return [punto.slug, marcador];
    }),
  );

  const selectorYear = raiz.querySelector<HTMLSelectElement>('[data-filtro-year]')!;
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
    if (activo && !visibles.has(activo)) panel.cerrar();
    else if (activo) marcarActivo(marcadores.get(activo)!, true);

    selectorYear.value = filtro.year === undefined ? '' : String(filtro.year);
    selectorArtista.value = filtro.artista ?? '';
    botonLimpiar.hidden = filtro.year === undefined && filtro.artista === undefined;
    contador.textContent = `${visibles.size} ${visibles.size === 1 ? 'mural' : 'murales'} en el mapa`;
    escribirFiltro(filtro);
  }

  selectorYear.addEventListener('change', () => {
    filtro = { ...filtro, year: selectorYear.value ? Number(selectorYear.value) : undefined };
    aplicar();
  });
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
