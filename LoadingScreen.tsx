export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[#c8102e] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>B</span>
        </div>
        <h1 className="text-3xl font-black text-[#1a1a2e]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Baba<span className="text-[#c8102e]">News</span>
        </h1>
      </div>

      {/* Skeleton cards */}
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden h-72 image-skeleton mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="h-32 image-skeleton" />
                  <div className="p-3 space-y-2 bg-white">
                    <div className="h-3 bg-gray-200 rounded image-skeleton" />
                    <div className="h-3 bg-gray-200 rounded image-skeleton w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded image-skeleton" />
                <div className="h-3 bg-gray-100 rounded image-skeleton w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm animate-pulse">Chargement des actualités...</p>
    </div>
  );
}
