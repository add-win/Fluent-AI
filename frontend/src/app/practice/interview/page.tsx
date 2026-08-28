'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { TTSButton } from '../../../components/TTSButton';
import { AudioRecorder } from '../../../components/AudioRecorder';
import api from '../../../services/api';
import { Briefcase, RefreshCw, Send, Mic, Sparkles, Loader2 } from 'lucide-react';

interface QAExchange {
  question: string;
  answer: string;
}

export default function MockInterview() {
  const categories = ['HR Interview', 'Technical Interview', 'Behavioral Interview', 'Communication Round'];
  
  const questionsBank: Record<string, string[]> = {
    'HR Interview': [
      "Tell me about yourself. What are your core strengths and weaknesses?",
      "Why do you want to join our organization and what makes you a good fit?",
      "Where do you see yourself in five years?"
    ],
    'Technical Interview': [
      "Explain the differences between SQL and NoSQL databases. When would you use each?",
      "What is a RESTful API? Explain the standard HTTP request methods.",
      "How do you handle performance bottlenecks or resource leaks in production code?"
    ],
    'Behavioral Interview': [
      "Tell me about a time you had a conflict with a team member. How did you resolve it?",
      "Describe a challenging project you delivered. What obstacles did you face and how did you overcome them?",
      "Describe a time you failed to meet a deadline. How did you manage it and what did you learn?"
    ],
    'Communication Round': [
      "If you could pitch a new product idea to a venture capitalist, how would you structure your hook?",
      "Tell me about a hobby you are passionate about. Explain it to someone who has never heard of it.",
      "How do you explain a complex technical concept to a non-technical stakeholder?"
    ]
  };

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [sessionActive, setSessionActive] = useState(false);
  
  // Dialog flow states
  const [qaHistory, setQaHistory] = useState<QAExchange[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMic, setShowMic] = useState(false);

  // Analysis result
  const [report, setReport] = useState<any>(null);

  const handleStartInterview = () => {
    setQaHistory([]);
    setQIndex(0);
    setInputText('');
    setReport(null);
    setSessionActive(true);
  };

  const currentQuestions = questionsBank[activeCategory] || questionsBank['HR Interview'];
  const activeQuestion = currentQuestions[qIndex];

  const handleNextQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newHistory = [...qaHistory, { question: activeQuestion, answer: inputText.trim() }];
    setQaHistory(newHistory);
    setInputText('');
    setShowMic(false);

    if (qIndex + 1 < currentQuestions.length) {
      setQIndex((prev) => prev + 1);
    } else {
      // Session finished, submit for final review
      setSessionActive(false);
      setIsProcessing(true);
      try {
        const data = await api.post('/interview/evaluate', {
          type: activeCategory,
          questions_answers: newHistory
        });
        setReport(data);
      } catch (err) {
        console.error(err);
        alert('Error generating interview analysis report.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleMicTranscriptionFinished = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'interview_answer.webm');

      const data = await api.post('/stt', formData);
      setInputText(data.transcript);
      setShowMic(false);
    } catch (err) {
      console.error(err);
      alert('Error transcribing spoken answer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span>Mock Interview Coach</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build professional confidence. Respond to typical HR and technical questions with STAR criteria evaluations.
          </p>
        </div>

        {!sessionActive && !report && !isProcessing && (
          /* Starting Board Selector */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Select Interview Track</h3>
              <p className="text-slate-500 text-xs">Choose the scenario you would like to practice today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === c
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full flex justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Start Practice Session
            </button>
          </div>
        )}

        {isProcessing && (
          /* Loading Assessment Panel */
          <div className="flex h-[35vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500">Compiling interview responses and analyzing communication delivery...</p>
            </div>
          </div>
        )}

        {sessionActive && (
          /* Active Dialog Frame */
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{activeCategory}</span>
              <span className="text-xs text-slate-400 font-medium">Question {qIndex + 1} of {currentQuestions.length}</span>
            </div>

            {/* Virtual Interviewer Prompt */}
            <div className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                HR
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-xs font-semibold leading-relaxed text-slate-800">
                  {activeQuestion}
                </p>
                <TTSButton text={activeQuestion} className="bg-white p-1 text-slate-700 border border-slate-200" />
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-3 pt-1">
              {showMic ? (
                <div className="space-y-3 py-2 flex flex-col items-center border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <AudioRecorder onStop={handleMicTranscriptionFinished} isProcessing={isProcessing} />
                  <button 
                    onClick={() => setShowMic(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Use Text Keyboard Input
                  </button>
                </div>
              ) : (
                <form onSubmit={handleNextQuestion} className="space-y-3">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type or record your response (utilize Situation, Task, Action, and Result structured metrics)..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setShowMic(true)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Use microphone recorder</span>
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Submit Response</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}

        {report && (
          /* Interview Report View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Interview Assessment Report</h2>
              <button 
                onClick={handleStartInterview}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Start New Simulation
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {[
                { label: 'Grammar', val: report.grammar_score, color: 'from-blue-600 to-indigo-600' },
                { label: 'Vocabulary', val: report.vocabulary_score, color: 'from-purple-600 to-violet-600' },
                { label: 'Confidence', val: report.confidence_score, color: 'from-rose-600 to-pink-600' },
                { label: 'STAR Method', val: report.star_score, color: 'from-indigo-600 to-blue-600' },
                { label: 'Communication', val: report.communication_score, color: 'from-amber-600 to-orange-600' }
              ].map((s) => (
                <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                  <div className={`text-2xl font-extrabold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}/100</div>
                </div>
              ))}
            </div>

            {/* Summary Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Coach Feedback</h3>
              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line text-justify bg-slate-50 p-4 rounded-xl border border-slate-100">
                {report.report_summary}
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
