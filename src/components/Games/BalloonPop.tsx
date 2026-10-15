import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Trophy, Star, Sparkles } from 'lucide-react';

interface Balloon {
  id: number;
  color: string;
  x: number; // percentage
  y: number; // percentage
  size: number;
  popped: boolean;
  points: number | null;
}

interface BalloonPopProps {
  onBack: () => void;
  onComplete: (score: number) => void;
  onAwardStars?: (stars: number) => void;
}

const BALLOON_COLORS = [
  'bg-rose-400 border-rose-500',
  'bg-sky-400 border-sky-500',
  'bg-amber-400 border-amber-500',
  'bg-emerald-400 border-emerald-500',
  'bg-purple-400 border-purple-500',
  'bg-pink-400 border-pink-500',
];

const LEVEL_CONFIGS: Record<number, { targetPops: number; timeLimit: number; spawnRate: number; maxBalloons: number }> = {
  1: { targetPops: 5, timeLimit: 45, spawnRate: 1000, maxBalloons: 8 },
  2: { targetPops: 7, timeLimit: 45, spawnRate: 950, maxBalloons: 8 },
  3: { targetPops: 10, timeLimit: 50, spawnRate: 900, maxBalloons: 9 },
  4: { targetPops: 12, timeLimit: 50, spawnRate: 850, maxBalloons: 9 },
  5: { targetPops: 15, timeLimit: 55, spawnRate: 800, maxBalloons: 10 },
  6: { targetPops: 18, timeLimit: 55, spawnRate: 750, maxBalloons: 10 },
  7: { targetPops: 20, timeLimit: 60, spawnRate: 700, maxBalloons: 11 },
  8: { targetPops: 22, timeLimit: 60, spawnRate: 650, maxBalloons: 11 },
  9: { targetPops: 25, timeLimit: 60, spawnRate: 600, maxBalloons: 12 },
  10: { targetPops: 30, timeLimit: 65, spawnRate: 550, maxBalloons: 12 },
};

export default function BalloonPop({ onBack, onComplete, onAwardStars }: BalloonPopProps) {
  const [level, setLevel] = useState(1);
  const [levelPops, setLevelPops] = useState(0);
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [timeLeft, setTimeLeft] = useState(LEVEL_CONFIGS[1].timeLimit);
  const [combo, setCombo] = useState(0);
  const [lastPopTime, setLastPopTime] = useState(0);
  const [comboText, setComboText] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Modals
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [justEarnedStar, setJustEarnedStar] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);

  // Helper to read completed levels from localStorage
  const getCompletedLevels = useCallback((): number[] => {
    try {
      const data = localStorage.getItem('balloon_completed_levels');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[10];

  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playPopSound = useCallback(() => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.frequency.setValueAtTime(450, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioContext.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.1);
    } catch {
      // AudioContext might require user interaction first
    }
  }, [isMuted]);

  const playCelebrationSound = useCallback(() => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = audioContext.current!.createOscillator();
        const gain = audioContext.current!.createGain();
        osc.connect(gain);
        gain.connect(audioContext.current!.destination);
        osc.frequency.value = freq;
        const startTime = audioContext.current!.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }, [isMuted]);

  // Level Countdown Timer
  useEffect(() => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Time is up and target not met
      setShowTimeUp(true);
    }
  }, [timeLeft, showLevelComplete, showTimeUp, gameFinished]);

  // Balloon Spawner
  useEffect(() => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    const interval = setInterval(() => {
      setBalloons(prev => {
        const activeBalloons = prev.filter(b => !b.popped);
        if (activeBalloons.length >= config.maxBalloons) return prev;

        const newBalloon: Balloon = {
          id: Date.now() + Math.random(),
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          x: Math.random() * 78 + 6, // 6% to 84% width
          y: Math.random() * 60 + 10, // 10% to 70% height
          size: Math.floor(Math.random() * 15) + 65, // 65px - 80px
          popped: false,
          points: null,
        };

        return [...prev, newBalloon];
      });
    }, config.spawnRate);

    return () => clearInterval(interval);
  }, [config.maxBalloons, config.spawnRate, showLevelComplete, showTimeUp, gameFinished]);

  // Handle Level Completion and Star Awarding
  const handleLevelCompleted = useCallback((completedLvl: number) => {
    playCelebrationSound();
    
    // Check if stars were already earned for this specific level
    const completedList = getCompletedLevels();
    const alreadyEarned = completedList.includes(completedLvl);

    if (!alreadyEarned) {
      // Award 1 star for this level
      const updatedList = [...completedList, completedLvl];
      localStorage.setItem('balloon_completed_levels', JSON.stringify(updatedList));

      if (onAwardStars) {
        onAwardStars(1);
      } else {
        const curStars = parseInt(localStorage.getItem('stars') || '0', 10);
        localStorage.setItem('stars', (curStars + 1).toString());
      }
      setJustEarnedStar(true);
    } else {
      setJustEarnedStar(false);
    }

    setShowLevelComplete(true);
  }, [getCompletedLevels, onAwardStars, playCelebrationSound]);

  // Pop a Balloon
  const popBalloon = (id: number) => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    const now = Date.now();
    const isCombo = now - lastPopTime < 1200;
    const newCombo = isCombo ? combo + 1 : 1;
    setCombo(newCombo);
    setLastPopTime(now);

    const comboBonus = newCombo >= 4 ? 30 : (newCombo - 1) * 10;
    const gainedPoints = 10 + comboBonus;

    setScore(s => s + gainedPoints);
    playPopSound();

    if (newCombo > 1) {
      setComboText(`COMBO x${newCombo}! 🔥`);
      setTimeout(() => setComboText(null), 900);
    }

    // Animate pop
    setBalloons(prev =>
      prev.map(b => (b.id === id ? { ...b, popped: true, points: gainedPoints } : b))
    );

    // Remove popped balloon after short animation
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== id));
    }, 450);

    // Update level progress
    const newPops = levelPops + 1;
    setLevelPops(newPops);

    if (newPops >= config.targetPops) {
      handleLevelCompleted(level);
    }
  };

  // Next Level Handler
  const handleNextLevel = () => {
    if (level < 10) {
      const nextLvl = level + 1;
      const nextConfig = LEVEL_CONFIGS[nextLvl] || LEVEL_CONFIGS[10];
      
      // Update state for new level cleanly
      setLevel(nextLvl);
      setLevelPops(0);
      setBalloons([]);
      setTimeLeft(nextConfig.timeLimit);
      setCombo(0);
      setShowLevelComplete(false); // Closes completion window completely
    } else {
      // Completed all 10 levels
      setShowLevelComplete(false);
      setGameFinished(true);
    }
  };

  // Retry Current Level
  const handleRetryLevel = () => {
    setLevelPops(0);
    setBalloons([]);
    setTimeLeft(config.timeLimit);
    setCombo(0);
    setShowTimeUp(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-3 sm:p-5 bg-gradient-to-b from-sky-200 via-indigo-100 to-purple-100 overflow-hidden select-none relative">
      
      {/* Top Header */}
      <div className="flex justify-between items-center w-full max-w-2xl mb-3 p-3 sm:p-4 bg-white/85 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white z-20">
        <button 
          onClick={onBack} 
          className="p-2.5 sm:p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Ana Menüye Dön"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Level and Target Status */}
        <div className="flex items-center gap-3 sm:gap-5 font-black text-indigo-950 text-sm sm:text-base">
          <div className="bg-indigo-100 text-indigo-900 px-3.5 py-1.5 rounded-full shadow-sm">
            Bölüm {level}
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-950 px-3.5 py-1.5 rounded-full shadow-sm">
            <span>🎯</span>
            <span>{levelPops} / {config.targetPops}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-800 font-extrabold">
            <Trophy className="text-amber-500" size={20} />
            <span>{score}</span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${timeLeft <= 10 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className="p-2.5 sm:p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer"
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        >
          {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>

      {/* Floating Combo Text */}
      <AnimatePresence>
        {comboText && (
          <motion.div 
            className="absolute top-24 z-30 text-3xl sm:text-4xl font-black text-rose-500 drop-shadow-md bg-white/90 px-4 py-2 rounded-2xl border-2 border-rose-300" 
            initial={{ scale: 0, y: 15 }} 
            animate={{ scale: 1.1, y: 0 }} 
            exit={{ scale: 0, opacity: 0 }}
          >
            {comboText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Play Area */}
      <div className="relative w-full max-w-2xl flex-grow min-h-[460px] bg-gradient-to-b from-sky-300 via-sky-200 to-blue-300 rounded-3xl overflow-hidden shadow-inner border-4 border-white/60 relative touch-none">
        
        {/* Background Clouds */}
        <div className="absolute top-6 left-8 text-5xl opacity-40 pointer-events-none">☁️</div>
        <div className="absolute top-16 right-12 text-6xl opacity-35 pointer-events-none">☁️</div>
        <div className="absolute bottom-8 left-16 text-4xl opacity-30 pointer-events-none">☁️</div>

        {/* Balloons */}
        <AnimatePresence>
          {balloons.map(b => (
            <motion.div 
              key={b.id} 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ 
                scale: b.popped ? 0 : 1, 
                opacity: 1,
                y: [0, -6, 0]
              }} 
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                scale: { duration: 0.2 }
              }}
              onClick={() => !b.popped && popBalloon(b.id)}
              onTouchStart={() => !b.popped && popBalloon(b.id)}
              className="absolute cursor-pointer select-none -translate-x-1/2 -translate-y-1/2 p-2 touch-manipulation" 
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <div 
                className={`relative rounded-[50%] ${b.color} shadow-lg border-2 flex items-center justify-center transition-transform`}
                style={{ width: `${b.size}px`, height: `${b.size * 1.25}px` }}
              >
                {/* Pop Points Float */}
                {b.points && (
                  <motion.div 
                    className="absolute -top-10 text-xl sm:text-2xl font-black text-emerald-600 bg-white px-2.5 py-1 rounded-xl shadow-lg border border-emerald-300 z-40 whitespace-nowrap" 
                    initial={{ y: 0, opacity: 1, scale: 0.8 }} 
                    animate={{ y: -30, opacity: 0, scale: 1.2 }}
                  >
                    +{b.points} ⭐
                  </motion.div>
                )}

                {/* Balloon Highlight Shine */}
                <div className="absolute top-2.5 left-2.5 w-3.5 h-6 bg-white/60 rounded-full rotate-35 pointer-events-none" />
                
                {/* Balloon Knot and String */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-inherit rounded-sm pointer-events-none" />
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-indigo-900/40 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MODAL: Level Complete */}
      <AnimatePresence>
        {showLevelComplete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-indigo-200 select-none"
            >
              <div className="text-5xl sm:text-6xl mb-3 animate-bounce">🎈🎉</div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 mb-2">
                BÖLÜM {level} TAMAMLANDI!
              </h2>

              <p className="text-indigo-800 font-bold mb-4 text-base">
                Harika iş! {config.targetPops} balonu başarıyla patlattın!
              </p>

              {/* Star Reward Box */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="text-amber-400 w-8 h-8 fill-amber-400 filter drop-shadow" />
                  <span className="text-2xl font-black text-amber-900">
                    {justEarnedStar ? '+1 YILDIZ!' : 'TAMAMLANDI'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-amber-800">
                  {justEarnedStar 
                    ? 'Yıldız ödülü toplam yıldızlarına eklendi! ⭐' 
                    : 'Bu bölümün yıldızını daha önce kazanmıştın.'}
                </p>
              </div>

              {/* Score Display */}
              <div className="flex justify-around items-center bg-indigo-50/80 rounded-2xl p-3 mb-6 border border-indigo-100">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase">Skor</div>
                  <div className="text-2xl font-black text-indigo-900">{score}</div>
                </div>
                <div className="h-8 w-px bg-indigo-200" />
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase">Bölüm</div>
                  <div className="text-2xl font-black text-indigo-900">{level} / 10</div>
                </div>
              </div>

              {/* Action Button: SONRAKİ BÖLÜM */}
              <button 
                onClick={handleNextLevel} 
                className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl font-black text-lg sm:text-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {level < 10 ? (
                  <>
                    <span>SONRAKİ BÖLÜM</span>
                    <Sparkles size={22} className="animate-pulse" />
                  </>
                ) : (
                  <>
                    <span>TÜM OYUNU BİTİR</span>
                    <Trophy size={22} />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Time Up */}
      <AnimatePresence>
        {showTimeUp && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85 }} 
              animate={{ scale: 1 }} 
              className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-amber-200 select-none"
            >
              <div className="text-5xl mb-3">⏰🎈</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Süre Doldu!</h2>
              <p className="text-slate-600 font-semibold mb-4 text-sm sm:text-base">
                Bu bölümde {levelPops} / {config.targetPops} balon patlattın. Tekrar denemek ister misin?
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleRetryLevel} 
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-lg shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  🔄 Bölümü Tekrar Dene
                </button>
                <button 
                  onClick={onBack} 
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-transform active:scale-95 cursor-pointer"
                >
                  🏠 Ana Menüye Dön
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Game Finished (All 10 Levels Completed) */}
      <AnimatePresence>
        {gameFinished && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85 }} 
              animate={{ scale: 1 }} 
              className="bg-white/95 backdrop-blur-md p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-purple-200 select-none"
            >
              <div className="text-6xl mb-4 animate-bounce">👑🎈</div>
              <h2 className="text-3xl font-black text-purple-950 mb-2">BALON USTASI!</h2>
              <p className="text-purple-800 font-bold mb-4">
                Tüm 10 bölümü başarıyla tamamladın!
              </p>
              <div className="bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-200">
                <div className="text-xs font-bold text-purple-600 uppercase">Toplam Skorun</div>
                <div className="text-3xl font-black text-purple-950 my-1">{score}</div>
              </div>
              <button 
                onClick={() => onComplete(score)} 
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl font-black text-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                🏠 Menüye Dön
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
