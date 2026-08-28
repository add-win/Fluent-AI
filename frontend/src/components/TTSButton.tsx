'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TTSButtonProps {
  text: string;
  lang?: string;
  className?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, lang = 'en-US', className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  const speak = () => {
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any ongoing speaking before starting
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Attempt to load standard high-quality English voices
    const voices = synth.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.includes(lang) && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.includes('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    synth.speak(utterance);
  };

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  return (
    <button
      onClick={speak}
      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400 cursor-pointer ${className}`}
      title={isPlaying ? 'Stop voice' : 'Play pronunciation voice'}
    >
      {isPlaying ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
};
export default TTSButton;
