'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { TTSButton } from '../../../components/TTSButton';
import api from '../../../services/api';
import { Speech } from 'lucide-react';

interface ListeningClip {
  title: string;
  type: string;
  transcript: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    answer: string;
  }[];
}

export default function ListeningPractice() {
  const clips: ListeningClip[] = [
    {
      title: 'Business Brief: Sustainable Tech Expansion',
      type: 'News Broadcast',
      transcript: 'EcoFlow, the leading sustainable energy provider, has announced a massive 50 million dollar expansion plan into Northern Europe. The CEO stated that the primary objective is to install over five thousand smart solar grids within the next eighteen months. Despite initial market skepticism, stocks surged by twelve percent following the press release. Experts suggest this move could trigger similar investments from competitors.',
      questions: [
        {
          id: 1,
          question: 'How much funding is allocated to the expansion plan?',
          options: ['15 million dollars', '50 million dollars', '12 million dollars', '5 million dollars'],
          answer: '50 million dollars'
        },
        {
          id: 2,
          question: 'How many smart solar grids does EcoFlow intend to install?',
          options: ['1,800 grids', '500 grids', '12,000 grids', '5,000 grids'],
          answer: '5,000 grids'
        }
      ]
    },
    {
      title: 'Daily Tech Podcast: The Web3 Shift',
      type: 'Podcast Dialogue',
      transcript: 'Welcome back to TechToday. Today we are unpacking the shift from centralized cloud providers to decentralized networks. Many startups are migrating because of rising subscription models. By moving data storage to cooperative clusters, companies report up to a forty percent reduction in monthly operational fees. However, latency and immediate file synchronization remain the two major technical bottlenecks.',
      questions: [
        {
          id: 1,
          question: 'Why are startups migrating to decentralized networks?',
          options: ['Rising subscription models', 'Faster processing speeds', 'Lack of encryption', 'Better graphics'],
          answer: 'Rising subscription models'
        },
        {
          id: 2,
          question: 'What reduction in monthly operational fees was reported?',
          options: ['10 percent', '20 percent', '40 percent', '50 percent'],
          answer: '40 percent'
        }
      ]
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeClip, setActiveClip] = useState<ListeningClip>(clips[0]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectClip = (clip: ListeningClip, idx: number) => {
    setCurrentIndex(idx);
    setActiveClip(clip);
    setAnswers({});
    setQuizScore(null);
  };

  const handleSubmitQuiz = async () => {
    let score = 0;
    activeClip.questions.forEach((q) => {
      if (answers[q.id] === q.answer) {
        score++;
      }
    });
    setQuizScore(score);
    setSubmitting(true);

    try {
      await api.post('/listening/submit', {
        audio_type: activeClip.type,
        title: activeClip.title,
        transcript: activeClip.transcript,
        questions: activeClip.questions,
        user_answers: answers,
        score: Math.round((score / activeClip.questions.length) * 100)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Speech className="w-5 h-5" />
            </div>
            <span>Listening Practice</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Listen to clear English dialogues, announcements, and narratives, then test your comprehension.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left: Clips List Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audio Clips</h3>
              <div className="space-y-1.5">
                {clips.map((clip, idx) => (
                  <button
                    key={clip.title}
                    onClick={() => handleSelectClip(clip, idx)}
                    className={`w-full text-left p-3 rounded-xl border flex flex-col gap-0.5 transition-all cursor-pointer ${
                      activeClip.title === clip.title
                        ? 'bg-sky-50 border-sky-200 text-sky-900 shadow-sm font-semibold'
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs truncate">{clip.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{clip.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Active Player and MCQ */}
          <div className="md:col-span-2 space-y-5">
            {/* Audio clip player card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-sky-600 font-bold uppercase tracking-wider">{activeClip.type}</span>
                <h3 className="text-lg font-bold text-slate-900">{activeClip.title}</h3>
              </div>

              {/* TTS Button */}
              <div className="flex justify-center py-2">
                <div className="w-16 h-16 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center border border-sky-200 transition-all">
                  <TTSButton text={activeClip.transcript} className="p-3 text-sky-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500">Click the speaker button to play the audio clip.</p>
            </div>

            {/* MCQ Quiz */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Comprehension Check</h3>
              
              <div className="space-y-5">
                {activeClip.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-2.5">
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt;
                        let style = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
                        if (isSelected) style = "border-blue-600 bg-blue-50 text-blue-700 font-semibold";
                        
                        if (quizScore !== null) {
                          if (opt === q.answer) style = "border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold";
                          else if (isSelected) style = "border-rose-400 bg-rose-50 text-rose-700";
                        }

                        return (
                          <button
                            key={opt}
                            onClick={() => quizScore === null && setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            disabled={quizScore !== null}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${style}`}
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
                    disabled={Object.keys(answers).length < activeClip.questions.length || submitting}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                  </button>
                ) : (
                  <div className="text-center text-xs font-semibold text-slate-700 py-2 border-t border-slate-100">
                    Listening Score: {quizScore} / {activeClip.questions.length} correct answers!
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
