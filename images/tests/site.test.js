import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = p => readFile(new URL('../'+p, import.meta.url), 'utf8');
test('ODS: tres tarjetas numeradas del 1 al 3 y vinculadas a los ODS 4, 5 y 10', async()=>{
 const html=await read('index.html');
 assert.match(html,/<b>1<\/b><span>ODS 4/); assert.match(html,/<b>2<\/b><span>ODS 5/); assert.match(html,/<b>3<\/b><span>ODS 10/);
});
test('secciones Conócenos incluyen textos actualizados con propósito', async()=>{
 const html=await read('index.html'); assert.match(html,/ninguna niña debería tener que renunciar a sus sueños/); assert.match(html,/cuando una de nosotras avanza, avanzamos todas/);
});
test('los doce registros administrables y sus tres estados están definidos', async()=>{
 const api=await read('netlify/functions/api.js');
 for(const id of ['jesus-maria','brena','san-miguel','pueblo-libre','cercado-lima','callao','edu','salud','comunidad','escuelas','mujeres','mayores']) assert.ok(api.includes(`id: "${id}"`),`falta ${id}`);
 for(const status of ['available','unavailable','soon']) assert.ok(api.includes(`"${status}"`));
});
test('la edición de textos aplica actualizaciones por campo y conserva los demás', async()=>{
 const api=await read('netlify/functions/api.js'); assert.match(api,/const current = await readJSON\("site\/content"/); assert.match(api,/current\[key\] = sanitizeMarkup\(value\)/);
});
test('el formulario y el mapa siguen conectados al estado compartido', async()=>{
 const js=await read('script.js'); assert.match(js,/fetch\("\/api\/public"/); assert.match(js,/districtSelect/); assert.match(js,/applyOrganizationAvailability\(\)/);
});
