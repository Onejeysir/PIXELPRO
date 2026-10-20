/*
 * PIXEL PRO — interface commune : icônes, en-tête, pied de page, bouton WhatsApp,
 * notification, carte produit, balises SEO dynamiques.
 * Dépend de config.js, icons.js, core.js.
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var CFG = PP.cfg;
  var esc = PP.esc;
  var NBSP = ' ';

  /* ------------------------------------------------------------------ Icônes */

  var BRANDS = window.PP_BRAND_ICONS || [];
  /** Une icône du sprite (Lucide ou logo de marque). Toujours décorative : le libellé est ailleurs. */
  PP.icon = function (name, extraClass) {
    var cls = 'icon' + (BRANDS.indexOf(name) !== -1 ? ' icon--brand' : '') + (extraClass ? ' ' + extraClass : '');
    return '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  };
  if (window.PP_ICONS_SPRITE) document.body.insertAdjacentHTML('afterbegin', window.PP_ICONS_SPRITE);

  /* ------------------------------------------------------------------ Images */

  /** Une adresse complète est utilisée telle quelle ; un simple nom de fichier est cherché dans assets/img/products/. */
  PP.imgSrc = function (src) {
    return /^(https?:)?\/\//.test(src) ? src : 'assets/img/products/' + src;
  };
  PP.altFor = function (p, index) {
    return index ? p.name + ', vue ' + (index + 1) : p.name;
  };
  PP.emptyMedia = function (p) {
    return '<div class="media-empty" role="img" aria-label="Photo à venir : ' + esc(p.name) + '">Photo à venir</div>';
  };
  /** Image d'un produit, ou visuel neutre « photo à venir » s'il n'en a pas. */
  PP.media = function (p, opts) {
    opts = opts || {};
    var src = p.images && p.images[opts.index || 0];
    if (!src) return PP.emptyMedia(p);
    return '<img data-pp-img data-name="' + esc(p.name) + '" src="' + esc(PP.imgSrc(src)) + '" alt="' + esc(PP.altFor(p, opts.index || 0)) +
      '" width="640" height="480" loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async" referrerpolicy="no-referrer">';
  };
  // Une photo qui ne charge pas (lien mort, hors-ligne) est remplacée par le visuel neutre, sans trou dans la page.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-pp-img')) return;
    var box = document.createElement('div');
    box.className = 'media-empty';
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', 'Photo à venir : ' + (img.getAttribute('data-name') || ''));
    box.textContent = 'Photo à venir';
    img.parentNode.replaceChild(box, img);
  }, true);

  /* ------------------------------------------------------- Prix et étiquettes */

  PP.conditionLabel = function (p) { return p.condition === 'occasion' ? 'Occasion' : 'Neuf'; };

  PP.priceHtml = function (p, opts) {
    var save = PP.savings(p);
    return '<div class="price' + (opts && opts.large ? ' price--lg' : '') + '">' +
      '<span class="price__now">' + PP.amount(p.price) + '<span class="price__cur">' + NBSP + CFG.currency.label + '</span></span>' +
      (save ? '<s class="price__old"><span class="sr-only">Ancien prix : </span>' + PP.price(p.oldPrice) + '</s>' +
        '<span class="price__save">Économie de ' + PP.price(save) + '</span>' : '') +
      '</div>';
  };
  PP.availHtml = function (p) {
    var av = PP.availability(p);
    return '<p class="avail avail--' + av.key + '">' + esc(av.label) + '</p>';
  };

  /* ---------------------------------------------------------- Carte produit */

  PP.card = function (p) {
    var av = PP.availability(p);
    var url = PP.productUrl(p);
    var points = (p.highlights || []).slice(0, 3).map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
    var waLink = av.canAdd ? PP.wa.url(PP.wa.productMessage(p, 1)) : PP.wa.url(PP.wa.restockMessage(p));
    var waLabel = av.canAdd ? 'Commander sur WhatsApp' : 'Être prévenu sur WhatsApp';
    return '<article class="card">' +
      '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' + PP.media(p) +
      '<span class="card__flag"><span class="tag">' + PP.conditionLabel(p) + '</span></span></a>' +
      '<div class="card__body">' +
        '<h3 class="card__title"><a href="' + url + '">' + esc(p.name) + '</a></h3>' +
        (points ? '<ul class="card__points">' + points + '</ul>' : '') +
        '<div class="card__buy">' + PP.priceHtml(p) + PP.availHtml(p) + '</div>' +
      '</div>' +
      '<div class="card__actions' + (av.canAdd ? '' : ' card__actions--single') + '">' +
        '<a class="btn btn--outline btn--sm" href="' + url + '" aria-label="Voir le produit : ' + esc(p.name) + '">Voir le produit</a>' +
        (av.canAdd ? '<button type="button" class="btn btn--outline btn--sm" data-add="' + esc(p.id) + '" aria-label="Ajouter à la sélection : ' + esc(p.name) + '">' + PP.icon('plus') + 'Ajouter</button>' : '') +
        '<a class="btn btn--wa btn--sm" href="' + waLink + '" target="_blank" rel="noopener noreferrer" aria-label="' + waLabel + ' : ' + esc(p.name) + '">' + PP.icon('whatsapp') + waLabel + '</a>' +
      '</div>' +
    '</article>';
  };

  /* -------------------------------------------------------------- Notification */

  var region = document.createElement('div');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.appendChild(region);
  var toastTimer;
  PP.toast = function (message, link) {
    clearTimeout(toastTimer);
    region.innerHTML = '<div class="toast"><span>' + esc(message) + '</span>' +
      (link ? '<a href="' + esc(link.href) + '">' + esc(link.label) + '</a>' : '') + '</div>';
    toastTimer = setTimeout(function () { region.innerHTML = ''; }, 5000);
  };

  // Tout bouton « Ajouter » (cartes, fiche produit) passe par ici.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-add]') : null;
    if (!btn) return;
    var id = btn.getAttribute('data-add');
    var p = PP.getProduct(id);
    if (!p) return;
    var qty = 1;
    var from = btn.getAttribute('data-qty-from');
    if (from) {
      var input = PP.qs(from);
      qty = parseInt(input && input.value, 10) || 1;
    }
    PP.cart.add(id, qty);
    PP.toast('« ' + p.name + ' » ajouté à votre sélection.', { href: 'panier.html', label: 'Voir la sélection' });
  });

  /* ------------------------------------------------------------ SEO dynamique */

  function upsert(selector, attrs) {
    var el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.indexOf('link') === 0 ? 'link' : 'meta');
      document.head.appendChild(el);
    }
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
  }
  /** Met à jour titre, description et Open Graph (fiche produit, recherche). */
  PP.setMeta = function (o) {
    var base = CFG.shop.url.replace(/\/$/, '');
    document.title = o.title;
    upsert('meta[name="description"]', { name: 'description', content: o.description });
    upsert('meta[property="og:title"]', { property: 'og:title', content: o.title });
    upsert('meta[property="og:description"]', { property: 'og:description', content: o.description });
    if (o.path) {
      upsert('link[rel="canonical"]', { rel: 'canonical', href: base + '/' + o.path });
      upsert('meta[property="og:url"]', { property: 'og:url', content: base + '/' + o.path });
    }
    if (o.image) upsert('meta[property="og:image"]', { property: 'og:image', content: o.image });
  };
  PP.jsonLd = function (data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  };

  /* ---------------------------------------------------------------- En-tête */

  var NAV = [
    { key: 'accueil', label: 'Accueil', href: 'index.html', mobileOnly: true },
    { key: 'ps5', label: 'Consoles PS5', href: 'consoles-ps5.html' },
    { key: 'ps4', label: 'Consoles PS4', href: 'consoles-ps4.html' },
    { key: 'manettes', label: 'Manettes', href: 'manettes.html' },
    { key: 'jeux', label: 'Jeux', href: 'jeux.html' },
    { key: 'accessoires', label: 'Accessoires', href: 'accessoires.html' },
    { key: 'promotions', label: 'Promotions et packs', href: 'promotions.html' },
  ];
  var NAV_MORE = [
    { key: 'a-propos', label: 'À propos', href: 'a-propos.html' },
    { key: 'contact', label: 'Contact', href: 'contact.html' },
  ];

  function brandName() {
    var parts = CFG.shop.name.split(' ');
    var last = parts.length > 1 ? parts.pop() : '';
    return esc(parts.join(' ')) + (last ? ' <span class="brand__pro">' + esc(last) + '</span>' : '');
  }
  function searchForm(id, extraClass) {
    return '<form class="search ' + (extraClass || '') + '" role="search" action="recherche.html" method="get">' +
      '<label class="sr-only" for="' + id + '">Rechercher un produit</label>' +
      '<input class="search__input" id="' + id + '" type="search" name="q" placeholder="Rechercher une console, un jeu" autocomplete="off" enterkeyhint="search">' +
      '<button class="search__btn" type="submit" aria-label="Lancer la recherche">' + PP.icon('search') + '</button></form>';
  }
  function navLink(item) {
    return '<li' + (item.mobileOnly ? ' class="site-nav__mobile"' : '') + '><a class="site-nav__link" data-nav="' + item.key + '" href="' + item.href + '">' + item.label + '</a></li>';
  }

  function renderHeader(host) {
    host.innerHTML =
      '<div class="container site-header__bar">' +
        '<a class="brand" href="index.html" aria-label="' + esc(CFG.shop.name) + ', accueil">' +
          '<img class="brand__mark" src="assets/img/logo-mark.svg" width="30" height="30" alt="">' +
          '<span class="brand__name">' + brandName() + '</span></a>' +
        searchForm('search-desktop') +
        '<div class="header-actions">' +
          '<a class="btn btn--wa btn--sm header-wa" href="' + PP.wa.url(PP.wa.generalMessage()) + '" target="_blank" rel="noopener noreferrer">' + PP.icon('whatsapp') + 'Écrire sur WhatsApp</a>' +
          '<a class="icon-btn" id="selection-link" href="panier.html" aria-label="Ma sélection">' + PP.icon('shopping-bag') + '<span class="badge" data-cart-count hidden>0</span></a>' +
          '<button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Ouvrir le menu">' + PP.icon('menu') + '</button>' +
        '</div>' +
      '</div>' +
      '<nav class="site-nav" id="primary-nav" aria-label="Navigation principale"><div class="container">' +
        searchForm('search-mobile', 'nav-search') +
        '<ul class="site-nav__list">' + NAV.map(navLink).join('') + '<li class="site-nav__sep" aria-hidden="true"></li>' + NAV_MORE.map(navLink).join('') + '</ul>' +
      '</div></nav>';

    var toggle = PP.qs('.nav-toggle', host);
    var nav = PP.qs('#primary-nav', host);
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      toggle.innerHTML = PP.icon(open ? 'x' : 'menu');
    }
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  /** Marque l'entrée de menu de la page courante (aria-current) : appelé au chargement, et par la fiche produit. */
  PP.setActiveNav = function (key) {
    PP.qsa('.site-nav__link').forEach(function (a) {
      if (a.getAttribute('data-nav') === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  var lastCount = null;
  PP.updateCartBadge = function () {
    var count = PP.cart.count();
    PP.qsa('[data-cart-count]').forEach(function (b) {
      b.textContent = count > 99 ? '99+' : String(count);
      b.hidden = count === 0;
      if (lastCount !== null && count > lastCount) {
        b.classList.remove('is-bump');
        void b.offsetWidth; // relance l'animation
        b.classList.add('is-bump');
      }
    });
    var link = PP.qs('#selection-link');
    if (link) link.setAttribute('aria-label', count ? 'Ma sélection, ' + count + (count > 1 ? ' articles' : ' article') : 'Ma sélection, vide');
    lastCount = count;
  };

  /* -------------------------------------------------------------- Pied de page */

  function renderFooter(host) {
    var c = CFG.contact;
    var catalogue = NAV.filter(function (n) { return !n.mobileOnly; })
      .map(function (n) { return '<li><a href="' + n.href + '">' + n.label + '</a></li>'; }).join('');
    var places = CFG.locations.map(function (l) {
      return '<p><strong>' + esc(l.city) + '</strong><br>' + esc(l.address) + '</p>';
    }).join('');
    var hours = CFG.hours.map(function (h) { return esc(h.days) + ' : ' + esc(h.time); }).join('<br>');
    var social = ['facebook', 'instagram', 'tiktok', 'youtube'].filter(function (k) { return CFG.social[k]; })
      .map(function (k) {
        return '<a href="' + esc(CFG.social[k]) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(CFG.shop.name) + ' sur ' + k.charAt(0).toUpperCase() + k.slice(1) + '">' + PP.icon(k) + '</a>';
      }).join('');

    host.innerHTML =
      '<div class="container footer-grid">' +
        '<div class="footer-col">' +
          '<p class="footer-title">' + esc(CFG.shop.name) + '</p>' +
          '<p>' + esc(CFG.shop.tagline) + '. Consultez les produits, ajoutez-les à votre sélection et envoyez votre commande sur WhatsApp.</p>' +
          '<a class="btn btn--wa" href="' + PP.wa.url(PP.wa.generalMessage()) + '" target="_blank" rel="noopener noreferrer">' + PP.icon('whatsapp') + 'Écrire sur WhatsApp</a>' +
          (social ? '<div class="footer-social">' + social + '</div>' : '') +
        '</div>' +
        '<div class="footer-col"><p class="footer-title">Catalogue</p><ul class="footer-list">' + catalogue + '</ul></div>' +
        '<div class="footer-col"><p class="footer-title">La boutique</p><ul class="footer-list">' +
          '<li><a href="a-propos.html">À propos</a></li><li><a href="contact.html">Contact</a></li><li><a href="panier.html">Ma sélection</a></li></ul></div>' +
        '<div class="footer-col"><p class="footer-title">Nous joindre</p>' +
          '<p><a href="tel:' + esc(c.phoneTel) + '">' + esc(c.phoneDisplay) + '</a>' + (c.email ? '<br><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '') + '</p>' +
          places + '<p>' + hours + '</p></div>' +
      '</div>' +
      '<div class="footer-bottom"><div class="container">' +
        '<p>&copy; ' + new Date().getFullYear() + ' ' + esc(CFG.shop.name) + '. Prix en ' + esc(CFG.currency.label) + '.</p>' +
        (CFG.demo.enabled ? '<p>Les produits, prix et disponibilités affichés sont des exemples tant que le catalogue n\'est pas finalisé.</p>' : '') +
      '</div></div>';
  }

  /* ---------------------------------------------------------------- Assemblage */

  var header = PP.qs('#site-header');
  if (header) {
    renderHeader(header);
    if (CFG.demo.enabled) {
      header.insertAdjacentHTML('beforebegin', '<div class="notice" role="region" aria-label="Catalogue de démonstration"><div class="container notice__inner">' + esc(CFG.demo.notice) + '</div></div>');
      document.documentElement.classList.add('has-notice'); // la place réservée par le CSS n'est plus nécessaire
    }
    PP.setActiveNav(document.body.getAttribute('data-nav'));
  }
  var footer = PP.qs('#site-footer');
  if (footer) renderFooter(footer);

  if (document.body.getAttribute('data-fab') !== 'off') {
    document.body.insertAdjacentHTML('beforeend',
      '<aside aria-label="Contact rapide"><a class="fab" href="' + PP.wa.url(PP.wa.generalMessage()) + '" target="_blank" rel="noopener noreferrer" aria-label="Écrire sur WhatsApp">' + PP.icon('whatsapp') + '</a></aside>');
  }

  /** Remplit les éléments du HTML liés à la configuration : data-wa, data-tel, data-cfg. */
  function listOf(arr) {
    return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' ou ' + arr[arr.length - 1];
  }
  /** Conditions commerciales (livraison, paiement, vérification, garantie), toujours issues de la configuration. */
  PP.commerceBlocks = function () {
    var c = CFG.commerce;
    return [
      { title: 'Livraison', text: 'Livraison à ' + c.deliveryZones + ', ' + c.deliveryDelay + '. Le délai exact est confirmé sur WhatsApp au moment de la commande.' },
      { title: 'Paiement', text: 'Vous payez par ' + listOf(c.payment) + ', ' + c.paymentWhen + '. Aucun paiement n\'est demandé sur ce site.' },
      { title: 'Vérification avant achat', text: c.inspection + ' Les produits d\'occasion sont nettoyés et testés avant la remise.' },
      { title: 'Garantie', text: 'La durée de garantie est indiquée sur chaque fiche produit. Elle dépend de l\'état du produit, neuf ou occasion.' },
    ];
  };

  var FILLERS = {
    commerce: function () {
      return PP.commerceBlocks().map(function (b) { return '<div><h3>' + esc(b.title) + '</h3><p>' + esc(b.text) + '</p></div>'; }).join('');
    },
    locations: function () {
      return CFG.locations.map(function (l) {
        return '<div class="location"><h3>' + esc(l.name) + ', ' + esc(l.city) + '</h3><p>' + esc(l.address) + '</p>' +
          (l.mapUrl ? '<p><a href="' + esc(l.mapUrl) + '" target="_blank" rel="noopener noreferrer">Voir sur la carte</a></p>' : '') + '</div>';
      }).join('');
    },
    hours: function () {
      return CFG.hours.map(function (h) { return '<div><dt>' + esc(h.days) + '</dt><dd>' + esc(h.time) + '</dd></div>'; }).join('');
    },
  };

  PP.bind = function (root) {
    PP.qsa('[data-fill]', root).forEach(function (el) {
      var fill = FILLERS[el.getAttribute('data-fill')];
      if (fill) el.innerHTML = fill();
    });
    PP.qsa('[data-wa]', root).forEach(function (a) {
      var text = PP.wa.messages[a.getAttribute('data-wa')] || PP.wa.messages.general;
      a.href = PP.wa.url(text);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    PP.qsa('[data-tel]', root).forEach(function (a) {
      a.href = 'tel:' + CFG.contact.phoneTel;
      if (!a.textContent.trim()) a.textContent = CFG.contact.phoneDisplay;
    });
    PP.qsa('[data-cfg]', root).forEach(function (el) {
      var value = el.getAttribute('data-cfg').split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, CFG);
      if (value != null) el.textContent = Array.isArray(value) ? listOf(value) : value;
    });
  };
  PP.bind(document);

  PP.updateCartBadge();
  window.addEventListener('pp:cart', PP.updateCartBadge);

  // Pré-remplit le champ de recherche sur la page de résultats.
  var q = new URLSearchParams(window.location.search).get('q');
  if (q) PP.qsa('.search__input').forEach(function (i) { i.value = q; });

  // Les scripts de page (différés, exécutés après celui-ci) ont tous rempli leur zone au moment
  // de DOMContentLoaded : on révèle alors le contenu, sans que rien ne se décale sous les yeux.
  function reveal() { document.documentElement.classList.add('pp-ready'); }
  if (document.readyState === 'complete') reveal();
  else document.addEventListener('DOMContentLoaded', reveal);
})();
