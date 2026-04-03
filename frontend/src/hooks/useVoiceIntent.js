// ============================================
// frontend/src/hooks/useVoiceIntent.js
// ============================================
// Web Speech API hook → parses intent → routes via AgenticRouter

import { useEffect, useRef, useState, useCallback } from 'react';
import { parseVoiceIntent } from '@/core/voice-intent-parser';
import { AgenticRouter } from '@/core/AgenticRouter';

const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export const useVoiceIntent = () => {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  // Initialize
  useEffect(() => {
    if (!SpeechRecognition) {
      setError('SpeechRecognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // You can extend to am-ET later

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onerror = (e) => {
      setError(e.error);
      setListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      setTranscript(text);

      // Normalize
      const normalized = text.toLowerCase();

      // Hard fallback mapping (critical commands)
      if (normalized.includes('sira') || normalized.includes('job')) {
        AgenticRouter.navigate('/get-hired');
        return;
      }

      // Parse via AI/logic layer
      const pillarId = parseVoiceIntent(text);

      if (pillarId) {
        AgenticRouter.navigateByPillar(pillarId);
      } else {
        console.warn('No intent matched for:', text);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  return {
    listening,
    transcript,
    error,
    startListening,
    stopListening
  };
};
