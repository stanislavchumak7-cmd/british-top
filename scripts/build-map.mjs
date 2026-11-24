/* Генерує js/europe-data.js — схематичну карту Європи (SVG-контури країн) з Natural Earth.
   Запуск: npm run build:map   (потрібні devDependencies; сам сайт їх не використовує) */
import { readFileSync, writeFileSync } from 'node:fs';
import { geoConicConformal, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const countries = feature(topo, topo.objects.countries).features;

const W = 1600, H = 1000;
const projection = geoConicConformal().rotate([-12, 0]).center([0, 52]).parallels([40, 62]);

/* підганяємо масштаб під потрібний шмат Європи */
const pts = [];
for (let lon = -14; lon <= 38; lon += 2) for (const lat of [36, 66]) pts.push([lon, lat]);
for (let lat = 36; lat <= 66; lat += 2) for (const lon of [-14, 38]) pts.push([lon, lat]);
const frame = { type: 'MultiPoint', coordinates: pts };
projection.fitExtent([[30, 30], [W - 30, H - 30]], frame);
projection.clipExtent([[0, 0], [W, H]]);

const path = geoPath(projection).digits(1);

const out = [];
let uk = null;
for (const f of countries) {
  const d = path(f);
  if (!d) continue;
  const name = f.properties.name;
  out.push({ n: name, d });
  if (name === 'United Kingdom') {
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    uk = { x0, y0, x1, y1 };
  }
}
if (!uk) throw new Error('United Kingdom not found');

/* міста, де «живуть» гурти зі списку (lon, lat) */
const CITIES = { london: [-0.12, 51.5], liverpool: [-2.99, 53.41], oxford: [-1.26, 51.75], birmingham: [-1.8904, 52.4862] };
const cities = {};
for (const k in CITIES) cities[k] = projection(CITIES[k]);
const data = { w: W, h: H, countries: out, uk, cities };

writeFileSync('js/europe-data.js',
  '/* Згенеровано scripts/build-map.mjs — не редагувати руками */\nwindow.EUROPE_MAP = ' + JSON.stringify(data) + ';\n');
console.log('countries:', out.length, 'uk bounds:', uk, 'cities:', cities);
