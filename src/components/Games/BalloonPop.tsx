import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';

const COLORS = [
  'bg-red-400 border-red-500', 
  'bg-blue-400 border-blue-500', 
  'bg-amber-400 border-amber-500', 
  'bg-emerald-400 border-emerald-500', 
  'bg-purple-400 border-purple-500', 
  'bg-pink-400 border-pink-500'
];

export default function BalloonPop({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [balloons, setBalloons] = useState<{ id: number; color: string; x: number; y: number; popped: boolean; points: number | null }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [lastPopTime, setLastPopTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [comboText, setComboText] = useState<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => { audioContext.current?.close(); };
  }, []);

  const playPopSound = () => {
    if (isMuted || !audioContext.current) return;
    try {
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.frequency.setValueAtTime(400, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioContext.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.1);
    } catch (e) {
      // AudioContext might not be allowed until user gesture
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const currentStars = parseInt(localStorage.getItem('stars') || '0');
      const earnedStars = Math.floor(score / 50);
      localStorage.setItem('stars', (currentStars + earnedStars).toString());
    }
  }, [timeLeft, score]);

  useEffect(() => {
    if (timeLeft === 0) return;
    const spawnRate = timeLeft > 40 ? 1000 : timeLeft > 20 ? 700 : 500;
    const interval = setInterval(() => {
      setBalloons(prev => {
        if (prev.filter(b => !b.popped).length >= 10) return prev;
        let newBalloon;
        let attempts = 0;
        do {
          newBalloon = { id: Date.now(), color: COLORS[Math.floor(Math.random() * COLORS.length)], x: Math.random() * 80 + 5, y: Math.random() * 70 + 5, popped: false, points: null };
          attempts++;
        } while (attempts < 5 && prev.some(b => Math.hypot(b.x - newBalloon.x, b.y - newBalloon.y) < 15));
        return attempts < 5 ? [...prev, newBalloon] : prev;
      });
    }, spawnRate);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const pop = (id: number) => {
    const now = Date.now();
    const newCombo = now - lastPopTime < 1000 ? combo + 1 : 1;
    setCombo(newCombo);
    setLastPopTime(now);
    const comboPoints = newCombo >= 4 ? 40 : newCombo * 10;
    const gained = 10 + comboPoints;
    setScore(s => s + gained);
    playPopSound();

    if (newCombo > 1) {
      setComboText(`COMBO x${newCombo}!`);
      setTimeout(() => setComboText(null), 1000);
    }

    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true, points: gained } : b));
    setTimeout(() => setBalloons(prev => prev.filter(b => b.id !== id)), 500);
  };

  if (timeLeft === 0) {
    const stars = Math.floor(score / 50);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-sky-100 to-indigo-200">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-sky-200">
          <div className="text-6xl mb-4">🎈🎉</div>
          <h2 className="text-4xl font-extrabold mb-4 text-indigo-900">Süre Bitti!</h2>
          <p className="text-2xl font-bold mb-2 text-indigo-700">Skorun: {score}</p>
          <p className="text-xl font-semibold mb-8 text-amber-600 flex items-center justify-center gap-2">⭐ Kazandığın Yıldız: {stars}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">Tekrar Oyna</button>
            <button onClick={onBack} className="w-full py-4 bg-sky-100 hover:bg-sky-200 text-indigo-900 rounded-2xl font-bold text-lg transition-transform active:scale-95">Ana Menü</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-sky-200 to-indigo-100 overflow-hidden select-none">
      <div className="flex justify-between items-center w-full max-w-2xl mb-4 p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white">
        <button onClick={onBack} className="p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-6 font-bold text-indigo-900 text-lg">
          <span className="flex items-center gap-1">⏱️ {timeLeft}s</span>
          <span className="flex items-center gap-1"><Trophy className="text-amber-500" size={22} /> {score}</span>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-colors shadow-sm">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {comboText && (
        <motion.div className="absolute top-24 z-30 text-4xl font-black text-rose-500 drop-shadow-lg" initial={{ scale: 0, y: 20 }} animate={{ scale: 1.2, y: 0 }} exit={{ scale: 0 }}>
          {comboText}
        </motion.div>
      )}

      <div className="relative w-full max-w-2xl flex-grow bg-gradient-to-b from-sky-300 to-sky-400 rounded-3xl overflow-hidden shadow-inner border-4 border-white/50">
        <AnimatePresence>
          {balloons.map(b => (
            <motion.div 
              key={b.id} 
              initial={{ scale: 0 }} 
              animate={{ scale: b.popped ? 0 : 1 }} 
              exit={{ scale: 0 }} 
              onClick={() => !b.popped && pop(b.id)} 
              className="absolute cursor-pointer p-4" 
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`w-16 h-20 rounded-[50%] ${b.color} shadow-xl flex items-center justify-center relative border-b-8 border-black/10`}>
                {b.points && (
                  <motion.div className="absolute -top-10 text-2xl font-extrabold text-emerald-600 bg-white px-2 py-1 rounded-xl shadow-md" initial={{ y: 0, opacity: 1 }} animate={{ y: -25, opacity: 0 }}>
                    +{b.points}
                  </motion.div>
                )}
                <div className="absolute top-2 left-2 w-3 h-4 bg-white/60 rounded-full rotate-45" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-indigo-900/40" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
