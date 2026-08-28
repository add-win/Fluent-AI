'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { AudioRecorder } from '../../../components/AudioRecorder';
import { TTSButton } from '../../../components/TTSButton';
import api from '../../../services/api';
import { Volume2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface WordDetails {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
}

export default function PronunciationTrainer() {
  const wordsList: WordDetails[] = [
    { word: 'Anachronism', ipa: '/əˈnæk.rə.nɪ.zəm/', meaning: 'Something placed in a wrong historical period.', example: 'The digital watch in the medieval movie was an anachronism.' },
    { word: 'Ubiquitous', ipa: '/juːˈbɪk.wɪ.təs/', meaning: 'Present, appearing, or found everywhere.', example: 'Smartphones have become ubiquitous in modern society.' },
    { word: 'Ephemeral', ipa: '/ɪˈfem.ər.əl/', meaning: 'Lasting for a very short time.', example: 'Fame is often ephemeral, fading in just a few days.' },
    { word: 'Meticulous', ipa: '/məˈtɪk.jə.ləs/', meaning: 'Showing great attention to detail; very careful.', example: 'He was meticulous about cleaning his car.' },
    { word: 'Phenomenon', ipa: '/fəˈnɒm.ɪ.nən/', meaning: 'A fact or situation that is observed to exist.', example: 'Glaciers melting is a natural phenomenon.' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [customWord, setCustomWord] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordDetails>(wordsList[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSelectWord = (word: WordDetails) => {
    setSelectedWord(word);
    setResult(null);
  };

  const handleCustomWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim()) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('target_word', customWord.trim());
      formData.append('transcript', customWord.trim());
      
      const data = await api.post('/pronunciation/evaluate', formData);
      setSelectedWord({
        word: customWord.trim(),
        ipa: data.ipa || '/.../',
        meaning: data.meaning || 'Custom vocabulary word.',
        example: 'Try pronouncing: ' + customWord.trim()
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setCustomWord('');
    }
  };

  const handleAudioFinished = async (blob: Blob) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'attempt.webm');
      formData.append('target_word', selectedWord.word);
      formData.append('transcript', '');

      const res = await api.post('/pronunciation/evaluate', formData);
      setResult(res);
    } catch (err) {
      console.error('Error evaluating pronunciation:', err);
      alert('Failed to evaluate. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextWord = () => {
    const nextIdx = (currentIndex + 1) % wordsList.length;
    setCurrentIndex(nextIdx);
    setSelectedWord(wordsList[nextIdx]);
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="pb-1 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <span>Pronunciation Trainer</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Listen to phonics accents, record your speaking attempt, and receive immediate phoneme breakdown and tips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Word Selector Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Word Bank</h3>
              <div className="space-y-1.5">
                {wordsList.map((w) => (
                  <button
                    key={w.word}
                    onClick={() => handleSelectWord(w)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                      selectedWord.word === w.word
                        ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {w.word}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <form onSubmit={handleCustomWordSubmit} className="pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Try Custom Word
                </label>
                <input
                  type="text"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="e.g. Phenomenon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                />
              </form>
            </div>
          </div>

          {/* Active Word Focus Display */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="absolute top-6 right-6">
                <TTSButton text={selectedWord.word} className="w-10 h-10 bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-100" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-violet-600 font-bold uppercase tracking-wider">Focus Word</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{selectedWord.word}</h2>
                <div className="text-sm text-violet-700 font-semibold font-mono bg-violet-50/60 inline-block px-2.5 py-0.5 rounded-md border border-violet-100">{selectedWord.ipa}</div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div>
                  <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">Meaning</h4>
                  <p className="text-slate-800">{selectedWord.meaning}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">Example Sentence</h4>
                  <p className="italic text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">&ldquo;{selectedWord.example}&rdquo;</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Listen above, then record your attempt below.</span>
                <button
                  onClick={handleNextWord}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Word</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recorder and results panel */}
            <div className="space-y-4">
              <AudioRecorder onStop={handleAudioFinished} isProcessing={isProcessing} />

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5"
                >
                  <div className="flex items-center gap-3">
                    {result.is_correct ? (
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-base text-slate-900">
                        {result.is_correct ? 'Accurate Pronunciation! 🎉' : 'Needs Minor Adjustment 💡'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{result.comparison_details}</p>
                    </div>
                  </div>

                  {result.pronunciation_tips && result.pronunciation_tips.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Phonetic Guidance:</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700">
                        {result.pronunciation_tips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
