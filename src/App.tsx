import { useState, useEffect } from 'react';
import GameMenu from './components/GameMenu';
import BalloonPop from './components/Games/BalloonPop';
import Match3Game from './components/Games/Match3Game';
import PlatformerGame from './components/Games/PlatformerGame';
import PuzzleGame from './components/Games/PuzzleGame';
import FishingGame from './components/Games/FishingGame';
import FruitCollector from './components/Games/FruitCollector';
import MemoryCards from './components/Games/MemoryCards';

export default function App() {
  const [view, setView] = useState('menu');
  const [totalStars, setTotalStars] = useState(0);
  const [lastScore, setLastScore] = useState(0);

  useEffect(() => {
    const stars = localStorage.getItem('stars');
    if (stars) setTotalStars(parseInt(stars));
  }, []);

  const handleGameComplete = (score: number) => {
    const newStars = Math.floor(score / 50);
    const updatedStars = totalStars + newStars;
    setTotalStars(updatedStars);
    localStorage.setItem('stars', updatedStars.toString());
    setLastScore(score);
    setView('results');
  };

  return (
    <>
      {view === 'menu' && <GameMenu onSelect={setView} totalStars={totalStars} />}
      {view === 'balloon' && <BalloonPop onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'match' && <Match3Game onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'stars' && <PlatformerGame onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'puzzle' && <PuzzleGame onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'fish' && <FishingGame onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'memory' && <MemoryCards onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'fruit' && <FruitCollector onBack={() => setView('menu')} onComplete={handleGameComplete} />}
      {view === 'results' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-amber-50 via-orange-50 to-sky-100 select-none">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-amber-200 text-center max-w-md w-full flex flex-col items-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-amber-900 mb-2">Tebrikler!</h2>
            <p className="text-amber-700 font-medium mb-6">Harika bir performans sergiledin!</p>
            
            <div className="bg-amber-100/80 rounded-2xl p-4 w-full mb-6 border border-amber-200">
              <div className="text-sm font-bold text-amber-800 uppercase tracking-wide">Kazanılan Skor</div>
              <div className="text-4xl font-black text-amber-900 my-1">{lastScore}</div>
            </div>

            <button 
              onClick={() => setView('menu')} 
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              🏠 Ana Menüye Dön
            </button>
          </div>
        </div>
      )}
    </>
  );
}
