/**
 * Comportamiento del panel de mural: abrir/cerrar, foco, Escape y clic en el fondo.
 */
import type { PuntoMapa } from '../map/datos-cliente.ts';

export interface PanelMural {
  abrir(punto: PuntoMapa): void;
  cerrar(): void;
}

export function crearPanelMural(alCerrar: () => void): PanelMural {
  const panel = document.querySelector<HTMLElement>('[data-panel]')!;
  const fondo = document.querySelector<HTMLElement>('[data-panel-fondo]')!;
  const parte = <T extends HTMLElement>(nombre: string) => panel.querySelector<T>(`[data-panel-${nombre}]`)!;
  const botonCerrar = parte<HTMLButtonElement>('cerrar');
  let focoAnterior: HTMLElement | null = null;
  let abierto = false;

  function mostrar(visible: boolean) {
    abierto = visible;
    panel.toggleAttribute('inert', !visible);
    panel.setAttribute('aria-hidden', String(!visible));
    panel.classList.toggle('translate-y-full', !visible);
    panel.classList.toggle('md:translate-x-full', !visible);
    panel.classList.toggle('md:translate-x-0', visible);
    fondo.classList.toggle('opacity-0', !visible);
    fondo.classList.toggle('pointer-events-none', !visible);
  }

  function cerrar() {
    if (!abierto) return;
    mostrar(false);
    focoAnterior?.focus();
    alCerrar();
  }

  botonCerrar.addEventListener('click', cerrar);
  fondo.addEventListener('click', cerrar);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && cerrar());

  return {
    abrir(punto) {
      const imagen = parte<HTMLImageElement>('imagen');
      imagen.src = punto.portada;
      imagen.alt = punto.titulo;
      parte('meta').textContent = `${punto.year} · ${punto.nombresArtistas.join(', ')}`;
      parte('titulo').textContent = punto.titulo;
      // HTML generado en el build a partir del markdown del contenido.
      parte('descripcion').innerHTML = punto.descripcionHtml;
      parte('direccion').textContent = punto.direccion;
      parte<HTMLAnchorElement>('maps').href = punto.googleMapsUrl;
      parte<HTMLAnchorElement>('enlace').href = `/murales/${punto.slug}/`;
      panel.scrollTop = 0;
      if (!abierto) focoAnterior = document.activeElement as HTMLElement | null;
      mostrar(true);
      botonCerrar.focus();
    },
    cerrar,
  };
}
