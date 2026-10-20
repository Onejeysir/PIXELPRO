/*
 * PIXEL PRO — page d'accueil : tableau des rayons, sélection, offres, avis.
 * Tout le contenu est calculé depuis le catalogue et la configuration.
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var esc = PP.esc;
  var CFG = PP.cfg;

  /* Tableau des rayons : un rayon par ligne, avec le prix de départ calculé. */
  var board = PP.qs('#board-rows');
  if (board) {
    var unit = { ps5: 'modèles', ps4: 'modèles', jeux: 'titres' };
    board.innerHTML = PP.categories.map(function (c) {
      var list = PP.productsIn(c.id);
      if (!list.length) return '';
      var name = c.id === 'packs' ? 'Packs et promotions' : c.label;
      return '<li><a class="board__row" href="' + c.href + '">' +
        '<span><span class="board__name">' + esc(name) + '</span>' +
        '<span class="board__meta">' + list.length + ' ' + (unit[c.id] || 'produits') + '</span></span>' +
        '<span class="board__from"><small>dès</small><span class="board__price">' + PP.amount(PP.minPrice(list)) + '</span> <small>' + esc(CFG.currency.label) + '</small></span>' +
        PP.icon('chevron-right', 'board__chev') + '</a></li>';
    }).join('');
  }

  /* Sélection de la boutique : produits marqués « featured » dans le catalogue. */
  var featured = PP.qs('#featured');
  if (featured) featured.innerHTML = PP.products.filter(function (p) { return p.featured; }).map(PP.card).join('');

  /* Offres du moment : plus fortes économies parmi les produits qui ne sont pas déjà dans la sélection. */
  var deals = PP.qs('#deals');
  if (deals) {
    deals.innerHTML = PP.products
      .filter(function (p) { return PP.savings(p) > 0 && !p.featured; })
      .sort(function (a, b) { return PP.savings(b) - PP.savings(a); })
      .slice(0, 4).map(PP.card).join('');
  }

  /* Conditions : reprises de la configuration. */
  var facts = PP.qs('#hero-facts');
  if (facts) {
    var c = CFG.commerce;
    facts.innerHTML = [
      'Livraison à ' + c.deliveryZones + ', ' + c.deliveryDelay,
      'Paiement par ' + c.payment.slice(0, -1).join(', ') + ' ou ' + c.payment[c.payment.length - 1] + ', ' + c.paymentWhen,
      c.inspection,
    ].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  }

  /* Avis clients : affichés uniquement s'il y en a de vrais dans data/avis.js. */
  var reviews = window.PIXELPRO_AVIS || [];
  var reviewsHost = PP.qs('#avis');
  if (reviewsHost && reviews.length) {
    PP.qs('#avis-list').innerHTML = reviews.map(function (r) {
      return '<figure class="review"><blockquote><p>' + esc(r.text) + '</p></blockquote>' +
        '<figcaption>' + esc(r.author) + (r.city ? ', ' + esc(r.city) : '') + '</figcaption></figure>';
    }).join('');
    reviewsHost.hidden = false;
  }

  /* Données structurées de la boutique. */
  PP.jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: CFG.shop.name,
    description: CFG.shop.tagline,
    url: CFG.shop.url,
    logo: CFG.shop.url + '/assets/img/logo-mark.svg',
    areaServed: ['Douala', 'Yaoundé'],
    currenciesAccepted: CFG.currency.code,
  });
})();
