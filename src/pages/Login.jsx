import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from "../api/axiosConfig";
import ThemeToggle from '../components/ThemeToggle';
import logoImg from '../assets/logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await api.post('/user/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_info', JSON.stringify(response.data.user_info));
      
      const userRole = response.data.user_info.role;
      if (userRole === 'manager') {
        navigate('/decision-maker');
      } else if (userRole === 'engineer') {
        navigate('/field-engineer');
      } else if (userRole === 'farmer') {
        navigate('/farmer');
      } else {
        alert("دور المستخدم غير معروف، اطلب من الدعم الفني المساعدة.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function navigateToSignup() {
    navigate('/Signup');
  }

  return (
    <div className="flex min-h-screen w-full font-sans relative bg-slate-950">
      <div className="absolute top-6 left-6 z-50">
        <ThemeToggle />
      </div>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeSlideUp 0.6s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
      `}</style>

      {/* Left Side - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-24 py-12 relative z-10">
        <div className="max-w-100 w-full mx-auto relative z-10">

{/* Logo without border - White in Dark Mode, Original in Light Mode */}
          <div className="flex justify-center items-center mb-6">
            <img 
              src={logoImg} 
              alt="Wall-E Logo" 
              className="w-16 h-16 object-contain brightness-0 invert transition-all duration-300 [.light_&]:brightness-100 [.light_&]:invert-0" 
            />
          </div>          
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-[26px] font-extrabold text-slate-100">Wall-E</h1>
            <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-[0.15em] font-bold">Agricultural Intelligence Platform</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[1.5rem] shadow-xl border border-slate-800 animate-fade-in delay-100">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-[13px] text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="email@walle.eg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-[13px] text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#DCD7C9] [.light_&]:text-[#FBF5DD] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-900/20"
              >
                {loading ? "Logging in..." : "Access Platform"} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            
            <div className="relative flex items-center py-4">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink-0 mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Or</span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            <button 
              type="button" 
              onClick={navigateToSignup}
              className="w-full bg-slate-950 border-[1.5px] border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Sticky Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-l border-slate-800 flex-col justify-center px-[8%] text-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', color: 'var(--color-emerald-500)' }}></div>
        <div className="relative z-10">
          <h2 className="text-[40px] font-bold mb-6 leading-[1.2] text-slate-100">Geospatial Agriculture <br/> Intelligence Platform</h2>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed max-w-lg">
            In an era of shrinking green spaces, our platform provides the precise intelligence needed to protect, manage, and sustain agricultural lands effectively.
          </p>
        </div>
      </div>
    </div>
  );
}