#!/usr/bin/env node
/*
 * Remplace l'adresse du site (canonical, Open Graph, données structurées, sitemap, robots.txt).
 *   node tools/set-domain.mjs https://www.mon-domaine.com
 * L'adresse actuelle est lue dans js/config.js (shop.url). Option --dry-run : affiche sans modifier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const target = (args.find((a) => !a.startsWith('--')) || '').replace(/\/+$/, '');

if (!/^https?:\/\/[^\s/]+\.[^\s/]+$/.test(target)) {
  console.error('Usage : node tools/set-domain.mjs https://votre-domaine.com [--dry-run]');
  process.exit(1);
}

const configPath = path.join(root, 'js/config.js');
const current = (fs.readFileSync(configPath, 'utf8').match(/url:\s*'([^']+)'/) || [])[1];
if (!current) { console.error('shop.url introuvable dans js/config.js'); process.exit(1); }
if (current === target) { console.log('Le site utilise déjà cette adresse : ' + target); process.exit(0); }

const files = fs.readdirSync(root).filter((f) => /\.(html|xml|txt)$/.test(f)).concat(['js/config.js']);
let total = 0;
for (const f of files) {
  const file = path.join(root, f);
  const text = fs.readFileSync(file, 'utf8');
  const count = text.split(current).length - 1;
  if (!count) continue;
  total += count;
  console.log(`${f} : ${count} occurrence(s)`);
  if (!dry) fs.writeFileSync(file, text.split(current).join(target));
}
console.log(`${current} -> ${target} (${total} remplacement(s))${dry ? ' [simulation, rien n\'a été modifié]' : ''}`);
if (!dry) spawnSync(process.execPath, [path.join(root, 'tools/build-sitemap.mjs')], { stdio: 'inherit' });
