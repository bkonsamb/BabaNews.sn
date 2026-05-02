import { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ArticleDetail from './components/ArticleDetail';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import NewsStatsBanner from './components/NewsStatsBanner';
import { useArticles } from './hooks/useArticles';
import { Article } from './types/article';

export default function App() {
  const { articles, loading, error, lastUpdated } = useArticles();
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Update document title when article selected
  useEffect(() => {
    if (selectedArticle) {
      document.title = `${selectedArticle.title} – BabaNews`;
    } else {
      document.title = "BabaNews – L'actualité du jour en temps réel";
    }
  }, [selectedArticle]);

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedArticle]);

  const handleArticleClick = (id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      setSelectedArticle(article);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSelectedArticle(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategory('Tous');
    setSelectedArticle(null);
  };

  const getRelatedArticles = (article: Article) => {
    return articles
      .filter(a => a.id !== article.id && a.category === article.category)
      .slice(0, 5)
      .concat(
        articles
          .filter(a => a.id !== article.id && a.category !== article.category)
          .slice(0, 3)
      );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#c8102e] text-white px-6 py-2 rounded-full hover:bg-[#9b0c23] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">
      <Header
        articles={articles}
        onCategoryChange={handleCategoryChange}
        activeCategory={activeCategory}
        onSearch={handleSearch}
        onArticleClick={handleArticleClick}
      />

      <NewsStatsBanner articles={articles} />

      <div className="flex-1">
        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            relatedArticles={getRelatedArticles(selectedArticle)}
            onBack={handleBack}
            onArticleClick={handleArticleClick}
          />
        ) : (
          <HomePage
            articles={articles}
            onArticleClick={handleArticleClick}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Last updated indicator */}
      {lastUpdated && !selectedArticle && (
        <div className="bg-gray-100 py-2 px-4 text-center">
          <p className="text-xs text-gray-400">
            Dernière mise à jour :{' '}
            {new Date(lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' '}· Actualisation automatique toutes les 5 minutes
          </p>
        </div>
      )}

      <Footer />
    </div>
  );
}
