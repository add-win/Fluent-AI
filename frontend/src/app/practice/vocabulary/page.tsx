'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { TTSButton } from '../../../components/TTSButton';
import api from '../../../services/api';
import { 
  BookOpen, ArrowRight, RefreshCw, Bookmark,
  BookmarkCheck, Search, GraduationCap, Loader2
} from 'lucide-react';

export default function VocabularyBuilder() {
  const [loading, setLoading] = useState(true);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    fetchVocab();
  }, []);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      const data = await api.get('/vocabulary');
      setVocabList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWords = async () => {
    try {
      setLoading(true);
      await api.post('/vocabulary/generate?count=5&difficulty=Medium');
      await fetchVocab();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async (wordId: string, currentBookmarked: boolean) => {
    try {
      const res = await api.put(`/vocabulary/${wordId}`, {
        bookmarked: !currentBookmarked
      });
      setVocabList((prev) => 
        prev.map((item) => item.word_id === wordId ? { ...item, bookmarked: res.bookmarked } : item)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartQuiz = () => {
    if (vocabList.length < 3) {
      alert('Add at least 3 words to your vocabulary bank to unlock quizzes!');
      return;
    }
    
    // Generate simple multiple-choice questions
    const questions = vocabList.map((item) => {
      const correctWord = item.vocab_item.word;
      const meaning = item.vocab_item.meaning;
      
      const distractors = vocabList
        .filter((i) => i.vocab_item.word !== correctWord)
        .map((i) => i.vocab_item.word);
        
      const shuffledOptions = [correctWord, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
      
      return {
        wordId: item.word_id,
        meaning: meaning,
        options: shuffledOptions,
        answer: correctWord
      };
    }).sort(() => Math.random() - 0.5).slice(0, 5);

    setQuizQuestions(questions);
    setQuizIndex(0);
    setSelectedAns(null);
    setQuizScore(0);
    setQuizSubmitted(false);
    setQuizMode(true);
  };

  const handleSubmitQuizAnswer = async () => {
    if (!selectedAns) return;
    
    const activeQ = quizQuestions[quizIndex];
    const isCorrect = selectedAns === activeQ.answer;
    
    if (isCorrect) setQuizScore((prev) => prev + 1);
    setQuizSubmitted(true);

    try {
      await api.post('/vocabulary/quiz', {
        word_id: activeQ.wordId,
        correct: isCorrect
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAns(null);
      setQuizSubmitted(false);
    } else {
      alert(`Quiz Finished! Your Score: ${quizScore}/${quizQuestions.length}`);
      setQuizMode(false);
      fetchVocab();
    }
  };

  const filteredVocab = vocabList.filter((item) => 
    item.vocab_item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVocab = filteredVocab[cardIndex]?.vocab_item;
  const activeUserVocab = filteredVocab[cardIndex];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-7 font-sans">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Vocabulary Builder</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Expand your lexicon with flashcards. Flip to reveal definitions and example sentences.
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleGenerateWords}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Learn 5 Words</span>
            </button>

            <button
              onClick={handleStartQuiz}
              disabled={vocabList.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Quiz Review</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : quizMode ? (
          /* Quiz panel */
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Vocabulary Quiz</span>
              <span className="text-xs text-slate-400 font-medium">Question {quizIndex + 1} of {quizQuestions.length}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Which word matches:</h4>
              <p className="text-base font-semibold text-slate-900 leading-relaxed">&ldquo;{quizQuestions[quizIndex]?.meaning}&rdquo;</p>
            </div>

            <div className="space-y-2 pt-1">
              {quizQuestions[quizIndex]?.options.map((opt: string) => {
                const isSelected = selectedAns === opt;
                const isCorrect = opt === quizQuestions[quizIndex].answer;
                
                let btnStyle = "border-slate-200 hover:bg-slate-50 text-slate-800 bg-white";
                if (isSelected) btnStyle = "border-blue-600 bg-blue-50 text-blue-700";
                if (quizSubmitted) {
                  if (isCorrect) btnStyle = "border-indigo-600 bg-indigo-50 text-indigo-800";
                  else if (isSelected) btnStyle = "border-rose-400 bg-rose-50 text-rose-700";
                }

                return (
                  <button
                    key={opt}
                    onClick={() => !quizSubmitted && setSelectedAns(opt)}
                    disabled={quizSubmitted}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => setQuizMode(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Quit Quiz
              </button>
              
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuizAnswer}
                  disabled={!selectedAns}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuiz}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span>{quizIndex + 1 === quizQuestions.length ? 'Finish' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : filteredVocab.length === 0 ? (
          /* Empty state */
          <div className="bg-white py-16 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Your Word Bank is Empty</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Generate starter words to study with flashcards and quizzes.
            </p>
            <div className="pt-2">
              <button
                onClick={handleGenerateWords}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Learn Your First 5 Words
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Flashcard and List Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left/Middle: Flashcard */}
            <div className="md:col-span-2 space-y-5">
              {activeVocab && (
                <div className="flex flex-col items-center">
                  {/* Flashing Anim Panel */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-80 rounded-2xl relative cursor-pointer perspective"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{ transformStyle: 'preserve-3d' }}
                      className="w-full h-full relative"
                    >
                      {/* Front: Word, Pronunciation */}
                      <div className="absolute inset-0 w-full h-full bg-white border border-slate-200 shadow-sm rounded-2xl p-8 flex flex-col justify-between backface-hidden">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Card {cardIndex + 1} of {filteredVocab.length}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle(activeVocab.id, activeUserVocab.bookmarked);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                          >
                            {activeUserVocab.bookmarked ? (
                              <BookmarkCheck className="w-5 h-5 text-amber-500 fill-current" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        <div className="text-center space-y-2">
                          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{activeVocab.word}</h2>
                          <p className="text-sm font-mono text-indigo-600 font-semibold">{activeVocab.ipa}</p>
                          <div className="inline-block mt-2" onClick={(e) => e.stopPropagation()}>
                            <TTSButton text={activeVocab.word} className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200" />
                          </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-3">
                          Click card to flip and view definition
                        </div>
                      </div>

                      {/* Back: Definition, Synonyms, Example */}
                      <div 
                        style={{ transform: 'rotateY(180deg)' }}
                        className="absolute inset-0 w-full h-full bg-white border border-slate-200 shadow-sm rounded-2xl p-8 flex flex-col justify-between backface-hidden"
                      >
                        <div className="text-left space-y-3.5">
                          <div>
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Meaning</span>
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed mt-0.5">{activeVocab.meaning}</p>
                          </div>
                          
                          {activeVocab.example_sentence && (
                            <div>
                              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Example</span>
                              <p className="text-xs italic leading-relaxed mt-0.5 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                &ldquo;{activeVocab.example_sentence}&rdquo;
                              </p>
                            </div>
                          )}

                          <div className="flex gap-4 pt-1">
                            {activeVocab.synonyms?.length > 0 && (
                              <div className="flex-1">
                                <span className="text-[9px] text-blue-700 font-bold uppercase">Synonyms</span>
                                <p className="text-xs text-slate-600 mt-0.5">{activeVocab.synonyms.slice(0, 3).join(', ')}</p>
                              </div>
                            )}
                            {activeVocab.antonyms?.length > 0 && (
                              <div className="flex-1">
                                <span className="text-[9px] text-rose-700 font-bold uppercase">Antonyms</span>
                                <p className="text-xs text-slate-600 mt-0.5">{activeVocab.antonyms.slice(0, 3).join(', ')}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-3">
                          Click to flip back
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation bar */}
                  <div className="flex items-center gap-4 mt-5">
                    <button
                      onClick={() => {
                        setCardIndex((prev) => Math.max(prev - 1, 0));
                        setIsFlipped(false);
                      }}
                      disabled={cardIndex === 0}
                      className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        setCardIndex((prev) => Math.min(prev + 1, filteredVocab.length - 1));
                        setIsFlipped(false);
                      }}
                      disabled={cardIndex === filteredVocab.length - 1}
                      className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Search and list */}
            <div className="space-y-3.5">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search word..."
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs"
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 max-h-[340px] overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Word Bank</h3>
                <div className="space-y-1">
                  {filteredVocab.map((item, idx) => (
                    <button
                      key={item.vocab_item.id}
                      onClick={() => {
                        setCardIndex(idx);
                        setIsFlipped(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                        cardIndex === idx
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{item.vocab_item.word}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      
      {/* Perspective styling inline to enable 3D flip card */}
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </DashboardLayout>
  );
}
