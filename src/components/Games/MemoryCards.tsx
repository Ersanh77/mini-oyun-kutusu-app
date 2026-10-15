import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Brain, Trophy, Star } from 'lucide-react';

const FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍉', '🍋', '🍒', '🍍'];

export default function MemoryCards({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const shuffled = [...FRUITS, ...FRUITS].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !finished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !finished) {
      setFinished(true);
    }
  }, [timeLeft, finished]);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setScore(s => s + 20);
        setFlipped([]);
        if (matched.length + 2 === 16) setFinished(true);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  const resetGame = () => {
    const shuffled = [...FRUITS, ...FRUITS].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setTimeLeft(60);
    setFinished(false);
  };

  if (finished) {
    const stars = Math.floor(score / 50);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-indigo-200 p-6 text-center select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-sky-200">
          <div className="text-6xl mb-4">🧠🎉</div>
          <h2 className="text-3xl font-black mb-4 text-sky-900">BÖLÜM TAMAMLANDI!</h2>
          <p className="text-2xl font-bold mb-2 text-sky-800 flex items-center justify-center gap-2"><Trophy className="text-amber-500" /> Skor: {score}</p>
          <p className="text-xl font-semibold mb-8 text-amber-600 flex items-center justify-center gap-2">⭐ Kazanılan Yıldız: {stars}</p>
          <div className="flex flex-col gap-3">
            <button onClick={resetGame} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 cursor-pointer">TEKRAR OYNA</button>
            <button onClick={() => {
              if (stars > 0) {
                const cur = parseInt(localStorage.getItem('stars') || '0', 10);
                localStorage.setItem('stars', (cur + stars).toString());
              }
              onComplete(score);
            }} className="w-full py-4 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-2xl font-bold text-lg transition-transform active:scale-95 cursor-pointer">OYUNLAR MENÜSÜ</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-sky-200 to-indigo-100 select-none">
      <div className="flex justify-between items-center w-full max-w-md mb-6 p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white">
        <button onClick={onBack} className="p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-6 font-bold text-sky-900 text-lg">
          <span>⏱️ {timeLeft}s</span>
          <span className="flex items-center gap-1"><Trophy className="text-amber-500" size={22} /> {score}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 w-full max-w-md">
        {cards.map((card, i) => {
          const isRevealed = flipped.includes(i) || matched.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => handleCardClick(i)}
              className={`w-full aspect-square flex items-center justify-center text-4xl sm:text-5xl rounded-3xl shadow-lg transition-all border-4 ${isRevealed ? 'bg-white border-sky-300' : 'bg-gradient-to-br from-sky-400 to-indigo-500 border-white hover:scale-105 active:scale-95'}`}
              whileTap={{ scale: 0.95 }}
            >
              {isRevealed ? card : '❓'}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
