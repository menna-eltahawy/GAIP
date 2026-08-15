import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareWarning, ScanHeart, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LeafHealthAI from '../components/farmer/LeafHealthAI';
import ComplaintsTab from '../components/farmer/ComplaintsTab';
import FarmerDocs from '../components/farmer/FarmerDocs'; // استيراد الدوكيومنتيشن
import logoImg from '../assets/logo.svg'; // استيراد اللوجو بتاعنا

const Farmer = () => {
  const navigate = useNavigate();
  // جعل صفحة الدليل (docs) هي الافتراضية عند الدخول
  const [activeTab, setActiveTab] = useState('docs');
  const [userName, setUserName] = useState('');

  // جلب اسم المستخدم من التخزين المحلي
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
        
        setUserName(fullName || 'المزارع');
      } catch (e) {
        setUserName('المزارع');
      }
    } else {
        setUserName('المزارع');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    navigate('/');
  };

  return (
    // إضافة flex flex-col لضمان إن الصفحة تاخد الارتفاع المظبوط والدوكيومنتيشن يملأ الشاشة
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200" dir="rtl">
      <style>{`
        @keyframes slideFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-card { animation: slideFadeUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* اللوجو بتاعنا بدل أيقونة القمح */}
            <div className="p-1 rounded-xl transition-colors duration-300 shrink-0">
               <img 
                  src={logoImg} 
                  alt="Wall-E Logo" 
                  className="w-8 h-8 object-contain brightness-0 invert transition-all duration-300 [.light_&]:brightness-100 [.light_&]:invert-0" 
                />
            </div>
            <div className="min-w-0">
              {/* عرض اسم اليوزر هنا */}
              <h1 className="font-extrabold text-sm text-slate-200 [.light_&]:text-[#022A06] flex items-center gap-2 truncate uppercase tracking-wider">
                {userName}
              </h1>
              <p className="text-[9px] text-slate-400 [.light_&]:text-[#022A06]/80 font-mono uppercase tracking-widest">
                بوابة المزارع | GAIP Farmer Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-400 [.light_&]:text-[#022A06]/80 hover:text-white [.light_&]:hover:text-[#022A06] transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-500 [.light_&]:text-[#022A06]" />
              <span className="text-xs font-semibold">خروج</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'complaints'
                ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20'
                : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
            }`}
          >
            <MessageSquareWarning className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
            الشكاوى
          </button>
          
          <button
            onClick={() => setActiveTab('ai-detection')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'ai-detection'
                ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20'
                : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
            }`}
          >
            <ScanHeart className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
            كشف صحة المحاصيل
          </button>

          {/* تبويبة الدليل الجديدة */}
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'docs'
                ? 'border-b-2 border-emerald-500 [.light_&]:border-[#022A06] text-emerald-400 [.light_&]:text-[#022A06] bg-slate-950/20'
                : 'text-slate-400 [.light_&]:text-[#022A06]/70 hover:text-slate-200 [.light_&]:hover:text-[#022A06] hover:bg-slate-850/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-450 [.light_&]:text-[#022A06]" />
            دليل الاستخدام
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 overflow-hidden min-h-[calc(100vh-130px)]">
        {activeTab === 'complaints' && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 h-full overflow-y-auto">
            <ComplaintsTab />
          </div>
        )}
        
        {activeTab === 'ai-detection' && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 h-full overflow-y-auto">
            <LeafHealthAI />
          </div>
        )}
        
        {/* صفحة الدوكيومنتيشن */}
        {activeTab === 'docs' && (
          <FarmerDocs 
            isActive={activeTab === 'docs'} 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>
    </div>
  );
};

export default Farmer;