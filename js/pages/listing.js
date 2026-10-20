/*
 * PIXEL PRO — listes de produits avec filtres et tri.
 * Utilisé par les pages Consoles PS5/PS4, Manettes, Jeux, Accessoires, Promotions et Recherche.
 *
 * Dans le HTML :  <section data-listing data-source="ps5"> … </section>
 *   data-source : identifiant d'une catégorie, « promos » (produits remisés hors packs) ou « search ».
 * Les filtres viennent de data/catalogue.js (categories[].filters) et leurs valeurs sont
 * déduites des produits : ajouter un produit suffit pour qu'une nouvelle valeur apparaisse.
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var esc = PP.esc;

  var roots = PP.qsa('[data-listing]');
  var compare = PP.qsa('[data-compare]');
  var syncUrl = roots.length === 1; // les paramètres d'adresse n'ont de sens qu'avec une seule liste par page

  var SORTS = [
    { id: 'ordre', label: 'Par défaut' },
    { id: 'prix-asc', label: 'Prix croissant' },
    { id: 'prix-desc', label: 'Prix décroissant' },
    { id: 'nom', label: 'Nom (A-Z)' },
  ];
  var CATEGORY_KEY = '__categorie';

  function valuesOf(p, key) {
    if (key === CATEGORY_KEY) {
      var c = PP.getCategory(p.category);
      return c ? [c.label] : [];
    }
    return PP.attrValues(p, key);
  }

  /** Trie « 500 Go, 1 To, 2 To » par capacité ; laisse les autres valeurs dans l'ordre du catalogue. */
  function sortValues(values) {
    var size = function (v) {
      var m = /^(\d+(?:[.,]\d+)?)\s*(Go|To)\b/i.exec(v);
      return m ? parseFloat(m[1].replace(',', '.')) * (m[2].toLowerCase() === 'to' ? 1000 : 1) : null;
    };
    if (values.every(function (v) { return size(v) !== null; })) {
      return values.slice().sort(function (a, b) { return size(a) - size(b); });
    }
    return values;
  }

  function init(root, index) {
    var source = root.getAttribute('data-source');
    var params = new URLSearchParams(window.location.search);
    var query = source === 'search' ? (params.get('q') || '').trim() : '';

    var base;
    var defs;
    if (source === 'promos') {
      base = PP.products.filter(function (p) { return PP.savings(p) > 0 && p.category !== 'packs'; });
      defs = [{ key: CATEGORY_KEY, label: 'Catégorie' }];
    } else if (source === 'search') {
      base = PP.search(query);
      defs = [{ key: CATEGORY_KEY, label: 'Catégorie' }];
    } else {
      base = PP.productsIn(source);
      var cat = PP.getCategory(source);
      defs = cat ? cat.filters : [];
    }

    var sorts = SORTS.slice();
    if (source === 'search') sorts[0] = { id: 'ordre', label: 'Pertinence' };

    // Filtres qui ont au moins deux valeurs à proposer.
    var filters = defs.map(function (def) {
      var seen = [];
      base.forEach(function (p) {
        valuesOf(p, def.key).forEach(function (v) { if (seen.indexOf(v) === -1) seen.push(v); });
      });
      return { key: def.key, label: def.label, values: sortValues(seen) };
    }).filter(function (f) { return f.values.length > 1; });

    var uid = 'l' + index + '-';
    var toolbarHost = PP.qs('[data-toolbar]', root);
    var grid = PP.qs('[data-grid]', root);
    var results = PP.qs('[data-results]', root);

    // État initial depuis l'adresse (liens partageables) : ?etat=Neuf&tri=prix-asc
    var state = { sort: 'ordre' };
    if (syncUrl) {
      filters.forEach(function (f) {
        var v = params.get(f.key);
        if (v && f.values.indexOf(v) !== -1) state[f.key] = v;
      });
      var s = params.get('tri');
      if (s && sorts.some(function (x) { return x.id === s; })) state.sort = s;
    }

    function option(value, label, selected) {
      return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
    }

    if (toolbarHost && base.length > 1) {
      toolbarHost.className = 'toolbar';
      toolbarHost.innerHTML =
        filters.map(function (f) {
          return '<div class="field"><label class="field__label" for="' + uid + f.key + '">' + esc(f.label) + '</label>' +
            '<select class="select" id="' + uid + f.key + '" data-filter="' + esc(f.key) + '">' +
            option('', 'Tous', !state[f.key]) +
            f.values.map(function (v) { return option(v, v, state[f.key] === v); }).join('') +
            '</select></div>';
        }).join('') +
        '<div class="field"><label class="field__label" for="' + uid + 'tri">Trier par</label>' +
          '<select class="select" id="' + uid + 'tri" data-sort>' +
          sorts.map(function (x) { return option(x.id, x.label, state.sort === x.id); }).join('') +
          '</select></div>' +
        '<div class="toolbar__foot"><p class="results" data-results role="status"></p>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-reset hidden>Réinitialiser les filtres</button></div>';
      results = PP.qs('[data-results]', toolbarHost);
    } else if (toolbarHost) {
      toolbarHost.hidden = true;
    }

    function matches(p) {
      return filters.every(function (f) {
        return !state[f.key] || valuesOf(p, f.key).indexOf(state[f.key]) !== -1;
      });
    }
    function sorted(list) {
      var out = list.slice();
      if (state.sort === 'prix-asc') out.sort(function (a, b) { return a.price - b.price; });
      else if (state.sort === 'prix-desc') out.sort(function (a, b) { return b.price - a.price; });
      else if (state.sort === 'nom') out.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
      return out;
    }

    function emptyState() {
      if (source === 'search') {
        return '<div class="empty"><p class="empty__title">' + (query ? 'Aucun résultat pour « ' + esc(query) + ' »' : 'Saisissez un mot-clé') + '</p>' +
          '<p>' + (query ? 'Essayez un autre mot (« PS5 », « manette », « FC 25 ») ou parcourez les rayons.' : 'Tapez le nom d\'un produit, d\'une console ou d\'un jeu dans la barre de recherche.') + '</p>' +
          '<div class="btn-row"><a class="btn btn--primary" href="consoles-ps5.html">Consoles PS5</a><a class="btn" href="jeux.html">Jeux</a><a class="btn" href="index.html">Accueil</a></div></div>';
      }
      return '<div class="empty"><p class="empty__title">Aucun produit ne correspond à ces filtres</p>' +
        '<p>Modifiez ou retirez un filtre pour voir plus de produits.</p>' +
        '<button type="button" class="btn btn--primary" data-reset>Réinitialiser les filtres</button></div>';
    }

    function render() {
      var filtered = base.filter(matches);
      var list = sorted(filtered);
      var active = filters.some(function (f) { return state[f.key]; });

      if (!list.length) {
        grid.className = '';
        grid.innerHTML = emptyState();
      } else {
        grid.className = grid.getAttribute('data-grid-class') || 'grid grid--cards';
        grid.innerHTML = list.map(PP.card).join('');
      }
      if (results) {
        var n = list.length;
        results.textContent = n + (n > 1 ? ' produits' : ' produit') + (active && n !== base.length ? ' sur ' + base.length : '');
      }
      var reset = PP.qs('.toolbar [data-reset]', root);
      if (reset) reset.hidden = !active;

      if (syncUrl && window.history && history.replaceState) {
        var next = new URLSearchParams();
        if (query) next.set('q', query);
        filters.forEach(function (f) { if (state[f.key]) next.set(f.key, state[f.key]); });
        if (state.sort !== 'ordre') next.set('tri', state.sort);
        var qs = next.toString();
        try { history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* adresse locale (file://) : on ignore */ }
      }
    }

    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-filter')) {
        var key = t.getAttribute('data-filter');
        if (t.value) state[key] = t.value; else delete state[key];
        render();
      } else if (t.hasAttribute('data-sort')) {
        state.sort = t.value;
        render();
      }
    });
    root.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('[data-reset]')) return;
      filters.forEach(function (f) { delete state[f.key]; });
      PP.qsa('[data-filter]', root).forEach(function (s) { s.value = ''; });
      render();
    });

    if (source === 'search') {
      var title = PP.qs('[data-search-title]');
      if (title) title.textContent = query ? 'Résultats pour « ' + query + ' »' : 'Recherche';
      document.title = (query ? 'Recherche : ' + query : 'Recherche') + ' | ' + PP.cfg.shop.name;
    }
    render();
  }

  roots.forEach(init);

  /* Tableau comparatif : généré depuis le catalogue pour rester toujours cohérent avec les prix. */
  function specValue(p, key) {
    var found = (p.specs || []).filter(function (s) { return s[0] === key; })[0];
    return found ? found[1] : '—';
  }
  compare.forEach(function (host) {
    var list = PP.productsIn(host.getAttribute('data-compare')).slice().sort(function (a, b) { return a.price - b.price; });
    var label = host.getAttribute('data-caption') || 'Comparatif des modèles';
    host.innerHTML = '<table class="table"><caption class="sr-only">' + esc(label) + '</caption>' +
      '<thead><tr><th scope="col">Modèle</th><th scope="col">État</th><th scope="col">Stockage</th><th scope="col">Lecteur de disques</th><th scope="col">Garantie</th><th scope="col" class="num">Prix</th></tr></thead><tbody>' +
      list.map(function (p) {
        return '<tr><th scope="row" data-label="Modèle"><a href="' + PP.productUrl(p) + '">' + esc(p.name) + '</a></th>' +
          '<td data-label="État">' + PP.conditionLabel(p) + '</td>' +
          '<td data-label="Stockage">' + esc((p.attrs && p.attrs.stockage) || '—') + '</td>' +
          '<td data-label="Lecteur">' + esc(specValue(p, 'Lecteur')) + '</td>' +
          '<td data-label="Garantie">' + esc(p.warranty || '—') + '</td>' +
          '<td class="num" data-label="Prix">' + PP.price(p.price) + '</td></tr>';
      }).join('') + '</tbody></table>';
  });
})();
