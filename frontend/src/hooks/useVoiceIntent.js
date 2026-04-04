import { useEffect } from 'react';
import { parseIntent } from '@/core/voice-intent-parser';
import { useAgenticRouter } from '@/core/AgenticRouter';

export default function useVoiceIntent() {
  const { routeTo } = useAgenticRouter();

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      const intent = parseIntent(text);

      if (intent?.path) {
        routeTo(intent.path);
      }
    };

    recognition.start();

    return () => recognition.stop();
  }, []);
}
