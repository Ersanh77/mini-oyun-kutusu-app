import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Trophy, Sparkles } from 'lucide-react';

const FRUITS = ['🍎', '🍐', '🍊', '🍓', '🍌', '🍉'];
const BAD_ITEMS = ['🍎🍂', '🍐🍂', '🍊🍂']; 
const BONUS_ITEM = '🍎✨';

interface FallingObject {
  id: number;
  type: string;
  x: number;
  y: number;
  speed: number;
  isBad: boolean;
  isBonus: boolean;
}

export default function FruitCollector({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [basketX, setBasketX] = useState(50);
  const basketXRef = useRef(50);
  const [performanceMultiplier, setPerformanceMultiplier] = useState(1.0);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [finished, setFinished] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, color: string} | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const getLevelConfig = (lvl: number) => {
    switch (lvl) {
        case 1: return { target: 50, bad: 0, speed: 1.5 };
        case 2: return { target: 70, bad: 0, speed: 1.7 };
        case 3: return { target: 100, bad: 0, speed: 1.9 };
        case 4: return { target: 120, bad: 1, speed: 2.1 };
        case 5: return { target: 150, bad: 2, speed: 2.3 };
        case 6: return { target: 180, bad: 2, speed: 2.5 };
        case 7: return { target: 220, bad: 3, speed: 2.7 };
        case 8: return { target: 260, bad: 3, speed: 2.9 };
        case 9: return { target: 300, bad: 4, speed: 3.1 };
        case 10: return { target: 350, bad: 4, speed: 3.5 };
        default: return { target: 50, bad: 0, speed: 1.5 };
    }
  };

  const spawnObject = useCallback(() => {
    const config = getLevelConfig(level);
    
    const isBad = Math.random() < 0.2;
    const isBonus = level >= 7 && Math.random() < 0.1;
    
    let type = isBonus ? BONUS_ITEM : (isBad ? BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)] : FRUITS[Math.floor(Math.random() * FRUITS.length)]);

    return {
      id: Date.now() + Math.random(),
      type,
      x: Math.random() * 90 + 5,
      y: -10,
      speed: (Math.random() * 0.5 + 1) * config.speed * performanceMultiplier,
      isBad,
      isBonus
    };
  }, [level, performanceMultiplier]);

  useEffect(() => {
    setObjects([]);
    setPerformanceMultiplier(1.0);
  }, [level]);

  useEffect(() => {
    if (finished || showLevelComplete) return;
    const spawnInterval = setInterval(() => {
        const obj = spawnObject();
        if (obj) setObjects(prev => [...prev, obj]);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, [spawnObject, finished, showLevelComplete]);

  useEffect(() => {
    if (finished || showLevelComplete) return;
    const moveInterval = setInterval(() => {
      setObjects(prev => {
        const nextObjects = prev.map(o => ({ ...o, y: o.y + o.speed })).filter(o => o.y < 100);
        
        // Collision
        nextObjects.forEach(o => {
            if (o.y > 82 && o.y < 96 && Math.abs(o.x - basketXRef.current) < 12) {
                if (o.isBad) {
                    setScore(s => Math.max(0, s - 10));
                    setFeedback({msg: '-10 DİKKAT!', color: 'text-rose-500'});
                    setPerformanceMultiplier(p => Math.max(0.7, p - 0.08));
                } else {
                    const points = o.isBonus ? (level === 10 ? 30 : 20) : 10;
                    const newScore = score + points;
                    setScore(newScore);
                    setFeedback({msg: `+${points}`, color: 'text-emerald-500'});
                    setPerformanceMultiplier(p => Math.min(1.6, p + 0.03));
                    
                    if (newScore >= getLevelConfig(level).target) {
                        setShowLevelComplete(true);
                    }
                }
                setObjects(prev => prev.filter(obj => obj.id !== o.id));
                setTimeout(() => setFeedback(null), 800);
            }
        });
        return nextObjects;
      });
    }, 50);
    return () => clearInterval(moveInterval);
  }, [level, finished, showLevelComplete, basketXRef, score]);

  const handlePointerMove = (e: PointerEvent) => {
    if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const newX = Math.max(5, Math.min(95, x));
        basketXRef.current = newX;
        setBasketX(newX);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-200 to-teal-300 p-6 text-center select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-emerald-200">
          <div className="text-6xl mb-4">🏆🍎</div>
          <h2 className="text-3xl font-black mb-4 text-emerald-900">{level === 10 ? 'MEYVE TOPLAMA USTASI!' : 'BÖLÜM TAMAMLANDI!'}</h2>
          <p className="text-2xl font-bold mb-6 text-emerald-800 flex items-center justify-center gap-2"><Trophy className="text-amber-500" /> Toplam Skor: {score}</p>
          <button onClick={() => {
              localStorage.setItem('stars', (parseInt(localStorage.getItem('stars') || '0') + level).toString());
              onComplete(score);
          }} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">OYUNLAR MENÜSÜ</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-screen bg-gradient-to-b from-emerald-200 via-teal-100 to-sky-100 relative overflow-hidden select-none" 
      ref={gameAreaRef} 
      style={{ touchAction: 'none' }} 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="flex justify-between items-center p-4 m-4 bg-white/70 backdrop-blur-md rounded-3xl z-20 border border-white shadow-lg">
        <button onClick={onBack} className="p-3 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="text-lg font-bold text-emerald-900 bg-emerald-100/80 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span>Bölüm: {level}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Trophy size={18} className="text-amber-500" /> {score} / {getLevelConfig(level).target}</span>
          </div>
          <div className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1.5 rounded-full shadow-sm">
            {performanceMultiplier > 1.2 ? '🔥 Hızlı' : performanceMultiplier < 0.9 ? '🛡️ Sakin' : '⚡ Normal'}
          </div>
        </div>
      </div>
      
      <div className="relative flex-grow cursor-grab active:cursor-grabbing">
        {objects.map(o => (
            <div key={o.id} className="absolute text-4xl drop-shadow-md select-none" style={{ left: `${o.x}%`, top: `${o.y}%` }}>{o.type}</div>
        ))}
        
        <motion.div className="absolute bottom-6 text-7xl select-none filter drop-shadow-xl" style={{ left: `${basketX}%`, x: '-50%' }}>🧺</motion.div>
        
        {feedback && (
            <motion.div initial={{opacity:0, scale: 0.5, y: 20}} animate={{opacity:1, scale: 1, y: 0}} exit={{opacity:0}} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black ${feedback.color} bg-white/95 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border-4 border-white`}>
                {feedback.msg}
            </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showLevelComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-emerald-200">
                <div className="text-5xl mb-3">🎉⭐</div>
                <h2 className="text-3xl font-extrabold mb-3 text-emerald-900">BÖLÜM {level} TAMAMLANDI!</h2>
                <p className="text-xl font-bold mb-1 text-emerald-800">Skor: {score}</p>
                <p className="text-lg font-semibold mb-6 text-emerald-600">Hedef: {getLevelConfig(level).target}</p>
                <button onClick={() => { 
                    if (level < 10) {
                        setLevel(l => l + 1); 
                        setScore(0);
                        setShowLevelComplete(false); 
                    } else {
                        setFinished(true);
                    }
                }} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">SONRAKİ BÖLÜM</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
