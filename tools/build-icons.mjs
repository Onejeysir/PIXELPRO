// Génère js/icons.js : un sprite SVG unique injecté dans la page.
//
// Sources (licences permissives, aucune icône dessinée à la main) :
//   - Lucide (ISC)         : icônes d'interface, tracé 24x24 au trait
//   - Simple Icons (CC0)   : logos de marques (WhatsApp, réseaux sociaux)
//
// Usage :  npm install --no-save lucide-static simple-icons
//          node tools/build-icons.mjs
//
// Pour ajouter une icône : ajouter son nom dans LUCIDE ou BRANDS, relancer, puis
// l'utiliser avec PP.icon('nom') côté JavaScript ou <svg class="icon"><use href="#i-nom"/></svg>.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lucideDir = join(root, 'node_modules', 'lucide-static', 'icons');
const brandDir = join(root, 'node_modules', 'simple-icons', 'icons');

const LUCIDE = [
  'menu', 'x', 'search', 'shopping-bag', 'plus', 'minus', 'trash-2',
  'chevron-right', 'chevron-left', 'phone', 'map-pin', 'clock', 'mail',
  'check', 'info', 'sliders-horizontal',
];
const BRANDS = ['whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube'];

const inner = (svg) => svg.replace(/<!--.*?-->/gs, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/g, '').replace(/\s+/g, ' ').trim();

const symbols = [
  ...LUCIDE.map((n) => `<symbol id="i-${n}" viewBox="0 0 24 24">${inner(readFileSync(join(lucideDir, `${n}.svg`), 'utf8'))}</symbol>`),
  ...BRANDS.map((n) => `<symbol id="i-${n}" viewBox="0 0 24 24">${inner(readFileSync(join(brandDir, `${n}.svg`), 'utf8'))}</symbol>`),
];

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute">${symbols.join('')}</svg>`;

const out = `/* Fichier généré par tools/build-icons.mjs, ne pas modifier à la main. */
window.PP_ICONS_SPRITE = ${JSON.stringify(sprite)};
window.PP_BRAND_ICONS = ${JSON.stringify(BRANDS)};
`;
writeFileSync(new URL('../js/icons.js', import.meta.url), out);
console.log(`js/icons.js : ${LUCIDE.length} icônes Lucide + ${BRANDS.length} logos (${out.length} octets)`);
