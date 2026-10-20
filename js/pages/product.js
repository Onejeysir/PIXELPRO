/*
 * PIXEL PRO — fiche produit dynamique : produit.html?id=<identifiant du catalogue>
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var esc = PP.esc;
  var CFG = PP.cfg;

  var host = PP.qs('#product-root');
  if (!host) return;

  var id = new URLSearchParams(window.location.search).get('id');
  var p = id ? PP.getProduct(id) : null;

  function absolute(path) { return CFG.shop.url.replace(/\/$/, '') + '/' + path; }

  /* ------------------------------------------------------------ Produit inconnu */
  if (!p) {
    document.title = 'Produit introuvable | ' + CFG.shop.name;
    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    host.innerHTML =
      '<div class="container not-found"><h1>Produit introuvable</h1>' +
      '<p class="lead">Ce produit n\'existe pas ou n\'est plus dans le catalogue.</p>' +
      '<div class="btn-row"><a class="btn btn--primary" href="consoles-ps5.html">Voir les consoles PS5</a>' +
      '<a class="btn" href="jeux.html">Voir les jeux</a><a class="btn" href="index.html">Retour à l\'accueil</a></div></div>';
    return;
  }

  var cat = PP.getCategory(p.category);
  var av = PP.availability(p);
  var navKey = p.category === 'packs' ? 'promotions' : p.category;
  PP.setActiveNav(navKey);

  /* --------------------------------------------------------------------- SEO */
  var path = 'produit.html?id=' + encodeURIComponent(p.id);
  var firstImage = p.images && p.images[0] && /^https?:/.test(p.images[0]) ? p.images[0] : null;
  PP.setMeta({
    title: p.name + ', prix en ' + CFG.currency.label + ' | ' + CFG.shop.name,
    description: (p.summary + ' Prix : ' + PP.priceText(p.price) + '. Commande sur WhatsApp.').slice(0, 300),
    path: path,
    image: firstImage,
  });
  PP.jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: absolute('index.html') },
      { '@type': 'ListItem', position: 2, name: cat.label, item: absolute(cat.href) },
      { '@type': 'ListItem', position: 3, name: p.name, item: absolute(path) },
    ],
  });
  // Les données « Produit » (prix, disponibilité) ne sont publiées que pour un vrai catalogue, jamais en démonstration.
  if (!CFG.demo.enabled) {
    var offer = {
      '@type': 'Offer', priceCurrency: CFG.currency.code, price: p.price, url: absolute(path),
      itemCondition: p.condition === 'occasion' ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      availability: p.availability === 'epuise' ? 'https://schema.org/OutOfStock' :
        (p.availability === 'sur-commande' ? 'https://schema.org/BackOrder' : 'https://schema.org/InStock'),
    };
    PP.jsonLd({
      '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.ref,
      description: p.description || p.summary, category: cat.label,
      image: (p.images || []).filter(function (i) { return /^https?:/.test(i); }), offers: offer,
    });
  }

  /* ---------------------------------------------------------------- Rendu */
  var images = p.images || [];

  function galleryHtml() {
    var thumbs = images.length > 1
      ? '<div class="gallery__thumbs" role="group" aria-label="Photos du produit">' + images.map(function (src, i) {
        return '<button type="button" class="gallery__thumb" data-thumb="' + i + '" aria-label="Voir la photo ' + (i + 1) + ' sur ' + images.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' +
          '<img src="' + esc(PP.imgSrc(src)) + '" alt="" width="76" height="58" loading="lazy" decoding="async" referrerpolicy="no-referrer"></button>';
      }).join('') + '</div>'
      : '';
    return '<div class="gallery"><div class="gallery__main" id="gallery-main">' + PP.media(p, { eager: true }) + '</div>' + thumbs + '</div>';
  }

  function swatchesHtml() {
    if (!p.family) return '';
    var siblings = PP.products.filter(function (q) { return q.family === p.family && q.color; });
    if (siblings.length < 2) return '';
    return '<div><p class="field__label">Coloris : <strong>' + esc(p.color ? p.color.name : '') + '</strong></p>' +
      '<div class="swatches" role="group" aria-label="Autres coloris">' + siblings.map(function (q) {
        var hex = /^#[0-9a-f]{3,8}$/i.test(q.color.hex) ? q.color.hex : '#cccccc';
        return '<a class="swatch" href="' + PP.productUrl(q) + '"' + (q.id === p.id ? ' aria-current="true"' : '') + '>' +
          '<span class="swatch__dot" style="background:' + hex + '"></span>' + esc(q.color.name) + '</a>';
      }).join('') + '</div></div>';
  }

  function buyHtml() {
    var c = CFG.commerce;
    var note = '<p class="product__note">Livraison à ' + esc(c.deliveryZones) + ', ' + esc(c.deliveryDelay) + '. Paiement ' + esc(c.paymentWhen) + '. Aucun paiement n\'est demandé sur ce site.</p>';
    if (!av.canAdd) {
      return '<div class="product__buy">' + PP.priceHtml(p, { large: true }) + PP.availHtml(p) +
        '<div class="product__actions"><a class="btn btn--wa btn--lg" href="' + PP.wa.url(PP.wa.restockMessage(p)) + '" target="_blank" rel="noopener noreferrer">' + PP.icon('whatsapp') + 'Être prévenu sur WhatsApp</a></div>' + note + '</div>';
    }
    return '<div class="product__buy">' + PP.priceHtml(p, { large: true }) + PP.availHtml(p) +
      '<div class="product__actions" id="buy-actions">' +
        '<div class="qty" role="group" aria-label="Quantité">' +
          '<button type="button" class="qty__btn" data-qty-minus aria-label="Retirer une unité">' + PP.icon('minus') + '</button>' +
          '<input class="qty__value" id="qty" type="number" inputmode="numeric" min="1" max="' + PP.maxQty + '" value="1" aria-label="Quantité">' +
          '<button type="button" class="qty__btn" data-qty-plus aria-label="Ajouter une unité">' + PP.icon('plus') + '</button>' +
        '</div>' +
        '<button type="button" class="btn btn--primary btn--lg" data-add="' + esc(p.id) + '" data-qty-from="#qty">Ajouter à la sélection</button>' +
        '<a class="btn btn--wa btn--lg" id="wa-order" href="' + PP.wa.url(PP.wa.productMessage(p, 1)) + '" target="_blank" rel="noopener noreferrer">' + PP.icon('whatsapp') + 'Commander sur WhatsApp</a>' +
      '</div>' + note + '</div>';
  }

  function listHtml(items) {
    return '<ul class="pixel-list">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  var sections = '';
  var desc = (p.description || p.summary || '').split('\n').filter(Boolean);
  if (desc.length) sections += '<section class="is-wide" aria-labelledby="h-desc"><h2 id="h-desc">Description</h2><div class="prose">' + desc.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div></section>';
  if (p.specs && p.specs.length) {
    sections += '<section aria-labelledby="h-specs"><h2 id="h-specs">Caractéristiques</h2><dl class="specs">' +
      p.specs.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl></section>';
  }
  if (p.included && p.included.length) {
    sections += '<section aria-labelledby="h-incl"><h2 id="h-incl">Contenu</h2>' + listHtml(p.included) + '</section>';
  }
  var related = PP.related(p, 4);
  if (related.length) {
    sections += '<section class="is-wide" aria-labelledby="h-rel"><h2 id="h-rel">Produits associés</h2><div class="grid grid--cards">' + related.map(PP.card).join('') + '</div></section>';
  }

  host.innerHTML =
    '<section class="page-head"><div class="container"><nav aria-label="Fil d\'Ariane"><ol class="breadcrumb">' +
      '<li><a href="index.html">Accueil</a></li><li><a href="' + cat.href + '">' + esc(cat.label) + '</a></li><li aria-current="page">' + esc(p.name) + '</li></ol></nav></div></section>' +
    '<section class="section section--tight"><div class="container">' +
      '<div class="product"><div class="product__gallery">' + galleryHtml() + '</div>' +
        '<div class="product__info"><h1>' + esc(p.name) + '</h1>' +
          '<div class="product__meta"><span class="tag">' + PP.conditionLabel(p) + '</span><span class="product__ref">Réf. ' + esc(p.ref) + '</span></div>' +
          '<p class="lead">' + esc(p.summary) + '</p>' + swatchesHtml() + buyHtml() + '</div></div>' +
      '<div class="detail-sections">' + sections + '</div>' +
    '</div></section>';

  /* ----------------------------------------------------------- Interactions */
  var main = PP.qs('#gallery-main');
  PP.qsa('[data-thumb]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = parseInt(btn.getAttribute('data-thumb'), 10);
      main.innerHTML = PP.media(p, { index: i, eager: true });
      PP.qsa('[data-thumb]').forEach(function (b) { b.setAttribute('aria-current', b === btn ? 'true' : 'false'); });
    });
  });

  var qty = PP.qs('#qty');
  var wa = PP.qs('#wa-order');
  if (qty) {
    var clamp = function () {
      var v = parseInt(qty.value, 10);
      if (!isFinite(v) || v < 1) v = 1;
      if (v > PP.maxQty) v = PP.maxQty;
      qty.value = v;
      if (wa) wa.href = PP.wa.url(PP.wa.productMessage(p, v));
    };
    PP.qs('[data-qty-minus]').addEventListener('click', function () { qty.value = (parseInt(qty.value, 10) || 1) - 1; clamp(); });
    PP.qs('[data-qty-plus]').addEventListener('click', function () { qty.value = (parseInt(qty.value, 10) || 1) + 1; clamp(); });
    qty.addEventListener('change', clamp);
    qty.addEventListener('input', function () { if (qty.value !== '') clamp(); });

    /* Barre d'achat fixe sur mobile : visible seulement quand les boutons de la page sont sortis de l'écran. */
    var actions = PP.qs('#buy-actions');
    if (actions && 'IntersectionObserver' in window) {
      var bar = document.createElement('div');
      bar.className = 'buybar';
      bar.innerHTML =
        '<div class="buybar__price">' + PP.priceHtml(p) + '</div>' +
        '<button type="button" class="btn btn--outline" data-add="' + esc(p.id) + '" data-qty-from="#qty" aria-label="Ajouter à la sélection">' + PP.icon('plus') + 'Ajouter</button>' +
        '<a class="btn btn--wa" id="wa-bar" href="' + PP.wa.url(PP.wa.productMessage(p, 1)) + '" target="_blank" rel="noopener noreferrer" aria-label="Commander sur WhatsApp">' + PP.icon('whatsapp') + 'Commander</a>';
      document.body.appendChild(bar);
      document.body.classList.add('has-buybar');
      var waBar = PP.qs('#wa-bar');
      qty.addEventListener('change', function () { waBar.href = wa.href; });
      PP.qsa('[data-qty-minus], [data-qty-plus]').forEach(function (b) { b.addEventListener('click', function () { waBar.href = wa.href; }); });
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        bar.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0);
      }).observe(actions);
    }
  }
})();
