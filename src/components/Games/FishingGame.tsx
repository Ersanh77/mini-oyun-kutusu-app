import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Trophy, Sparkles } from 'lucide-react';

const NORMAL_FISH = ['🐟', '🐠', '🐬'];
const DANGER_FISH = ['🐡', '🐙']; 
const BONUS_FISH = '⭐';

interface Fish {
  id: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDangerous: boolean;
  isBonus: boolean;
}

export default function FishingGame({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [fishList, setFishList] = useState<Fish[]>([]);
  const [finished, setFinished] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, color: string} | null>(null);

  const getLevelConfig = (lvl: number) => {
    switch (lvl) {
        case 1: return { normal: 3, danger: 0, octopus: 0, bonus: 0, speed: 1 };
        case 2: return { normal: 4, danger: 1, octopus: 0, bonus: 0, speed: 1.2 };
        case 3: return { normal: 5, danger: 2, octopus: 0, bonus: 0, speed: 1.4 };
        case 4: return { normal: 5, danger: 2, octopus: 1, bonus: 0, speed: 1.6 };
        case 5: return { normal: 6, danger: 2, octopus: 1, bonus: 0, speed: 1.8 };
        case 6: return { normal: 7, danger: 2, octopus: 2, bonus: 0, speed: 2 };
        case 7: return { normal: 8, danger: 3, octopus: 2, bonus: 1, speed: 2.2 };
        case 8: return { normal: 9, danger: 3, octopus: 2, bonus: 1, speed: 2.4 };
        case 9: return { normal: 10, danger: 4, octopus: 3, bonus: 1, speed: 2.6 };
        case 10: return { normal: 12, danger: 4, octopus: 3, bonus: 2, speed: 3 };
        default: return { normal: 5, danger: 1, octopus: 0, bonus: 0, speed: 1 };
    }
  };

  const spawnFish = useCallback(() => {
    const config = getLevelConfig(level);
    const totalFish = config.normal + config.danger + config.octopus + config.bonus;
    
    const newFish: Fish[] = Array.from({ length: totalFish }).map((_, i) => {
      let type: string;
      let isDangerous = false;
      let isBonus = false;

      if (i < config.normal) { type = NORMAL_FISH[i % NORMAL_FISH.length]; }
      else if (i < config.normal + config.danger) { type = '🐡'; isDangerous = true; }
      else if (i < config.normal + config.danger + config.octopus) { type = '🐙'; isDangerous = true; }
      else { type = BONUS_FISH; isBonus = true; }

      return {
        id: Date.now() + i,
        type,
        x: Math.random() * 80 + 5,
        y: Math.random() * 70 + 10,
        vx: (Math.random() - 0.5) * 4 * config.speed * (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 4 * config.speed * (Math.random() > 0.5 ? 1 : -1),
        isDangerous,
        isBonus
      };
    });
    setFishList(newFish);
  }, [level]);

  useEffect(() => {
    if (!finished && !showLevelComplete) spawnFish();
  }, [level, spawnFish, finished, showLevelComplete]);

  useEffect(() => {
    if (showLevelComplete || finished) return;
    const interval = setInterval(() => {
      setFishList(prev => prev.map(f => {
        let { x, y, vx, vy } = f;
        x += vx;
        y += vy;
        if (x < 0 || x > 90) vx *= -1;
        if (y < 0 || y > 80) vy *= -1;
        return { ...f, x, y, vx, vy };
      }));
    }, 40);
    return () => clearInterval(interval);
  }, [showLevelComplete, finished]);

  const handleCatch = (fish: Fish) => {
    if (fish.isDangerous) {
        setScore(s => Math.max(0, s - 10));
        setFeedback({msg: '-10 DİKKAT!', color: 'text-rose-500'});
        setTimeout(() => setFeedback(null), 800);
        return;
    }

    const points = fish.isBonus ? (level === 10 ? 30 : 20) : 10;
    setScore(s => s + points);
    setFeedback({msg: `+${points}`, color: 'text-emerald-500'});
    setTimeout(() => setFeedback(null), 800);
    
    setFishList(prev => prev.filter(f => f.id !== fish.id));
    
    const remainingNormalFish = fishList.filter(f => !f.isDangerous && !f.isBonus && f.id !== fish.id).length;
    
    if (remainingNormalFish === 0) {
      setTimeout(() => setShowLevelComplete(true), 500);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-200 to-indigo-300 p-6 text-center select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-blue-200">
          <div className="text-6xl mb-4">🏆🌊</div>
          <h2 className="text-3xl font-black mb-4 text-blue-900">FİNAL BÖLÜMÜ TAMAMLANDI!</h2>
          <p className="text-2xl font-bold mb-6 text-blue-800 flex items-center justify-center gap-2"><Trophy className="text-amber-500" /> Toplam Skor: {score}</p>
          <button onClick={() => {
              localStorage.setItem('stars', (parseInt(localStorage.getItem('stars') || '0') + level).toString());
              onComplete(score);
          }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">OYUNLAR MENÜSÜ</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-500 to-indigo-700 relative overflow-hidden select-none">
      <div className="flex justify-between items-center p-4 m-4 bg-white/20 backdrop-blur-md rounded-3xl z-20 border border-white/30 shadow-lg">
        <button onClick={onBack} className="p-3 bg-white hover:bg-blue-50 text-blue-900 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-6 font-bold text-white text-lg">
          <span className="bg-white/20 px-4 py-1.5 rounded-full">Bölüm: {level}</span>
          <span className="flex items-center gap-1.5"><Trophy className="text-amber-300" size={22} /> {score}</span>
        </div>
      </div>
      
      <div className="relative flex-grow">
        <AnimatePresence>
          {fishList.map(f => (
            <motion.button 
              key={f.id} 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0, rotate: 180 }}
              onClick={() => handleCatch(f)} 
              className="absolute text-5xl p-6 hover:scale-110 active:scale-90 transition-transform cursor-pointer drop-shadow-lg" 
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            >
              {f.type}
            </motion.button>
          ))}
        </AnimatePresence>
        
        {feedback && (
            <motion.div initial={{opacity:0, scale: 0.5, y: 20}} animate={{opacity:1, scale: 1, y: 0}} exit={{opacity:0}} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black ${feedback.color} bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border-4 border-white`}>
                {feedback.msg}
            </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showLevelComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-blue-200">
                <div className="text-5xl mb-3">🌟🎉</div>
                <h2 className="text-3xl font-extrabold mb-3 text-blue-900">Bölüm {level} Tamamlandı!</h2>
                <div className="flex justify-center gap-2 mb-6">
                    {Array.from({length: 3}).map((_, i) => <Star key={i} className="text-amber-400 w-8 h-8" fill="currentColor" />)}
                </div>
                <button onClick={() => { 
                    if (level < 10) {
                        setLevel(l => l + 1); 
                        setShowLevelComplete(false); 
                    } else {
                        setFinished(true);
                    }
                }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                  {level < 10 ? 'SONRAKİ BÖLÜM' : 'OYUNU TAMAMLA'}
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
