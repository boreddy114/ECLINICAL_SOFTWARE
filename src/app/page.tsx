"use client";

import React, { useState, useEffect, useRef } from 'react';
import { patients } from '@/mockData';
import { 
  Users, User, Settings, Search, 
  Activity, Clipboard, HeartPulse, Sparkles, 
  ChevronRight, ShieldCheck, Send, Mic, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState<'patients' | 'settings'>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat & AI State
  const [chatHistory, setChatHistory] = useState<{role: string, parts: [{text: string}] }[]>([]);
  const [displayChat, setDisplayChat] = useState<{role: string, text: string}[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayChat, isGenerating]);

  // Reset chat when patient changes
  useEffect(() => {
    setChatHistory([]);
    setDisplayChat([{
      role: 'model', 
      text: `Hello. I am the Spine West Clinical Assistant. I have loaded the FHIR records for ${selectedPatient?.name || 'this patient'}. How can I assist you today?`
    }]);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [selectedPatientId]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean up markdown for speech
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

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
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: aiReply }] }
      ]);
      
      speakText(aiReply);
      
    } catch (error) {
      console.error(error);
      setDisplayChat([...newDisplay, { role: 'model', text: "Sorry, there was an error connecting to the AI." }]);
    } finally {
      setIsGenerating(false);
    }
  };

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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dr. Sarah Jenkins</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>SJ</div>
          </div>
        </header>

        <div className="dashboard-scroll">
          {activeTab === 'patients' && (
            <>
              {/* Left Column: Patient List */}
              <div className="glass-panel" style={{ width: '300px', flexShrink: 0, padding: 0, overflow: 'hidden', height: '100%' }}>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '0', height: '100%' }}>
                {selectedPatient ? (
                  <>
                    {/* Top Row: Demographics & Vitals Graph */}
                    <div style={{ display: 'flex', gap: '1.5rem', height: '300px' }}>
                      <div className="glass-panel" style={{ flex: 1 }}>
                        <h3 className="section-title"><User size={18} /> Demographics</h3>
                        <div className="data-grid" style={{ marginBottom: '1.5rem' }}>
                          <div className="data-item"><span className="data-label">Patient Name</span><span className="data-value">{selectedPatient.name}</span></div>
                          <div className="data-item"><span className="data-label">MRN</span><span className="data-value">{selectedPatient.mrn}</span></div>
                          <div className="data-item"><span className="data-label">Contact</span><span className="data-value">{selectedPatient.phone}</span></div>
                          <div className="data-item"><span className="data-label">Address</span><span className="data-value">{selectedPatient.address}</span></div>
                        </div>
                        
                        <h3 className="section-title" style={{ marginTop: 'auto' }}><Clipboard size={18} /> Active Overview</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                           <div style={{ flex: 1 }}><span className="data-label">Conditions ({selectedPatient.conditions.length})</span><p style={{ fontSize: '0.85rem' }}>{selectedPatient.conditions.map(c=>c.name).join(', ')}</p></div>
                           <div style={{ flex: 1 }}><span className="data-label">Medications ({selectedPatient.medications.length})</span><p style={{ fontSize: '0.85rem' }}>{selectedPatient.medications.map(c=>c.name).join(', ')}</p></div>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ width: '450px', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="section-title"><HeartPulse size={18} /> Blood Pressure Trend</h3>
                        <div style={{ flex: 1, width: '100%', height: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedPatient.vitalsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                              <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickFormatter={(tick) => tick.substring(5)} />
                              <YAxis stroke="#8b949e" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                              <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                              <Line type="monotone" dataKey="sys" name="Systolic" stroke="#f85149" strokeWidth={2} dot={{ r: 4 }} />
                              <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#58a6ff" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: '#f85149' }}>● Systolic</span>
                          <span style={{ color: '#58a6ff' }}>● Diastolic</span>
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
        </div>
      </main>
    </div>
  );
}
