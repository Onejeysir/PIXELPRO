/*
 * CONFIGURATION CENTRALE — PIXEL PRO
 * ------------------------------------------------------------------
 * Toutes les informations de la boutique sont ici, et nulle part ailleurs :
 * le numéro WhatsApp, le téléphone, les adresses, les horaires, les réseaux
 * sociaux. Modifier ce fichier suffit pour mettre à jour tout le site.
 *
 * Les valeurs marquées « À CONFIRMER » viennent de l'ancien site ou sont des
 * valeurs provisoires : vérifiez-les avant la mise en ligne.
 */
window.PIXELPRO_CONFIG = {

  shop: {
    name: 'PIXEL PRO',
    tagline: 'Consoles PlayStation, manettes et jeux au Cameroun',
    // À CONFIRMER : adresse du site en ligne, sans « / » final.
    // Après changement, lancer : node tools/set-domain.mjs https://votre-domaine.com
    url: 'https://VOTRE-DOMAINE.com',
  },

  contact: {
    // À CONFIRMER : numéro FICTIF. Format international sans « + », sans espace.
    whatsapp: '237670000000',
    // Numéro affiché à l'écran et numéro utilisé pour les appels.
    phoneDisplay: '+237 6 70 00 00 00',
    phoneTel: '+237670000000',
    email: null, // ex. 'contact@votre-domaine.com'. null = non affiché.
  },

  // À CONFIRMER : adresses reprises de l'ancien site.
  // mapUrl : lien Google Maps de l'adresse. Quand il est renseigné, un lien
  // « Voir sur la carte » apparaît sur la page Contact.
  locations: [
    {
      id: 'douala',
      city: 'Douala',
      name: 'Boutique d\'Akwa',
      address: 'Boulevard de la Liberté, Akwa (en face de la pharmacie)',
      mapUrl: null,
    },
    {
      id: 'yaounde',
      city: 'Yaoundé',
      name: 'Point de retrait de Bastos',
      address: 'Nouvelle route Bastos, carrefour Golf',
      mapUrl: null,
    },
  ],

  // À CONFIRMER : horaires repris de l'ancien site.
  hours: [
    { days: 'Lundi au samedi', time: '8 h 30 à 19 h 30' },
    { days: 'Dimanche', time: 'Sur rendez-vous' },
  ],

  // Laissez null pour masquer l'icône. Adresse complète du profil sinon.
  social: {
    facebook: null,
    instagram: null,
    tiktok: null,
    youtube: null,
  },

  currency: { code: 'XAF', label: 'FCFA' },

  // Mode démonstration : tant qu'il est actif, le site affiche un bandeau et
  // remplace les disponibilités par « à confirmer ». Passer à false quand le
  // catalogue (data/catalogue.js) contient les vrais produits et les vrais stocks.
  demo: {
    enabled: true,
    notice: 'Catalogue de démonstration : prix et disponibilités à confirmer sur WhatsApp avant toute commande.',
  },

  // À CONFIRMER : conditions commerciales reprises de l'ancien site.
  commerce: {
    deliveryZones: 'Douala et Yaoundé',
    deliveryDelay: 'sous 24 h',
    payment: ['Orange Money', 'MTN Mobile Money', 'espèces'],
    paymentWhen: 'à la réception ou en boutique',
    inspection: 'Vous contrôlez la console et ses accessoires avant de payer.',
    orderMessage: {
      greetingSingle: 'Bonjour, je souhaite commander :',
      greetingMulti: 'Bonjour, je souhaite commander les produits suivants :',
      closing: 'Merci de me confirmer la disponibilité et les modalités de livraison.',
    },
  },
};
