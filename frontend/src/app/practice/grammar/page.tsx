'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import api from '../../../services/api';
import { Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface GrammarLesson {
  key: string;
  title: string;
  category: string;
  explanation: string;
  rules: string[];
  quiz: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
}

export default function GrammarCoach() {
  const lessons: GrammarLesson[] = [
    {
      key: 'tenses',
      title: 'Tenses: Past, Present & Future',
      category: 'Verb Tenses',
      explanation: 'Tenses denote the time of action. English has three primary tenses: Past, Present, and Future, each subdivided into Simple, Continuous, Perfect, and Perfect Continuous.',
      rules: [
        'Simple Present: Used for habits and truths. e.g. "She writes daily."',
        'Present Perfect: Connects past to present. e.g. "I have eaten breakfast (already)."',
        'Past Simple: Refers to a completed action in the past. e.g. "They went to the market yesterday."',
        'Future Perfect: Event completed before a specific future time. e.g. "I will have completed the report by 5 PM."'
      ],
      quiz: [
        {
          question: 'Identify the correct tense: "By next September, they ______ in this house for ten years."',
          options: ['will live', 'will have lived', 'are living', 'have lived'],
          answer: 'will have lived',
          explanation: 'Use Future Perfect (will have + past participle) to show that an action will be completed before a certain point in the future.'
        },
        {
          question: 'Choose the correct form: "She ______ a book when the phone rang."',
          options: ['read', 'has read', 'was reading', 'will read'],
          answer: 'was reading',
          explanation: 'Past Continuous (was/were + verb-ing) is used for an action that was in progress when interrupted by another past action.'
        }
      ]
    },
    {
      key: 'articles',
      title: 'Articles: A, An & The',
      category: 'Noun Modifiers',
      explanation: 'Articles define a noun as specific or unspecific. "A" and "an" are indefinite, while "the" is definite.',
      rules: [
        'Use "a" before consonant sounds. e.g. "a university" (/juː/)',
        'Use "an" before vowel sounds. e.g. "an hour" (/aʊər/)',
        'Use "the" for specific or unique objects. e.g. "the sun", "the CEO of Google"'
      ],
      quiz: [
        {
          question: 'Which article fits: "She wants to buy ______ honest dog."',
          options: ['a', 'an', 'the', 'no article needed'],
          answer: 'an',
          explanation: 'Honest starts with a silent "h" (/ˈɒn.ɪst/), producing a vowel sound, so "an" is correct.'
        }
      ]
    },
    {
      key: 'prepositions',
      title: 'Prepositions of Time & Place',
      category: 'Connectors',
      explanation: 'Prepositions indicate relationships between other words in a sentence, establishing time, direction, or location.',
      rules: [
        'In: Enclosed spaces or long periods (months/years). e.g. "in London", "in 2026"',
        'On: Surfaces, dates, and days. e.g. "on the table", "on Monday"',
        'At: Specific points or precise times. e.g. "at 5:00 PM", "at the bus stop"'
      ],
      quiz: [
        {
          question: 'Select the right preposition: "The conference starts ______ 9:00 AM ______ Monday."',
          options: ['at, on', 'in, at', 'on, at', 'at, in'],
          answer: 'at, on',
          explanation: '"At" is used for specific time of day, and "on" is used for days of the week.'
        }
      ]
    }
  ];

  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson>(lessons[0]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answersStatus, setAnswersStatus] = useState<boolean[]>([]);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const data = await api.get('/grammar');
      const finished = data.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_key);
      setCompletedLessons(finished);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAns) return;
    const currentQ = selectedLesson.quiz[qIndex];
    const isCorrect = selectedAns === currentQ.answer;
    
    setSubmitted(true);
    setAnswersStatus((prev) => [...prev, isCorrect]);
  };

  const handleNextQuestion = async () => {
    if (qIndex + 1 < selectedLesson.quiz.length) {
      setQIndex((prev) => prev + 1);
      setSelectedAns(null);
      setSubmitted(false);
    } else {
      // Quiz completed
      const correctCount = answersStatus.filter(Boolean).length;
      const score = Math.round((correctCount / selectedLesson.quiz.length) * 100);
      
      try {
        await api.post('/grammar/quiz', {
          lesson_key: selectedLesson.key,
          quiz_score: score
        });
        setCompletedLessons((prev) => Array.from(new Set([...prev, selectedLesson.key])));
      } catch (err) {
        console.error(err);
      }

      alert(`Quiz completed! Score: ${score}%`);
      setActiveQuiz(false);
      setQIndex(0);
      setSelectedAns(null);
      setSubmitted(false);
    }
  };

  const isCompleted = completedLessons.includes(selectedLesson.key);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span>Grammar Coach</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Master core grammatical structures, tenses, articles, and prepositions with practical drills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Lesson List Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grammar Modules</h3>
              <div className="space-y-1.5">
                {lessons.map((l) => {
                  const isDone = completedLessons.includes(l.key);
                  const isSelected = selectedLesson.key === l.key;
                  return (
                    <button
                      key={l.key}
                      onClick={() => {
                        setSelectedLesson(l);
                        setActiveQuiz(false);
                        setQIndex(0);
                        setSubmitted(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold shadow-sm'
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{l.category}</p>
                      </div>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lesson Content Panel */}
          <div className="md:col-span-2 space-y-6">
            {!activeQuiz ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">{selectedLesson.category}</span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{selectedLesson.title}</h2>
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                  <p>{selectedLesson.explanation}</p>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider">Usage Rules:</h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                      {selectedLesson.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  {isCompleted && (
                    <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Lesson Completed
                    </span>
                  )}
                  
                  <button
                    onClick={() => {
                      setActiveQuiz(true);
                      setAnswersStatus([]);
                    }}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Take Lesson Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz interface active */
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{selectedLesson.title} Quiz</span>
                  <span className="text-xs text-slate-400 font-medium">Q {qIndex + 1} of {selectedLesson.quiz.length}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {selectedLesson.quiz[qIndex]?.question}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {selectedLesson.quiz[qIndex]?.options.map((opt: string) => {
                    const isSelected = selectedAns === opt;
                    const isCorrect = opt === selectedLesson.quiz[qIndex].answer;
                    
                    let style = "border-slate-200 hover:bg-slate-50 text-slate-800 bg-white";
                    if (isSelected) style = "border-blue-600 bg-blue-50 text-blue-700";
                    if (submitted) {
                      if (isCorrect) style = "border-indigo-600 bg-indigo-50 text-indigo-800";
                      else if (isSelected) style = "border-rose-400 bg-rose-50 text-rose-700";
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => !submitted && setSelectedAns(opt)}
                        disabled={submitted}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${style}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1"
                  >
                    <div className="font-bold text-blue-800 uppercase tracking-wider text-[9px]">Explanation:</div>
                    <p className="text-slate-700 leading-relaxed">{selectedLesson.quiz[qIndex].explanation}</p>
                  </motion.div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    onClick={() => setActiveQuiz(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Back to Lesson
                  </button>
                  
                  {!submitted ? (
                    <button
                      onClick={handleAnswerSubmit}
                      disabled={!selectedAns}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>{qIndex + 1 === selectedLesson.quiz.length ? 'Finish' : 'Next'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
