# 📋 Test Plan - Berlly Boutique Responsive

## Breakpoints à tester

### 1️⃣ Extra Small (320px - 480px)
- ✅ Hamburger menu visible et fonctionnel
- ✅ Logo réduit (50px)
- ✅ Navigation en colonne (display: none, puis flex au clic)
- ✅ Grille catégories: 1 colonne
- ✅ Grille produits: 1 colonne
- ✅ Footer empilé verticalement
- ✅ Header spacing: 12px
- ✅ Formulaires 100% width
- ✅ Pas de scroll horizontal

### 2️⃣ Small (481px - 768px)
- ✅ Hamburger menu visible
- ✅ Logo: 45px
- ✅ Navigation toujours en colonne
- ✅ Grille catégories: 2 colonnes (grid-template-columns)
- ✅ Grille produits: 2 colonnes
- ✅ Footer sections: 2 colonnes
- ✅ Padding sections: 50px 5%
- ✅ Hero height: 350px

### 3️⃣ Medium (769px - 1024px)
- ✅ Hamburger menu CACHÉ
- ✅ Navigation affichée horizontalement
- ✅ Logo: 48px
- ✅ Grille catégories: 2 colonnes (auto-fit)
- ✅ Grille produits: 2 colonnes (auto-fit)
- ✅ Footer: 2 colonnes
- ✅ Header gap: 25px
- ✅ Product detail: 1 colonne

### 4️⃣ Large (1025px+)
- ✅ Hamburger menu CACHÉ (display: none)
- ✅ Navigation horizontale avec gap: 35px
- ✅ Logo: 50px
- ✅ Grille catégories: 4 colonnes
- ✅ Grille produits: 3 colonnes
- ✅ Footer: 3 colonnes (grid)
- ✅ Header avec spacing normal
- ✅ Hero avec gradient et background
- ✅ Max-width respected

## ✨ Fonctionnalités à tester

### Hamburger Menu
- [ ] Clique: menu s'ouvre
- [ ] Clique à nouveau: menu se ferme
- [ ] Animation: rotation des 3 lignes
- [ ] Clique lien: menu se ferme
- [ ] Clique dehors: menu se ferme
- [ ] Aria-label présent
- [ ] Accessibilité: tab navigation

### Images & Media
- [ ] Images responsive (max-width: 100%)
- [ ] Hero background responsive
- [ ] Footer background responsive
- [ ] Logo image scaling correctement

### Forms & Inputs
- [ ] Inputs 100% width sur mobile
- [ ] Labels affichés correctement
- [ ] Boutons 100% width sur petit écran
- [ ] Password visibility toggle fonctionne
- [ ] Autocomplete fonctionne

### Navigation
- [ ] Liens accessibles sur tous les breakpoints
- [ ] Cart icon avec badge visible
- [ ] User menu accessible
- [ ] Guest links spacing OK

### Texte & Typographie
- [ ] Titres lisibles sur petit écran
- [ ] Pas de texte coupé
- [ ] Font sizes scalent correctement
- [ ] Line-height OK pour readability

## 🎯 Vérification Cross-Device

### Desktop (Chrome DevTools - 1920x1080)
```bash
- Hamburger: hidden
- Nav: horizontal
- Grilles: 4/3 colonnes
```

### Tablet (iPad - 768x1024)
```bash
- Hamburger: visible/hidden (selon breakpoint)
- Nav: peut être mobile menu ou horizontal
- Grilles: 2 colonnes
```

### Mobile (iPhone 12 - 390x844)
```bash
- Hamburger: visible
- Nav: vertical dropdown
- Grilles: 1 colonne
- No horizontal scroll
```

### Extra Small (iPhone SE - 375x667)
```bash
- All content readable
- Touch targets > 44px
- No overflow
```

## 🧪 Checklist de Responsiveness

- [ ] **Layout**: Pas de scroll horizontal
- [ ] **Navigation**: Menu accessible à tous les sizes
- [ ] **Grilles**: Columns adjust correctement
- [ ] **Espacement**: Padding/margin proportional
- [ ] **Texte**: Lisible et non coupé
- [ ] **Images**: Scale correctement
- [ ] **Boutons**: Cliquables (touch-friendly)
- [ ] **Formulaires**: Fully responsive
- [ ] **Footer**: Bien disposé
- [ ] **Header**: Adaptatif

## 🔍 DevTools Testing

### Chrome DevTools
1. F12 → Device Toolbar (Ctrl+Shift+M)
2. Tester: iPhone 12, iPad, Desktop
3. Responsive mode: test 320px, 600px, 900px, 1200px
4. Network throttling: Slow 4G
5. Console: No errors

### Firefox
1. F12 → Responsive Design Mode (Ctrl+Shift+M)
2. Mêmes tests que Chrome
3. Vérifier performance

### Safari (Real Device)
- Tester sur vrai iPhone si possible
- Tester sur vrai iPad si possible

## 📊 Performance

- [ ] Lighthouse: Desktop > 90 (Performance)
- [ ] Lighthouse: Mobile > 80 (Performance)
- [ ] CSS file size: < 50KB
- [ ] Images: optimized (.jpg, .png)
- [ ] No console errors
- [ ] No console warnings

## ✅ Final Checklist

- [ ] Tous les breakpoints testés
- [ ] Toutes les pages testées
- [ ] Hamburger menu fonctionne
- [ ] Navigation responsive OK
- [ ] Images responsive
- [ ] Formulaires responsive
- [ ] Footer responsive
- [ ] Pas de scroll horizontal
- [ ] Performances OK
- [ ] Accessible (a11y basics)
- [ ] Ready for GitHub Pages

---

**Tester sur**: Chrome, Firefox, Safari, Mobile
**Temps estimé**: 30-45 minutes
**Date test**: [À remplir]
