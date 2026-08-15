import { useState } from 'react';
import Navbar from '../components/field-engineer/Navbar';
import TabsNav from '../components/field-engineer/TabsNav';
import SensorMap from '../components/field-engineer/SensorMap';
import SoilDashboard from '../components/field-engineer/SoilDashboard';
import ComplaintsView from '../components/field-engineer/ComplaintsView';
// استدعاء ملف الدوكيومنتيشن الجديد
import FieldEngineerDocs from '../components/field-engineer/FieldEngineerDocs';

const FieldEngineer = () => {
  // الشاشة الافتراضية هي الدوكيومنتيشن
  const [activeTab, setActiveTab] = useState('docs'); 
  const [lang, setLang] = useState('en'); // اللغة الافتراضية

  return (
    <div className={`flex flex-col h-screen bg-slate-950 font-sans overflow-hidden transition-colors duration-300`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <style>
        {`
          @keyframes slideFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-card {
            animation: slideFadeUp 0.6s ease-out forwards;
            opacity: 0;
          }
          .leaflet-container { z-index: 10; }
        `}
      </style>

      <Navbar lang={lang} setLang={setLang} />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />

      <main className="flex-1 relative overflow-hidden">
        {/* المكونات الأساسية */}
        {activeTab === 'sensors' && <SensorMap isActive={true} lang={lang} />}
        {activeTab === 'soil-dashboard' && <SoilDashboard isActive={true} lang={lang} />}
        {activeTab === 'complaints' && <ComplaintsView isActive={true} lang={lang} />}
        
        {/* صفحة الدوكيومنتيشن */}
        {activeTab === 'docs' && (
          <FieldEngineerDocs 
            isActive={true} 
            setActiveTab={setActiveTab} 
            lang={lang} 
            setLang={setLang} 
          />
        )}
      </main>
    </div>
  );
};

export default FieldEngineer;