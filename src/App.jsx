import React, { useState } from 'react';
import Home from './components/Home';
import Analyze from './components/Analyze';
import Coaching from './components/Coaching';
import Login from './components/Login';
import SignUp from './components/SignUp';
import './App.css';
import './Auth.css'; // ← 새로 추가한 인증 스타일

function App() {
  // ─── 인증 상태 ───────────────────────────────
  // 'login' | 'signup' | 'app'
  const [authScreen, setAuthScreen] = useState('login');
  const [userName, setUserName] = useState('사용자');

  // ─── 앱 내부 화면 상태 ───────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [screen, setScreen] = useState('home');
  const [transitioning, setTransitioning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ─── 화면 전환 트랜지션 ──────────────────────
  const trigTransition = (cb) => {
    setTransitioning(true);
    setTimeout(() => { cb(); setTransitioning(false); }, 350);
  };

  // ─── 인증 완료 후 홈으로 이동 ────────────────
  const handleLoginSuccess = (name) => {
    setUserName(name || '사용자');
    setAuthScreen('app');
  };

  // ─── 앱 내 탭 이동 ───────────────────────────
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
        return (
          <Home
            goAnalyze={goAnalyze}
            analysisResult={analysisResult}
            startCoaching={startCoaching}
            userName={userName}  // ← 로그인한 이름 전달
          />
        );
      case 'analyze':
        return <Analyze backHome={backHome} updateResult={updateResult} startCoaching={startCoaching} />;
      case 'coaching':
        return <Coaching selectedPlan={selectedPlan} />;
      default:
        return (
          <Home
            goAnalyze={goAnalyze}
            analysisResult={analysisResult}
            startCoaching={startCoaching}
            userName={userName}
          />
        );
    }
  };

  // ─── 인증 화면 분기 ──────────────────────────
  if (authScreen === 'login') {
    return (
      <div className="app">
        <Login
          goHome={handleLoginSuccess}
          goSignUp={() => setAuthScreen('signup')}
        />
      </div>
    );
  }

  if (authScreen === 'signup') {
    return (
      <div className="app">
        <SignUp
          goLogin={() => setAuthScreen('login')}
          goHome={handleLoginSuccess}
        />
      </div>
    );
  }

  // ─── 메인 앱 ─────────────────────────────────
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
