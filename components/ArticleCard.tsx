import { useState } from 'react';
import { Article, CATEGORY_BG } from '../types/article';

interface ArticleCardProps {
  article: Article;
  onClick: (id: string) => void;
  variant?: 'hero' | 'featured' | 'compact' | 'list';
}

// Couleurs de placeholder par catégorie (gradient CSS, aucune image externe)
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

// Icônes par catégorie
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

function getCategoryBadge(category: string) {
  return CATEGORY_BG[category] || CATEGORY_BG['Default'];
}

function getGradient(category: string) {
  return CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS['Default'];
}

function getIcon(category: string) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['Default'];
}

// Placeholder stylé quand pas d'image RSS
function ImagePlaceholder({ category, className = '' }: { category: string; className?: string }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${getGradient(category)} flex flex-col items-center justify-center gap-2 ${className}`}>
      <span className="text-4xl opacity-80">{getIcon(category)}</span>
      <span className="text-white/60 text-xs font-medium uppercase tracking-widest">{category}</span>
    </div>
  );
}

export default function ArticleCard({ article, onClick, variant = 'featured' }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = !imgError && !!article.image;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (variant === 'hero') {
    return (
      <article
        className="article-card relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg h-[480px] md:h-[560px]"
        onClick={() => onClick(article.id)}
      >
        {hasImage ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 image-skeleton" />}
            <img
              src={article.image!}
              alt={article.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
            />
          </>
        ) : (
          <ImagePlaceholder category={article.category} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            {article.breaking && (
              <span className="breaking-badge bg-[#c8102e] text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wide">
                🔴 Urgent
              </span>
            )}
            <span className={`category-badge px-2.5 py-1 rounded-sm ${getCategoryBadge(article.category)}`}>
              {article.category}
            </span>
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-3 line-clamp-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            {article.title}
          </h2>
          <p className="text-gray-300 text-sm line-clamp-2 mb-4 hidden md:block">{article.summary}</p>
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            <span>{article.source}</span>
            <span>•</span>
            <span>{formatDate(article.date)}</span>
            <span className="ml-auto flex items-center gap-1 text-white/80 hover:text-white transition-colors">
              Lire la suite
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article
        className="article-card flex gap-4 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
        onClick={() => onClick(article.id)}
      >
        <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          {hasImage ? (
            <>
              {!imgLoaded && <div className="w-full h-full image-skeleton" />}
              <img
                src={article.image!}
                alt={article.title}
                className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true); }}
              />
            </>
          ) : (
            <ImagePlaceholder category={article.category} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {article.breaking && (
              <span className="breaking-badge text-xs text-[#c8102e] font-bold">🔴</span>
            )}
            <span className={`category-badge px-2 py-0.5 rounded-sm text-[10px] ${getCategoryBadge(article.category)}`}>
              {article.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400">{formatDate(article.date)}</p>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article
        className="article-card bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm border border-gray-100 group"
        onClick={() => onClick(article.id)}
      >
        <div className="relative h-44 overflow-hidden">
          {hasImage ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 image-skeleton" />}
              <img
                src={article.image!}
                alt={article.title}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true); }}
              />
            </>
          ) : (
            <ImagePlaceholder category={article.category} />
          )}
          {article.breaking && (
            <span className="absolute top-2 left-2 breaking-badge bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
              🔴 Urgent
            </span>
          )}
          <span className={`absolute bottom-2 left-2 category-badge px-2 py-0.5 rounded-sm ${getCategoryBadge(article.category)}`}>
            {article.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {article.title}
          </h3>
          <p className="text-gray-500 text-xs line-clamp-2 mb-3">{article.summary}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{article.source}</span>
            <span>{formatDate(article.date)}</span>
          </div>
        </div>
      </article>
    );
  }

  // Default: featured
  return (
    <article
      className="article-card bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm border border-gray-100 group flex flex-col"
      onClick={() => onClick(article.id)}
    >
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        {hasImage ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 image-skeleton" />}
            <img
              src={article.image!}
              alt={article.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
            />
          </>
        ) : (
          <ImagePlaceholder category={article.category} />
        )}
        {article.breaking && (
          <span className="absolute top-3 left-3 breaking-badge bg-[#c8102e] text-white text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide">
            🔴 Urgent
          </span>
        )}
        <span className={`absolute bottom-3 left-3 category-badge px-2.5 py-1 rounded-sm ${getCategoryBadge(article.category)}`}>
          {article.category}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-[#c8102e] transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">{article.summary}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3 mt-auto">
          <span className="font-medium text-gray-600">{article.source}</span>
          <span>{formatDate(article.date)}</span>
        </div>
      </div>
    </article>
  );
}
