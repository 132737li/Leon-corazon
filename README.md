# 🛍️ Berlly Boutique - E-Commerce Responsive

Un site e-commerce moderne et entièrement **responsive** pour Berlly Boutique, spécialisé dans les produits de beauté (visage, cheveux, corps, parfums).

## ✨ Caractéristiques

### 📱 Design Responsive
- **Mobile-first approach** avec CSS optimisé
- **Hamburger menu** avec animation pour les petits écrans
- **Breakpoints** optimisés:
  - 320px - 480px (Extra Small)
  - 481px - 768px (Small)
  - 769px - 1024px (Medium)
  - 1025px+ (Large Desktop)

### 🎨 Grilles Responsives
- **Catégories**: 4 colonnes (desktop) → 2 colonnes (tablette) → 1 colonne (mobile)
- **Produits**: 3 colonnes (desktop) → 2 colonnes (tablette) → 1 colonne (mobile)
- Utilise `grid-template-columns: repeat(auto-fit, minmax(...))`

### 🎯 Optimisations
- Header adaptatif avec logo redimensionné sur mobile
- Footer empilé verticalement sur petits écrans
- Espacement (padding/margin) optimisé pour tous les breakpoints
- Formulaires d'authentification responsive
- Panier responsive avec layout flexible

### 🔐 Authentification
- Connexion / Inscription avec validation
- Gestion de profil utilisateur
- Récupération de mot de passe
- Animations interactives (lampe décorative)

## 🚀 Technologies

- **HTML5** - Structure sémantique
- **CSS3** - Media queries, Flexbox, CSS Grid
- **JavaScript** - Interaction (hamburger menu, cart, authentification)
- **Font Awesome 6.5** - Icônes
- **GSAP** - Animations (optionnel)

## 📂 Structure du Projet

```
berlly-boutique/
├── index.html              # Page d'accueil
├── produits.html           # Catalogue produits
├── panier.html            # Panier
├── connexion.html         # Login
├── inscription.html       # Registre
├── profil.html           # Profil utilisateur
├── css/
│   ├── style.css         # Styles principaux (responsive)
│   ├── auth.css          # Styles authentification
│   └── lamp.css          # Styles animation lampe
├── js/
│   ├── hamburger.js      # Menu hamburger
│   ├── cart.js           # Gestion du panier
│   ├── api.js            # API calls
│   ├── header.js         # Header logic
│   └── auth.js           # Authentification
├── images/               # Assets
└── README.md            # Documentation
```

## 📱 Responsive Breakpoints

### CSS Breakpoints
```css
/* Extra Small (320px - 480px) */
@media (max-width: 480px) { ... }

/* Small (481px - 768px) */
@media (max-width: 768px) { ... }

/* Medium (769px - 1024px) */
@media (max-width: 1024px) { ... }

/* Large (1025px+) */
@media (min-width: 1025px) { ... }
```

## 🎮 Fonctionnalités Principales

### Hamburger Menu
- Clique pour ouvrir/fermer le menu
- Fermeture automatique au clic sur un lien
- Animation smooth du bouton (rotations)
- Se ferme en cliquant en dehors

### Grilles Produits
- Auto-fit responsive avec minmax
- Cards avec hover effects
- Images optimisées (object-fit: cover)

### Formulaires
- Validation côté client
- Layouts flexibles sur mobile
- Labels, inputs, textareas responsive

## 🔧 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/132737li/berlly-boutique.git
cd berlly-boutique
```

2. **Serveur local (optionnel)**
```bash
# Avec Python 3
python -m http.server 8000

# Ou avec Node.js (http-server)
npx http-server
```

3. **Accéder au site**
```
http://localhost:8000
```

## 📸 Screenshots

### Desktop (1200px+)
- Header avec navigation complète
- Grille 4 colonnes pour catégories
- Grille 3 colonnes pour produits

### Tablette (768px)
- Hamburger menu caché
- Grille 2 colonnes pour catégories
- Grille 2 colonnes pour produits

### Mobile (320px)
- Hamburger menu visible
- Grille 1 colonne
- Header compact
- Footer empilé

## 🌐 Déploiement

### GitHub Pages
```bash
# Push sur GitHub
git push origin main

# Activer GitHub Pages
# Settings → Pages → Source: main branch → Save
```

Le site sera accessible à: `https://132737li.github.io/berlly-boutique`

## 📝 Pages

- **index.html** - Accueil avec hero et catégories populaires
- **produits.html** - Catalogue complet
- **visage.html, cheveux.html, corps.html, parfums.html** - Catégories
- **produit.html** - Détail produit
- **panier.html** - Shopping cart
- **connexion.html** - Login avec lampe décorative
- **inscription.html** - Créer compte
- **profil.html** - Profil utilisateur
- **mes-commandes.html** - Historique commandes

## 🎨 Couleurs

- **Primary**: #c2185b (Rose/Magenta)
- **Secondary**: #e2dfdf (Gris clair)
- **Dark**: #181515 (Noir)
- **Success**: #0a7 (Vert)
- **Footer**: rgb(143, 100, 107) (Marron)

## 🐛 Problèmes Connus

Aucun pour l'instant. Signalez les bugs via GitHub Issues.

## 👤 Auteur

- **Développement**: Copilot CLI
- **Propriétaire**: Berlly Boutique
- **Repo**: [132737li/berlly-boutique](https://github.com/132737li/berlly-boutique)

## 📄 Licence

Propriétaire - Berlly Boutique 2026

## 🙏 Remerciements

- Font Awesome pour les icônes
- GSAP pour les animations
- GitHub Pages pour l'hosting

---

**Dernière mise à jour**: Octobre 2026  
**Version**: 1.0 (Responsive Design)
