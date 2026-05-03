import { useState, useEffect } from 'react';
import { Article } from '../types/article';

interface UseArticlesReturn {
  articles: Article[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export function useArticles(): UseArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        // import.meta.env.BASE_URL vaut '/BabaNews.sn/' en prod, '/' en dev
        // Cela garantit que le fetch pointe toujours vers le bon chemin,
        // que ce soit en local ou sur GitHub Pages.
        const base = import.meta.env.BASE_URL;
        const url = `${base}articles.json?v=${Date.now()}`;

        const response = await fetch(url, {
          cache: 'no-store', // force le rechargement du fichier à chaque appel
        });

        if (!response.ok) {
          throw new Error(`Impossible de charger les articles (HTTP ${response.status})`);
        }

        const data: Article[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Aucun article disponible');
        }

        setArticles(sortArticles(data));
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de chargement';
        console.error('[useArticles] Erreur:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();

    // Actualisation automatique toutes les 5 minutes
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { articles, loading, error, lastUpdated };
}

function sortArticles(data: Article[]): Article[] {
  return [...data].sort((a, b) => {
    // Breaking news en premier
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    // Puis par date décroissante
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
