import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Star } from 'lucide-react';

const PUZZLES = [
  { id: 1, name: 'Elma', img: '🍎' },
  { id: 2, name: 'Araba', img: '🚗' },
  { id: 3, name: 'Ev', img: '🏠' },
  { id: 4, name: 'Balık', img: '🐟' },
  { id: 5, name: 'Çiçek', img: '🌸' },
  { id: 6, name: 'Köpek', img: '🐶' },
  { id: 7, name: 'Yıldız', img: '⭐' },
  { id: 8, name: 'Roket', img: '🚀' },
  { id: 9, name: 'Kedi', img: '🐱' },
  { id: 10, name: 'Güneş', img: '☀️' },
];

export default function PuzzleGame({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [missingIdx, setMissingIdx] = useState(0);

  const puzzle = PUZZLES[currentIdx];

  useEffect(() => {
    const opts = [puzzle.img, '🍌', '🚲', '🎈'].sort(() => 0.5 - Math.random());
    setOptions(opts);
    setMissingIdx(Math.floor(Math.random() * 16));
    setSelectedOption(null);
    setPlaced(false);
  }, [currentIdx]);

  const handleSelectOption = (option: string) => {
    if (placed) return;
    setSelectedOption(option);
    setWrongAttempt(false);
  };

  const handleTargetClick = () => {
    if (placed || !selectedOption) return;

    if (selectedOption === puzzle.img) {
      setPlaced(true);
      const newScore = score + 20;
      setScore(newScore);
      setSelectedOption(null);
      
      setTimeout(() => {
        if (currentIdx + 1 < PUZZLES.length) {
          setCurrentIdx(i => i + 1);
        } else {
          setFinished(true);
        }
      }, 900);
    } else {
      setWrongAttempt(true);
      setTimeout(() => setWrongAttempt(false), 600);
    }
  };

  if (finished) {
    const stars = Math.floor(score / 50);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-amber-100 p-6 text-center select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-sky-200">
          <div className="text-6xl mb-4">🧩🏆</div>
          <h2 className="text-3xl font-black mb-4 text-sky-900">MİNİ OYUN TAMAMLANDI!</h2>
          <p className="text-2xl font-bold mb-8 text-sky-800 flex items-center justify-center gap-2">⭐ Kazanılan Yıldız: {stars} <Star className="text-amber-400 fill-amber-400 w-6 h-6" /></p>
          <button onClick={() => {
              const currentStars = parseInt(localStorage.getItem('stars') || '0');
              localStorage.setItem('stars', (currentStars + stars).toString());
              onComplete(score);
          }} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-transform active:scale-95">OYUNLAR MENÜSÜ</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 select-none">
      <div className="flex justify-between items-center w-full max-w-md mb-4 p-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white">
        <button onClick={onBack} className="p-3 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold text-sky-900">Parçayı Yerleştir! ({currentIdx + 1}/10)</h1>
        <div className="flex items-center gap-1 font-bold text-sky-900"><Trophy className="text-amber-500" size={20} /> {score}</div>
      </div>

      <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm mb-4 border border-white">
        <p className="text-sky-800 font-bold text-sm text-center">
          {selectedOption ? '✨ Şimdi yukarıdaki boş kutuya dokun!' : '👉 Önce aşağıdan doğru parçaya dokun!'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-6 bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-xl border-4 border-white">
        {[...Array(16)].map((_, i) => (
            i === missingIdx ? (
                <motion.div 
                  key={i} 
                  onClick={handleTargetClick}
                  animate={wrongAttempt ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 flex items-center justify-center text-4xl sm:text-5xl cursor-pointer transition-all ${
                    placed 
                      ? 'bg-emerald-100 border-emerald-400 shadow-md scale-105' 
                      : wrongAttempt
                      ? 'bg-rose-100 border-rose-500'
                      : selectedOption
                      ? 'bg-amber-50 border-amber-400 border-solid animate-pulse ring-4 ring-amber-200'
                      : 'bg-sky-100 border-dashed border-sky-300 hover:bg-sky-200'
                  }`}
                >
                    {placed ? puzzle.img : (selectedOption ? '❓' : '')}
                </motion.div>
            ) : (
                <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-center text-4xl sm:text-5xl shadow-inner">
                    {puzzle.img}
                </div>
            )
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-auto mb-6 max-w-md">
        {!placed && options.map((option, i) => {
          const isSelected = selectedOption === option;
          return (
            <motion.div 
              key={i} 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleSelectOption(option)}
              className={`w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl bg-white rounded-3xl shadow-xl border-4 flex items-center justify-center cursor-pointer transition-all ${
                isSelected 
                  ? 'border-amber-400 bg-amber-50 shadow-2xl ring-4 ring-amber-300 scale-105' 
                  : 'border-white hover:border-sky-300'
              }`}
            >
              {option}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
