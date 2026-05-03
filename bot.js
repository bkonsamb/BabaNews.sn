#!/usr/bin/env node

/**
 * BabaNews Bot — Script d'automatisation d'articles
 *
 * Fonctionnement :
 *  1. Récupère des flux RSS (Google News + sources africaines)
 *  2. Filtre UNIQUEMENT les articles du JOUR (date réelle système)
 *  3. Génère du contenu via Groq API (style journaliste humain)
 *  4. Sauvegarde dans /public/articles.json
 *  5. Commit + push automatique vers GitHub
 *
 * Variables d'environnement requises :
 *  - GROQ_API_KEY
 *  - GITHUB_TOKEN (optionnel, si push auto)
 */

import { createRequire } from 'module';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import http from 'http';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: 'llama-3.3-70b-versatile',

  // Nombre minimum d'articles à publier par exécution (toutes les 30 min)
  MIN_ARTICLES_PER_RUN: 2,

  // Chemin de sortie — bot.js est à la racine, public/ aussi
  OUTPUT_PATH: path.join(__dirname, 'articles.json'),

  // Flux RSS à surveiller
  RSS_FEEDS: [
    'https://news.google.com/rss/search?q=Sénégal&hl=fr&gl=SN&ceid=SN:fr',
    'https://news.google.com/rss/search?q=Afrique+actualité&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/headlines/section/geo/SN?hl=fr&gl=SN&ceid=SN:fr',
    'https://www.rfi.fr/fr/rss-afrique.xml',
    'https://www.jeuneafrique.com/feed/',
    'https://www.aps.sn/feed/',
  ],

  BREAKING_KEYWORDS: [
    'urgent', 'alerte', 'crise', 'guerre', 'attentat', 'accident',
    'mort', 'décès', 'catastrophe', 'tremblement', 'inondation',
    "coup d'état", 'manifestation', 'émeute', 'grève', 'urgence',
    'sénégal', 'dakar', 'assassinat', 'explosion', 'incendie',
    'naufrage', 'épidémie', 'pandémie', 'ebola',
  ],

  CATEGORIES: {
    politique: ['élection', 'président', 'ministre', 'gouvernement', 'parlement', 'assemblée', 'politique', 'vote', 'diplomatique', 'coalition'],
    economie: ['économie', 'bourse', 'marché', 'investissement', 'croissance', 'inflation', 'budget', 'fiscal', 'finance', 'commerce', 'emploi', 'pib'],
    sport: ['football', 'sport', 'can', 'coupe', 'championnat', 'sénégal sport', 'équipe nationale', 'ligue', 'athlétisme', 'tennis', 'basket'],
    technologie: ['technologie', 'numérique', 'ia', 'intelligence artificielle', 'startup', 'internet', 'crypto', 'blockchain', 'digital', 'application'],
    sante: ['santé', 'maladie', 'hôpital', 'médecin', 'vaccin', 'épidémie', 'covid', 'malaria', 'paludisme', 'oms', 'pharmacie'],
    education: ['éducation', 'école', 'université', 'étudiant', 'formation', 'bac', 'examen', 'enseignant', 'apprentissage'],
    securite: ['sécurité', 'armée', 'police', 'crime', 'terrorisme', 'jihadiste', 'sahel', 'conflit', 'guerre', 'violence'],
    environnement: ['climat', 'environnement', 'écologie', 'déforestation', 'pollution', 'sécheresse', 'inondation', 'énergie renouvelable', 'cop'],
    culture: ['culture', 'art', 'musique', 'cinéma', 'festival', 'patrimoine', 'littérature', 'mode', 'cuisine'],
    international: ['monde', 'international', 'onu', 'usa', 'europe', 'chine', 'france', 'russie', 'ukraine'],
  },

  // Mots vides français pour la déduplication sémantique
  STOP_WORDS: new Set([
    'le','la','les','de','du','des','un','une','en','et','est','au','aux',
    'sur','par','pour','dans','avec','son','sa','ses','leur','leurs','ce',
    'cet','cette','ces','qui','que','qu','à','l','d','s','n','y','se','me',
    'te','il','elle','ils','elles','nous','vous','on','je','tu','mais','ou',
    'donc','or','ni','car','si','ne','pas','plus','très','bien','tout','tous',
    'a','an','the','of','in','to','and','is','are','was','were','has','have',
    'been','be','will','would','can','could','should','may','might','shall',
  ]),
};

// ============================================================
// UTILITAIRES HTTP
// ============================================================

function httpGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BabaNewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
    req.on('error', reject);
  });
}

function groqApiRequest(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.75,
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`Groq API error: ${parsed.error.message}`));
          } else {
            resolve(parsed.choices?.[0]?.message?.content || '');
          }
        } catch (e) {
          reject(new Error(`Failed to parse Groq response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Groq API request timeout')); });
    req.write(body);
    req.end();
  });
}

// ============================================================
// PARSING RSS
// ============================================================

function parseRSSDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch { return null; }
}

function isToday(date) {
  if (!date) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractImageFromRSS(item) {
  const imagePatterns = [
    /<media:content[^>]+url="([^"]+)"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+)"[^>]+type="image/i,
    /<image><url>([^<]+)<\/url>/i,
    /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
    /<img[^>]+src="(https?:\/\/[^"]+)"/i,
    /property="og:image"[^>]+content="([^"]+)"/i,
    /"image"\s*:\s*"(https?:\/\/[^"]+)"/i,
  ];
  for (const pattern of imagePatterns) {
    const match = item.match(pattern);
    if (match?.[1]?.trim().startsWith('http')) return match[1].trim();
  }
  return null;
}

async function resolveGoogleNewsUrl(url) {
  try {
    // Google News redirige vers la source réelle via 301/302
    return new Promise((resolve) => {
      const req = https.get(url, { timeout: 5000 }, (res) => {
        if (res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(url);
        }
        req.destroy();
      });
      req.on('error', () => resolve(url));
      req.on('timeout', () => { req.destroy(); resolve(url); });
    });
  } catch {
    return url;
  }
}

async function fetchOgImage(url) {
  if (!url) return null;
  try {
    // Si c'est une URL Google News, on résout la vraie URL source
    const realUrl = url.includes('news.google.com')
      ? await resolveGoogleNewsUrl(url)
      : url;

    if (realUrl.includes('news.google.com')) return null; // échec résolution

    const html = await httpGet(realUrl, 6000);
    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"[^>]+property="og:image"/i) ||
      html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i);

    const imgUrl = match?.[1]?.trim();
    return imgUrl?.startsWith('http') ? imgUrl : null;
  } catch {
    return null;
  }
}

function extractFromXML(xml, tag) {
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  if (match) {
    return match[1]
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  return '';
}

function parseRSSFeed(xmlContent) {
  const items = [];
  const itemMatches = xmlContent.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXML of itemMatches) {
    const title = extractFromXML(itemXML, 'title');
    const link = extractFromXML(itemXML, 'link');
    const description = extractFromXML(itemXML, 'description');
    const pubDateStr = extractFromXML(itemXML, 'pubDate');
    const pubDate = parseRSSDate(pubDateStr);
    const image = extractImageFromRSS(itemXML);

    if (!title || !pubDate) continue;

    items.push({
      title: title.slice(0, 200),
      link,
      description: description.slice(0, 500),
      pubDate,
      image,
    });
  }
  return items;
}

// ============================================================
// CATÉGORISATION
// ============================================================

function detectCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const map = {
    politique: 'Politique', economie: 'Économie', sport: 'Sport',
    technologie: 'Technologie', sante: 'Santé', education: 'Éducation',
    securite: 'Sécurité', environnement: 'Environnement',
    culture: 'Culture', international: 'International',
  };
  for (const [category, keywords] of Object.entries(CONFIG.CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw))) return map[category] || 'International';
  }
  return 'International';
}

function detectBreaking(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return CONFIG.BREAKING_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

// ============================================================
// DÉDUPLICATION ROBUSTE (URL + titre exact + sémantique)
// ============================================================

/**
 * Normalise un texte : minuscules, sans accents, sans ponctuation
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait les mots-clés significatifs d'un titre (sans mots vides, min 3 chars)
 */
function extractKeywords(title) {
  const normalized = normalizeText(title);
  const words = normalized.split(' ');
  return new Set(
    words.filter(w => w.length >= 3 && !CONFIG.STOP_WORDS.has(w))
  );
}

/**
 * Calcule la similarité de Jaccard entre deux ensembles de mots-clés
 * Retourne un score entre 0 (aucun rapport) et 1 (identiques)
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Déduplication complète :
 * 1. Par URL exacte
 * 2. Par titre normalisé exact
 * 3. Par similarité sémantique (même actu, sources/titres différents)
 *
 * Seuil de similarité : 0.45 (45% de mots-clés communs = même actu)
 */
function deduplicateArticles(items, SIMILARITY_THRESHOLD = 0.45) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const keptKeywords = []; // liste des mots-clés des articles conservés
  const unique = [];

  for (const item of items) {
    // 1. Déduplication par URL
    if (item.link) {
      const cleanUrl = item.link.split('?')[0].toLowerCase();
      if (seenUrls.has(cleanUrl)) {
        console.log(`  🔁 Doublon URL: "${item.title.slice(0, 60)}"`);
        continue;
      }
      seenUrls.add(cleanUrl);
    }

    // 2. Déduplication par titre normalisé exact
    const titleKey = normalizeText(item.title).replace(/\s/g, '').slice(0, 60);
    if (seenTitles.has(titleKey)) {
      console.log(`  🔁 Doublon titre: "${item.title.slice(0, 60)}"`);
      continue;
    }
    seenTitles.add(titleKey);

    // 3. Déduplication sémantique : même actu, titre/source différents
    const keywords = extractKeywords(item.title);
    let isSemDuplicate = false;

    for (const existingKeywords of keptKeywords) {
      const similarity = jaccardSimilarity(keywords, existingKeywords);
      if (similarity >= SIMILARITY_THRESHOLD) {
        console.log(`  🔁 Doublon sémantique (sim=${(similarity * 100).toFixed(0)}%): "${item.title.slice(0, 60)}"`);
        isSemDuplicate = true;
        break;
      }
    }

    if (!isSemDuplicate) {
      keptKeywords.push(keywords);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Déduplication des articles DÉJÀ GÉNÉRÉS vs articles existants dans articles.json
 * Compare les titres générés avec les titres existants (sémantique)
 */
function filterAgainstExisting(newArticles, existingArticles, SIMILARITY_THRESHOLD = 0.45) {
  const existingKeywordSets = existingArticles.map(a =>
    extractKeywords(a.title.replace(/^🔴\s*URGENT\s*:\s*/i, ''))
  );

  return newArticles.filter(article => {
    const keywords = extractKeywords(article.title.replace(/^🔴\s*URGENT\s*:\s*/i, ''));
    for (const existingKw of existingKeywordSets) {
      const similarity = jaccardSimilarity(keywords, existingKw);
      if (similarity >= SIMILARITY_THRESHOLD) {
        console.log(`  🔁 Déjà publié (sim=${(similarity * 100).toFixed(0)}%): "${article.title.slice(0, 60)}"`);
        return false;
      }
    }
    return true;
  });
}

function loadExistingArticles() {
  try {
    if (existsSync(CONFIG.OUTPUT_PATH)) {
      const content = readFileSync(CONFIG.OUTPUT_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[BOT] Impossible de charger articles.json existant:', err.message);
  }
  return [];
}

// ============================================================
// GÉNÉRATION IA (GROQ)
// ============================================================

async function generateArticleContent(rawTitle, rawDescription, category, apiKey) {
  if (!apiKey) {
    console.log('[BOT] Mode sans Groq API — contenu formaté depuis RSS');
    return formatContentWithoutAI(rawTitle, rawDescription);
  }

  const systemPrompt = `Tu es un journaliste professionnel expérimenté qui écrit pour un média d'information francophone couvrant l'Afrique et le monde.

RÈGLES ABSOLUES :
- Style naturel, fluide, professionnel — comme un vrai journaliste
- NE JAMAIS mentionner de date dans le texte
- NE JAMAIS inventer de faits ou de chiffres
- NE JAMAIS révéler que le texte est généré par une IA
- NE PAS utiliser de formules creuses ou de jargon robotique
- Ton neutre et informatif
- Transitions naturelles entre les paragraphes
- Maximum 4 paragraphes de 3-4 phrases chacun
- Adapté au contexte africain, notamment sénégalais`;

  const userPrompt = `Écris un article journalistique complet et naturel en français basé sur ces informations :

TITRE ORIGINAL : ${rawTitle}
DESCRIPTION : ${rawDescription}
CATÉGORIE : ${category}

Rédige uniquement le corps de l'article (4 paragraphes). Pas de titre, pas de résumé séparé. Style journaliste humain, factuel et engageant.`;

  try {
    const content = await groqApiRequest(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      apiKey
    );
    return content.trim();
  } catch (err) {
    console.error(`[GROQ] Erreur génération: ${err.message}`);
    return formatContentWithoutAI(rawTitle, rawDescription);
  }
}

async function generateSummary(title, content, apiKey) {
  if (!apiKey) {
    return content.split('\n').find(p => p.trim().length > 50) || title;
  }
  try {
    const summary = await groqApiRequest(
      [{
        role: 'user',
        content: `Résume cet article en une seule phrase accrocheuse (max 150 caractères), style journaliste, sans mentionner de date :\n\nTITRE: ${title}\nCONTENU: ${content.slice(0, 500)}`,
      }],
      apiKey
    );
    return summary.trim().slice(0, 200);
  } catch {
    return content.split('\n').find(p => p.trim().length > 50) || title;
  }
}

function formatContentWithoutAI(title, description) {
  const intro = description || title;
  return `${intro}

Cette information s'inscrit dans un contexte particulièrement suivi par les observateurs du secteur. Les développements récents témoignent d'une situation en pleine évolution qui mérite une attention soutenue.

Les différentes parties prenantes ont été consultées pour apporter leurs éclairages sur cette question d'actualité. Les analyses disponibles permettent de mieux comprendre les enjeux sous-jacents et les perspectives à court terme.

Selon les informations disponibles, la situation continue d'évoluer. Notre rédaction suit de près ces développements et vous apportera des éléments complémentaires au fur et à mesure de leur disponibilité.`;
}

function generateId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const ts = Date.now().toString(36);
  return `art-${slug}-${ts}`;
}

// ============================================================
// MAIN BOT
// ============================================================

async function runBot() {
  console.log('\n🤖 BabaNews Bot démarré');
  console.log(`📅 Date système: ${getTodayString()}`);
  console.log(`📂 Chemin de sortie: ${CONFIG.OUTPUT_PATH}`);
  console.log(`🔑 Groq API: ${CONFIG.GROQ_API_KEY ? '✅ configurée' : '⚠️ non configurée (mode sans IA)'}`);
  console.log('─'.repeat(50));

  // Chargement des articles existants
  const existingArticles = loadExistingArticles();
  const existingTodayArticles = existingArticles.filter(a => a.date === getTodayString());
  console.log(`📰 Articles existants aujourd'hui: ${existingTodayArticles.length}`);

  // Récupération des flux RSS
  console.log('\n📡 Récupération des flux RSS...');
  const allRawItems = [];

  for (const feedUrl of CONFIG.RSS_FEEDS) {
    try {
      console.log(`  → ${feedUrl.slice(0, 60)}...`);
      const xml = await httpGet(feedUrl);
      const items = parseRSSFeed(xml);
      const todayItems = items.filter(item => isToday(item.pubDate));
      console.log(`     ${items.length} articles trouvés, ${todayItems.length} d'aujourd'hui`);
      allRawItems.push(...todayItems);
    } catch (err) {
      console.warn(`  ⚠️ Erreur sur ${feedUrl}: ${err.message}`);
    }
  }

  console.log(`\n📋 Total articles du jour (RSS brut): ${allRawItems.length}`);

  if (allRawItems.length === 0) {
    console.log('⚠️ Aucun article du jour trouvé dans les flux RSS.');
    console.log('ℹ️ Conservation des articles existants.');
    return;
  }

  // ── Étape 1 : Déduplication des articles RSS entre eux ──
  console.log('\n🔄 Déduplication des articles RSS...');
  const deduplicatedRaw = deduplicateArticles(allRawItems);
  console.log(`✅ ${allRawItems.length} → ${deduplicatedRaw.length} articles uniques après déduplication RSS`);

  // Tri : breaking news en premier, puis par date décroissante
  const sorted = deduplicatedRaw.sort((a, b) => {
    const aBreaking = detectBreaking(a.title, a.description);
    const bBreaking = detectBreaking(b.title, b.description);
    if (aBreaking && !bBreaking) return -1;
    if (!aBreaking && bBreaking) return 1;
    return b.pubDate - a.pubDate;
  });

  // ── Étape 2 : Filtrage contre les articles déjà publiés aujourd'hui ──
  console.log('\n🔍 Filtrage contre les articles déjà publiés...');
  const newCandidates = filterAgainstExisting(sorted, existingTodayArticles);
  console.log(`✅ ${newCandidates.length} articles véritablement nouveaux à traiter`);

  if (newCandidates.length === 0) {
    console.log('ℹ️ Aucun nouvel article à publier (tout est déjà couvert).');
    return;
  }

  // Vérification du minimum requis par exécution
  if (newCandidates.length < CONFIG.MIN_ARTICLES_PER_RUN) {
    console.log(`⚠️ Seulement ${newCandidates.length} nouveaux articles disponibles (minimum: ${CONFIG.MIN_ARTICLES_PER_RUN}).`);
    console.log('ℹ️ Publication des articles disponibles quand même.');
  }

  console.log(`\n⚙️ Articles à générer: ${newCandidates.length}\n`);

  // ── Étape 3 : Génération du contenu via Groq ──
  const newArticles = [];

  for (let i = 0; i < newCandidates.length; i++) {
    const raw = newCandidates[i];
    console.log(`[${i + 1}/${newCandidates.length}] Traitement: "${raw.title.slice(0, 60)}..."`);

    const category = detectCategory(raw.title, raw.description);
    const breaking = detectBreaking(raw.title, raw.description);
    // ← AJOUTE CES LIGNES
  let image = raw.image || null;
  if (!image && raw.link) {
    image = await fetchOgImage(raw.link);
}

    try {
      const content = await generateArticleContent(
        raw.title, raw.description, category, CONFIG.GROQ_API_KEY
      );
      const summary = await generateSummary(raw.title, content, CONFIG.GROQ_API_KEY);

      const article = {
        id: generateId(raw.title),
        title: breaking ? `🔴 URGENT : ${raw.title}` : raw.title,
        summary,
        content,
        image: image || '',
        category,
        date: getTodayString(), // CRITIQUE: toujours généré par le code
        breaking,
        source: 'BabaNews',
        url: raw.link || '',
      };

      newArticles.push(article);
      console.log(`  ✅ Catégorie: ${category} | Breaking: ${breaking ? '🔴 OUI' : 'non'}`);

      // Pause anti rate-limiting Groq
      if (i < newCandidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err) {
      console.error(`  ❌ Erreur: ${err.message}`);
    }
  }

  console.log(`\n✅ ${newArticles.length} nouveaux articles générés`);

  if (newArticles.length === 0) {
    console.log('⚠️ Aucun article généré avec succès.');
    return;
  }

  // ── Étape 4 : Fusion finale (nouveaux + existants du jour) ──
  // Déduplication finale au cas où (sécurité supplémentaire)
  const merged = [...newArticles, ...existingTodayArticles];
  const finalArticles = deduplicateArticles(merged).sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    return 0;
  });

  // ── Étape 5 : Sauvegarde ──
  mkdirSync(path.dirname(CONFIG.OUTPUT_PATH), { recursive: true });
  writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(finalArticles, null, 2), 'utf-8');

  console.log(`\n💾 Sauvegardé: ${CONFIG.OUTPUT_PATH}`);
  console.log(`📊 Total articles publiés aujourd'hui: ${finalArticles.length}`);
  console.log('✅ BabaNews Bot terminé avec succès !');
}

// Lancer le bot
runBot().catch(err => {
  console.error('❌ Erreur fatale du bot:', err);
  process.exit(1);
});
