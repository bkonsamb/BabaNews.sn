import ArticleCard from './ArticleCard';
import { Article } from '../types/article';

interface HomePageProps {
  articles: Article[];
  onArticleClick: (id: string) => void;
  activeCategory: string;
  searchQuery: string;
}

export default function HomePage({ articles, onArticleClick, activeCategory, searchQuery }: HomePageProps) {
  const filtered = articles.filter(a => {
    const matchCategory = activeCategory === 'Tous' || a.category === activeCategory;
    const matchSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {searchQuery ? 'Aucun résultat trouvé' : 'Aucun article pour le moment'}
        </h2>
        <p className="text-gray-500">
          {searchQuery
            ? `Aucun article ne correspond à "${searchQuery}"`
            : 'Les articles du jour seront publiés prochainement.'}
        </p>
      </div>
    );
  }

  const [hero, ...rest] = filtered;
  const featured = rest.slice(0, 3);
  const remaining = rest.slice(3);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Search result banner */}
      {searchQuery && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl fade-in">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#c8102e]">{filtered.length}</span> résultat{filtered.length > 1 ? 's' : ''} pour{' '}
            <span className="font-semibold">"{searchQuery}"</span>
          </p>
        </div>
      )}

      {/* Category banner */}
      {activeCategory !== 'Tous' && !searchQuery && (
        <div className="mb-6 flex items-center gap-3 fade-in">
          <span className="w-1 h-8 bg-[#c8102e] rounded-full" />
          <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            {activeCategory}
          </h2>
          <span className="text-gray-400 text-sm">— {filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hero + Featured */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Article */}
          {hero && (
            <div className="fade-in">
              <ArticleCard article={hero} onClick={onArticleClick} variant="hero" />
            </div>
          )}

          {/* Featured Grid */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 fade-in">
              {featured.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={onArticleClick}
                  variant="compact"
                />
              ))}
            </div>
          )}

          {/* Section divider */}
          {remaining.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="w-1 h-6 bg-[#c8102e] rounded-full" />
              <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Plus d'actualités
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Remaining Articles Grid */}
          {remaining.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-in">
              {remaining.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={onArticleClick}
                  variant="featured"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sidebar-sticky space-y-6">
            {/* À la une */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                <span className="w-1 h-6 bg-[#c8102e] rounded-full inline-block" />
                À la une
              </h3>
              <div className="space-y-1">
                {filtered.slice(0, 6).map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={onArticleClick}
                    variant="list"
                  />
                ))}
              </div>
            </div>

            {/* Stats Widget */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-5 text-white">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                📊 En chiffres
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Articles publiés</span>
                  <span className="font-bold text-white">{articles.length}</span>
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Alertes urgentes</span>
                  <span className="font-bold text-[#c8102e]">{articles.filter(a => a.breaking).length}</span>
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Catégories</span>
                  <span className="font-bold text-white">
                    {new Set(articles.map(a => a.category)).size}
                  </span>
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Mise à jour</span>
                  <span className="font-bold text-green-400 text-xs">Auto ✓</span>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-[#c8102e] to-[#9b0c23] rounded-2xl p-5 text-white">
              <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                📧 Newsletter
              </h3>
              <p className="text-red-100 text-sm mb-4">
                Recevez l'essentiel de l'actualité chaque matin.
              </p>
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-red-200 focus:outline-none focus:bg-white/30 mb-2"
              />
              <button className="w-full bg-white text-[#c8102e] font-bold py-2 rounded-lg text-sm hover:bg-red-50 transition-colors">
                S'abonner gratuitement
              </button>
            </div>

            {/* Categories cloud */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                <span className="w-1 h-6 bg-[#c8102e] rounded-full inline-block" />
                Rubriques
              </h3>
              <div className="space-y-2">
                {Array.from(new Set(articles.map(a => a.category))).map(cat => {
                  const count = articles.filter(a => a.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
