import { useState, useRef } from 'react';
import Navbar from '../components/decision-maker/Navbar';
import TabsNav from '../components/decision-maker/TabsNav';
import IntelligenceCenter from '../components/decision-maker/IntelligenceCenter';
import PerformanceDashboard from '../components/decision-maker/PerformanceDashboard';
import PredictionDashboard from '../components/decision-maker/PredictionDashboard';
import SystemManagement from '../components/decision-maker/SystemManagement';
import SharedFiles from '../components/decision-maker/SharedFiles';
import Complaints from '../components/decision-maker/Complaints';
import DecisionMakerDocs from '../components/decision-maker/DecisionMakerDocs';

const DecisionMaker = () => {
  // تغيير التاب الافتراضي ليكون الدوكيومنتيشن
  const [activeTab, setActiveTab] = useState('docs'); 
  
  const [sharedMetadata, setSharedGeoMetadata] = useState(null);
  const intelligenceRef = useRef(null);

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden">
      
      <Navbar />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 relative overflow-hidden">
        
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
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          
          .leaflet-container { z-index: 10; }
        `}
        </style>
        <IntelligenceCenter 
          ref={intelligenceRef}
          isActive={activeTab === 'intelligence'} 
          onAnalysisComplete={(metadata) => setSharedGeoMetadata(metadata)}
        />
        
        <PerformanceDashboard 
          isActive={activeTab === 'dashboard'} 
          sharedMetadata={sharedMetadata}
        />

        {activeTab === 'prediction' && (
          <PredictionDashboard 
            isActive={activeTab === 'prediction'} 
            sharedMetadata={sharedMetadata}
          />
        )}
        
        {activeTab === 'management' && (
          <SystemManagement 
            isActive={activeTab === 'management'} 
          />
        )}
        
        {activeTab === 'shared' && (
          <SharedFiles 
            isActive={activeTab === 'shared'} 
          />
        )}
        
        {activeTab === 'complaints' && (
          <Complaints 
            isActive={activeTab === 'complaints'} 
          />
        )}

        {/* تمرير setActiveTab هنا عشان الزرار يقدر ينقلنا */}
        {activeTab === 'docs' && (
          <DecisionMakerDocs 
            isActive={activeTab === 'docs'} 
            setActiveTab={setActiveTab}
          />
        )}
      </main>
    </div>
  );
};

export default DecisionMaker;