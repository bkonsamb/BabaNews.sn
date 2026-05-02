export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a2e] text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#c8102e] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>B</span>
              </div>
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                Baba<span className="text-[#c8102e]">News</span>
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              L'actualité du jour en temps réel. Sénégal, Afrique et monde.
            </p>
            <div className="flex gap-3 mt-4">
              {/* Social icons */}
              {[
                { label: 'Twitter/X', icon: '𝕏' },
                { label: 'Facebook', icon: 'f' },
                { label: 'Telegram', icon: '✈' },
              ].map(s => (
                <button
                  key={s.label}
                  title={s.label}
                  className="w-9 h-9 bg-white/10 hover:bg-[#c8102e] rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Rubriques */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-xs">Rubriques</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Politique', 'Économie', 'Sport', 'Technologie', 'Santé', 'Culture'].map(cat => (
                <li key={cat}>
                  <span className="hover:text-[#c8102e] transition-colors cursor-pointer">{cat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Régions */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-xs">Zones</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Sénégal', 'Afrique de l\'Ouest', 'Continent africain', 'Monde', 'Diaspora', 'International'].map(r => (
                <li key={r}>
                  <span className="hover:text-[#c8102e] transition-colors cursor-pointer">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-xs">À propos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Qui sommes-nous', 'Contact', 'Mentions légales', 'Politique de confidentialité', 'Sitemap'].map(l => (
                <li key={l}>
                  <span className="hover:text-[#c8102e] transition-colors cursor-pointer">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {year} BabaNews. Tous droits réservés.</p>
          <p className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Mis à jour automatiquement
          </p>
        </div>
      </div>
    </footer>
  );
}
