/*
 * PIXEL PRO — page Contact : coordonnées issues de la configuration et formulaire.
 * Le site n'a pas de serveur : le formulaire prépare un message et ouvre WhatsApp.
 */
(function () {
  'use strict';

  var PP = window.PP;
  if (!PP) return;
  var esc = PP.esc;
  var CFG = PP.cfg;

  var info = PP.qs('#contact-info');
  if (info) {
    var c = CFG.contact;
    var item = function (icon, title, body) {
      return '<div class="contact-item">' + PP.icon(icon) + '<div><strong>' + title + '</strong>' + body + '</div></div>';
    };
    var places = CFG.locations.map(function (l) {
      return '<p>' + esc(l.name) + ', ' + esc(l.city) + '<br>' + esc(l.address) +
        (l.mapUrl ? '<br><a href="' + esc(l.mapUrl) + '" target="_blank" rel="noopener noreferrer">Voir sur la carte</a>' : '') + '</p>';
    }).join('');
    info.innerHTML =
      item('whatsapp', 'WhatsApp', '<p>Pour commander ou poser une question, c\'est le plus rapide.</p><p><a href="' + PP.wa.url(PP.wa.generalMessage()) + '" target="_blank" rel="noopener noreferrer">Ouvrir une conversation</a></p>') +
      item('phone', 'Téléphone', '<p><a href="tel:' + esc(c.phoneTel) + '">' + esc(c.phoneDisplay) + '</a></p>') +
      (c.email ? item('mail', 'E-mail', '<p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p>') : '') +
      item('map-pin', 'Nous trouver', places) +
      item('clock', 'Horaires', '<p>' + CFG.hours.map(function (h) { return esc(h.days) + ' : ' + esc(h.time); }).join('<br>') + '</p>');
  }

  var form = PP.qs('#contact-form');
  if (!form) return;
  var status = PP.qs('#form-status');

  function fieldError(input, message) {
    var err = PP.qs('#' + input.id + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = message;
    } else {
      input.removeAttribute('aria-invalid');
      err.textContent = '';
    }
    return !message;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name;
    var message = form.elements.message;
    var okName = fieldError(name, name.value.trim() ? '' : 'Indiquez votre nom.');
    var okMsg = fieldError(message, message.value.trim().length >= 5 ? '' : 'Écrivez votre message (au moins quelques mots).');
    if (!okName || !okMsg) {
      (okName ? message : name).focus();
      status.textContent = '';
      return;
    }
    var text = PP.wa.contactMessage({
      name: name.value.trim(),
      phone: form.elements.phone.value.trim(),
      topic: form.elements.topic.value,
      message: message.value.trim(),
    });
    var url = PP.wa.url(text);
    var win = window.open(url, '_blank', 'noopener');
    if (!win) window.location.href = url;
    status.textContent = 'WhatsApp s\'ouvre avec votre message prêt à envoyer. Si rien ne s\'affiche, utilisez le bouton « Écrire sur WhatsApp ».';
  });
})();
