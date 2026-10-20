#!/usr/bin/env node
/*
 * Génère sitemap.xml et robots.txt à partir de js/config.js et data/catalogue.js.
 * À relancer après toute modification du catalogue ou de l'adresse du site :
 *   node tools/build-sitemap.mjs
 * Les pages « noindex » (panier, recherche, 404) n'y figurent pas.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['js/config.js', 'data/catalogue.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}
const cfg = sandbox.window.PIXELPRO_CONFIG;
const catalogue = sandbox.window.PIXELPRO_CATALOGUE;
if (!cfg || !catalogue) throw new Error('config.js ou catalogue.js introuvable ou invalide.');

const base = cfg.shop.url.replace(/\/$/, '');
const pages = ['index.html', 'consoles-ps5.html', 'consoles-ps4.html', 'manettes.html', 'jeux.html',
  'accessoires.html', 'promotions.html', 'a-propos.html', 'contact.html'];
const products = catalogue.products.map((p) => 'produit.html?id=' + encodeURIComponent(p.id));

const today = new Date().toISOString().slice(0, 10);
const loc = (p) => (p === 'index.html' ? base + '/' : base + '/' + p).replace(/&/g, '&amp;');
const urls = [...pages, ...products].map((p) => `  <url><loc>${loc(p)}</loc><lastmod>${today}</lastmod></url>`);

fs.writeFileSync(path.join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n');

// Le panier et la recherche portent « noindex » : on ne les bloque pas ici, sinon Google ne verrait pas la consigne.
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`sitemap.xml : ${pages.length + products.length} adresses (${pages.length} pages, ${products.length} fiches produit)`);
console.log(`robots.txt  : Sitemap: ${base}/sitemap.xml`);
if (/VOTRE-DOMAINE/.test(base)) console.log('Attention : le domaine est encore le texte provisoire. Lancez d\'abord : node tools/set-domain.mjs https://votre-domaine.com');
