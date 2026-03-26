/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, RotateCw, Trophy, Settings2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Segment {
  id: string;
  text: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
];

export default function App() {
  const [segments, setSegments] = useState<Segment[]>([
    { id: '1', text: 'Pizza', color: DEFAULT_COLORS[0] },
    { id: '2', text: 'Sushi', color: DEFAULT_COLORS[1] },
    { id: '3', text: 'Burger', color: DEFAULT_COLORS[2] },
    { id: '4', text: 'Salad', color: DEFAULT_COLORS[3] },
    { id: '5', text: 'Tacos', color: DEFAULT_COLORS[4] },
    { id: '6', text: 'Pasta', color: DEFAULT_COLORS[5] },
  ]);
  
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Segment | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef<number>(0);
  const currentRotationRef = useRef(0);

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const angleStep = (2 * Math.PI) / segments.length;

    segments.forEach((segment, i) => {
      const startAngle = i * angleStep + currentRotationRef.current;
      const endAngle = startAngle + angleStep;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillText(segment.text, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();

  }, [segments, rotation]);

  const spin = () => {
    if (isSpinning || segments.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    const spinDuration = 4000; // 4 seconds
    const startTimestamp = performance.now();
    const extraSpins = 5 + Math.random() * 5; // 5 to 10 full rotations
    const totalRotation = extraSpins * 2 * Math.PI;
    const initialRotation = currentRotationRef.current;

    const animate = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Easing function: cubic out
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      
      const currentRotation = initialRotation + totalRotation * easeOut(progress);
      currentRotationRef.current = currentRotation;
      setRotation(currentRotation);

      if (progress < 1) {
        spinRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        
        // Calculate winner
        // The pointer is at the top (3/2 * PI or -1/2 * PI)
        // We need to find which segment is at that position
        const normalizedRotation = (currentRotation % (2 * Math.PI));
        const angleStep = (2 * Math.PI) / segments.length;
        
        // The wheel rotates clockwise. The pointer is at 12 o'clock (1.5 * PI).
        // A segment at index i is between (i * step + rot) and ((i+1) * step + rot).
        // We want to find i such that (i * step + rot) <= 1.5 * PI <= ((i+1) * step + rot)
        // Or more simply: (1.5 * PI - rot) falls within [i*step, (i+1)*step]
        
        let pointerAngle = (1.5 * Math.PI - normalizedRotation) % (2 * Math.PI);
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
        
        const winningIndex = Math.floor(pointerAngle / angleStep);
        const win = segments[winningIndex];
        setWinner(win);
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [win.color, '#ffffff']
        });
      }
    };

    spinRef.current = requestAnimationFrame(animate);
  };

  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    
    const newSegment: Segment = {
      id: Date.now().toString(),
      text: newOption.trim(),
      color: DEFAULT_COLORS[segments.length % DEFAULT_COLORS.length]
    };
    
    setSegments([...segments, newSegment]);
    setNewOption('');
  };

  const removeOption = (id: string) => {
    if (segments.length <= 2) return;
    setSegments(segments.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#FF6B6B] selection:text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-[#1A1A1A]/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center">
            <RotateCw className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SPIN WHEEL</h1>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-[#1A1A1A]/5 rounded-full transition-colors"
        >
          <Settings2 className="w-6 h-6" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Wheel Section */}
        <div className="relative flex flex-col items-center">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-8 h-10 bg-[#1A1A1A] clip-path-triangle shadow-lg" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
          </div>
          
          <div className="relative p-4 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-[#1A1A1A]/5">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={400} 
              className="max-w-full h-auto"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={spin}
            disabled={isSpinning}
            className={`mt-12 px-12 py-4 rounded-full text-xl font-bold tracking-wider shadow-xl transition-all
              ${isSpinning 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
              }`}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN NOW'}
          </motion.button>

          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-8 p-6 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-2xl text-center max-w-xs w-full"
              >
                <Trophy className="w-10 h-10 text-[#F7DC6F] mx-auto mb-2" />
                <p className="text-sm uppercase tracking-widest font-bold text-[#1A1A1A]/40 mb-1">Winner</p>
                <h2 className="text-3xl font-black uppercase break-words" style={{ color: winner.color }}>
                  {winner.text}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1A1A1A]/5 h-fit">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            Options
            <span className="text-sm font-normal text-[#1A1A1A]/40 bg-[#1A1A1A]/5 px-2 py-1 rounded-md">
              {segments.length}
            </span>
          </h2>

          <form onSubmit={addOption} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add new option..."
              className="flex-1 px-4 py-3 bg-[#FDFCFB] border border-[#1A1A1A]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 focus:border-[#FF6B6B] transition-all"
            />
            <button
              type="submit"
              className="p-3 bg-[#FF6B6B] text-white rounded-xl hover:bg-[#FF5252] transition-colors shadow-lg shadow-[#FF6B6B]/20"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {segments.map((segment) => (
              <motion.div
                layout
                key={segment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group flex items-center justify-between p-4 bg-[#FDFCFB] border border-[#1A1A1A]/5 rounded-2xl hover:border-[#1A1A1A]/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium">{segment.text}</span>
                </div>
                <button
                  onClick={() => removeOption(segment.id)}
                  disabled={segments.length <= 2}
                  className="p-2 text-[#1A1A1A]/20 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/5 rounded-lg transition-all disabled:opacity-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#1A1A1A]/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Wheel Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Numbers', items: ['1', '2', '3', '4', '5', '6', '7', '8'] },
                      { name: 'Yes / No', items: ['YES', 'NO', 'YES', 'NO'] },
                      { name: 'Dinner', items: ['Pizza', 'Sushi', 'Burger', 'Tacos', 'Pasta', 'Steak'] },
                      { name: 'Colors', items: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'] }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setSegments(preset.items.map((text, i) => ({
                            id: i.toString(),
                            text,
                            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length]
                          })));
                          setShowSettings(false);
                        }}
                        className="px-4 py-3 bg-[#FDFCFB] border border-[#1A1A1A]/10 rounded-xl text-sm font-bold hover:border-[#1A1A1A] transition-all"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-top border-[#1A1A1A]/5">
                  <button
                    onClick={() => {
                      setSegments([]);
                      setShowSettings(false);
                    }}
                    className="w-full py-4 text-[#FF6B6B] font-bold hover:bg-[#FF6B6B]/5 rounded-xl transition-all"
                  >
                    Clear All Options
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .clip-path-triangle {
          clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1A1A10;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1A1A1A20;
        }
      `}</style>
    </div>
  );
}
