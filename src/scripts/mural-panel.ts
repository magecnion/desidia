/**
 * Mural panel behaviour: open/close, focus, Escape and click on the backdrop.
 */
import type { MapPoint } from '../map/client-data.ts';

export interface MuralPanel {
  open(point: MapPoint): void;
  close(): void;
}

export function createMuralPanel(onClose: () => void): MuralPanel {
  const panel = document.querySelector<HTMLElement>('[data-panel]')!;
  const backdrop = document.querySelector<HTMLElement>('[data-panel-backdrop]')!;
  const part = <T extends HTMLElement>(name: string) => panel.querySelector<T>(`[data-panel-${name}]`)!;
  const closeButton = part<HTMLButtonElement>('close');
  let previousFocus: HTMLElement | null = null;
  let isOpen = false;

  function show(visible: boolean) {
    isOpen = visible;
    panel.toggleAttribute('inert', !visible);
    panel.setAttribute('aria-hidden', String(!visible));
    panel.classList.toggle('translate-y-full', !visible);
    panel.classList.toggle('md:translate-x-full', !visible);
    panel.classList.toggle('md:translate-x-0', visible);
    backdrop.classList.toggle('opacity-0', !visible);
    backdrop.classList.toggle('pointer-events-none', !visible);
  }

  function close() {
    if (!isOpen) return;
    show(false);
    previousFocus?.focus();
    onClose();
  }

  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close());

  return {
    open(point) {
      const image = part<HTMLImageElement>('image');
      image.src = point.cover;
      image.alt = point.title;
      part('meta').textContent = `${point.year} · ${point.artistNames.join(', ')}`;
      part('title').textContent = point.title;
      // HTML generated at build time from the content's markdown.
      part('description').innerHTML = point.descriptionHtml;
      part('address').textContent = point.address;
      part<HTMLAnchorElement>('maps').href = point.googleMapsUrl;
      part<HTMLAnchorElement>('link').href = `/murales/${point.slug}/`;
      panel.scrollTop = 0;
      if (!isOpen) previousFocus = document.activeElement as HTMLElement | null;
      show(true);
      closeButton.focus();
    },
    close,
  };
}
