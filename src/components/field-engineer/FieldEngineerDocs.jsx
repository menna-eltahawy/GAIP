import React from 'react';
import { 
  BookOpen, 
  Languages, 
  Sparkles, 
  MapPin, 
  ActivitySquare, 
  ClipboardCheck, 
  MessageSquareWarning,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const T = {
  en: {
    headerTitle: "Field Engineer Documentation",
    headerDesc: "Your complete field guide for managing IoT sensors, monitoring soil health, and addressing farmer complaints on the GAIP platform.",
    overview: "Platform Overview",
    overviewDesc: "The Field Engineer portal is your command center for real-time agricultural monitoring. It connects you directly with IoT soil sensors and escalates urgent field issues for your review.",
    sensors: "IoT Sensor Network",
    sensorsDesc: "Deploy new virtual/physical sensors on the map and inject or monitor real-time telemetry data (Moisture, Salinity, pH, Temperature).",
    dashboard: "Soil Health Dashboard",
    dashboardDesc: "Monitor live readings from your active sensor nodes. Set critical thresholds and receive immediate alerts for abnormal soil conditions.",
    complaints: "Field Complaints",
    complaintsDesc: "Review complaints submitted by farmers. Add your technical assessment, attach field evidence, and resolve simple issues or escalate complex ones to the Decision Maker.",
    chatbot: "GeoAI Field Assistant",
    chatbotDesc: "Use the floating AI assistant to query specific sensor historical data or get recommendations for soil treatment based on current readings.",
    startBtn: "Start Field Operations"
  },
  ar: {
    headerTitle: "دليل المهندس الميداني",
    headerDesc: "دليلك الميداني الشامل لإدارة مستشعرات IoT، مراقبة صحة التربة، ومعالجة شكاوى المزارعين على منصة GAIP.",
    overview: "نظرة عامة على المنصة",
    overviewDesc: "بوابة المهندس الميداني هي مركز التحكم الخاص بك للمراقبة الزراعية الحية. تربطك مباشرة بمستشعرات التربة (IoT) وتصعد لك المشاكل الميدانية العاجلة لمراجعتها.",
    sensors: "شبكة مستشعرات IoT",
    sensorsDesc: "قم بنشر عقد استشعار (Sensors) جديدة على الخريطة، وحقن أو مراقبة بيانات القياس عن بعد الحية (الرطوبة، الملوحة، درجة الحموضة، والحرارة).",
    dashboard: "لوحة صحة التربة",
    dashboardDesc: "راقب القراءات الحية من عقد الاستشعار النشطة. حدد العتبات الحرجة واستلم تنبيهات فورية لحالات التربة غير الطبيعية.",
    complaints: "الشكاوى الميدانية",
    complaintsDesc: "راجع الشكاوى المقدمة من المزارعين. أضف تقييمك الفني، وأرفق أدلة ميدانية، وقم بحل المشاكل البسيطة أو تصعيد المعقدة لصانع القرار.",
    chatbot: "مساعد GeoAI الميداني",
    chatbotDesc: "استخدم المساعد الذكي العائم للاستعلام عن بيانات مستشعرات محددة تاريخياً أو للحصول على توصيات لعلاج التربة بناءً على القراءات الحالية.",
    startBtn: "ابدأ العمليات الميدانية"
  }
};

const FieldEngineerDocs = ({ isActive, setActiveTab, lang, setLang }) => {
  const t = (key) => T[lang][key] || key;

  if (!isActive) return null;

  const sections = [
    { id: 'overview', icon: Sparkles, color: 'var(--c-tertiary)' },
    { id: 'sensors', icon: MapPin, color: 'var(--c-primary)' },
    { id: 'dashboard', icon: ActivitySquare, color: 'var(--c-secondary)' },
    { id: 'complaints', icon: MessageSquareWarning, color: 'var(--c-tertiary)' },
    { id: 'chatbot', icon: ClipboardCheck, color: 'var(--c-primary)' }
  ];

  return (
    <div className="absolute inset-0 bg-[#f9fbf9] dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 flex flex-col transition-colors duration-300 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
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
      <div className="relative z-10 px-8 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-start">
            <h2 className="text-2xl font-black uppercase tracking-wide flex items-center gap-3" style={{ color: 'var(--chart-text)' }}>
              <BookOpen className="w-7 h-7" style={{ color: 'var(--c-secondary)' }} />
              {t('headerTitle')}
            </h2>
            <p className="text-xs font-mono mt-1 opacity-80" style={{ color: 'var(--chart-text)' }}>{t('headerDesc')}</p>
          </div>

          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? 'عربي' : 'English'}
          </button>
        </div>
      </div>

      {/* ─── DOCS CONTENT ─── */}
      <div className="flex-1 relative z-10 p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.id} 
                className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: 'var(--c-bg)' }}>
                    <Icon className="w-6 h-6" style={{ color: section.color }} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-wide" style={{ color: 'var(--chart-text)' }}>
                    {t(section.id)}
                  </h3>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-80" style={{ color: 'var(--chart-text)' }}>
                  {t(`${section.id}Desc`)}
                </p>
              </div>
            );
          })}

        </div>

        {/* تم استبدال التلميحة القديمة بالتلميحة التقنية الجديدة ESRI DLPK Models */}
        <div className="mt-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl px-6 py-5 flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-emerald-800 dark:text-emerald-300 mb-1">
              {lang === 'en' ? "Need more technical details?" : "تحتاج إلى تفاصيل تقنية أعمق؟"}
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 opacity-90 leading-relaxed">
              {lang === 'en' ? (
                <>
                  The GAIP platform relies on advanced Deep Learning packages <strong className="font-black opacity-100">(ESRI DLPK Models)</strong> trained via ArcGIS Pro, integrated with PostGIS spatial databases and Google Earth Engine. Hover over any chart or map point to reveal detailed metadata.
                </>
              ) : (
                <>
                  تعتمد منصة GAIP على نماذج تعلم عميق متقدمة <strong className="font-black opacity-100" dir="ltr">(ESRI DLPK Models)</strong> تم تدريبها وإنشاؤها باستخدام ArcGIS Pro، وهي مدمجة مع قواعد بيانات PostGIS الجغرافية ومحرك Google Earth. مرر مؤشر الماوس فوق أي رسم بياني أو نقطة خريطة لرؤية البيانات الوصفية الدقيقة.
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => setActiveTab('sensors')}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-emerald-600/30 transition-all hover:-translate-y-1"
          >
            {t('startBtn')}
            {lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FieldEngineerDocs;