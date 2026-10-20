/*
 * PIXEL PRO — noyau : outils, catalogue, sélection (panier), messages WhatsApp.
 * Aucune dépendance. Expose un seul objet global : window.PP.
 * Ce fichier ne touche pas à l'affichage (voir ui.js).
 */
(function () {
  'use strict';

  var CFG = window.PIXELPRO_CONFIG;
  var DATA = window.PIXELPRO_CATALOGUE;
  if (!CFG || !DATA) {
    console.error('[PIXEL PRO] config.js ou data/catalogue.js introuvable.');
    return;
  }

  var PP = (window.PP = { cfg: CFG });
  var NBSP = ' ';

  /* ------------------------------------------------------------------ Outils */

  PP.esc = function (value) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return map[c]; });
  };

  function group(n, sep) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }
  /** 385000 -> « 385 000 FCFA » (espaces insécables : le prix ne se coupe jamais en fin de ligne). */
  PP.price = function (n) { return group(n, NBSP) + NBSP + CFG.currency.label; };
  PP.amount = function (n) { return group(n, NBSP); };
  /** Même chose pour les messages texte (WhatsApp), avec de simples espaces. */
  PP.priceText = function (n) { return group(n, ' ') + ' ' + CFG.currency.label; };

  PP.normalize = function (s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  PP.qs = function (sel, root) { return (root || document).querySelector(sel); };
  PP.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var memory = {};
  PP.store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
      }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { memory[key] = value; }
    },
  };

  /* --------------------------------------------------------------- Catalogue */

  PP.categories = DATA.categories;
  PP.products = DATA.products;

  var byId = {};
  PP.products.forEach(function (p) { byId[p.id] = p; });

  PP.getProduct = function (id) { return Object.prototype.hasOwnProperty.call(byId, id) ? byId[id] : null; };
  PP.getCategory = function (id) {
    for (var i = 0; i < PP.categories.length; i++) if (PP.categories[i].id === id) return PP.categories[i];
    return null;
  };
  PP.productsIn = function (categoryId) {
    return PP.products.filter(function (p) { return p.category === categoryId; });
  };
  PP.productUrl = function (p) { return 'produit.html?id=' + encodeURIComponent(p.id); };
  PP.savings = function (p) { return p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0; };
  PP.minPrice = function (list) {
    return list.reduce(function (min, p) { return p.price < min ? p.price : min; }, Infinity);
  };
  /** Valeurs d'un attribut, toujours sous forme de liste (la plateforme d'un jeu peut en avoir deux). */
  PP.attrValues = function (p, key) {
    var v = p.attrs ? p.attrs[key] : undefined;
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  };

  /**
   * Disponibilité affichée. En mode démonstration, aucune disponibilité n'est affirmée.
   * canOrder : le client peut demander le produit sur WhatsApp. canAdd : il peut l'ajouter à la sélection.
   */
  PP.availability = function (p) {
    if (CFG.demo && CFG.demo.enabled) {
      return { key: 'check', label: 'Disponibilité à confirmer', canAdd: true };
    }
    if (p.availability === 'epuise') return { key: 'out', label: 'Épuisé', canAdd: false };
    if (p.availability === 'sur-commande') return { key: 'order', label: 'Sur commande', canAdd: true };
    return { key: 'ok', label: 'Disponible', canAdd: true };
  };

  /** Produits proches d'un produit : même catégorie, mêmes caractéristiques, prix voisin. */
  PP.related = function (p, count) {
    var keys = ['etat', 'plateforme', 'genre', 'type', 'modele', 'contenu'];
    return PP.products
      .filter(function (q) { return q.id !== p.id && q.category === p.category && !(p.family && q.family === p.family); })
      .map(function (q) {
        var score = 0;
        keys.forEach(function (k) {
          var a = PP.attrValues(p, k), b = PP.attrValues(q, k);
          if (a.some(function (x) { return b.indexOf(x) !== -1; })) score += 2;
        });
        score -= Math.abs(q.price - p.price) / Math.max(p.price, 1);
        return { p: q, score: score };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, count)
      .map(function (x) { return x.p; });
  };

  /** Recherche plein texte tolérante aux accents. Chaque mot saisi doit être trouvé. */
  PP.search = function (query) {
    var terms = PP.normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return PP.products
      .map(function (p) {
        var cat = PP.getCategory(p.category);
        var name = PP.normalize(p.name);
        var rest = PP.normalize([p.ref, cat ? cat.label : '', p.summary, Object.keys(p.attrs || {}).map(function (k) { return PP.attrValues(p, k).join(' '); }).join(' ')].join(' '));
        var score = 0;
        for (var i = 0; i < terms.length; i++) {
          if (name.indexOf(terms[i]) !== -1) score += 3;
          else if (rest.indexOf(terms[i]) !== -1) score += 1;
          else return null;
        }
        return { p: p, score: score };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (x) { return x.p; });
  };

  /* --------------------------------------------- Sélection (panier, localStorage) */

  var CART_KEY = 'pixelpro.selection.v1';
  var MAX_QTY = 20;

  function clampQty(q) {
    q = parseInt(q, 10);
    if (!isFinite(q) || q < 1) return 1;
    return q > MAX_QTY ? MAX_QTY : q;
  }
  function readCart() {
    var raw = PP.store.get(CART_KEY, []);
    if (!Array.isArray(raw)) return [];
    // Le panier ne garde que l'identifiant et la quantité : les prix viennent toujours du catalogue.
    return raw
      .filter(function (l) { return l && typeof l.id === 'string' && PP.getProduct(l.id); })
      .map(function (l) { return { id: l.id, qty: clampQty(l.qty) }; });
  }
  function writeCart(lines) {
    PP.store.set(CART_KEY, lines);
    window.dispatchEvent(new CustomEvent('pp:cart'));
  }

  PP.maxQty = MAX_QTY;
  PP.cart = {
    lines: function () {
      return readCart().map(function (l) {
        var p = PP.getProduct(l.id);
        return { product: p, qty: l.qty, total: p.price * l.qty };
      });
    },
    count: function () { return readCart().reduce(function (n, l) { return n + l.qty; }, 0); },
    total: function () {
      return PP.cart.lines().reduce(function (sum, l) { return sum + l.total; }, 0);
    },
    add: function (id, qty) {
      var p = PP.getProduct(id);
      if (!p) return false;
      var lines = readCart();
      var found = lines.filter(function (l) { return l.id === id; })[0];
      if (found) found.qty = clampQty(found.qty + clampQty(qty || 1));
      else lines.push({ id: id, qty: clampQty(qty || 1) });
      writeCart(lines);
      return true;
    },
    setQty: function (id, qty) {
      var lines = readCart();
      lines.forEach(function (l) { if (l.id === id) l.qty = clampQty(qty); });
      writeCart(lines);
    },
    remove: function (id) {
      writeCart(readCart().filter(function (l) { return l.id !== id; }));
    },
    clear: function () { writeCart([]); },
  };
  // Un autre onglet a modifié la sélection : on prévient cet onglet aussi.
  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) window.dispatchEvent(new CustomEvent('pp:cart'));
  });

  /* ---------------------------------------------------------------- WhatsApp */

  var MSG = CFG.commerce.orderMessage;
  function waUrl(text) {
    return 'https://wa.me/' + CFG.contact.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  PP.wa = {
    url: waUrl,

    /** Commande d'un seul produit, au format demandé par la boutique. */
    productMessage: function (p, qty, extra) {
      qty = clampQty(qty || 1);
      var lines = [
        MSG.greetingSingle, '',
        'Produit : ' + p.name,
        'Référence : ' + p.ref,
        'Quantité : ' + qty,
        'Prix affiché : ' + PP.priceText(p.price),
      ];
      if (qty > 1) lines.push('Total affiché : ' + PP.priceText(p.price * qty));
      if (extra && extra.place) lines.push('Ville ou quartier de livraison : ' + extra.place);
      lines.push('', MSG.closing);
      return lines.join('\n');
    },

    /** Commande de toute la sélection : récapitulatif numéroté, ou format simple s'il n'y a qu'un produit. */
    cartMessage: function (lines, extra) {
      extra = extra || {};
      if (lines.length === 1) return PP.wa.productMessage(lines[0].product, lines[0].qty, extra);
      var out = [MSG.greetingMulti, ''];
      var total = 0;
      lines.forEach(function (l, i) {
        total += l.total;
        out.push((i + 1) + '. ' + l.product.name);
        out.push('   Référence : ' + l.product.ref);
        out.push('   Quantité : ' + l.qty);
        out.push('   Prix affiché : ' + PP.priceText(l.product.price));
        if (l.qty > 1) out.push('   Sous-total : ' + PP.priceText(l.total));
        out.push('');
      });
      out.push('Total affiché : ' + PP.priceText(total));
      if (extra.place) out.push('Ville ou quartier de livraison : ' + extra.place);
      out.push('', MSG.closing);
      return out.join('\n');
    },

    /** Produit épuisé : le client demande à être prévenu. */
    restockMessage: function (p) {
      return ['Bonjour, ce produit est-il bientôt de nouveau disponible ?', '',
        'Produit : ' + p.name, 'Référence : ' + p.ref].join('\n');
    },

    generalMessage: function () {
      return PP.wa.messages.general;
    },

    /** Messages d'ouverture de conversation, utilisés par les boutons data-wa="..." du HTML. */
    messages: {
      general: 'Bonjour, j\'ai une question sur vos produits.',
      game: 'Bonjour, je cherche un jeu qui n\'est pas dans le catalogue : ',
      pack: 'Bonjour, je voudrais composer un pack sur mesure : ',
      visit: 'Bonjour, je voudrais passer en boutique. Pouvez-vous me confirmer l\'adresse et les horaires ?',
    },

    contactMessage: function (f) {
      var out = ['Bonjour, je vous écris depuis le site ' + CFG.shop.name + '.', ''];
      if (f.topic) out.push('Sujet : ' + f.topic);
      if (f.name) out.push('Nom : ' + f.name);
      if (f.phone) out.push('Téléphone : ' + f.phone);
      out.push('', f.message);
      return out.join('\n');
    },
  };

  if (CFG.contact.whatsapp === '237670000000') {
    console.warn('[PIXEL PRO] Le numéro WhatsApp est un numéro factice. Modifiez js/config.js (contact.whatsapp) avant la mise en ligne.');
  }
})();
