'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../services/api';
import {
  Mic, Volume2, BookOpen, Award, BookOpenText,
  Speech, PenTool, Briefcase, Users, Loader2, BarChart2
} from 'lucide-react';

// ─── Navigation feature cards shown in the main dashboard grid ───────────────
const features = [
  {
    name: 'Speech Evaluator',
    description: 'Record your voice and get instant AI feedback on fluency, grammar, and pacing.',
    path: '/practice/speaking',
    icon: Mic,
    gradient: 'from-blue-600 to-indigo-600',
    glow: 'hover:shadow-blue-500/10',
    border: 'border-slate-200',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Pronunciation Coach',
    description: 'Say target words and get phonetic comparison with IPA breakdown and tips.',
    path: '/practice/pronunciation',
    icon: Volume2,
    gradient: 'from-violet-600 to-purple-600',
    glow: 'hover:shadow-violet-500/10',
    border: 'border-slate-200',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    name: 'Vocabulary Builder',
    description: 'Learn curated words with meanings, synonyms, antonyms and example sentences.',
    path: '/practice/vocabulary',
    icon: BookOpen,
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'hover:shadow-emerald-500/10',
    border: 'border-slate-200',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    name: 'Grammar Coach',
    description: 'Master tenses, articles, and sentence structures through interactive quizzes.',
    path: '/practice/grammar',
    icon: Award,
    gradient: 'from-amber-600 to-orange-600',
    glow: 'hover:shadow-amber-500/10',
    border: 'border-slate-200',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    name: 'Reading Aloud',
    description: 'Read AI-generated articles aloud and receive pronunciation accuracy scores.',
    path: '/practice/reading',
    icon: BookOpenText,
    gradient: 'from-pink-600 to-rose-600',
    glow: 'hover:shadow-pink-500/10',
    border: 'border-slate-200',
    bg: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    name: 'Listening Practice',
    description: 'Listen to dialogues and answer comprehension questions to sharpen your ear.',
    path: '/practice/listening',
    icon: Speech,
    gradient: 'from-sky-600 to-blue-600',
    glow: 'hover:shadow-sky-500/10',
    border: 'border-slate-200',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  {
    name: 'Writing Assistant',
    description: 'Submit essays or emails and get grammar, tone, and readability scores.',
    path: '/practice/writing',
    icon: PenTool,
    gradient: 'from-indigo-600 to-slate-800',
    glow: 'hover:shadow-indigo-500/10',
    border: 'border-slate-200',
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    name: 'Mock Interview',
    description: 'Practice HR, technical, and behavioral interviews with AI evaluation.',
    path: '/practice/interview',
    icon: Briefcase,
    gradient: 'from-slate-700 to-slate-900',
    glow: 'hover:shadow-slate-500/10',
    border: 'border-slate-200',
    bg: 'bg-slate-100',
    iconColor: 'text-slate-800',
  },
  {
    name: 'GD Simulator',
    description: 'Simulate group discussions and get leadership & communication scores.',
    path: '/practice/group-discussion',
    icon: Users,
    gradient: 'from-fuchsia-600 to-purple-600',
    glow: 'hover:shadow-fuchsia-500/10',
    border: 'border-slate-200',
    bg: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-600',
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const data = await api.get('/dashboard');
      setScores(data?.profile?.scores);
    } catch (err) {
      console.error('Failed to load dashboard scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const skillCards = [
    { label: 'Speaking',     val: scores?.speaking,      color: 'from-blue-600 to-indigo-600'  },
    { label: 'Grammar',      val: scores?.grammar,       color: 'from-purple-600 to-indigo-600'},
    { label: 'Vocabulary',   val: scores?.vocabulary,    color: 'from-emerald-600 to-teal-600' },
    { label: 'Pronunciation',val: scores?.pronunciation, color: 'from-pink-600 to-rose-600'   },
    { label: 'Confidence',   val: scores?.confidence,    color: 'from-amber-600 to-orange-600' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 font-sans">

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Select any practice module below to begin your personalized English training session.
            </p>
          </div>
        </div>

        {/* Skill Score Strip */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Loading your performance metrics…
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {skillCards.map((score, i) => (
              <motion.div
                key={score.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  {score.label}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold bg-gradient-to-r ${score.color} bg-clip-text text-transparent`}>
                    {score.val ?? 70}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${score.color} rounded-full`}
                    style={{ width: `${score.val ?? 70}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center gap-2.5 pt-2">
          <BarChart2 className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-bold text-slate-900">Practice Modules</h2>
        </div>

        {/* Feature Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.path}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={feat.path}
                  className={`group flex flex-col h-full p-6 rounded-2xl bg-white border ${feat.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl ${feat.bg} border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${feat.iconColor}`} />
                  </div>

                  <h3 className="font-bold text-base mb-1.5 text-slate-900 group-hover:text-blue-600 transition-colors">
                    {feat.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">
                    {feat.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    <span>Open Module</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
