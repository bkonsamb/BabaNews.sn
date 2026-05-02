import { useState, useEffect } from 'react';
import { Article } from '../types/article';

// Since viteSingleFile bundles everything into one HTML,
// we use a smart approach: try to fetch articles.json,
// and if that fails (single-file mode), use embedded data.

interface UseArticlesReturn {
  articles: Article[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// This will be populated by the build process or fallback to embedded data
declare global {
  interface Window {
    __BABANEWS_ARTICLES__?: Article[];
  }
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

        // 1. Check for injected window data (GitHub Pages build)
        if (window.__BABANEWS_ARTICLES__ && window.__BABANEWS_ARTICLES__.length > 0) {
          const sorted = sortArticles(window.__BABANEWS_ARTICLES__);
          setArticles(sorted);
          setLastUpdated(new Date().toISOString());
          setLoading(false);
          return;
        }

        // 2. Try fetching articles.json (dev mode / non-singlefile)
        const cacheBuster = Date.now();
        const response = await fetch(`./articles.json?v=${cacheBuster}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: Article[] = await response.json();
        const sorted = sortArticles(data);
        setArticles(sorted);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        // 3. Fallback to static import
        try {
          const data = await import('../../public/articles.json');
          const articlesData = (data.default || data) as Article[];
          const sorted = sortArticles(articlesData);
          setArticles(sorted);
          setLastUpdated(new Date().toISOString());
        } catch {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { articles, loading, error, lastUpdated };
}

function sortArticles(data: Article[]): Article[] {
  return [...data].sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
