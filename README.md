# PIXEL PRO — site vitrine PlayStation (Cameroun)

Site statique multi-pages pour une boutique de consoles PlayStation à Douala et Yaoundé.
Le client parcourt le catalogue, prépare une sélection de produits et envoie sa commande
sur WhatsApp. Pas de serveur, pas de base de données, pas de framework : des fichiers HTML,
CSS et JavaScript qui s'hébergent n'importe où.

**État actuel : version de démonstration.** Le catalogue, les prix, les disponibilités, le numéro
WhatsApp et le nom de domaine sont des valeurs provisoires. La liste de ce qu'il faut
renseigner avant la mise en ligne est au point 2.

---

## 1. Ouvrir le site

- **Rapidement** : double-cliquer sur `index.html`. Tout fonctionne sans serveur (polices, panier et
  messages WhatsApp compris). En ouvrant les fichiers ainsi, la console du navigateur peut afficher des
  messages sur le préchargement des polices : ils n'ont aucun effet et n'existent pas une fois le site en ligne.
- **Avec un petit serveur local** (rendu plus proche de la mise en ligne) :
  `python3 -m http.server 8000` dans ce dossier, puis ouvrir `http://localhost:8000`.
- **Mise en ligne** : envoyer le contenu du dossier sur un hébergement statique (Netlify, Vercel,
  GitHub Pages, hébergement mutualisé). `404.html` est utilisé comme page d'erreur par la plupart
  d'entre eux.

## 2. À renseigner avant la mise en ligne

Tout se règle dans `js/config.js` et `data/catalogue.js`. Les valeurs concernées sont
marquées « À CONFIRMER » dans ces fichiers.

| À faire | Où | Remarque |
|---|---|---|
| Vrai numéro WhatsApp | `js/config.js` → `contact.whatsapp` | Actuellement `237670000000`, **numéro factice**. Format international sans `+` ni espace. Le numéro n'existe qu'à cet endroit. |
| Numéro affiché et numéro d'appel | `contact.phoneDisplay`, `contact.phoneTel` | Même numéro que ci-dessus en général. |
| Adresse du site | `shop.url`, puis `node tools/set-domain.mjs https://votre-domaine.com` | Met à jour canonical, Open Graph, données structurées, `sitemap.xml` et `robots.txt`. |
| Adresses des boutiques | `locations` | Reprises de l'ancien site, à vérifier. Ajouter `mapUrl` (lien Google Maps) pour afficher « Voir sur la carte ». |
| Horaires | `hours` | Repris de l'ancien site, à vérifier. |
| Conditions commerciales | `commerce` | Zones et délai de livraison, moyens de paiement, contrôle avant achat. Reprises de l'ancien site, à vérifier : elles apparaissent sur l'accueil, les fiches et la page À propos. |
| Réseaux sociaux | `social` | Laisser `null` pour masquer l'icône. |
| E-mail | `contact.email` | `null` = non affiché. |
| Vrais produits, prix et stocks | `data/catalogue.js` | Voir point 3. |
| Photos | `assets/img/products/` | Voir point 3. |
| Avis clients | `data/avis.js` | Liste vide volontairement : aucun avis n'est inventé. La section n'apparaît qu'avec de vrais avis. |
| Désactiver le mode démonstration | `demo.enabled: false` | À faire en dernier, quand le catalogue est réel. |

**Mode démonstration** (`demo.enabled: true`) : un bandeau l'annonce en haut de chaque page et
tous les produits affichent « Disponibilité à confirmer ». Quand il est désactivé, la
disponibilité réelle de chaque produit s'affiche (« Disponible », « Sur commande », « Épuisé »),
un produit épuisé ne peut plus être ajouté à la sélection (le client peut demander à être prévenu),
et les fiches produit publient leurs données structurées `Product` pour Google.

## 3. Modifier le catalogue

Chaque produit est un bloc dans `data/catalogue.js`. L'en-tête du fichier résume les champs.

```js
{
  id: 'ps5-slim-lecteur-1to',      // identifiant unique, sans espace (sert dans l'adresse de la fiche)
  ref: 'PP-PS5-001',               // référence affichée et envoyée dans le message WhatsApp
  category: 'ps5',                 // ps5 | ps4 | manettes | jeux | accessoires | packs
  name: 'PS5 Slim avec lecteur 1 To',
  condition: 'neuf',               // neuf | occasion
  price: 385000,                   // en FCFA, nombre sans espace
  oldPrice: 420000,                // prix barré, ou null. L'économie affichée est calculée.
  availability: 'disponible',      // disponible | sur-commande | epuise
  featured: true,                  // apparaît dans « Sélection de la boutique » sur l'accueil
  attrs: { etat: 'Neuf', ... },    // valeurs lues par les filtres de la page
  highlights: ['SSD 1 To', ...],   // 2 à 4 points courts sur la carte
  summary: '...', description: '...',
  specs: [['Modèle', '...'], ...], // tableau « Caractéristiques »
  included: ['...'],               // liste « Contenu »
  warranty: '...',
  images: ['ps5-slim-1.jpg'],      // voir ci-dessous
}
```

**Photos.** Déposer les fichiers dans `assets/img/products/` et les citer par leur nom dans `images`
(`images: ['ps5-slim-1.jpg', 'ps5-slim-2.jpg']`). Format conseillé : JPEG ou WebP, 4:3, environ
1200 × 900 px, moins de 150 Ko. La première image est la photo principale, les suivantes forment la
galerie de la fiche. Une liste vide affiche un visuel neutre « Photo à venir ». Une photo qui ne charge pas
est remplacée automatiquement par ce même visuel : la page ne casse jamais.

> **Important.** Dans cette version, 37 des 54 produits pointent vers des images hébergées à
> l'extérieur (`lh3.googleusercontent.com`), reprises de l'ancien site. Ces liens peuvent disparaître
> à tout moment, et je n'ai pas pu vérifier leur contenu depuis mon environnement de travail.
> Les 17 autres produits n'ont pas d'image. Remplacer par les vraies photos de la boutique.

**Coloris d'un même produit.** Donner la même valeur `family` aux variantes et une valeur `color` à
chacune : la fiche affiche des pastilles de coloris qui mènent d'une variante à l'autre.

**Ajouter un produit** : copier un bloc existant de la même catégorie, changer `id` et `ref`
(uniques), puis `node tools/build-sitemap.mjs` pour mettre à jour le plan du site.

**Ajouter un filtre** : ajouter `{ key: 'xxx', label: 'Libellé' }` dans `categories[].filters`
et renseigner `attrs.xxx` sur les produits.

## 4. Structure

```
index.html  consoles-ps5.html  consoles-ps4.html  manettes.html  jeux.html
accessoires.html  promotions.html  a-propos.html  contact.html
produit.html      fiche produit dynamique : produit.html?id=<id du produit>
panier.html       « Ma sélection » + commande WhatsApp récapitulative
recherche.html    résultats de recherche (noindex)
404.html          page introuvable (noindex)
sitemap.xml  robots.txt

css/tokens.css    variables du système de design (couleurs, espacements, typographie)
css/site.css      composants et mises en page (mobile d'abord)
js/config.js      CONFIGURATION CENTRALE (numéro, adresses, horaires, conditions, mode démo)
data/catalogue.js catalogue de démonstration
data/avis.js      avis clients (vide)
js/core.js        outils, catalogue, sélection (panier), messages WhatsApp
js/ui.js          en-tête, pied de page, cartes produit, bouton WhatsApp flottant
js/icons.js       sprite d'icônes (généré)
js/pages/*.js     un script par type de page (accueil, listes, fiche, panier, contact)
assets/           polices, logo, favicon, image de partage, photos produits, licences
tools/            3 scripts utilitaires (point 6)
```

Principes de construction :

- **Un seul endroit pour chaque information.** Le numéro WhatsApp, les adresses et les horaires sont
  lus dans `js/config.js` par le script de chaque page ; ils ne sont écrits dans aucun fichier HTML.
  L'en-tête et le pied de page sont générés par `js/ui.js`, donc un changement de menu se fait une seule fois.
- **Le catalogue pilote tout.** Cartes, filtres, fiches, tableaux comparatifs, prix de départ de l'accueil,
  plan du site : tout est calculé à partir de `data/catalogue.js`.
- **La sélection** est enregistrée dans le navigateur du client (`localStorage`), avec uniquement
  l'identifiant et la quantité. Les prix sont toujours relus dans le catalogue, donc une modification de
  prix se répercute sur une sélection déjà préparée.
- **Sans JavaScript**, le catalogue ne s'affiche pas (il est construit par script). Un message l'explique.

## 5. Commande WhatsApp

Le bouton ouvre `https://wa.me/<numéro>?text=<message>`. Pour un produit :

```
Bonjour, je souhaite commander :

Produit : PS5 Slim avec lecteur 1 To
Référence : PP-PS5-001
Quantité : 1
Prix affiché : 385 000 FCFA

Merci de me confirmer la disponibilité et les modalités de livraison.
```

Pour plusieurs produits, la page « Ma sélection » envoie un récapitulatif numéroté avec les sous-totaux,
le total affiché et, si le client l'a saisi, sa ville ou son quartier. Une sélection d'un seul produit
utilise le format simple ci-dessus. Les textes d'introduction et de conclusion se modifient dans
`commerce.orderMessage` (`js/config.js`).

Boutons WhatsApp : bouton flottant (toutes les pages sauf fiche produit et sélection), cartes produit,
fiches produit (avec barre d'achat fixe sur mobile), promotions, page Contact, en-tête et pied de page.

Le formulaire de la page Contact n'envoie rien à un serveur : il prépare un message et ouvre WhatsApp.

## 6. Outils (facultatifs)

Ils demandent Node.js 18 ou plus. Le site lui-même n'en a pas besoin.

- `node tools/set-domain.mjs https://votre-domaine.com` : remplace l'adresse du site partout
  (option `--dry-run` pour simuler), puis régénère `sitemap.xml` et `robots.txt`.
- `node tools/build-sitemap.mjs` : régénère `sitemap.xml` (9 pages et une adresse par produit) et `robots.txt`.
  À relancer après avoir ajouté ou retiré des produits.
- `node tools/build-icons.mjs` : régénère `js/icons.js`. Il faut d'abord
  `npm install --no-save lucide-static simple-icons`. Utile seulement pour ajouter une icône.

## 7. Design

- **Palette** : bleu nuit (`#0b1b3a`) pour l'en-tête et le pied de page, bleu (`#0a5be0`) pour l'action
  principale, vert WhatsApp (`#0f7f43`) réservé aux actions WhatsApp, rouge (`#c0271d`) réservé aux
  économies. Fond clair neutre. Les couleurs sont des variables dans `css/tokens.css`.
- **Typographie** : Barlow (texte) et Barlow Semi Condensed (titres et prix), hébergées dans
  `assets/fonts/`. Aucune requête vers un service de polices tiers.
- **Icônes** : une seule famille, Lucide, plus les logos de marques de Simple Icons. Aucune icône dessinée
  à la main, aucun emoji.
- **Éléments propres au site** : le tableau « Nos rayons » de l'accueil (prix de départ calculés par rayon),
  les puces carrées « pixel » pour les listes et les disponibilités, les chiffres condensés pour les prix.
- Aucune animation permanente, aucun dégradé décoratif, aucun effet de verre.

## 8. SEO

Chaque page a son titre, sa description, son adresse canonique, ses balises Open Graph et Twitter,
une seule balise `h1` et un ordre de titres cohérent. Les pages « Ma sélection », « Recherche » et
« 404 » sont en `noindex`. Les fiches produit ont leur titre, leur description et leur adresse
canonique construits à partir des données du produit. Données structurées : `Store` sur l'accueil,
`BreadcrumbList` sur les fiches, `Product` sur les fiches une fois le mode démonstration désactivé.

L'adresse des fiches est de la forme `produit.html?id=...` : c'est le prix de l'absence de serveur.
Elle fonctionne et le plan du site la déclare, mais des adresses du type `/produit/ps5-slim` demanderaient
une règle de réécriture côté hébergeur.

## 9. Tests effectués

Tous exécutés sur ce dossier, avec Chromium piloté par Playwright :

- **49 tests fonctionnels** : ajout au panier depuis les cartes et la fiche, compteur, notification,
  persistance, quantités, retrait, vidage, message WhatsApp pour 1 produit, plusieurs produits,
  quantité supérieure à 1 et ville de livraison (le numéro n'apparaît que dans l'adresse `wa.me`),
  galerie, coloris, filtres, tri, recherche sans accents ni casse, formulaire de contact (erreurs puis
  message), produit inconnu, mode réel (épuisé, sur commande), images bloquées, menu mobile et touche Échap.
- **130 contrôles de mise en page** : 13 pages × 10 largeurs (320, 360, 375, 390, 414, 768, 1024, 1280,
  1440, 1920 px). Aucun débordement horizontal, aucun élément hors écran, aucun texte coupé. Sur mobile,
  boutons, champs et icônes font au moins 44 px de haut ; seuls les liens placés dans une phrase
  (fil d'Ariane, pied de page, nom d'un produit dans la sélection) sont plus petits.
- **Accessibilité** : 26 analyses axe-core (WCAG 2.0, 2.1 et 2.2 niveaux A et AA, plus bonnes pratiques) sans
  violation ; lien d'évitement, focus visible et noms accessibles vérifiés au clavier ; états sans JavaScript.
- **SEO** : titres, descriptions, canonical, Open Graph, favicon, `h1` unique et `alt` contrôlés sur les 13 pages.
- **Performance** (réseau « 3G rapide » et processeur ralenti 4 fois) : environ 260 Ko et 15 requêtes par page
  (dont 111 Ko de polices). Décalage de mise en page (CLS) de 0 sur mobile et d'au plus 0,02 sur ordinateur
  (le seuil « bon » est 0,1). Premier affichage entre 0,8 et 0,9 s sur la plupart des pages, 1,5 à 1,7 s sur la
  fiche produit et la page 404, dont le contenu est construit par script. Console du navigateur sans erreur ni
  avertissement (hors rappel volontaire du numéro factice).

**Non vérifié** :

- Les images externes du catalogue (voir point 3).
- L'ouverture réelle de WhatsApp : l'accès à `wa.me` est bloqué dans mon environnement ; j'ai vérifié
  l'adresse et le texte du message, pas la conversation elle-même.
- Safari, Firefox et vrais téléphones : seul Chromium a été utilisé. Le site s'appuie sur des fonctions CSS et
  JavaScript courantes (grille, `aspect-ratio`, `localStorage`) ; un très vieux navigateur Android peut
  afficher une mise en page dégradée.
- Aucun audit Lighthouse complet n'a été lancé : les mesures ci-dessus viennent de mes propres scripts.

## 10. Limites connues

- Pas de paiement en ligne, pas de gestion de stock, pas de compte client : c'est une vitrine qui
  mène à une conversation WhatsApp. Les stocks se tiennent à la main dans `data/catalogue.js`.
- Le catalogue est un fichier à éditer. Pour une gestion plus confortable (interface d'administration),
  il faudra passer à un système avec base de données.
- Tant que le numéro et l'adresse du site sont provisoires, le plan du site et les liens de partage
  pointent vers `https://VOTRE-DOMAINE.com`.

## 11. Licences

Polices Barlow et Barlow Semi Condensed : SIL Open Font License 1.1. Icônes d'interface Lucide : licence ISC.
Logos de marques Simple Icons : CC0. Les textes de licence sont dans `assets/licences/`.
#   P I X E L P R O  
 