import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearProyeccion, errorPorPunto, type Ilustracion } from '../src/map/proyeccion.ts';
import { parseCoordenadas } from '../src/domain/murales.ts';

// Ilustración sintética deformada: la mitad este está "estirada" respecto a la oeste.
const ilustracion: Ilustracion = {
  imagen: '',
  ancho: 1000,
  alto: 1000,
  puntosControl: [
    { nombre: 'NO', pixel: [0, 0], coordenadas: '28.98, -13.58' },
    { nombre: 'NE', pixel: [1000, 0], coordenadas: '28.98, -13.56' },
    { nombre: 'SO', pixel: [0, 1000], coordenadas: '28.96, -13.58' },
    { nombre: 'SE', pixel: [1000, 1000], coordenadas: '28.96, -13.56' },
    { nombre: 'Centro', pixel: [350, 500], coordenadas: '28.97, -13.57' },
  ],
};

test('la proyección pasa exactamente por los puntos de control', () => {
  const proyeccion = crearProyeccion(ilustracion);
  for (const punto of ilustracion.puntosControl) {
    const [x, y] = proyeccion.aPixel(parseCoordenadas(punto.coordenadas));
    assert.ok(Math.hypot(x - punto.pixel[0], y - punto.pixel[1]) < 0.01, punto.nombre);
  }
});

test('la proyección deforma de forma suave entre puntos', () => {
  const proyeccion = crearProyeccion(ilustracion);
  const [xOeste] = proyeccion.aPixel({ lat: 28.97, lng: -13.575 });
  const [xEste] = proyeccion.aPixel({ lat: 28.97, lng: -13.565 });
  assert.ok(xOeste > 0 && xOeste < 350, `oeste: ${xOeste}`);
  assert.ok(xEste > 350 && xEste < 1000, `este: ${xEste}`);
});

test('dentro() distingue puntos dentro y fuera de la ilustración', () => {
  const proyeccion = crearProyeccion(ilustracion);
  assert.equal(proyeccion.dentro({ lat: 28.97, lng: -13.57 }), true);
  assert.equal(proyeccion.dentro({ lat: 28.99, lng: -13.57 }), false);
});

test('errorPorPunto señala un punto de control mal colocado', () => {
  // Malla 4×4 coherente (lng → x, lat → y) más un punto interior marcado en un sitio equivocado.
  const malla = [0, 1, 2, 3].flatMap((i) =>
    [0, 1, 2, 3].map((j) => ({
      nombre: `${i},${j}`,
      pixel: [i * 300 + 50, j * 300 + 50] as [number, number],
      coordenadas: `${28.98 - j * 0.006}, ${-13.58 + i * 0.006}`,
    })),
  );
  const conError: Ilustracion = {
    ...ilustracion,
    puntosControl: [...malla, { nombre: 'Mal', pixel: [800, 300], coordenadas: '28.971, -13.571' }],
  };
  const errores = errorPorPunto(conError);
  const peor = errores.reduce((a, b) => (b.errorPx > a.errorPx ? b : a));
  assert.equal(peor.nombre, 'Mal');
});
