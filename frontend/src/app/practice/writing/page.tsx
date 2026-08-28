'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import api from '../../../services/api';
import { PenTool, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export default function WritingPractice() {
  const types = ['Essay', 'Email', 'Paragraph', 'Story', 'Resume', 'Cover Letter'];
  const [activeType, setActiveType] = useState(types[0]);
  
  const [prompt, setPrompt] = useState('Write an email to a client explaining that their project will be delayed by one week due to unforeseen circumstances. Maintain a professional and apologetic tone.');
  const [text, setText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setReport(null);
    try {
      const data = await api.post('/writing/evaluate', {
        type: activeType,
        prompt: prompt,
        user_input: text
      });
      setReport(data);
    } catch (err) {
      console.error(err);
      alert('Error evaluating writing. Check configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrompt = () => {
    const prompts: Record<string, string[]> = {
      'Essay': [
        "Write a persuasive essay arguing whether remote work increases or decreases productivity.",
        "Should tertiary education be fully funded by governments? Discuss your viewpoints."
      ],
      'Email': [
        "Draft a formal request to your supervisor asking to attend an industry workshop next month.",
        "Write a cold sales email introducing a new cybersecurity product to a chief technology officer."
      ],
      'Paragraph': [
        "Write a paragraph describing the sensory details of a busy airport terminal.",
        "Explain the concept of compound interest in simple terms."
      ],
      'Story': [
        "Write a short suspenseful story starting with: 'The package was not supposed to arrive today...'",
        "Write a fictional story about a time traveler returning to the year 1920."
      ],
      'Resume': [
        "Draft a professional summary statement for a Senior Full-Stack Engineer with 5 years experience.",
        "Write 3 achievement-focused bullet points for a Product Manager role."
      ],
      'Cover Letter': [
        "Write an opening paragraph for a Cover Letter applying for a Marketing Specialist position.",
        "Write a closing call-to-action paragraph for a software developer application."
      ]
    };
    const list = prompts[activeType] || prompts['Email'];
    setPrompt(list[Math.floor(Math.random() * list.length)]);
    setReport(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <span>Writing Assistant</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Refine essays, emails, and articles with instant AI feedback on vocabulary richness, grammar, and tone.
          </p>
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Type:</span>
          <div className="flex gap-2 overflow-x-auto py-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveType(t);
                  setReport(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  activeType === t
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Writing Task</span>
            <button 
              onClick={handleNewPrompt}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Prompt</span>
            </button>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-slate-800">
            {prompt}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your written submission here..."
              rows={8}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal leading-relaxed shadow-sm"
            />
            <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {wordCount} words
            </div>
          </div>

          <button
            type="submit"
            disabled={wordCount === 0 || loading}
            className="w-full flex justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 text-white animate-spin" /> Evaluating submission...
              </span>
            ) : (
              'Submit Writing for Evaluation'
            )}
          </button>
        </form>

        {/* Results */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mt-8"
          >
            {/* Score Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { label: 'Grammar', val: report.grammar_score, color: 'from-blue-600 to-indigo-600' },
                { label: 'Vocabulary', val: report.vocabulary_score, color: 'from-purple-600 to-violet-600' },
                { label: 'Style & Tone', val: report.tone_score, color: 'from-indigo-600 to-blue-600' },
                { label: 'Readability', val: report.readability_score, color: 'from-rose-600 to-pink-600' }
              ].map((s) => (
                <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                  <div className={`text-2xl font-extrabold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}/100</div>
                </div>
              ))}
            </div>

            {/* Structured detailed reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Corrected Text markup */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Polished Rephrasing</h3>
                <p className="text-xs leading-relaxed text-slate-700 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60 select-text">
                  {report.corrected_text}
                </p>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  💡 {report.analysis?.tone_feedback || 'Your phrasing and style are appropriate.'}
                </div>
              </div>

              {/* Grammar Errors list */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Structural Improvements</span>
                </h3>
                
                {report.analysis?.grammar_details?.length === 0 ? (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50/60 p-4 rounded-xl text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No grammatical errors detected! Great writing.</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {report.analysis?.grammar_details?.map((err: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-rose-600 font-semibold uppercase text-[10px]">Incorrect:</span>
                          <span className="text-slate-500 italic line-through">&ldquo;{err.mistake}&rdquo;</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-indigo-700 font-semibold uppercase text-[10px]">Preferred:</span>
                          <span className="text-slate-900 font-semibold">&ldquo;{err.correction}&rdquo;</span>
                        </div>
                        <p className="text-slate-600 mt-1 font-normal">{err.rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
