import React, { useState } from 'react';
import Home from './components/Home';
import Analyze from './components/Analyze';
import Coaching from './components/Coaching';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [screen, setScreen] = useState('home');
  const [transitioning, setTransitioning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const trigTransition = (cb) => {
    setTransitioning(true);
    setTimeout(() => { cb(); setTransitioning(false); }, 350);
  };

  const goTab = (tab) => {
    trigTransition(() => { setScreen(tab); setActiveTab(tab); });
  };

  const goAnalyze = () => {
    trigTransition(() => setScreen('analyze'));
  };

  const backHome = () => {
    trigTransition(() => {
      setScreen('home');
      setActiveTab('home');
    });
  };

  const updateResult = (result) => {
    if (result) setAnalysisResult(result);
  };

  const startCoaching = (plan) => {
    setSelectedPlan(plan);
    trigTransition(() => { setScreen('coaching'); setActiveTab('coaching'); });
  };

  const tabs = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'coaching', label: '코칭', icon: '💬' },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home goAnalyze={goAnalyze} analysisResult={analysisResult} startCoaching={startCoaching} />;
      case 'analyze':
        return <Analyze backHome={backHome} updateResult={updateResult} startCoaching={startCoaching} />;
      case 'coaching':
        return <Coaching selectedPlan={selectedPlan} />;
      default:
        return <Home goAnalyze={goAnalyze} analysisResult={analysisResult} startCoaching={startCoaching} />;
    }
  };

  return (
    <div className="app">
      <div className={`screen ${transitioning ? 'fade-out' : 'fade-in'}`}>
        {renderScreen()}
      </div>
      <div className="bottom-tab">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => goTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
