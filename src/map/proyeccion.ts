/**
 * Proyección coordenadas reales (lat, lng) → píxel de la ilustración.
 *
 * La ilustración es artística (deformada), así que no hay una fórmula cartográfica: se usan puntos de
 * control (lugares cuya posición se conoce en el dibujo y en la realidad) y una transformación
 * thin plate spline, que pasa exactamente por cada punto y deforma de forma suave entre ellos.
 * Las coordenadas se pasan antes a Web Mercator para que la transformación trabaje en metros.
 */
import { GeneralGcpTransformer } from '@allmaps/transform';
import { parseCoordenadas, type Coordenadas } from '../domain/murales.ts';

export type Pixel = [x: number, y: number];

export interface PuntoControl {
  nombre: string;
  pixel: Pixel;
  coordenadas: string;
}

export interface Ilustracion {
  imagen: string;
  ancho: number;
  alto: number;
  puntosControl: PuntoControl[];
}

export interface Proyeccion {
  aPixel(coordenadas: Coordenadas): Pixel;
  dentro(coordenadas: Coordenadas): boolean;
}

const RADIO_TIERRA = 6378137;

function aMercator({ lat, lng }: Coordenadas): [number, number] {
  const rad = Math.PI / 180;
  return [RADIO_TIERRA * lng * rad, RADIO_TIERRA * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2))];
}

function crearTransformador(puntos: PuntoControl[]) {
  if (puntos.length < 3) throw new Error('Se necesitan al menos 3 puntos de control');
  const gcps = puntos.map((p) => ({ source: aMercator(parseCoordenadas(p.coordenadas)), destination: p.pixel }));
  return new GeneralGcpTransformer(gcps, 'thinPlateSpline', { differentHandedness: true });
}

export function crearProyeccion(ilustracion: Ilustracion): Proyeccion {
  const transformador = crearTransformador(ilustracion.puntosControl);
  const aPixel = (c: Coordenadas): Pixel => {
    const [x, y] = transformador.transformForward(aMercator(c));
    return [x, y];
  };
  return {
    aPixel,
    dentro(c) {
      const [x, y] = aPixel(c);
      return x >= 0 && x <= ilustracion.ancho && y >= 0 && y <= ilustracion.alto;
    },
  };
}

/**
 * Error de cada punto de control por validación cruzada: se calcula la transformación sin ese punto y se
 * mide a cuántos píxeles queda de donde está marcado. Un valor muy alto suele indicar un punto mal puesto.
 */
export function errorPorPunto(ilustracion: Ilustracion): { nombre: string; errorPx: number }[] {
  const puntos = ilustracion.puntosControl;
  if (puntos.length < 4) return puntos.map((p) => ({ nombre: p.nombre, errorPx: Number.NaN }));
  return puntos.map((punto, i) => {
    const resto = crearTransformador(puntos.filter((_, j) => j !== i));
    const [x, y] = resto.transformForward(aMercator(parseCoordenadas(punto.coordenadas)));
    return { nombre: punto.nombre, errorPx: Math.hypot(x - punto.pixel[0], y - punto.pixel[1]) };
  });
}
