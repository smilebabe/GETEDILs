import { useEffect } from 'react';
import { parseIntent } from '@/core/voice-intent-parser';

export default function useVoiceIntent(openPillar) {
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      const intent = parseIntent(text);

      if (intent?.pillar) {
        openPillar(intent.pillar);
      }
    };

    recognition.start();

    return () => recognition.stop();
  }, [openPillar]);
}
