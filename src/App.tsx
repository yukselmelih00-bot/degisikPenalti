import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Target, RotateCcw, Trophy } from 'lucide-react';

type GameState = 'waiting' | 'charging' | 'shooting' | 'result';
type ShotResult = 'goal' | 'save' | 'miss' | null;

function App() {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [power, setPower] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [shotResult, setShotResult] = useState<ShotResult>(null);
  const [goalkeeperPosition, setGoalkeeperPosition] = useState('center');
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 85 });
  const [showResult, setShowResult] = useState(false);
  
  const powerIntervalRef = useRef<NodeJS.Timeout>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Perfect zone boundaries (70-85%)
  const perfectZoneStart = 70;
  const perfectZoneEnd = 85;

  const handleTouchStart = useCallback(() => {
    if (gameState !== 'waiting') return;
    
    setGameState('charging');
    setPower(0);
    setShotResult(null);
    setShowResult(false);
    
    // Start power charging
    powerIntervalRef.current = setInterval(() => {
      setPower(prev => {
        if (prev >= 100) {
          // Auto-shoot at max power
          return 100;
        }
        return prev + 2; // Charge speed
      });
    }, 50);
  }, [gameState]);

  const handleTouchEnd = useCallback(() => {
    if (gameState !== 'charging') return;
    
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
    }
    
    setGameState('shooting');
    
    // Calculate shot outcome
    const result = calculateShotOutcome(power);
    setShotResult(result);
    
    // Animate goalkeeper
    animateGoalkeeper();
    
    // Animate ball
    animateBall(result, power);
    
    // Update score and attempts
    setAttempts(prev => prev + 1);
    if (result === 'goal') {
      setScore(prev => prev + 1);
    }
    
    // Show result after animation
    setTimeout(() => {
      setShowResult(true);
      setTimeout(() => {
        resetGame();
      }, 2000);
    }, 1000);
  }, [gameState, power]);

  const calculateShotOutcome = (shotPower: number): ShotResult => {
    if (shotPower >= perfectZoneStart && shotPower <= perfectZoneEnd) {
      return 'goal';
    } else if (shotPower < perfectZoneStart) {
      return 'save'; // Weak shot, goalkeeper saves
    } else {
      return 'miss'; // Too powerful, ball goes over
    }
  };

  const animateGoalkeeper = () => {
    const positions = ['left', 'center', 'right'];
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    setGoalkeeperPosition(randomPosition);
  };

  const animateBall = (result: ShotResult, shotPower: number) => {
    if (result === 'goal') {
      // Ball goes to goal
      setBallPosition({ x: 50 + (Math.random() - 0.5) * 30, y: 40 });
    } else if (result === 'save') {
      // Ball goes toward goalkeeper
      const gkX = goalkeeperPosition === 'left' ? 25 : goalkeeperPosition === 'right' ? 75 : 50;
      setBallPosition({ x: gkX + (Math.random() - 0.5) * 10, y: 45 });
    } else {
      // Ball goes over the goal
      setBallPosition({ x: 50 + (Math.random() - 0.5) * 40, y: 10 });
    }
  };

  const resetGame = () => {
    setGameState('waiting');
    setPower(0);
    setShotResult(null);
    setShowResult(false);
    setBallPosition({ x: 50, y: 85 });
    setGoalkeeperPosition('center');
  };

  const resetScore = () => {
    setScore(0);
    setAttempts(0);
    resetGame();
  };

  // Auto-shoot when power reaches 100%
  useEffect(() => {
    if (power >= 100 && gameState === 'charging') {
      handleTouchEnd();
    }
  }, [power, gameState, handleTouchEnd]);

  // Add touch event listeners
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      handleTouchStart();
    };

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      handleTouchEnd();
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold text-white">Mükemmel Şut</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white font-bold">
            <Trophy className="w-5 h-5 inline mr-1" />
            {score}/{attempts}
          </div>
          <button
            onClick={resetScore}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={gameContainerRef}
        className="flex-1 relative overflow-hidden cursor-pointer select-none"
        style={{ userSelect: 'none', touchAction: 'none' }}
      >
        {/* Soccer Field */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-600 via-green-500 to-green-400">
          {/* Field Lines */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white/30 rounded-t-full"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/50 rounded-full"></div>
        </div>

        {/* Goal */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="relative w-48 h-24 bg-white/10 border-2 border-white/40 rounded-t-lg">
            {/* Goal Posts */}
            <div className="absolute -left-1 top-0 w-2 h-24 bg-white/60"></div>
            <div className="absolute -right-1 top-0 w-2 h-24 bg-white/60"></div>
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/60 rounded-t-lg"></div>
            
            {/* Goal Net Pattern */}
            <div className="absolute inset-2 opacity-30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="absolute bg-white/40 w-full h-px" style={{ top: `${i * 12.5}%` }}></div>
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="absolute bg-white/40 h-full w-px" style={{ left: `${i * 16.66}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Goalkeeper */}
        <div 
          className={`absolute top-20 transition-all duration-500 ${
            goalkeeperPosition === 'left' ? 'left-1/4' : 
            goalkeeperPosition === 'right' ? 'right-1/4' : 
            'left-1/2 -translate-x-1/2'
          } ${gameState === 'shooting' ? 'animate-bounce' : ''}`}
        >
          <div className="relative">
            {/* Goalkeeper Body */}
            <div className="w-8 h-12 bg-yellow-500 rounded-lg relative overflow-hidden">
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-orange-300 rounded-full"></div>
              <div className="absolute top-4 inset-x-1 h-6 bg-red-500 rounded"></div>
              <div className="absolute bottom-0 inset-x-1 h-4 bg-blue-600 rounded"></div>
            </div>
            {/* Arms */}
            <div className="absolute top-4 -left-2 w-2 h-4 bg-orange-300 rounded rotate-45"></div>
            <div className="absolute top-4 -right-2 w-2 h-4 bg-orange-300 rounded -rotate-45"></div>
          </div>
        </div>

        {/* Football */}
        <div 
          className="absolute w-6 h-6 transition-all duration-1000 ease-out"
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-full h-full bg-white rounded-full relative overflow-hidden shadow-lg">
            {/* Soccer Ball Pattern */}
            <div className="absolute inset-1 border border-black/20 rounded-full">
              <div className="absolute top-1/2 left-1/2 w-2 h-2 border border-black/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-0 left-1/2 w-px h-full bg-black/20 transform -translate-x-1/2 rotate-45"></div>
              <div className="absolute top-0 left-1/2 w-px h-full bg-black/20 transform -translate-x-1/2 -rotate-45"></div>
            </div>
          </div>
        </div>

        {/* Power Bar */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-80 max-w-[90vw]">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Güç</span>
              <span className="text-white font-bold">{Math.round(power)}%</span>
            </div>
            
            {/* Power Bar Background */}
            <div className="relative h-6 bg-gray-700/50 rounded-full overflow-hidden">
              {/* Perfect Zone Indicator */}
              <div 
                className="absolute top-0 h-full bg-green-400/50 border-2 border-green-300"
                style={{
                  left: `${perfectZoneStart}%`,
                  width: `${perfectZoneEnd - perfectZoneStart}%`
                }}
              ></div>
              
              {/* Power Fill */}
              <div 
                className={`h-full transition-all duration-100 ${
                  power >= perfectZoneStart && power <= perfectZoneEnd 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : power < perfectZoneStart 
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                }`}
                style={{ width: `${power}%` }}
              ></div>
              
              {/* Perfect Zone Labels */}
              <div className="absolute -top-8 text-xs text-white/80" style={{ left: `${perfectZoneStart}%` }}>
                Mükemmel
              </div>
            </div>
            
            {/* Instructions */}
            <div className="mt-2 text-center text-white/80 text-sm">
              {gameState === 'waiting' && "Şut atmak için basılı tut"}
              {gameState === 'charging' && "Yeşil alana gelince bırak!"}
              {gameState === 'shooting' && "Şut atılıyor..."}
            </div>
          </div>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-8 text-center animate-bounce">
              <div className="text-4xl mb-4">
                {shotResult === 'goal' && '⚽'}
                {shotResult === 'save' && '🧤'}
                {shotResult === 'miss' && '😅'}
              </div>
              <div className="text-xl font-bold">
                {shotResult === 'goal' && 'GOL!'}
                {shotResult === 'save' && 'Kaleci Kurtardı!'}
                {shotResult === 'miss' && 'Dışarı Gitti!'}
              </div>
              <div className="text-gray-600 mt-2">
                Güç: {Math.round(power)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/10 backdrop-blur-sm text-center text-white/80 text-sm">
        <p>Yeşil alana denk getirerek mükemmel şutu at!</p>
        <p className="mt-1">Başarı Oranı: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%</p>
      </div>
    </div>
  );
}

export default App;