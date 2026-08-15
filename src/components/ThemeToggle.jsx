import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(function() {
    if (document.documentElement.classList.contains('light')) {
      setTheme('light');
    }
  }, []);

  function toggleTheme() {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      setTheme('dark');
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full bg-slate-900 [.light_&]:bg-[#FBF5DD] border border-emerald-500/40 [.light_&]:border-[#0D530E]/30 text-emerald-400 [.light_&]:text-[#0D530E] hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] [.light_&]:hover:shadow-[0_0_15px_rgba(13,83,14,0.3)] transition-all duration-300 flex items-center justify-center group"
      title="Toggle Theme"
    >
      <Zap className="w-5 h-5 group-hover:animate-pulse drop-shadow-md" />
    </button>
  );
}