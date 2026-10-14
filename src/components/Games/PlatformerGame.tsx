import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUp, ArrowRight, Trophy, Star } from 'lucide-react';

const LEVEL_WIDTH = 2500;
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const SPEED = 6;

export default function PlatformerGame({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [player, setPlayer] = useState({ x: 100, y: 150, vx: 0, vy: 0, grounded: false, dir: 1 });
  const [stars, setStars] = useState(
    Array.from({ length: 10 }).map((_, i) => ({ id: i, x: 300 + i * 200, y: 150 + Math.random() * 100, collected: false }))
  );
  
  const [platforms] = useState([
    { x: 0, y: 350, w: 2500, h: 50 }, // Ground
    { x: 300, y: 280, w: 150, h: 20 },
    { x: 600, y: 220, w: 150, h: 20 },
    { x: 900, y: 160, w: 150, h: 20 },
    { x: 1200, y: 220, w: 150, h: 20 },
    { x: 1500, y: 180, w: 200, h: 20 },
    { x: 1800, y: 250, w: 150, h: 20 },
  ]);
  const [score, setScore] = useState(0);
  const [starsCount, setStarsCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const movePlayer = useCallback((dx: number) => {
    setPlayer(p => ({ ...p, vx: dx * SPEED, dir: dx !== 0 ? dx : p.dir }));
  }, []);

  const jump = useCallback(() => {
    setPlayer(p => p.grounded ? { ...p, vy: JUMP_FORCE, grounded: false } : p);
  }, []);

  useEffect(() => {
    const loop = setInterval(() => {
      setPlayer(p => {
        let { x, y, vx, vy } = p;
        vy += GRAVITY;
        x += vx;
        y += vy;

        let newGrounded = false;
        for (const plat of platforms) {
          if (x + 30 > plat.x && x < plat.x + plat.w && vy > 0 && y + 50 > plat.y && y + 50 < plat.y + 20) {
            y = plat.y - 50;
            vy = 0;
            newGrounded = true;
          }
        }
        
        x = Math.max(0, Math.min(x, LEVEL_WIDTH - 40));
        if (y > 600) { x = 100; y = 150; vy = 0; }

        return { x, y, vx, vy, grounded: newGrounded, dir: p.dir };
      });

      setStars(prev => {
        let newStarsCount = starsCount;
        let newScore = score;
        const newStars = prev.map(s => {
          if (!s.collected && Math.hypot(s.x - (player.x + 20), s.y - (player.y + 25)) < 40) {
            newScore += 10;
            newStarsCount += 1;
            return { ...s, collected: true };
          }
          return s;
        });
        
        setScore(newScore);
        setStarsCount(newStarsCount);
        
        if (newStarsCount === 10) {
          setFinished(true);
        }
        
        return newStars;
      });

    }, 1000 / 60);
    return () => clearInterval(loop);
  }, [player.x, player.y, starsCount, score, platforms]);

  if (finished) {
    const totalBonus = starsCount === 10 ? 100 : 0;
    const finalScore = score + totalBonus;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-200 to-indigo-300 p-6 text-center z-50 absolute inset-0 select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-sky-200">
          <div className="text-6xl mb-4">🏆⭐</div>
          <h2 className="text-3xl font-black mb-4 text-sky-900">BÖLÜM TAMAMLANDI!</h2>
          <p className="text-2xl font-bold mb-2 text-sky-800 flex items-center justify-center gap-2">⭐ Yıldız: {starsCount} / 10</p>
          <p className="text-2xl font-bold mb-8 text-sky-800 flex items-center justify-center gap-2"><Trophy className="text-amber-500" /> Toplam Skor: {finalScore}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">🔄 TEKRAR OYNA</button>
            <button onClick={() => {
                const currentStars = parseInt(localStorage.getItem('stars') || '0');
                localStorage.setItem('stars', (currentStars + starsCount).toString());
                onBack();
            }} className="w-full py-4 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-2xl font-bold text-lg transition-transform active:scale-95">🏠 OYUNLAR MENÜSÜ</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-sky-400 to-sky-600 overflow-hidden relative select-none">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center p-4 bg-white/80 backdrop-blur-md z-20 rounded-3xl shadow-lg border-2 border-white">
        <button onClick={onBack} className="p-3 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-6 font-bold text-sky-900 text-lg">
          <span className="flex items-center gap-1">⭐ {starsCount} / 10</span>
          <span className="flex items-center gap-1"><Trophy className="text-amber-500" size={22} /> {score}</span>
        </div>
      </div>
      
      <div className="relative flex-grow overflow-hidden">
        <motion.div className="absolute inset-0" style={{ x: -player.x + 150 }}>
          <div className="absolute w-[2500px] h-full bg-gradient-to-b from-sky-300 to-sky-400">
            <motion.div className="absolute text-8xl select-none" style={{ x: player.x * 0.2 }}><div className="opacity-60">☁️</div></motion.div>
            <motion.div className="absolute text-8xl select-none" style={{ left: 800, x: player.x * 0.3 }}><div className="opacity-70">☁️</div></motion.div>
            
            {stars.map(s => !s.collected && <motion.div key={s.id} className="absolute text-3xl select-none" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ left: s.x, top: s.y }}>⭐</motion.div>)}
            
            {platforms.map((p, i) => (
              <div key={i} className="absolute bg-emerald-600 rounded-t-2xl shadow-xl border-b-4 border-emerald-800" style={{ left: p.x, top: p.y, width: p.w, height: p.h }}>
                <div className="bg-emerald-500 h-4 rounded-t-xl" />
              </div>
            ))}
            
            <div className="absolute text-4xl select-none" style={{ left: 500, top: 310 }}>🪨</div>
            <div className="absolute text-4xl select-none" style={{ left: 1000, top: 310 }}>🪵</div>
            <div className="absolute w-20 h-10 bg-sky-400/50 rounded-full" style={{ left: 1300, top: 350 }} />
            
            <div className="absolute text-6xl select-none" style={{ left: LEVEL_WIDTH - 150, top: 250 }}>🏁</div>
          </div>
          
          <motion.div className="absolute text-5xl select-none filter drop-shadow-md" style={{ left: player.x, top: player.y, transform: `scaleX(${player.dir === 1 ? -1 : 1})`, transformOrigin: 'center' }}>🏃</motion.div>
        </motion.div>
      </div>

      <div className="flex justify-around p-6 bg-sky-900/90 backdrop-blur-md z-20 rounded-t-3xl border-t-2 border-sky-700">
        <button onTouchStart={() => movePlayer(-1)} onTouchEnd={() => movePlayer(0)} onMouseDown={() => movePlayer(-1)} onMouseUp={() => movePlayer(0)} className="p-6 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"><ArrowLeft size={36} /></button>
        <button onTouchStart={jump} onMouseDown={jump} className="p-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"><ArrowUp size={36} /></button>
        <button onTouchStart={() => movePlayer(1)} onTouchEnd={() => movePlayer(0)} onMouseDown={() => movePlayer(1)} onMouseUp={() => movePlayer(0)} className="p-6 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"><ArrowRight size={36} /></button>
      </div>
    </div>
  );
}
