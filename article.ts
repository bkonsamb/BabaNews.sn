export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  date: string;
  breaking: boolean;
  source: string;
}

export type Category =
  | 'Tous'
  | 'Politique'
  | 'Économie'
  | 'Sport'
  | 'Technologie'
  | 'Santé'
  | 'Éducation'
  | 'Sécurité'
  | 'Environnement'
  | 'Culture'
  | 'International';

export const CATEGORY_COLORS: Record<string, string> = {
  Politique: '#c8102e',
  Économie: '#0369a1',
  Sport: '#16a34a',
  Technologie: '#7c3aed',
  Santé: '#0891b2',
  Éducation: '#d97706',
  Sécurité: '#dc2626',
  Environnement: '#15803d',
  Culture: '#db2777',
  International: '#0284c7',
  Monde: '#0284c7',
  Afrique: '#ea580c',
  Default: '#6b7280',
};

export const CATEGORY_BG: Record<string, string> = {
  Politique: 'bg-red-100 text-red-700',
  Économie: 'bg-blue-100 text-blue-700',
  Sport: 'bg-green-100 text-green-700',
  Technologie: 'bg-purple-100 text-purple-700',
  Santé: 'bg-cyan-100 text-cyan-700',
  Éducation: 'bg-amber-100 text-amber-700',
  Sécurité: 'bg-red-100 text-red-700',
  Environnement: 'bg-emerald-100 text-emerald-700',
  Culture: 'bg-pink-100 text-pink-700',
  International: 'bg-sky-100 text-sky-700',
  Monde: 'bg-sky-100 text-sky-700',
  Afrique: 'bg-orange-100 text-orange-700',
  Default: 'bg-gray-100 text-gray-700',
};
