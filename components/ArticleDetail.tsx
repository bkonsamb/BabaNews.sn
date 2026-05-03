import { useState } from 'react';
import { Article, CATEGORY_BG } from '../types/article';

interface ArticleDetailProps {
  article: Article;
  relatedArticles: Article[];
  onBack: () => void;
  onArticleClick: (id: string) => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Politique:      'from-blue-800 to-blue-600',
  Économie:       'from-emerald-800 to-emerald-600',
  Sport:          'from-orange-700 to-orange-500',
  Technologie:    'from-violet-800 to-violet-600',
  Santé:          'from-teal-700 to-teal-500',
  Éducation:      'from-sky-700 to-sky-500',
  Environnement:  'from-green-800 to-green-600',
  Sécurité:       'from-red-900 to-red-700',
  International:  'from-gray-700 to-gray-500',
  Culture:        'from-pink-700 to-pink-500',
  Default:        'from-gray-700 to-gray-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  Politique:      '🏛️',
  Économie:       '📈',
  Sport:          '⚽',
  Technologie:    '💻',
  Santé:          '🏥',
  Éducation:      '📚',
  Environnement:  '🌿',
  Sécurité:       '🛡️',
  International:  '🌍',
  Culture:        '🎭',
  Default:        '📰',
};

function ImagePlaceholder({ category }: { category: string }) {
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS['Default'];
  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS['Default'];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
      <span className="text-6xl opacity-80">{icon}</span>
      <span className="text-white/60 text-sm font-medium uppercase tracking-widest">{category}</span>
    </div>
  );
}

export default function ArticleDetail({ article, relatedArticles, onBack, onArticleClick }: ArticleDetailProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = !imgError && !!article.image;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const categoryBadge = CATEGORY_BG[article.category] || CATEGORY_BG['Default'];
  const paragraphs = article.content.split('\n').filter(p => p.trim().length > 0);
  const estimatedReadTime = Math.ceil(article.content.split(' ').length / 200);

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={onBack} className="hover:text-[#c8102e] transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Accueil
            </button>
            <span>/</span>
            <button className={`px-2 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wide ${categoryBadge}`}>
              {article.category}
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {article.breaking && (
                    <span className="breaking-badge bg-[#c8102e] text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wide">
                      🔴 Alerte
                    </span>
                  )}
                  <span className={`category-badge px-3 py-1 rounded-sm ${categoryBadge}`}>
                    {article.category}
                  </span>
                  <span className="text-gray-400 text-xs ml-auto">{estimatedReadTime} min de lecture</span>
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {article.title}
                </h1>

                <p className="text-lg text-gray-600 font-medium leading-relaxed mb-6 border-l-4 border-[#c8102e] pl-4">
                  {article.summary}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#c8102e] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">B</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{article.source}</p>
                      <p className="text-xs">Rédaction</p>
                    </div>
                  </div>
                  <span className="text-gray-300">|</span>
                  <time dateTime={article.date} className="capitalize">
                    {formatDate(article.date)}
                  </time>
                </div>
              </div>

              {/* Image ou placeholder */}
              <div className="relative overflow-hidden h-64 md:h-96">
                {hasImage ? (
                  <>
                    {!imgLoaded && <div className="absolute inset-0 image-skeleton" />}
                    <img
                      src={article.image!}
                      alt={article.title}
                      className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => { setImgError(true); setImgLoaded(true); }}
                    />
                  </>
                ) : (
                  <ImagePlaceholder category={article.category} />
                )}
              </div>

              {/* Contenu */}
              <div className="p-6 md:p-8">
                <div className="prose-article max-w-none">
                  {paragraphs.map((para, index) => (
                    <p
                      key={index}
                      className={`mb-5 leading-relaxed ${
                        index === 0
                          ? 'text-lg font-semibold text-gray-800'
                          : 'text-gray-600 text-base'
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Partage */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Partager :</span>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: article.title, text: article.summary, url: window.location.href });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                          }
                        }}
                        className="flex items-center gap-1.5 bg-[#c8102e] text-white px-4 py-2 rounded-full text-sm hover:bg-[#9b0c23] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Partager
                      </button>
                      <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm hover:bg-gray-50 transition-colors"
                      >
                        ← Retour
                      </button>
                    </div>
                    <span className={`category-badge px-3 py-1 rounded-full ${categoryBadge}`}>
                      #{article.category}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sidebar-sticky space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <span className="w-1 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                  À lire aussi
                </h3>
                <div className="space-y-1">
                  {relatedArticles.slice(0, 5).map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => onArticleClick(rel.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-800 group-hover:text-[#c8102e] transition-colors line-clamp-2 leading-snug block">
                        {rel.title}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">{rel.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#c8102e] to-[#9b0c23] rounded-2xl p-5 text-white">
                <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Newsletter
                </h3>
                <p className="text-red-100 text-sm mb-4">
                  Recevez l'actualité du jour directement dans votre boîte mail.
                </p>
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-red-200 focus:outline-none focus:bg-white/30 mb-2"
                />
                <button className="w-full bg-white text-[#c8102e] font-bold py-2 rounded-lg text-sm hover:bg-red-50 transition-colors">
                  S'abonner
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <span className="w-1 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                  Catégories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Politique', 'Économie', 'Sport', 'Technologie', 'Santé', 'Environnement', 'Culture'].map(cat => (
                    <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-red-50 hover:text-[#c8102e] cursor-pointer transition-colors">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
