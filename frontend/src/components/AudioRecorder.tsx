'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface AudioRecorderProps {
  onStop: (blob: Blob) => void;
  isProcessing?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onStop, isProcessing = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio context for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, []);

  const getSupportedMimeType = (): string | undefined => {
    const types = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return undefined;
  };

  const startRecording = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio API for visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const recordedType = mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: recordedType });
        onStop(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordTime(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

      // Start canvas visualization
      visualize();
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecordingAndCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Cleanup visualizer
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    isRecordingRef.current = false;
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const visualize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecordingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      canvasCtx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2.2;

        const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#2563EB');
        gradient.addColorStop(1, '#7C3AED');
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 shadow-sm rounded-2xl w-full max-w-md mx-auto">
      <div className="relative w-full h-24 mb-4 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
        {isRecording ? (
          <canvas ref={canvasRef} width={380} height={80} className="w-full h-full max-h-20" />
        ) : (
          <div className="text-slate-400 text-sm font-medium">
            {isProcessing ? 'Processing speech assessment...' : 'Microphone Ready'}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {isRecording ? (
          <button
            onClick={stopRecordingAndCleanup}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Stop Recording"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Start Recording"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span>{formatTime(recordTime)}</span>
        </div>
      )}
    </div>
  );
};
export default AudioRecorder;
