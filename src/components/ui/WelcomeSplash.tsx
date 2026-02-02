import React, { useState, useEffect } from 'react';
import { Sparkles, Rocket, Star, Zap } from 'lucide-react';

interface WelcomeSplashProps {
  onComplete?: () => void;
  duration?: number;
}

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-blue-600 to-indigo-800 animate-gradient" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-300" />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl animate-pulse delay-700" />

      {/* Main content */}
      <div className={`relative z-10 text-center px-8 transition-all duration-700 ${
        isExiting ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
      }`}>
        {/* Top icons */}
        <div className="flex justify-center gap-4 mb-8 animate-bounce-slow">
          <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" />
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
          <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
        </div>

        {/* Rocket icon with special animation */}
        <div className="mb-6 animate-rocket">
          <Rocket className="w-20 h-20 text-white mx-auto drop-shadow-2xl" />
        </div>

        {/* Main text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg animate-text-glow">
            🚀 نظام ذكي
          </h1>
          
          <div className="flex items-center justify-center gap-2 my-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full animate-dot-wave"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg animate-text-glow delay-300">
            مستقبل مشرق ✨
          </h2>
        </div>

        {/* Bottom icons */}
        <div className="flex justify-center gap-4 mt-8 animate-bounce-slow delay-500">
          <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
          <Sparkles className="w-8 h-8 text-white/80 animate-pulse delay-150" />
          <Zap className="w-6 h-6 text-yellow-300 animate-pulse delay-300" />
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-32 animate-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(255,255,255,0.1)"
            d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </div>
  );
};

export default WelcomeSplash;
