'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { AudioRecorder } from '../../../components/AudioRecorder';
import api from '../../../services/api';
import { Users, Send, Mic, RefreshCw, Sparkles, Loader2 } from 'lucide-react';

interface DiscussionMsg {
  sender: string;
  avatar: string;
  role: 'user' | 'bot';
  content: string;
}

export default function GroupDiscussionSimulator() {
  const topics = [
    "Should social media platforms be regulated like publishers?",
    "Will remote work completely replace traditional corporate offices in the future?",
    "Is artificial intelligence a threat to human creativity?",
    "The role of space exploration: is it worth the high expenditure?"
  ];

  const aiParticipants = [
    { name: 'Sarah (UX Designer)', avatar: '👩‍💻' },
    { name: 'David (Marketing Lead)', avatar: '👨‍💼' },
    { name: 'Elena (AI Research Scientist)', avatar: '👩' },
    { name: 'Marcus (Product Analyst)', avatar: '👨' }
  ];

  const [activeTopic, setActiveTopic] = useState(topics[0]);
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const [messages, setMessages] = useState<DiscussionMsg[]>([]);
  
  // Dialog flow controls
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMic, setShowMic] = useState(false);
  const [report, setReport] = useState<any>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartDiscussion = () => {
    setMessages([
      {
        sender: 'Moderator',
        avatar: '🗣️',
        role: 'bot',
        content: `Welcome participants. Today's group discussion topic is: "${activeTopic}". Let's start with brief opening statements. Sarah, please begin.`
      },
      {
        sender: 'Sarah (UX Designer)',
        avatar: '👩‍💻',
        role: 'bot',
        content: `Thank you, Moderator. Regarding this topic, I believe that while technology introduces major conveniences, we must design guardrails. Without them, user trust and wellness suffer.`
      }
    ]);
    setDiscussionStarted(true);
    setReport(null);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: DiscussionMsg = {
      sender: 'You (Candidate)',
      avatar: '👤',
      role: 'user',
      content: inputText.trim()
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputText('');
    setShowMic(false);

    // Simulate response from next AI participant
    setTimeout(() => {
      const nextSpeaker = aiParticipants[Math.floor(Math.random() * aiParticipants.length)];
      const replies = [
        `That is a valid point you raised. However, from a practical standpoint, we must also consider cost implications and user adoption speeds.`,
        `I agree with what was just mentioned. Adding to that, we should also consider how global markets and policy regulations impact this.`,
        `I would offer a slightly different perspective. While those concerns are real, innovation moves too quickly for traditional barriers to work effectively.`
      ];
      
      setMessages((prev) => [
        ...prev,
        {
          sender: nextSpeaker.name,
          avatar: nextSpeaker.avatar,
          role: 'bot',
          content: replies[Math.floor(Math.random() * replies.length)]
        }
      ]);
    }, 1200);
  };

  const handleFinishDiscussion = async () => {
    if (messages.length < 3) {
      alert('Please contribute at least 1 or 2 statements before finishing.');
      return;
    }

    setDiscussionStarted(false);
    setIsProcessing(true);
    try {
      const data = await api.post('/group-discussion/evaluate', {
        topic: activeTopic,
        history: messages
      });
      setReport(data);
    } catch (err) {
      console.error(err);
      alert('Error evaluating group discussion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicTranscriptionFinished = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'gd_statement.webm');

      const data = await api.post('/stt', formData);
      setInputText(data.transcript);
      setShowMic(false);
    } catch (err) {
      console.error(err);
      alert('Could not transcribe audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans flex flex-col h-[85vh]">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span>GD Simulator</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Simulate dynamic group discussions with AI peers. Articulate viewpoints, lead dialogue, and receive evaluation on participation and poise.
          </p>
        </div>

        {!discussionStarted && !report && !isProcessing && (
          /* Topic Starter Card */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-auto">
            <div className="w-12 h-12 bg-fuchsia-50 border border-fuchsia-100 rounded-full flex items-center justify-center mx-auto text-fuchsia-600">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Select Discussion Topic</h3>
              <p className="text-slate-500 text-xs">Choose a topic to open the virtual discussion room.</p>
            </div>

            <div className="space-y-2 text-left">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTopic(t)}
                  className={`w-full p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    activeTopic === t
                      ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartDiscussion}
              className="w-full flex justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Enter Discussion Room
            </button>
          </div>
        )}

        {isProcessing && (
          /* Loading Assessment */
          <div className="flex h-[35vh] w-full items-center justify-center my-auto">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500">Moderating session logs and scoring contribution grades...</p>
            </div>
          </div>
        )}

        {discussionStarted && (
          /* Active Simulator Pane */
          <div className="flex-1 flex flex-col justify-between bg-white border border-slate-200 shadow-sm rounded-2xl min-h-0 overflow-hidden">
            {/* Header info */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-bold">Topic: {activeTopic}</span>
              <button
                onClick={handleFinishDiscussion}
                className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition-all cursor-pointer"
              >
                Finish Discussion
              </button>
            </div>

            {/* Discussion Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0 select-none">
                      {msg.avatar}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">{msg.sender}</span>
                      <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        isUser ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200/80'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={listEndRef} />
            </div>

            {/* Input panel */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {showMic ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <AudioRecorder onStop={handleMicTranscriptionFinished} isProcessing={isProcessing} />
                  <button onClick={() => setShowMic(false)} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">
                    Cancel voice recording
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMic(true)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter your argument or statement..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {report && (
          /* Discussion Report Card */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 my-auto overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Group Discussion Scoring Sheet</h2>
              <button 
                onClick={handleStartDiscussion}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-open Room
              </button>
            </div>

            {/* Score cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Participation', val: report.participation_score, color: 'from-blue-600 to-indigo-600' },
                { label: 'Leadership', val: report.leadership_score, color: 'from-purple-600 to-violet-600' },
                { label: 'Confidence', val: report.confidence_score, color: 'from-pink-600 to-rose-600' },
                { label: 'Grammar', val: report.grammar_score, color: 'from-indigo-600 to-blue-600' },
                { label: 'Idea Quality', val: report.idea_quality_score, color: 'from-rose-600 to-orange-600' },
                { label: 'Delivery', val: report.communication_score, color: 'from-amber-600 to-yellow-600' }
              ].map((s) => (
                <div key={s.label} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                  <div className={`text-xl font-extrabold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}/100</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Moderator Review</h3>
              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line text-justify bg-slate-50 p-4 rounded-xl border border-slate-100 select-text">
                {report.report_summary}
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
