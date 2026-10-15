import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Trophy, Sparkles, Volume2, VolumeX, RotateCcw, Clock, ArrowRight } from 'lucide-react';

interface FallingObject {
  id: number;
  type: string;
  name: string;
  x: number; // percentage (8 to 92)
  y: number; // percentage (0 to 100)
  speed: number;
  isBad: boolean;
  isBonus: boolean;
}

interface FruitCollectorProps {
  onBack: () => void;
  onComplete: (score: number) => void;
  onAwardStars?: (stars: number) => void;
}

interface LevelConfig {
  targetFruits: number;
  speed: number;
  badRate: number;
  bonusRate: number;
  spawnInterval: number;
  timeLimit: number;
}

const FRUIT_ITEMS = [
  { emoji: '🍎', name: 'Elma' },
  { emoji: '🍐', name: 'Armut' },
  { emoji: '🍊', name: 'Portakal' },
  { emoji: '🍓', name: 'Çilek' },
  { emoji: '🍌', name: 'Muz' },
  { emoji: '🍉', name: 'Karpuz' },
  { emoji: '🍇', name: 'Üzüm' },
  { emoji: '🍑', name: 'Şeftali' },
];

const BAD_ITEMS = [
  { emoji: '🍂', name: 'Kuru Yaprak' },
  { emoji: '🐛', name: 'Tırtıl' },
];

const BONUS_ITEM = { emoji: '🌟', name: 'Yıldız Meyvesi' };

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { targetFruits: 5, speed: 1.2, badRate: 0, bonusRate: 0, spawnInterval: 950, timeLimit: 50 },
  2: { targetFruits: 7, speed: 1.3, badRate: 0, bonusRate: 0, spawnInterval: 900, timeLimit: 50 },
  3: { targetFruits: 8, speed: 1.4, badRate: 0, bonusRate: 0.05, spawnInterval: 850, timeLimit: 50 },
  4: { targetFruits: 10, speed: 1.5, badRate: 0.08, bonusRate: 0.08, spawnInterval: 800, timeLimit: 55 },
  5: { targetFruits: 12, speed: 1.6, badRate: 0.1, bonusRate: 0.1, spawnInterval: 750, timeLimit: 55 },
  6: { targetFruits: 15, speed: 1.7, badRate: 0.12, bonusRate: 0.1, spawnInterval: 720, timeLimit: 60 },
  7: { targetFruits: 18, speed: 1.8, badRate: 0.14, bonusRate: 0.12, spawnInterval: 700, timeLimit: 60 },
  8: { targetFruits: 20, speed: 1.9, badRate: 0.15, bonusRate: 0.12, spawnInterval: 680, timeLimit: 65 },
  9: { targetFruits: 22, speed: 2.0, badRate: 0.16, bonusRate: 0.14, spawnInterval: 650, timeLimit: 65 },
  10: { targetFruits: 25, speed: 2.1, badRate: 0.18, bonusRate: 0.15, spawnInterval: 600, timeLimit: 70 },
};

export default function FruitCollector({ onBack, onComplete, onAwardStars }: FruitCollectorProps) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [levelFruitsCollected, setLevelFruitsCollected] = useState(0);
  const [basketX, setBasketX] = useState(50);
  const [basketBounce, setBasketBounce] = useState(false);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & States
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [justEarnedStar, setJustEarnedStar] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; color: string; id: number } | null>(null);

  const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[10];
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);

  const basketXRef = useRef(50);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const isTransitioningRef = useRef(false);

  // Helper to read completed levels from localStorage
  const getCompletedLevels = useCallback((): number[] => {
    try {
      const data = localStorage.getItem('fruit_completed_levels');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  // Web Audio Context setup
  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  // Audio: Catch / Pop Sound
  const playCatchSound = useCallback(() => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, audioContext.current.currentTime + 0.12);

      gain.gain.setValueAtTime(0.18, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.12);

      osc.start();
      osc.stop(audioContext.current.currentTime + 0.12);
    } catch {
      // Audio fallback
    }
  }, [isMuted]);

  // Audio: Bad item sound
  const playBadSound = useCallback(() => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioContext.current.currentTime + 0.18);

      gain.gain.setValueAtTime(0.15, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.18);

      osc.start();
      osc.stop(audioContext.current.currentTime + 0.18);
    } catch {
      // Audio fallback
    }
  }, [isMuted]);

  // Audio: Celebration sound
  const playCelebrationSound = useCallback(() => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const notes = [293.66, 369.99, 440.00, 587.33];
      notes.forEach((freq, i) => {
        const osc = audioContext.current!.createOscillator();
        const gain = audioContext.current!.createGain();
        osc.connect(gain);
        gain.connect(audioContext.current!.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = audioContext.current!.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.14, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);
        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch {
      // Audio fallback
    }
  }, [isMuted]);

  // Handle level completion
  const handleLevelCompleted = useCallback((completedLvl: number) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    playCelebrationSound();

    const completedList = getCompletedLevels();
    const alreadyEarned = completedList.includes(completedLvl);

    if (!alreadyEarned) {
      const updatedList = [...completedList, completedLvl];
      try {
        localStorage.setItem('fruit_completed_levels', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error saving fruit_completed_levels:', e);
      }

      if (onAwardStars) {
        onAwardStars(1);
      } else {
        const curStars = parseInt(localStorage.getItem('stars') || '0', 10);
        const newStars = curStars + 1;
        localStorage.setItem('stars', newStars.toString());
        window.dispatchEvent(new Event('storage'));
      }
      setJustEarnedStar(true);
    } else {
      setJustEarnedStar(false);
    }

    setShowLevelComplete(true);
  }, [getCompletedLevels, onAwardStars, playCelebrationSound]);

  // Reset or restart a level
  const startLevel = useCallback((lvl: number) => {
    isTransitioningRef.current = false;
    const cfg = LEVEL_CONFIGS[lvl] || LEVEL_CONFIGS[10];
    setLevel(lvl);
    setLevelFruitsCollected(0);
    setObjects([]);
    setTimeLeft(cfg.timeLimit);
    setShowLevelComplete(false);
    setShowTimeUp(false);
    setBasketX(50);
    basketXRef.current = 50;
  }, []);

  // When level changes, initialize time
  useEffect(() => {
    const cfg = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[10];
    setTimeLeft(cfg.timeLimit);
    setLevelFruitsCollected(0);
    setObjects([]);
    isTransitioningRef.current = false;
  }, [level]);

  // Level Countdown Timer
  useEffect(() => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowTimeUp(true);
    }
  }, [timeLeft, showLevelComplete, showTimeUp, gameFinished]);

  // Object Spawner
  useEffect(() => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    const interval = setInterval(() => {
      setObjects(prev => {
        if (prev.length >= 8) return prev;

        const isBad = config.badRate > 0 && Math.random() < config.badRate;
        const isBonus = config.bonusRate > 0 && Math.random() < config.bonusRate;

        let selectedItem;
        if (isBonus) {
          selectedItem = BONUS_ITEM;
        } else if (isBad) {
          selectedItem = BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];
        } else {
          selectedItem = FRUIT_ITEMS[Math.floor(Math.random() * FRUIT_ITEMS.length)];
        }

        const newObj: FallingObject = {
          id: Date.now() + Math.random(),
          type: selectedItem.emoji,
          name: selectedItem.name,
          x: Math.random() * 80 + 10, // 10% to 90%
          y: -10,
          speed: (Math.random() * 0.4 + 0.8) * config.speed,
          isBad,
          isBonus,
        };

        return [...prev, newObj];
      });
    }, config.spawnInterval);

    return () => clearInterval(interval);
  }, [config, showLevelComplete, showTimeUp, gameFinished]);

  // Handle Fruit Collection Action (Called both by direct tap and basket collision)
  const collectFruit = useCallback((obj: FallingObject, viaDirectTap: boolean = false) => {
    if (showLevelComplete || showTimeUp || gameFinished || isTransitioningRef.current) return;

    if (obj.isBad) {
      playBadSound();
      setScore(s => Math.max(0, s - 5));
      setFeedback({
        msg: '-5 Dikkat! 🍂',
        color: 'text-rose-500',
        id: Date.now(),
      });
      setObjects(prev => prev.filter(o => o.id !== obj.id));
      setTimeout(() => setFeedback(null), 700);
      return;
    }

    // Good or Bonus Fruit
    playCatchSound();
    setBasketBounce(true);
    setTimeout(() => setBasketBounce(false), 250);

    const points = obj.isBonus ? 25 : 10;
    const fruitsAdded = obj.isBonus ? 2 : 1;

    setScore(s => s + points);
    setFeedback({
      msg: obj.isBonus ? '+25 Süper! 🌟' : viaDirectTap ? `+${points} Yakaladın! ${obj.type}` : `+${points} Sepette! 🧺`,
      color: obj.isBonus ? 'text-amber-500' : 'text-emerald-500',
      id: Date.now(),
    });
    setTimeout(() => setFeedback(null), 700);

    // Remove caught item
    setObjects(prev => prev.filter(o => o.id !== obj.id));

    // Update collected count and check target
    setLevelFruitsCollected(currentCount => {
      const nextCount = currentCount + fruitsAdded;
      if (nextCount >= config.targetFruits) {
        handleLevelCompleted(level);
      }
      return nextCount;
    });
  }, [showLevelComplete, showTimeUp, gameFinished, playBadSound, playCatchSound, config.targetFruits, level, handleLevelCompleted]);

  // Move Objects & Collision with Basket
  useEffect(() => {
    if (showLevelComplete || showTimeUp || gameFinished) return;

    const moveInterval = setInterval(() => {
      setObjects(prev => {
        const next: FallingObject[] = [];
        const currentBasketX = basketXRef.current;

        for (const obj of prev) {
          const nextY = obj.y + obj.speed;

          // Check Basket collision zone (bottom: 74% - 88%)
          const isInCollisionY = nextY >= 74 && nextY <= 88;
          const isInCollisionX = Math.abs(obj.x - currentBasketX) <= 13;

          if (isInCollisionY && isInCollisionX) {
            collectFruit(obj, false);
          } else if (nextY < 100) {
            next.push({ ...obj, y: nextY });
          }
        }

        return next;
      });
    }, 40);

    return () => clearInterval(moveInterval);
  }, [showLevelComplete, showTimeUp, gameFinished, collectFruit]);

  // Basket Pointer Controls
  const updateBasketPosition = (clientX: number) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(8, Math.min(92, relativeX));
    basketXRef.current = clampedX;
    setBasketX(clampedX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.fruit-item')) {
      return;
    }
    updateBasketPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0) {
      updateBasketPosition(e.clientX);
    }
  };

  // Steer basket with buttons (for young toddlers)
  const moveBasketStep = (direction: 'left' | 'right') => {
    const step = 14;
    const newX = direction === 'left' ? Math.max(8, basketX - step) : Math.min(92, basketX + step);
    basketXRef.current = newX;
    setBasketX(newX);
  };

  // Next level handler
  const handleNextLevel = () => {
    setShowLevelComplete(false);
    if (level < 10) {
      startLevel(level + 1);
    } else {
      setGameFinished(true);
    }
  };

  // Replay current level
  const handleReplayLevel = () => {
    startLevel(level);
  };

  // Final Victory Screen (Completed all 10 levels)
  if (gameFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-100 via-teal-50 to-sky-100 p-6 text-center select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-emerald-300"
        >
          <div className="text-7xl mb-4 animate-bounce">🏆🍎</div>
          <h2 className="text-3xl font-black mb-2 text-emerald-950">MEYVE TOPLAMA USTASI!</h2>
          <p className="text-emerald-700 font-medium mb-6">Tüm 10 bölümün meyvelerini başarıyla topladın!</p>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-6 space-y-2">
            <div className="flex items-center justify-between text-emerald-900 font-bold">
              <span>Toplam Skor:</span>
              <span className="text-2xl text-emerald-600 font-black">{score} Puan</span>
            </div>
            <div className="flex items-center justify-between text-emerald-900 font-bold">
              <span>Kazanılan Yıldızlar:</span>
              <span className="text-2xl text-amber-500 font-black flex items-center gap-1">
                ⭐ {getCompletedLevels().length} / 10
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onComplete(score);
              }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              🏠 Ana Menüye Dön
            </button>
            <button
              onClick={() => {
                setGameFinished(false);
                startLevel(1);
              }}
              className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Yeniden Başla
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((levelFruitsCollected / config.targetFruits) * 100));

  return (
    <div
      ref={gameAreaRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
      className="flex flex-col h-screen bg-gradient-to-b from-emerald-100 via-teal-50 to-sky-100 relative overflow-hidden select-none"
    >
      {/* Decorative Sky Background Elements */}
      <div className="absolute top-12 left-6 text-white/50 text-6xl pointer-events-none select-none">☁️</div>
      <div className="absolute top-24 right-10 text-white/50 text-5xl pointer-events-none select-none">☁️</div>
      <div className="absolute bottom-16 left-4 text-emerald-300/40 text-7xl pointer-events-none select-none">🌿</div>
      <div className="absolute bottom-16 right-4 text-emerald-300/40 text-7xl pointer-events-none select-none">🌳</div>

      {/* Top Header Bar */}
      <div className="flex flex-col gap-2 p-3 sm:p-4 m-2 sm:m-4 bg-white/80 backdrop-blur-md rounded-3xl z-20 border-2 border-emerald-200/80 shadow-md">
        <div className="flex justify-between items-center gap-2">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-2.5 sm:p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl transition-transform active:scale-90 shadow-sm border border-emerald-200 cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Level and Target Badge */}
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 sm:px-4 py-1.5 rounded-2xl font-black text-sm sm:text-base shadow-sm">
            <span>Bölüm {level} / 10</span>
          </div>

          {/* Fruits Collected Target */}
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-2xl font-black text-sm sm:text-base shadow-sm">
            <span>🍎</span>
            <span>{levelFruitsCollected} / {config.targetFruits}</span>
          </div>

          {/* Score & Time & Mute */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1.5 rounded-2xl font-bold text-xs sm:text-sm shadow-sm">
              <Trophy size={16} className="text-amber-500" />
              <span>{score}</span>
            </div>

            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl font-bold text-xs sm:text-sm border shadow-sm ${
              timeLeft <= 10 ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse' : 'bg-white text-emerald-900 border-emerald-200'
            }`}>
              <Clock size={15} />
              <span>{timeLeft}s</span>
            </div>

            <button
              onClick={() => setIsMuted(m => !m)}
              className="p-2 sm:p-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl transition-transform active:scale-90 shadow-sm cursor-pointer"
              aria-label="Ses Aç/Kapat"
            >
              {isMuted ? <VolumeX size={18} className="text-rose-500" /> : <Volume2 size={18} className="text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* Progress Bar for Fruits Target */}
        <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden border border-emerald-200/60">
          <motion.div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Play Area */}
      <div className="relative flex-grow overflow-hidden">
        {/* Floating Feedback Bubble */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1.1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 font-black text-2xl sm:text-4xl ${feedback.color} bg-white/95 backdrop-blur-md px-6 py-3 rounded-3xl shadow-2xl border-4 border-white pointer-events-none select-none`}
            >
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Falling Fruit and Bad Objects */}
        {objects.map(obj => (
          <div
            key={obj.id}
            onClick={(e) => {
              e.stopPropagation();
              collectFruit(obj, true);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              collectFruit(obj, true);
            }}
            className="fruit-item absolute flex items-center justify-center cursor-pointer select-none transition-transform active:scale-125"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '64px',
              height: '64px',
            }}
          >
            <div className={`relative flex items-center justify-center w-14 h-14 rounded-full ${
              obj.isBonus 
                ? 'bg-amber-100/90 shadow-lg shadow-amber-300/50 border-2 border-amber-300 animate-pulse' 
                : obj.isBad 
                ? 'bg-rose-50/70 border border-rose-200' 
                : 'hover:scale-110 active:scale-125 transition-transform'
            }`}>
              <span className="text-4xl sm:text-5xl filter drop-shadow-md">
                {obj.type}
              </span>
              {obj.isBonus && (
                <span className="absolute -top-1 -right-1 text-xs">✨</span>
              )}
            </div>
          </div>
        ))}

        {/* The Basket */}
        <div
          className="absolute bottom-16 select-none pointer-events-none z-10 transition-transform duration-75"
          style={{
            left: `${basketX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            animate={basketBounce ? { scale: [1, 1.25, 0.95, 1], y: [0, -8, 2, 0] } : { scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-col items-center justify-center"
          >
            <span className="text-6xl sm:text-7xl filter drop-shadow-xl">🧺</span>
            <span className="text-xs font-black text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full shadow-sm mt-0.5 border border-emerald-200">
              Sepet
            </span>
          </motion.div>
        </div>

        {/* Touch Guidance for Kids */}
        <div className="absolute bottom-2 inset-x-4 flex justify-between items-center z-20 pointer-events-auto">
          <button
            onClick={() => moveBasketStep('left')}
            className="w-16 h-12 bg-white/90 hover:bg-emerald-50 active:bg-emerald-200 text-emerald-800 font-black text-xl rounded-2xl shadow-md border-2 border-emerald-300 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            aria-label="Sepeti Sola Kaydır"
          >
            ◀ SOL
          </button>

          <span className="text-xs font-bold text-emerald-800 bg-white/70 px-3 py-1 rounded-full shadow-sm">
            Meyvelere dokun veya sepetle topla!
          </span>

          <button
            onClick={() => moveBasketStep('right')}
            className="w-16 h-12 bg-white/90 hover:bg-emerald-50 active:bg-emerald-200 text-emerald-800 font-black text-xl rounded-2xl shadow-md border-2 border-emerald-300 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            aria-label="Sepeti Sağa Kaydır"
          >
            SAĞ ▶
          </button>
        </div>
      </div>

      {/* Level Completed Modal */}
      <AnimatePresence>
        {showLevelComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-emerald-300 relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="text-5xl sm:text-6xl mb-2 animate-bounce">🎉🍎⭐</div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-emerald-950">
                BÖLÜM {level} TAMAMLANDI!
              </h2>

              <p className="text-emerald-700 font-semibold mb-4 text-sm sm:text-base">
                Harika iş! Tüm meyveleri topladın!
              </p>

              {/* Star reward badge */}
              {justEarnedStar ? (
                <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-3 mb-4 flex items-center justify-center gap-2 text-amber-900 font-black animate-pulse">
                  <Star className="text-amber-500 fill-amber-400" size={24} />
                  <span>+1 YENİ YILDIZ KAZANDIN!</span>
                  <Sparkles className="text-amber-500" size={20} />
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 mb-4 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <Star className="text-amber-500 fill-amber-400" size={16} />
                  <span>Bu bölümün yıldızı zaten koleksiyonunda!</span>
                </div>
              )}

              {/* Level Stats */}
              <div className="bg-emerald-50/80 rounded-2xl p-3 mb-6 space-y-1.5 border border-emerald-200 text-sm">
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>Toplanan Meyve:</span>
                  <span className="text-emerald-700">{config.targetFruits} / {config.targetFruits} 🍎</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>Toplam Skor:</span>
                  <span className="text-emerald-700">{score} Puan</span>
                </div>
              </div>

              {/* Next Level / Finish Button */}
              <button
                onClick={handleNextLevel}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {level < 10 ? (
                  <>
                    <span>SONRAKİ BÖLÜM</span>
                    <ArrowRight size={22} />
                  </>
                ) : (
                  <>
                    <span>BÜYÜK KUPAYI AL! 🏆</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Up Modal */}
      <AnimatePresence>
        {showTimeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-amber-300"
            >
              <div className="text-6xl mb-3">⏰🍎</div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-amber-950">
                SÜRE DOLDU!
              </h2>
              <p className="text-amber-800 font-medium mb-4 text-sm sm:text-base">
                Meyveleri toplamaya çok yaklaştın. Bir kez daha dene!
              </p>

              <div className="bg-amber-50 rounded-2xl p-3 mb-6 border border-amber-200 text-sm">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>Toplanan:</span>
                  <span>{levelFruitsCollected} / {config.targetFruits} 🍎</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleReplayLevel}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  <span>TEKRAR DENE</span>
                </button>

                <button
                  onClick={onBack}
                  className="w-full py-3 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-200 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Ana Menüye Dön
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
