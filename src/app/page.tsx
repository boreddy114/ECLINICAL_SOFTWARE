"use client";

import React, { useState, useEffect, useRef } from 'react';
import { patients, providers } from '@/mockData';
import { supabase } from '@/supabaseClient';
import { 
  Users, User, Settings, Search, 
  Activity, Clipboard, HeartPulse, Sparkles, 
  ChevronRight, ShieldCheck, Send, Mic, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AppDashboard() {
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState(''); // Added for Full Name
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const [activeTab, setActiveTab] = useState<'patients' | 'settings' | 'profile'>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGraph, setActiveGraph] = useState<'bp' | 'a1c' | 'imaging'>('bp');
  
  // Chat & AI State
  const [chatHistory, setChatHistory] = useState<{role: string, parts?: [{text: string}], content?: string }[]>([]);
  const [displayChat, setDisplayChat] = useState<{role: string, text: string}[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Authenticated User Details
  const currentUserMetadata = session?.user?.user_metadata || {};
  const currentUserEmail = session?.user?.email || '';
  const currentProviderName = currentUserMetadata.full_name || currentUserEmail.split('@')[0] || 'Provider';
  const currentProviderInitials = currentProviderName.substring(0, 2).toUpperCase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      if (authMode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
        if (error) throw error;
        alert('Password reset link sent to your email!');
        setAuthMode('signin');
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email: authEmail, 
          password: authPassword,
          options: {
            data: { full_name: authName || authEmail.split('@')[0] }
          }
        });
        if (error) throw error;
        alert('Signup successful! Check your email for verification link, or log in if auto-confirmed.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayChat, isGenerating]);

  // Reset chat when patient changes
  useEffect(() => {
    setChatHistory([]);
    setDisplayChat([{
      role: 'model', 
      text: `Hello ${currentProviderName}. I am the Spine West Clinical Assistant. I have loaded the FHIR records for ${selectedPatient?.name || 'this patient'}. How can I assist you today?`
    }]);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [selectedPatientId, currentProviderName]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean up markdown for speech
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select a friendly American English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google US English') ||
      (v.lang === 'en-US' && v.name.includes('Female'))
    );
    
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    } else {
      const usVoice = voices.find(v => v.lang === 'en-US');
      if (usVoice) utterance.voice = usVoice;
    }

    // Adjust rate and pitch for a friendlier, gentler tone
    utterance.rate = 0.95; 
    utterance.pitch = 1.05;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Pre-load voices on component mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setCurrentInput(prev => prev + ' ' + finalTranscript);
      }
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !selectedPatient) return;
    
    const userMessage = currentInput.trim();
    setCurrentInput('');
    setIsListening(false);
    
    const newDisplay = [...displayChat, { role: 'user', text: userMessage }];
    setDisplayChat(newDisplay);
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: selectedPatient,
          message: userMessage,
          history: chatHistory
        })
      });
      
      const data = await response.json();
      const aiReply = data.reply || "Error: No response from AI.";
      
      setDisplayChat([...newDisplay, { role: 'model', text: aiReply }]);
      setChatHistory([
        ...chatHistory, 
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiReply }
      ]);
      
      speakText(aiReply);
      
    } catch (error) {
      console.error(error);
      setDisplayChat([...newDisplay, { role: 'model', text: "Sorry, there was an error connecting to the AI." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', background: '#0d1117', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        
        {/* Left Informational Panel */}
        <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(135deg, rgba(22,27,34,1) 0%, rgba(13,17,23,1) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', borderRight: '1px solid rgba(88, 166, 255, 0.1)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(88, 166, 255, 0.05) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
          
          <div style={{ maxWidth: '500px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(88, 166, 255, 0.2)' }}>
               <Activity color="#000" size={48} />
            </div>
            
            <h1 style={{ color: 'var(--text-white)', fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Spine West<br/>
              <span style={{ color: 'var(--accent-color)' }}>Clinical Assistant.</span>
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Empowering providers with AI-driven EHR insights. Dedicated to whole-body care, physiatry, and non-surgical solutions for joint, muscle, nerve, and spine health.
            </p>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <div>
                <h4 style={{ color: 'var(--text-white)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Boulder Clinic</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Main Headquarters</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-white)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Wheat Ridge</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Specialty Center</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-white)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Steamboat Springs</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Regional Office</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
          <div className="glass-panel mobile-full-width" style={{ width: '420px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-white)', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Provider Access</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Secure SSO & Supabase Authentication</p>
            </div>
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {authMode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-white)', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name (Dr. First Last)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Dr. John Smith"
                    className="input-field" 
                    style={{ width: '100%', padding: '0.85rem' }}
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-white)', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="provider@spinewest.com"
                  className="input-field" 
                  style={{ width: '100%', padding: '0.85rem' }}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              {authMode !== 'reset' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 500 }}>Secure Password</label>
                    {authMode === 'signin' && (
                      <button type="button" onClick={() => setAuthMode('reset')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.8rem', cursor: 'pointer' }}>Forgot Password?</button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="input-field" 
                    style={{ width: '100%', padding: '0.85rem' }}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
              )}
              
              {authError && <div style={{ color: '#f85149', fontSize: '0.85rem', background: 'rgba(248, 81, 73, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={16}/> {authError}</div>}
              
              <button 
                type="submit" 
                disabled={authLoading}
                style={{ width: '100%', padding: '1rem', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {authLoading ? 'Processing...' : (authMode === 'signin' ? 'Secure Login' : authMode === 'signup' ? 'Register Provider Account' : 'Send Reset Link')}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {authMode === 'signin' ? "Don't have clinical access? " : authMode === 'reset' ? "Remembered your password? " : "Already registered as a provider? "}
              </span>
              <button 
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
              >
                {authMode === 'signin' ? 'Request Access' : 'Return to Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity color="var(--accent-color)" size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)' }}>Spine West<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Clinical Assistant</span></h2>
        </div>
        
        <div className={`sidebar-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
          <Users size={18} /> Patient Records
        </div>
        <div className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={18} /> Provider Profile
        </div>
        <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> eCW FHIR Settings
        </div>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="pulse-indicator"></div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-white)' }}>eCW API Connected</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sandbox Environment</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-nav">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'patients' && (
              <>
                <Users size={16} /> Patients {selectedPatient && <><ChevronRight size={14} /> <span style={{ color: 'var(--text-white)' }}>{selectedPatient.name}</span></>}
              </>
            )}
            {activeTab === 'settings' && <><Settings size={16} /> Settings</>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) window.speechSynthesis.cancel();
              }} 
              style={{ background: 'transparent', border: 'none', color: voiceEnabled ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
              title={voiceEnabled ? "Voice Output Enabled" : "Voice Output Muted"}
            >
              {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <div style={{ background: 'transparent', color: 'var(--text-white)', border: 'none', fontSize: '0.9rem', outline: 'none' }}>
              {currentProviderName}
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{currentProviderInitials}</div>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
            <button 
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-scroll">
          {activeTab === 'patients' && (
            <>
              {/* Left Column: Patient List */}
              <div className="glass-panel mobile-full-width" style={{ width: '300px', flexShrink: 0, padding: 0, overflow: 'hidden', height: '100%' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search patients..." 
                      style={{ paddingLeft: '2.2rem' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(patient => (
                    <div 
                      key={patient.id} 
                      className={`patient-list-item ${selectedPatientId === patient.id ? 'active' : ''}`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text-white)' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        DOB: {patient.dob} | {patient.gender}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Patient Details & AI Chat */}
              <div className="mobile-stack" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '0', height: '100%' }}>
                {selectedPatient ? (
                  <>
                    {/* Top Row: Demographics & Graphs */}
                    <div className="mobile-stack" style={{ display: 'flex', gap: '1.5rem', height: '300px' }}>
                      <div className="glass-panel" style={{ flex: 1 }}>
                        <h3 className="section-title"><User size={18} /> Demographics</h3>
                        <div className="data-grid" style={{ marginBottom: '1.5rem' }}>
                          <div className="data-item"><span className="data-label">Patient Name</span><span className="data-value">{selectedPatient.name}</span></div>
                          <div className="data-item"><span className="data-label">MRN</span><span className="data-value">{selectedPatient.mrn}</span></div>
                          <div className="data-item"><span className="data-label">BMI</span><span className="data-value">{selectedPatient.vitals.bmi}</span></div>
                          <div className="data-item"><span className="data-label">Allergies</span><span className="data-value" style={{color: 'var(--danger-color)'}}>{selectedPatient.allergies.map(a=>a.name).join(', ')}</span></div>
                        </div>
                        
                        <h3 className="section-title" style={{ marginTop: 'auto' }}><Clipboard size={18} /> Active Overview</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                           <div style={{ flex: 1 }}><span className="data-label">Conditions ({selectedPatient.conditions.length})</span><p style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>{selectedPatient.conditions.map(c=>c.name).join(', ')}</p></div>
                           <div style={{ flex: 1 }}><span className="data-label">Medications ({selectedPatient.medications.length})</span><p style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>{selectedPatient.medications.map(c=>c.name).join(', ')}</p></div>
                        </div>
                      </div>

                      <div className="glass-panel mobile-full-width" style={{ width: '450px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h3 className="section-title" style={{ margin: 0 }}><HeartPulse size={18} /> Clinical Trends & Imaging</h3>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setActiveGraph('bp')} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: activeGraph === 'bp' ? 'var(--accent-color)' : 'transparent', color: activeGraph === 'bp' ? '#000' : 'var(--text-secondary)', border: '1px solid var(--accent-color)', cursor: 'pointer' }}>Vitals</button>
                            <button onClick={() => setActiveGraph('a1c')} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: activeGraph === 'a1c' ? '#a371f7' : 'transparent', color: activeGraph === 'a1c' ? '#000' : 'var(--text-secondary)', border: '1px solid #a371f7', cursor: 'pointer' }}>Labs</button>
                            <button onClick={() => setActiveGraph('imaging')} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: activeGraph === 'imaging' ? '#58a6ff' : 'transparent', color: activeGraph === 'imaging' ? '#000' : 'var(--text-secondary)', border: '1px solid #58a6ff', cursor: 'pointer' }}>Imaging</button>
                          </div>
                        </div>
                        
                        <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
                          {activeGraph === 'imaging' ? (
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0', height: '100%' }}>
                              {(selectedPatient as any).imaging?.length > 0 ? (selectedPatient as any).imaging.map((img: any) => (
                                <div key={img.id} style={{ minWidth: '220px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                                  <img src={img.url} alt={img.type} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>{img.region} ({img.type})</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scanned: {img.date}</div>
                                </div>
                              )) : <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>No imaging records found.</div>}
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              {activeGraph === 'bp' ? (
                                <LineChart data={selectedPatient.vitalsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                                  <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickFormatter={(tick) => tick.substring(5)} />
                                  <YAxis stroke="#8b949e" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                                  <Line type="monotone" dataKey="sys" name="Systolic" stroke="#f85149" strokeWidth={2} dot={{ r: 4 }} />
                                  <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#58a6ff" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                              ) : (
                                <LineChart data={selectedPatient.labHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                                  <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickFormatter={(tick) => tick.substring(5)} />
                                  <YAxis yAxisId="left" stroke="#8b949e" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                                  <YAxis yAxisId="right" orientation="right" stroke="#8b949e" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                                  <Line yAxisId="left" type="monotone" dataKey="a1c" name="HbA1c (%)" stroke="#a371f7" strokeWidth={2} dot={{ r: 4 }} />
                                  <Line yAxisId="right" type="monotone" dataKey="glucose" name="Fasting Glucose" stroke="#3fb950" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                              )}
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: AI Conversational Chat */}
                    <div className="glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', background: 'linear-gradient(145deg, rgba(22,27,34,0.9) 0%, rgba(20,25,35,0.95) 100%)', border: '1px solid rgba(88, 166, 255, 0.3)' }}>
                      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="gemini-gradient-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                          <Sparkles size={18} /> Spine West AI Co-Pilot
                        </h3>
                        {isSpeaking && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.8rem' }}><Volume2 size={14} className="ai-typing" /> Speaking...</div>}
                      </div>
                      
                      {/* Chat Messages Area */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayChat.map((msg, idx) => (
                          <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <div style={{ 
                              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                              color: msg.role === 'user' ? '#000' : 'var(--text-white)',
                              padding: '0.75rem 1rem',
                              borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                              border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {isGenerating && (
                          <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Loader2 size={16} className="ai-typing" color="var(--accent-color)" /> <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Synthesizing FHIR data...</span>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input Area */}
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={toggleListening}
                          style={{ 
                            background: isListening ? 'var(--danger-color)' : 'transparent', 
                            color: isListening ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${isListening ? 'var(--danger-color)' : 'var(--border-color)'}`,
                            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          title="Dictate message"
                        >
                          <Mic size={18} />
                        </button>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Ask about allergies, vitals, or dictate clinical notes..."
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          style={{ flex: 1, border: 'none', background: 'rgba(0,0,0,0.3)' }}
                        />
                        <button 
                          onClick={handleSendMessage}
                          className="btn-primary"
                          style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          disabled={isGenerating || !currentInput.trim()}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Users size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <h3>Select a patient to begin</h3>
                      <p>View their FHIR records and interact with the AI Co-Pilot.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-white)' }}>eClinicalWorks Integration Settings</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Configure your SMART on FHIR OAuth settings to connect the Spine West Clinical Assistant to the eCW Sandbox.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label className="data-label">Application Name</label>
                  <input type="text" className="input-field" defaultValue="Spine West Clinical Assistant" readOnly />
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--success-color)"/> Active FHIR Scopes (USCDI v3)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(46, 160, 67, 0.3)' }}>
                      <span className="badge">Read APIs (Active)</span>
                      <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', maxHeight: '150px', overflowY: 'auto' }}>
                        <li>AllergyIntolerance</li>
                        <li>CarePlan & CareTeam</li>
                        <li>Condition (Encounter, Health Concern, Problems)</li>
                        <li>DiagnosticReport</li>
                        <li>DocumentReference</li>
                        <li>Immunization</li>
                        <li>Medication & MedicationRequest</li>
                        <li>Observation (Vitals, Labs, Smoking)</li>
                        <li>Patient</li>
                        <li>Procedure</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-white)' }}>Provider Profile Settings</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage your personal details and secure credentials.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>{currentProviderInitials}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-white)' }}>{currentProviderName}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{currentUserEmail}</p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const newName = target.fullName.value;
                  const newPassword = target.newPassword.value;
                  try {
                    const updates: any = {};
                    if (newName && newName !== currentProviderName) updates.data = { full_name: newName };
                    if (newPassword) updates.password = newPassword;
                    
                    const { error } = await supabase.auth.updateUser(updates);
                    if (error) throw error;
                    alert('Profile updated successfully!');
                    target.newPassword.value = '';
                  } catch(err: any) {
                    alert('Error updating profile: ' + err.message);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div>
                    <label className="data-label">Update Full Name</label>
                    <input name="fullName" type="text" className="input-field" defaultValue={currentProviderName} />
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-white)' }}>Security</h3>
                    <label className="data-label">New Password (leave blank to keep current)</label>
                    <input name="newPassword" type="password" className="input-field" placeholder="••••••••" />
                  </div>
                  
                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
