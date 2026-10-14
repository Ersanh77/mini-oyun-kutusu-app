import { motion } from 'motion/react';
import { Apple, Star, Puzzle, Fish, Brain, Sparkles, Play, Circle } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  desc: string;
  icon: any;
  color: string;
  badge: string;
}

const games: Game[] = [
  { id: 'balloon', name: 'Balon Patlat', desc: 'Renkli balonları patlatıp eğlen!', icon: Circle, color: 'from-pink-400 to-rose-500', badge: '🎈 Popüler' },
  { id: 'match', name: 'Meyve Eşleştir', desc: 'Tatlı meyveleri yan yana getir!', icon: Apple, color: 'from-amber-400 to-orange-500', badge: '⭐ Eğlenceli' },
  { id: 'stars', name: 'Yıldız Topla', desc: 'Zıpla ve parlayan yıldızları topla!', icon: Star, color: 'from-yellow-400 to-amber-500', badge: '✨ Heyecanlı' },
  { id: 'puzzle', name: 'Kayıp Parça', desc: 'Eksik bulmaca parçasını yerine koy!', icon: Puzzle, color: 'from-sky-400 to-blue-500', badge: '🧩 Akıl Oyunu' },
  { id: 'fish', name: 'Balık Yakala', desc: 'Sevimli balıkları ağla yakala!', icon: Fish, color: 'from-teal-400 to-emerald-500', badge: '🌊 Macera' },
  { id: 'memory', name: 'Hafıza Kartları', desc: 'Aynı kart çiftlerini bul ve eşleştir!', icon: Brain, color: 'from-purple-400 to-indigo-500', badge: '🧠 Zihin' },
  { id: 'fruit', name: 'Meyve Toplama', desc: 'Sepetle düşen meyveleri yakala!', icon: Apple, color: 'from-emerald-400 to-green-600', badge: '🍎 Yeni!' },
];

export default function GameMenu({ onSelect, totalStars }: { onSelect: (id: string) => void, totalStars: number }) {
  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 sm:p-8 bg-gradient-to-b from-amber-50 via-orange-50/40 to-sky-100/60 relative overflow-x-hidden select-none">
      
      {/* Decorative background floating elements positioned safely away from core text */}
      <div className="absolute top-4 left-4 text-2xl sm:text-3xl opacity-75 pointer-events-none select-none animate-bounce">☁️</div>
      <div className="absolute top-6 right-6 text-2xl sm:text-3xl opacity-75 pointer-events-none select-none animate-pulse">⭐</div>
      <div className="absolute top-28 left-8 text-xl sm:text-2xl opacity-60 pointer-events-none select-none hidden sm:block">🎈</div>
      <div className="absolute top-24 right-12 text-xl sm:text-2xl opacity-60 pointer-events-none select-none hidden sm:block">🌈</div>

      {/* Header */}
      <motion.div 
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center mb-5 sm:mb-6 z-10 text-center max-w-2xl px-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-200 shadow-sm text-amber-800 text-xs sm:text-sm font-bold mb-3">
          <Sparkles size={16} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          Çocuk Eğlence Dünyası
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-amber-900 tracking-wide drop-shadow-sm flex items-center justify-center gap-2 flex-wrap">
          <span className="text-orange-500">🎮</span> MİNİ OYUN KUTUSU <span className="text-amber-500">🎁</span>
        </h1>
        <p className="text-sm sm:text-lg text-amber-700 font-medium mt-2 max-w-md">
          Küçük parmaklar için en eğlenceli ve eğitici oyunlar!
        </p>
      </motion.div>

      {/* Star Counter */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-3xl shadow-md border-2 border-white text-amber-950 font-black text-lg sm:text-2xl mb-6 sm:mb-8 z-10"
      >
        <span className="text-2xl sm:text-3xl filter drop-shadow">⭐</span>
        <span>Toplam Yıldız:</span>
        <span className="bg-white/95 px-3 py-0.5 sm:px-4 sm:py-1 rounded-2xl shadow-inner text-amber-800">{totalStars}</span>
      </motion.div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-5xl z-10 pb-12">
        {games.map((game, index) => {
          const IconComponent = game.icon;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(game.id)}
              className="group relative bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl border-3 border-amber-200/90 hover:border-amber-400 cursor-pointer flex flex-col items-center text-center transition-all duration-200 overflow-hidden"
            >
              {/* Top badge */}
              <div className="absolute top-3.5 right-3.5 bg-amber-100/90 text-amber-800 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">
                {game.badge}
              </div>

              {/* Game Icon Illustration Bubble */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-md mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-200`}>
                <IconComponent size={36} className="filter drop-shadow-sm sm:w-10 sm:h-10" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-amber-900 mb-1 group-hover:text-orange-600 transition-colors">
                {game.name}
              </h2>

              <p className="text-amber-700/80 text-xs sm:text-sm font-medium mb-5 line-clamp-2 px-2 min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center">
                {game.desc}
              </p>

              {/* Play Button */}
              <div className="mt-auto w-full">
                <button className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-md flex items-center justify-center gap-2 transition-all group-hover:shadow-lg">
                  <Play size={18} fill="currentColor" />
                  OYNA
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
