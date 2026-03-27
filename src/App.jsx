import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Analyze from './components/Analyze';
import Coaching from './components/Coaching';
import Login from './components/Login';
import SignUp from './components/SignUp';
import MyPage from './components/MyPage';
import './App.css';
import './Auth.css';

function App() {
  const [authScreen, setAuthScreen] = useState(
    localStorage.getItem('authScreen') || 'login'
  );
  const [userName, setUserName] = useState(
    localStorage.getItem('userName') || '사용자'
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem('userEmail') || 'user@email.com'
  );
  const [userId, setUserId] = useState(
    localStorage.getItem('userId') || ''
  );

  const [activeTab, setActiveTab] = useState('home');
  const [screen, setScreen] = useState('home');
  const [transitioning, setTransitioning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(7);

  // ── 앱 시작 시 인증 상태 확인 ──────────────────
  useEffect(() => {
    if (authScreen !== 'app') return; // 로그인 전이면 스킵
    const token = localStorage.getItem('token');
    if (!token) {
      forceLogout();
      return;
    }
    fetch('http://localhost:7000/api/auth/check', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.valid) forceLogout();
      })
      .catch(() => {
        // 서버 연결 실패 시에는 로그아웃 강제하지 않음
      });
  }, []);

  const forceLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('authScreen');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    setAuthScreen('login');
    setUserName('사용자');
    setUserEmail('user@email.com');
    setUserId('');
    setScreen('home');
    setActiveTab('home');
  };

  const trigTransition = (cb) => {
    setTransitioning(true);
    setTimeout(() => { cb(); setTransitioning(false); }, 350);
  };

  const handleLoginSuccess = (name, email, id) => {
    const safeName = name || '사용자';
    const safeEmail = email || 'user@email.com';
    const safeId = id || '';
    setUserName(safeName);
    setUserEmail(safeEmail);
    setUserId(safeId);
    setAuthScreen('app');
    localStorage.setItem('authScreen', 'app');
    localStorage.setItem('userName', safeName);
    localStorage.setItem('userEmail', safeEmail);
    localStorage.setItem('userId', safeId);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('authScreen');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    setAuthScreen('login');
    setUserName('사용자');
    setUserEmail('user@email.com');
    setUserId('');
    setScreen('home');
    setActiveTab('home');
  };

  const goTab = (tab) => {
    trigTransition(() => { setScreen(tab); setActiveTab(tab); });
  };

  const goAnalyze = () => {
    trigTransition(() => setScreen('analyze'));
  };

  const backHome = () => {
    trigTransition(() => { setScreen('home'); setActiveTab('home'); });
  };

  const updateResult = (result) => {
    if (result) setAnalysisResult(result);
  };

  const startCoaching = (plan) => {
    setSelectedPlan(plan);
    trigTransition(() => { setScreen('coaching'); setActiveTab('coaching'); });
  };

  const tabs = [
    { id: 'home',     label: '홈',   icon: '🏠' },
    { id: 'coaching', label: '코칭', icon: '💬' },
    { id: 'mypage',   label: '마이', icon: '👤' },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home goAnalyze={goAnalyze} analysisResult={analysisResult} startCoaching={startCoaching} userName={userName} />;
      case 'analyze':
        return <Analyze backHome={backHome} updateResult={updateResult} startCoaching={startCoaching} />;
      case 'coaching':
        return <Coaching selectedPlan={selectedPlan} analysisResult={analysisResult} />;
      case 'mypage':
        return <MyPage userName={userName} userEmail={userEmail} userId={userId} onLogout={handleLogout} />;
      default:
        return <Home goAnalyze={goAnalyze} analysisResult={analysisResult} startCoaching={startCoaching} userName={userName} />;
    }
  };

  if (authScreen === 'login') {
    return <div className="app"><Login goHome={handleLoginSuccess} goSignUp={() => setAuthScreen('signup')} /></div>;
  }

  if (authScreen === 'signup') {
    return <div className="app"><SignUp goLogin={() => setAuthScreen('login')} goHome={handleLoginSuccess} /></div>;
  }

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
