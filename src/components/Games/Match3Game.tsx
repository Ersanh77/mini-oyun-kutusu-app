import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Trophy } from 'lucide-react';

const GRID_SIZE = 7;
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍉'];

export default function Match3Game({ onBack, onComplete }: { onBack: () => void, onComplete: (score: number) => void }) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createBoard = () => {
    let board: string[][];
    do {
      board = Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => FRUITS[Math.floor(Math.random() * FRUITS.length)])
      );
    } while (hasMatch(board) || !hasValidMove(board));
    return board;
  };

  const hasMatch = (board: string[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (c < GRID_SIZE - 2 && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) return true;
        if (r < GRID_SIZE - 2 && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) return true;
      }
    }
    return false;
  };

  const hasValidMove = (board: string[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (c < GRID_SIZE - 1) {
          const b = board.map(row => [...row]);
          [b[r][c], b[r][c+1]] = [b[r][c+1], b[r][c]];
          if (hasMatch(b)) return true;
        }
        if (r < GRID_SIZE - 1) {
          const b = board.map(row => [...row]);
          [b[r][c], b[r+1][c]] = [b[r+1][c], b[r][c]];
          if (hasMatch(b)) return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    setGrid(createBoard());
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const currentStars = parseInt(localStorage.getItem('stars') || '0');
      const earnedStars = Math.floor(score / 150);
      localStorage.setItem('stars', (currentStars + earnedStars).toString());
      onComplete(score);
    }
  }, [timeLeft, score, onComplete]);

  const handleCellClick = (r: number, c: number) => {
    if (isProcessing) return;
    if (!selected) {
      setSelected([r, c]);
    } else {
      const [sr, sc] = selected;
      const isNeighbor = Math.abs(r - sr) + Math.abs(c - sc) === 1;
      if (isNeighbor) {
        processSwap(sr, sc, r, c);
      } else {
        setSelected([r, c]);
      }
    }
  };

  const processSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsProcessing(true);
    const newGrid = grid.map(row => [...row]);
    [newGrid[r1][c1], newGrid[r2][c2]] = [newGrid[r2][c2], newGrid[r1][c1]];

    if (hasMatch(newGrid)) {
      setGrid(newGrid);
      setSelected(null);
      await resolveMatches(newGrid);
    } else {
      setGrid(newGrid);
      setTimeout(() => {
        const revertGrid = newGrid.map(row => [...row]);
        [revertGrid[r1][c1], revertGrid[r2][c2]] = [revertGrid[r2][c2], revertGrid[r1][c1]];
        setGrid(revertGrid);
        setSelected(null);
        setIsProcessing(false);
      }, 300);
    }
  };

  const resolveMatches = async (board: string[][]) => {
    let currentBoard = board;
    let matched = true;
    while (matched) {
      const matches: [number, number][] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (c < GRID_SIZE - 2 && currentBoard[r][c] === currentBoard[r][c+1] && currentBoard[r][c] === currentBoard[r][c+2]) {
            matches.push([r, c], [r, c+1], [r, c+2]);
          }
          if (r < GRID_SIZE - 2 && currentBoard[r][c] === currentBoard[r+1][c] && currentBoard[r][c] === currentBoard[r+2][c]) {
            matches.push([r, c], [r+1, c], [r+2, c]);
          }
        }
      }
      if (matches.length > 0) {
        const uniqueMatches = Array.from(new Set(matches.map(m => JSON.stringify(m)))).map(m => JSON.parse(m) as [number, number]);
        setScore(s => s + (uniqueMatches.length * 10));
        uniqueMatches.forEach(([r, c]) => currentBoard[r][c] = '');
        
        for (let c = 0; c < GRID_SIZE; c++) {
            let write = GRID_SIZE - 1;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (currentBoard[r][c] !== '') {
                    [currentBoard[write][c], currentBoard[r][c]] = [currentBoard[r][c], currentBoard[write][c]];
                    write--;
                }
            }
            for (let r = write; r >= 0; r--) currentBoard[r][c] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        }
        setGrid(currentBoard.map(row => [...row]));
        await new Promise(r => setTimeout(r, 400));
      } else {
        matched = false;
      }
    }
    if (!hasValidMove(currentBoard)) setGrid(createBoard());
    setIsProcessing(false);
  };

  const resetGame = () => {
    setGrid(createBoard());
    setScore(0);
    setTimeLeft(60);
    setSelected(null);
  };

  if (timeLeft === 0) {
    const stars = Math.floor(score / 150);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-emerald-100 to-teal-200 select-none">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-emerald-200">
          <div className="text-6xl mb-4">🏆🍓</div>
          <h2 className="text-4xl font-extrabold mb-4 text-emerald-900">Süre Bitti!</h2>
          <p className="text-2xl font-bold mb-2 text-emerald-800">Skorun: {score}</p>
          <p className="text-xl font-semibold mb-8 text-amber-600">⭐ Kazandığın Yıldız: {stars}</p>
          <div className="flex flex-col gap-3">
            <button onClick={resetGame} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 cursor-pointer">Tekrar Oyna</button>
            <button onClick={() => {
              if (stars > 0) {
                const cur = parseInt(localStorage.getItem('stars') || '0', 10);
                localStorage.setItem('stars', (cur + stars).toString());
              }
              onBack();
            }} className="w-full py-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-2xl font-bold text-lg transition-transform active:scale-95 cursor-pointer">Ana Menü</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-emerald-200 to-teal-100 select-none">
      <div className="flex justify-between items-center w-full max-w-md mb-6 p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white">
        <button onClick={onBack} className="p-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-6 font-bold text-emerald-900 text-lg">
          <span className="flex items-center gap-1">⏱️ {timeLeft}s</span>
          <span className="flex items-center gap-1"><Trophy className="text-amber-500" size={22} /> {score}</span>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl transition-colors shadow-sm">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>
      
      <div className="grid gap-2 p-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-4 border-emerald-200" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
        {grid.map((row, r) => row.map((fruit, c) => (
          <motion.button 
            key={`${r}-${c}`} 
            onClick={() => handleCellClick(r, c)} 
            className={`w-12 h-12 md:w-14 md:h-14 text-3xl md:text-4xl flex items-center justify-center bg-emerald-50 rounded-2xl shadow-sm transition-all ${selected?.[0] === r && selected?.[1] === c ? 'ring-4 ring-emerald-400 bg-emerald-100 scale-105' : 'hover:bg-emerald-100'}`} 
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            {fruit}
          </motion.button>
        )))}
      </div>
    </div>
  );
}
