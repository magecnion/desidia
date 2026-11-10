import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProjection, errorPerPoint, type Illustration } from '../src/map/projection.ts';
import { parseCoordinates } from '../src/domain/murals.ts';

// Synthetic distorted illustration: the east half is "stretched" compared to the west half.
const illustration: Illustration = {
  image: '',
  width: 1000,
  height: 1000,
  controlPoints: [
    { name: 'NW', pixel: [0, 0], coordinates: '28.98, -13.58' },
    { name: 'NE', pixel: [1000, 0], coordinates: '28.98, -13.56' },
    { name: 'SW', pixel: [0, 1000], coordinates: '28.96, -13.58' },
    { name: 'SE', pixel: [1000, 1000], coordinates: '28.96, -13.56' },
    { name: 'Centre', pixel: [350, 500], coordinates: '28.97, -13.57' },
  ],
};

test('the projection passes exactly through the control points', () => {
  const projection = createProjection(illustration);
  for (const point of illustration.controlPoints) {
    const [x, y] = projection.toPixel(parseCoordinates(point.coordinates));
    assert.ok(Math.hypot(x - point.pixel[0], y - point.pixel[1]) < 0.01, point.name);
  }
});

test('the projection deforms smoothly between points', () => {
  const projection = createProjection(illustration);
  const [xWest] = projection.toPixel({ lat: 28.97, lng: -13.575 });
  const [xEast] = projection.toPixel({ lat: 28.97, lng: -13.565 });
  assert.ok(xWest > 0 && xWest < 350, `west: ${xWest}`);
  assert.ok(xEast > 350 && xEast < 1000, `east: ${xEast}`);
});

test('contains() tells points inside and outside the illustration apart', () => {
  const projection = createProjection(illustration);
  assert.equal(projection.contains({ lat: 28.97, lng: -13.57 }), true);
  assert.equal(projection.contains({ lat: 28.99, lng: -13.57 }), false);
});

test('errorPerPoint flags a misplaced control point', () => {
  // Consistent 4×4 grid (lng → x, lat → y) plus an interior point marked in the wrong place.
  const grid = [0, 1, 2, 3].flatMap((i) =>
    [0, 1, 2, 3].map((j) => ({
      name: `${i},${j}`,
      pixel: [i * 300 + 50, j * 300 + 50] as [number, number],
      coordinates: `${28.98 - j * 0.006}, ${-13.58 + i * 0.006}`,
    })),
  );
  const withError: Illustration = {
    ...illustration,
    controlPoints: [...grid, { name: 'Wrong', pixel: [800, 300], coordinates: '28.971, -13.571' }],
  };
  const errors = errorPerPoint(withError);
  const worst = errors.reduce((a, b) => (b.errorPx > a.errorPx ? b : a));
  assert.equal(worst.name, 'Wrong');
});
