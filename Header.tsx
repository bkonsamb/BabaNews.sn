import React, { useState, useEffect } from 'react';
import { Article } from '../types/article';

interface HeaderProps {
  articles: Article[];
  onCategoryChange: (cat: string) => void;
  activeCategory: string;
  onSearch: (q: string) => void;
  onArticleClick: (id: string) => void;
}

const CATEGORIES = ['Tous', 'Politique', 'Économie', 'Sport', 'Technologie', 'Santé', 'International', 'Environnement', 'Culture'];

export default function Header({ articles, onCategoryChange, activeCategory, onSearch, onArticleClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const breakingArticles = articles.filter(a => a.breaking);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="w-full z-50 sticky top-0">
      {/* Breaking News Ticker */}
      {breakingArticles.length > 0 && (
        <div className="bg-[#c8102e] text-white py-1.5 overflow-hidden">
          <div className="flex items-center">
            <span className="breaking-badge flex-shrink-0 bg-white text-[#c8102e] text-xs font-bold px-3 py-0.5 mx-3 rounded-sm uppercase tracking-wide">
              🔴 URGENT
            </span>
            <div className="ticker-wrap flex-1">
              <div className="ticker-move">
                {breakingArticles.map((a, i) => (
                  <span key={a.id} className="mr-16">
                    <button
                      onClick={() => onArticleClick(a.id)}
                      className="hover:underline text-sm font-medium"
                    >
                      {a.title.replace(/^🔴 URGENT : /, '')}
                    </button>
                    {i < breakingArticles.length - 1 && <span className="mx-8 opacity-50">◆</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <button
              onClick={() => { onCategoryChange('Tous'); onSearch(''); }}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-[#c8102e] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-black text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>B</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1a1a2e]" style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}>
                  Baba<span className="text-[#c8102e]">News</span>
                </h1>
                <p className="text-xs text-gray-400 leading-none -mt-0.5">L'actualité du moment</p>
              </div>
            </button>

            {/* Date & Actions */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-500 capitalize">{formatDate(currentTime)}</span>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-500 hover:text-[#c8102e] hover:bg-red-50 rounded-full transition-colors"
                title="Rechercher"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#c8102e] rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="pb-3 fade-in">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un article..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-[#c8102e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9b0c23] transition-colors"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); onSearch(''); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Annuler
                </button>
              </form>
            </div>
          )}

          {/* Nav Categories - Desktop */}
          <nav className="hidden md:flex items-center gap-1 pb-1 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`nav-link px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md ${
                  activeCategory === cat
                    ? 'text-[#c8102e] bg-red-50'
                    : 'text-gray-600 hover:text-[#c8102e] hover:bg-red-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white fade-in">
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                />
                <button type="submit" className="bg-[#c8102e] text-white px-3 py-2 rounded-lg text-sm">
                  →
                </button>
              </form>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { onCategoryChange(cat); setMenuOpen(false); }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg text-center transition-colors ${
                      activeCategory === cat
                        ? 'bg-[#c8102e] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-[#c8102e]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
