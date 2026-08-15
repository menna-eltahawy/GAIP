import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  MessageSquareWarning, 
  ScanHeart,
  ArrowLeft,
  Wheat
} from 'lucide-react';

const FarmerDocs = ({ isActive, setActiveTab }) => {
  if (!isActive) return null;

  const sections = [
    { 
      id: 'complaints', 
      title: 'تقديم ومتابعة الشكاوى',
      desc: 'واجهتك مشكلة في أرضك؟ صورها وارفعها فوراً مع تحديد موقعك على الخريطة. المهندس الزراعي هيستلم بلاغك ويتابع معاك لحد ما المشكلة تتحل.',
      icon: MessageSquareWarning, 
      color: 'var(--c-tertiary)' 
    },
    { 
      id: 'ai-detection', 
      title: 'طبيب المحاصيل الذكي (AI)',
      desc: 'شاكك إن الزرع فيه مرض؟ ارفع صورة لورقة النبات، والذكاء الاصطناعي الخاص بينا هيفحصها في ثواني ويقولك نوع المرض وطرق علاجه المضمونة.',
      icon: ScanHeart, 
      color: 'var(--c-secondary)' 
    }
  ];

  return (
    <div className="absolute inset-0 bg-[#f9fbf9] dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 flex flex-col transition-colors duration-300 overflow-y-auto" dir="rtl">
      
      {/* نفس الثيم اللوني لضمان التناسق مع باقي المنصة */}
      <style>{`
        :root {
          --c-primary: #fff2d8;    
          --c-secondary: #ead7bb;  
          --c-tertiary: #bca37f;   
          --c-bg: #0f172a;         
          --chart-text: #fff2d8;
        }
        :root.light, .light {
          --c-primary: #113946;    
          --c-secondary: #bca37f;  
          --c-tertiary: #815b5b;   
          --c-bg: #ffffff;         
          --chart-text: #113946;
        }
      `}</style>

      {/* ─── HEADER BAR ─── */}
      <div className="relative z-10 px-6 md:px-8 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-start">
            <h2 className="text-2xl font-black uppercase tracking-wide flex items-center gap-3" style={{ color: 'var(--chart-text)' }}>
              <BookOpen className="w-7 h-7" style={{ color: 'var(--c-secondary)' }} />
              دليل المزارع الذكي
            </h2>
            <p className="text-sm font-medium mt-2 opacity-80" style={{ color: 'var(--chart-text)' }}>
              بوابتك لحماية محصولك والتواصل المباشر مع المهندسين الزراعيين.
            </p>
          </div>
        </div>
      </div>

      {/* ─── DOCS CONTENT ─── */}
      <div className="flex-1 relative z-10 p-6 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500 pb-24">
        
        {/* رسالة ترحيبية للمزارع */}
        <div className="mb-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-full shrink-0">
            <Wheat className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center md:text-right">
            <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-300 mb-2">
              أهلاً بك في منصة Wall-E الزراعية
            </h3>
            <p className="text-base text-emerald-700 dark:text-emerald-400 opacity-90 leading-relaxed">
              إحنا هنا عشان نساعدك تطلع أحسن إنتاج من أرضك. المنصة دي متصممة خصيصاً عشان توصلك بالمهندس المسؤول عن منطقتك، وتوفرلك كشف سريع ودقيق على أمراض النباتات باستخدام كاميرا تليفونك بس!
            </p>
          </div>
        </div>

        {/* الكروت التوضيحية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.id} 
                className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--c-bg)' }}>
                    <Icon className="w-8 h-8" style={{ color: section.color }} />
                  </div>
                  <h3 className="text-xl font-black" style={{ color: 'var(--chart-text)' }}>
                    {section.title}
                  </h3>
                </div>
                <p className="text-base font-medium leading-relaxed opacity-80" style={{ color: 'var(--chart-text)' }}>
                  {section.desc}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* زرار بدء الاستخدام الخاص بالمزارع */}
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => setActiveTab('complaints')} // يوجه لصفحة الشكاوى كبداية طبيعية
            className="flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-emerald-600/30 transition-all hover:-translate-y-1"
          >
            ابدأ في حماية محصولك الآن
            <ArrowLeft className="w-6 h-6 animate-pulse" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FarmerDocs;