/*
 * PIXEL PRO — page « Ma sélection » : lignes, quantités, total, commande WhatsApp récapitulative.
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var esc = PP.esc;

  var host = PP.qs('#cart-root');
  if (!host) return;

  var place = ''; // ville ou quartier saisi : conservé quand la liste est redessinée

  function lineHtml(l) {
    var p = l.product;
    var url = PP.productUrl(p);
    return '<article class="cart-line" data-id="' + esc(p.id) + '">' +
      '<a class="cart-line__thumb" href="' + url + '" tabindex="-1" aria-hidden="true">' + PP.media(p) + '</a>' +
      '<div class="cart-line__info"><a class="cart-line__name" href="' + url + '">' + esc(p.name) + '</a>' +
        '<p class="cart-line__ref">Réf. ' + esc(p.ref) + '</p>' +
        '<p class="cart-line__unit">' + PP.price(p.price) + ' l\'unité</p>' + PP.availHtml(p) + '</div>' +
      '<div class="cart-line__controls">' +
        '<div class="qty" role="group" aria-label="Quantité de ' + esc(p.name) + '">' +
          '<button type="button" class="qty__btn" data-minus aria-label="Retirer une unité"' + (l.qty <= 1 ? ' disabled' : '') + '>' + PP.icon('minus') + '</button>' +
          '<span class="qty__text" role="status" aria-live="polite">' + l.qty + '</span>' +
          '<button type="button" class="qty__btn" data-plus aria-label="Ajouter une unité"' + (l.qty >= PP.maxQty ? ' disabled' : '') + '>' + PP.icon('plus') + '</button>' +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-remove aria-label="Retirer de la sélection : ' + esc(p.name) + '">' + PP.icon('trash-2') + 'Retirer</button>' +
        '<span class="cart-line__total"><span class="sr-only">Sous-total : </span>' + PP.price(l.total) + '</span>' +
      '</div></article>';
  }

  function render(focusSelector) {
    var lines = PP.cart.lines();
    if (!lines.length) {
      host.innerHTML =
        '<div class="empty"><p class="empty__title" tabindex="-1">Votre sélection est vide</p>' +
        '<p>Ajoutez des produits depuis le catalogue : ils apparaîtront ici et vous pourrez les commander en une seule fois sur WhatsApp.</p>' +
        '<div class="btn-row"><a class="btn btn--primary" href="consoles-ps5.html">Consoles PS5</a><a class="btn" href="consoles-ps4.html">Consoles PS4</a>' +
        '<a class="btn" href="manettes.html">Manettes</a><a class="btn" href="jeux.html">Jeux</a></div></div>';
      return;
    }
    var count = PP.cart.count();
    host.innerHTML =
      '<div class="cart"><div><div class="cart__lines">' + lines.map(lineHtml).join('') + '</div>' +
        '<p class="cart__clear"><button type="button" class="btn btn--ghost btn--sm" data-clear>Vider la sélection</button></p></div>' +
      '<aside class="summary" aria-label="Récapitulatif">' +
        '<div class="summary__row"><span>' + count + (count > 1 ? ' articles' : ' article') + '</span></div>' +
        '<div class="summary__row"><span>Total affiché</span><strong class="summary__total">' + PP.price(PP.cart.total()) + '</strong></div>' +
        '<div class="field"><label class="field__label" for="place">Ville ou quartier de livraison (facultatif)</label>' +
          '<input class="input" id="place" type="text" autocomplete="address-level2" value="' + esc(place) + '" placeholder="Par exemple : Douala, Bonamoussadi"></div>' +
        '<a class="btn btn--wa btn--lg btn--block" id="send-order" href="' + PP.wa.url(PP.wa.cartMessage(lines, { place: place })) + '" target="_blank" rel="noopener noreferrer">' + PP.icon('whatsapp') + 'Envoyer la commande sur WhatsApp</a>' +
        '<p class="summary__note">Le message de commande est déjà rédigé avec vos produits, les quantités et les prix affichés. Nous confirmons la disponibilité et les modalités de livraison avant tout paiement. Votre sélection reste enregistrée sur cet appareil.</p>' +
      '</aside></div>';
    if (focusSelector) {
      var el = PP.qs(focusSelector);
      if (el) el.focus();
    }
  }

  host.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    var line = t.closest('.cart-line');
    var id = line ? line.getAttribute('data-id') : null;
    // Le rendu est relancé par l'événement pp:cart (déclenché pendant la modification) :
    // on indique avant tout où remettre le focus pour ne pas perdre le clavier.
    if (t.hasAttribute('data-clear')) {
      host.setAttribute('data-refocus', '.empty__title');
      PP.cart.clear();
      return;
    }
    if (!id) return;
    var current = PP.cart.lines().filter(function (l) { return l.product.id === id; })[0];
    if (t.hasAttribute('data-remove')) {
      host.setAttribute('data-refocus', '.cart-line [data-remove], .empty__title');
      PP.cart.remove(id);
    } else if (t.hasAttribute('data-plus')) {
      host.setAttribute('data-refocus', '[data-id="' + id + '"] [data-plus]');
      PP.cart.setQty(id, current.qty + 1);
    } else if (t.hasAttribute('data-minus')) {
      host.setAttribute('data-refocus', '[data-id="' + id + '"] [data-minus]');
      PP.cart.setQty(id, current.qty - 1);
    }
  });

  host.addEventListener('input', function (e) {
    if (e.target.id !== 'place') return;
    place = e.target.value.trim();
    PP.qs('#send-order').href = PP.wa.url(PP.wa.cartMessage(PP.cart.lines(), { place: place }));
  });

  window.addEventListener('pp:cart', function () {
    var focus = host.getAttribute('data-refocus');
    host.removeAttribute('data-refocus');
    render(focus || null);
  });

  render();
})();
