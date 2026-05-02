import { Article } from '../types/article';

interface NewsStatsBannerProps {
  articles: Article[];
}

export default function NewsStatsBanner({ articles }: NewsStatsBannerProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const breakingCount = articles.filter(a => a.breaking).length;

  return (
    <div className="bg-[#1a1a2e] text-white">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="capitalize text-gray-300">{dateStr}</span>
            {breakingCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#c8102e] rounded-full animate-pulse" />
                <span className="text-red-300 font-semibold">{breakingCount} alerte{breakingCount > 1 ? 's' : ''} urgente{breakingCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{articles.length} articles publiés</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              En direct
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
