import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import logoImg from '../../assets/logo.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userInfoString = localStorage.getItem('user_info');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        const first = userInfo.first_name || userInfo.firstName || '';
        const last = userInfo.last_name || userInfo.lastName || '';
        let fullName = `${first} ${last}`.trim();
        
        if (!fullName && userInfo.name) fullName = userInfo.name;
        if (!fullName && userInfo.email) fullName = userInfo.email.split('@')[0];
        
        setUserName(fullName || 'Decision Maker');
      } catch (e) {
        setUserName('Decision Maker');
      }
    } else {
        setUserName('Decision Maker');
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    navigate('/');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex justify-between items-center z-50 shadow-lg font-sans relative">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-xl transition-colors duration-300">
           <img 
              src={logoImg} 
              alt="Wall-E Logo" 
              className="w-8 h-8 object-contain brightness-0 invert transition-all duration-300 [.light_&]:brightness-100 [.light_&]:invert-0" 
            />
        </div>
        <div>
          <h1 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 [.light_&]:text-[#022A06]">Wall-E GAIP</h1>
          <p className="text-[9px] text-slate-400 [.light_&]:text-[#022A06]/80 uppercase tracking-widest font-mono">Geospatial Agricultural Intelligence</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="font-bold text-xs text-slate-200 [.light_&]:text-[#022A06] uppercase">{userName}</p>
          <p className="text-[10px] text-slate-400 [.light_&]:text-[#022A06]/80 font-mono">Decision Maker</p>
        </div>
        <ThemeToggle />
        <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-400 [.light_&]:text-[#022A06]/80 hover:text-white [.light_&]:hover:text-[#022A06] transition-colors">
          <LogOut className="w-4 h-4 text-slate-500 [.light_&]:text-[#022A06]" />
          <span className="text-xs font-semibold">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;