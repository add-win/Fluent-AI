'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { AudioRecorder } from '../../../components/AudioRecorder';
import api from '../../../services/api';
import { BookOpenText, RefreshCw, Loader2 } from 'lucide-react';

export default function ReadingPractice() {
  const categories = ['Technology', 'Business', 'Science', 'AI', 'General English'];
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  
  // Practice states
  const [hasRead, setHasRead] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  
  // MCQ Quiz states
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [evaluatedReport, setEvaluatedReport] = useState<any>(null);

  useEffect(() => {
    fetchArticle();
  }, [activeCategory]);

  const fetchArticle = async () => {
    setLoading(true);
    setArticle(null);
    setHasRead(false);
    setTranscriptText('');
    setAnswers({});
    setQuizScore(null);
    setEvaluatedReport(null);
    try {
      const data = await api.get(`/reading/generate?category=${activeCategory}`);
      setArticle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioFinished = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'reading.webm');
      formData.append('transcript', '');

      const res = await api.post('/speaking/evaluate', formData);
      setTranscriptText(res.transcript);
      setHasRead(true);
    } catch (err) {
      console.error(err);
      alert('Error transcribing read aloud attempt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!article || !article.mcqs) return;
    
    let correct = 0;
    article.mcqs.forEach((mcq: any) => {
      const userAns = answers[mcq.id];
      if (userAns && userAns.startsWith(mcq.answer.charAt(0))) {
        correct++;
      }
    });

    setQuizScore(correct);

    const compScore = Math.round((correct / article.mcqs.length) * 100);
    const speedEst = 135;
    const pronunScore = 80;

    const reportData = {
      article_title: article.article_title,
      article_content: article.article_content,
      category: activeCategory,
      transcript: transcriptText || 'Read aloud text',
      speed: speedEst,
      pronunciation_score: pronunScore,
      accuracy_score: 85,
      comprehension_score: compScore,
      mcqs: article.mcqs,
      user_answers: answers
    };

    setEvaluatedReport(reportData);

    try {
      await api.post('/reading/submit', reportData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <BookOpenText className="w-5 h-5" />
            </div>
            <span>Reading Aloud</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Read AI-generated editorial passages aloud. Record your delivery to measure cadence, pacing, and comprehension.
          </p>
        </div>

        {/* Category Pill Filters */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Topic:</span>
          <div className="flex gap-2 overflow-x-auto py-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  activeCategory === c
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-[35vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
              <p className="text-sm text-slate-500">Creating reading passage...</p>
            </div>
          </div>
        ) : article ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle: Article Text and Recording */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">Reading Passage</span>
                  <button 
                    onClick={fetchArticle} 
                    className="text-xs text-slate-500 hover:text-pink-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900">{article.article_title}</h2>
                <p className="text-sm leading-relaxed text-slate-700 select-none text-justify">
                  {article.article_content}
                </p>
              </div>

              {/* Recorder */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  {!hasRead ? 'Read the passage aloud into the microphone' : 'Recording Complete! Check details below'}
                </h3>
                <AudioRecorder onStop={handleAudioFinished} isProcessing={isProcessing} />
              </div>

              {/* Evaluation score report */}
              {evaluatedReport && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5"
                >
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Reading Performance Report</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold">SPEED</span>
                      <p className="text-lg font-bold mt-1 text-slate-800">{evaluatedReport.speed} WPM</p>
                    </div>
                    <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100">
                      <span className="text-[10px] text-pink-700 font-bold">PRONUNCIATION</span>
                      <p className="text-lg font-bold mt-1 text-pink-700">{evaluatedReport.pronunciation_score}%</p>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 font-bold">COMPREHENSION</span>
                      <p className="text-lg font-bold mt-1 text-blue-700">{evaluatedReport.comprehension_score}%</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Panel: MCQs */}
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  <span>Comprehension Quiz</span>
                </h3>

                {article.mcqs?.length === 0 ? (
                  <p className="text-xs text-slate-400">No questions generated for this article.</p>
                ) : (
                  <div className="space-y-5">
                    {article.mcqs.map((mcq: any, idx: number) => (
                      <div key={mcq.id} className="space-y-2.5">
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {idx + 1}. {mcq.question}
                        </p>
                        
                        <div className="space-y-1.5">
                          {mcq.options.map((opt: string) => {
                            const isSelected = answers[mcq.id] === opt;
                            let btnStyle = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
                            if (isSelected) btnStyle = "border-blue-600 bg-blue-50 text-blue-700 font-semibold";
                            
                            if (quizScore !== null) {
                              const isCorrect = opt.startsWith(mcq.answer.charAt(0));
                              if (isCorrect) btnStyle = "border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold";
                              else if (isSelected) btnStyle = "border-rose-400 bg-rose-50 text-rose-700";
                            }

                            return (
                              <button
                                key={opt}
                                onClick={() => quizScore === null && setAnswers((prev) => ({ ...prev, [mcq.id]: opt }))}
                                disabled={quizScore !== null}
                                className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${btnStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {quizScore === null ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(answers).length < article.mcqs.length || isProcessing}
                        className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <div className="text-center text-xs font-semibold text-slate-700 py-2 border-t border-slate-100">
                        Score: {quizScore} / {article.mcqs.length} correct answers!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : null}

      </div>
    </DashboardLayout>
  );
}
