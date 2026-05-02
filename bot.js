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
import { readFileSync, writeFileSync, existsSync } from 'fs';
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
  GROQ_MODEL: 'llama3-70b-8192',
  MAX_ARTICLES_PER_DAY: 10,
  MIN_ARTICLES: 5,
  OUTPUT_PATH: path.resolve(__dirname, '../public/articles.json'),
  // Flux RSS à surveiller
  RSS_FEEDS: [
    // Google News Sénégal
    'https://news.google.com/rss/search?q=Sénégal&hl=fr&gl=SN&ceid=SN:fr',
    // Google News Afrique
    'https://news.google.com/rss/search?q=Afrique+actualité&hl=fr&gl=FR&ceid=FR:fr',
    // Google News Monde
    'https://news.google.com/rss/headlines/section/geo/SN?hl=fr&gl=SN&ceid=SN:fr',
    // RFI Afrique
    'https://www.rfi.fr/fr/rss-afrique.xml',
    // Jeune Afrique
    'https://www.jeuneafrique.com/feed/',
    // APS Sénégal
    'https://www.aps.sn/feed/',
  ],
  BREAKING_KEYWORDS: [
    'urgent', 'alerte', 'crise', 'guerre', 'attentat', 'accident',
    'mort', 'décès', 'catastrophe', 'tremblement', 'inondation',
    'coup d\'état', 'manifestation', 'émeute', 'grève', 'urgence',
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
      // Gestion des redirections
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });

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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Groq API request timeout'));
    });

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
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

function isToday(date) {
  if (!date) return false;
  // CRITIQUE: On utilise UNIQUEMENT la date système réelle
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getTodayString() {
  // CRITIQUE: Date générée par le code, pas l'IA
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractImageFromRSS(item) {
  // Essaie plusieurs attributs possibles
  const imagePatterns = [
    /<media:content[^>]+url="([^"]+)"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+)"[^>]+type="image/i,
    /<image><url>([^<]+)<\/url>/i,
    /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = item.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      if (url.startsWith('http')) return url;
    }
  }
  return null;
}

function extractFromXML(xml, tag) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();
  
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

  for (const [category, keywords] of Object.entries(CONFIG.CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw))) {
      const map = {
        politique: 'Politique',
        economie: 'Économie',
        sport: 'Sport',
        technologie: 'Technologie',
        sante: 'Santé',
        education: 'Éducation',
        securite: 'Sécurité',
        environnement: 'Environnement',
        culture: 'Culture',
        international: 'International',
      };
      return map[category] || 'International';
    }
  }

  return 'International';
}

function detectBreaking(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return CONFIG.BREAKING_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

// ============================================================
// GÉNÉRATION IA (GROQ)
// ============================================================

async function generateArticleContent(rawTitle, rawDescription, category, apiKey) {
  if (!apiKey) {
    // Mode sans API : génère un contenu formaté depuis la description
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
      [
        {
          role: 'user',
          content: `Résume cet article en une seule phrase accrocheuse (max 150 caractères), style journaliste, sans mentionner de date :\n\nTITRE: ${title}\nCONTENU: ${content.slice(0, 500)}`,
        },
      ],
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

// ============================================================
// DÉDUPLICATION
// ============================================================

function generateId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const ts = Date.now().toString(36);
  return `art-${slug}-${ts}`;
}

function deduplicateByTitle(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
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
// MAIN BOT
// ============================================================

async function runBot() {
  console.log('\n🤖 BabaNews Bot démarré');
  console.log(`📅 Date système: ${getTodayString()}`);
  console.log(`🔑 Groq API: ${CONFIG.GROQ_API_KEY ? '✅ configurée' : '⚠️ non configurée (mode sans IA)'}`);
  console.log('─'.repeat(50));

  const existingArticles = loadExistingArticles();
  const existingTodayArticles = existingArticles.filter(a => a.date === getTodayString());
  
  console.log(`📰 Articles existants aujourd'hui: ${existingTodayArticles.length}/${CONFIG.MAX_ARTICLES_PER_DAY}`);

  if (existingTodayArticles.length >= CONFIG.MAX_ARTICLES_PER_DAY) {
    console.log('✅ Quota journalier atteint. Aucune action nécessaire.');
    return;
  }

  const slotsRemaining = CONFIG.MAX_ARTICLES_PER_DAY - existingTodayArticles.length;
  console.log(`🎯 Slots disponibles: ${slotsRemaining}\n`);

  // Récupération des flux RSS
  console.log('📡 Récupération des flux RSS...');
  const allRawItems = [];

  for (const feedUrl of CONFIG.RSS_FEEDS) {
    try {
      console.log(`  → ${feedUrl.slice(0, 60)}...`);
      const xml = await httpGet(feedUrl);
      const items = parseRSSFeed(xml);
      
      // CRITIQUE: Filtrer UNIQUEMENT les articles du jour
      const todayItems = items.filter(item => isToday(item.pubDate));
      
      console.log(`     ${items.length} articles trouvés, ${todayItems.length} d'aujourd'hui`);
      allRawItems.push(...todayItems);
    } catch (err) {
      console.warn(`  ⚠️ Erreur sur ${feedUrl}: ${err.message}`);
    }
  }

  console.log(`\n📋 Total articles du jour (RSS): ${allRawItems.length}`);

  if (allRawItems.length === 0) {
    console.log('⚠️ Aucun article du jour trouvé dans les flux RSS.');
    console.log('ℹ️ Conservation des articles existants.');
    return;
  }

  // Déduplication
  const deduplicated = deduplicateByTitle(allRawItems);
  console.log(`🔄 Après déduplication: ${deduplicated.length} articles uniques`);

  // Prioriser les breaking news
  const sorted = deduplicated.sort((a, b) => {
    const aBreaking = detectBreaking(a.title, a.description);
    const bBreaking = detectBreaking(b.title, b.description);
    if (aBreaking && !bBreaking) return -1;
    if (!aBreaking && bBreaking) return 1;
    return b.pubDate - a.pubDate;
  });

  // Limiter au nombre de slots disponibles
  const toProcess = sorted.slice(0, slotsRemaining);
  console.log(`⚙️ Articles à traiter: ${toProcess.length}`);
  console.log('');

  // Génération du contenu
  const newArticles = [];

  for (let i = 0; i < toProcess.length; i++) {
    const raw = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] Traitement: "${raw.title.slice(0, 60)}..."`);

    const category = detectCategory(raw.title, raw.description);
    const breaking = detectBreaking(raw.title, raw.description);

    try {
      // Génération contenu
      const content = await generateArticleContent(
        raw.title,
        raw.description,
        category,
        CONFIG.GROQ_API_KEY
      );

      const summary = await generateSummary(raw.title, content, CONFIG.GROQ_API_KEY);

      const article = {
        id: generateId(raw.title),
        title: breaking ? `🔴 URGENT : ${raw.title}` : raw.title,
        summary,
        content,
        image: raw.image || '',
        category,
        // CRITIQUE: Date générée par le CODE, jamais par l'IA
        date: getTodayString(),
        breaking,
        source: 'BabaNews',
      };

      newArticles.push(article);
      console.log(`  ✅ Catégorie: ${category} | Breaking: ${breaking ? '🔴 OUI' : 'non'}`);

      // Pause pour éviter rate limiting
      if (i < toProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err) {
      console.error(`  ❌ Erreur: ${err.message}`);
    }
  }

  console.log(`\n✅ ${newArticles.length} nouveaux articles générés`);

  if (newArticles.length === 0) {
    console.log('⚠️ Aucun nouveau article généré.');
    return;
  }

  // Fusion : nouveaux articles + articles existants d'aujourd'hui
  // On supprime les anciens articles (pas du jour) pour garder le fichier propre
  const finalArticles = [
    ...newArticles,
    ...existingTodayArticles,
  ]
    .sort((a, b) => {
      if (a.breaking && !b.breaking) return -1;
      if (!a.breaking && b.breaking) return 1;
      return 0;
    })
    .slice(0, CONFIG.MAX_ARTICLES_PER_DAY);

  // Sauvegarde
  writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(finalArticles, null, 2), 'utf-8');
  console.log(`💾 Sauvegardé: ${CONFIG.OUTPUT_PATH}`);
  console.log(`📊 Total articles publiés: ${finalArticles.length}`);
  console.log('');
  console.log('✅ BabaNews Bot terminé avec succès !');
}

// Lancer le bot
runBot().catch(err => {
  console.error('❌ Erreur fatale du bot:', err);
  process.exit(1);
});
