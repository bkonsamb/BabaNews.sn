# 🗞️ BabaNews — Site d'actualité automatisé

**BabaNews** est un site d'actualité moderne, entièrement automatisé, publiant des articles du jour via une pipeline :

```
RSS → Bot Node.js → Groq IA → articles.json → GitHub Pages
```

## 🚀 Déploiement rapide

### 1. Fork / Clone

```bash
git clone https://github.com/TON_USERNAME/babanews.git
cd babanews
npm install
```

### 2. Configuration GitHub Pages

Dans votre repo GitHub :
- Allez dans **Settings → Pages**
- Source : **GitHub Actions**

### 3. Configuration de la clé Groq

- Créez un compte sur [console.groq.com](https://console.groq.com)
- Générez une clé API gratuite
- Dans GitHub : **Settings → Secrets → Actions**
- Ajoutez le secret : `GROQ_API_KEY` = votre clé

### 4. Activation des GitHub Actions

Dans **Settings → Actions → General** :
- ✅ Allow all actions
- ✅ Read and write permissions

### 5. Premier déploiement

```bash
git push origin main
```

Le workflow se déclenchera automatiquement et déploiera le site.

---

## ⚙️ Architecture

```
babanews/
├── public/
│   └── articles.json          # Articles générés (mis à jour auto)
├── src/
│   ├── components/
│   │   ├── Header.tsx         # Navigation + Breaking ticker
│   │   ├── HomePage.tsx       # Page principale
│   │   ├── ArticleCard.tsx    # Cartes articles
│   │   ├── ArticleDetail.tsx  # Page article complet
│   │   ├── Footer.tsx         # Pied de page
│   │   └── LoadingScreen.tsx  # Écran de chargement
│   ├── hooks/
│   │   └── useArticles.ts     # Hook fetch articles.json
│   ├── types/
│   │   └── article.ts         # Types TypeScript
│   └── App.tsx                # Composant principal
├── scripts/
│   └── bot.js                 # Bot de génération d'articles
├── .github/
│   └── workflows/
│       ├── bot.yml            # Bot auto (toutes les 30 min)
│       └── deploy.yml         # Deploy on push
└── README.md
```

---

## 🤖 Fonctionnement du Bot

Le bot (`scripts/bot.js`) :

1. **Récupère** les flux RSS (Google News, RFI, Jeune Afrique, APS)
2. **Filtre** UNIQUEMENT les articles du jour (date système, jamais IA)
3. **Génère** le contenu via Groq API (style journaliste humain)
4. **Limite** à 10 articles maximum par jour
5. **Sauvegarde** dans `public/articles.json`
6. **Commit** automatiquement sur GitHub

### Lancer le bot manuellement

```bash
GROQ_API_KEY=votre_clé node scripts/bot.js
```

---

## 📅 Automatisation (GitHub Actions)

Le bot tourne **toutes les 30 minutes** entre 6h et 23h UTC.

Pour déclencher manuellement :
- GitHub → **Actions** → **BabaNews Bot** → **Run workflow**

---

## 🔑 Règles critiques

| Règle | Implémentation |
|-------|----------------|
| 100% statique | Vite + React, pas de serveur |
| Articles du jour uniquement | Filtre `isToday()` sur pubDate RSS |
| Date générée par le code | `getTodayString()` — jamais l'IA |
| Max 10 articles/jour | `CONFIG.MAX_ARTICLES_PER_DAY = 10` |
| Breaking news auto | Détection mots-clés `BREAKING_KEYWORDS` |
| Style journaliste humain | Prompt Groq optimisé |

---

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Tester le bot (sans Groq)
node scripts/bot.js

# Tester le bot (avec Groq)
GROQ_API_KEY=gsk_xxx node scripts/bot.js

# Build production
npm run build
```

---

## 📊 Structure `articles.json`

```json
[
  {
    "id": "art-001",
    "title": "Titre de l'article",
    "summary": "Résumé en une phrase",
    "content": "Corps complet de l'article...",
    "image": "https://url-image.jpg",
    "category": "Politique",
    "date": "2026-06-10",
    "breaking": false,
    "source": "BabaNews"
  }
]
```

---

## 🌐 Catégories disponibles

- 🔴 Politique
- 💰 Économie  
- ⚽ Sport
- 💻 Technologie
- 🏥 Santé
- 📚 Éducation
- 🛡️ Sécurité
- 🌿 Environnement
- 🎭 Culture
- 🌍 International

---

## 📄 Licence

MIT — Projet open source
