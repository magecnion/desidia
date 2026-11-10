/**
 * Projection from real coordinates (lat, lng) → illustration pixel.
 *
 * The illustration is artistic (distorted), so there is no cartographic formula: it uses control
 * points (places whose position is known both in the drawing and in reality) and a thin plate spline
 * transformation, which passes exactly through each point and deforms smoothly between them.
 * Coordinates are first converted to Web Mercator so the transformation works in metres.
 */
import { GeneralGcpTransformer } from '@allmaps/transform';
import { parseCoordinates, type Coordinates } from '../domain/murals.ts';

export type Pixel = [x: number, y: number];

export interface ControlPoint {
  name: string;
  pixel: Pixel;
  coordinates: string;
}

export interface Illustration {
  image: string;
  width: number;
  height: number;
  controlPoints: ControlPoint[];
}

export interface Projection {
  toPixel(coordinates: Coordinates): Pixel;
  contains(coordinates: Coordinates): boolean;
}

const EARTH_RADIUS = 6378137;

function toMercator({ lat, lng }: Coordinates): [number, number] {
  const rad = Math.PI / 180;
  return [EARTH_RADIUS * lng * rad, EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2))];
}

function createTransformer(points: ControlPoint[]) {
  if (points.length < 3) throw new Error('At least 3 control points are needed');
  const gcps = points.map((p) => ({ source: toMercator(parseCoordinates(p.coordinates)), destination: p.pixel }));
  return new GeneralGcpTransformer(gcps, 'thinPlateSpline', { differentHandedness: true });
}

export function createProjection(illustration: Illustration): Projection {
  const transformer = createTransformer(illustration.controlPoints);
  const toPixel = (c: Coordinates): Pixel => {
    const [x, y] = transformer.transformForward(toMercator(c));
    return [x, y];
  };
  return {
    toPixel,
    contains(c) {
      const [x, y] = toPixel(c);
      return x >= 0 && x <= illustration.width && y >= 0 && y <= illustration.height;
    },
  };
}

/**
 * Error of each control point by cross-validation: the transformation is computed without that point and
 * we measure how many pixels away it lands from where it is marked. A very high value usually means a
 * misplaced point.
 */
export function errorPerPoint(illustration: Illustration): { name: string; errorPx: number }[] {
  const points = illustration.controlPoints;
  if (points.length < 4) return points.map((p) => ({ name: p.name, errorPx: Number.NaN }));
  return points.map((point, i) => {
    const rest = createTransformer(points.filter((_, j) => j !== i));
    const [x, y] = rest.transformForward(toMercator(parseCoordinates(point.coordinates)));
    return { name: point.name, errorPx: Math.hypot(x - point.pixel[0], y - point.pixel[1]) };
  });
}
