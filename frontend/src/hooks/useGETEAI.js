import { supabase } from '../lib/supabase'; // Ensure this path is correct
import { useGETEStore } from '../store/geteStore';

export const useGETEAI = () => {
  const { messages, addMessage, updateLastMessage, setStreaming } = useGETEStore();

  const sendMessage = async (userId, text) => {
    // 1. Check if user has balance (The "Gas" Check)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!wallet || wallet.balance < 0.05) {
      addMessage({ role: 'assistant', text: "Insufficient P6 Credits. Please deposit ETB to continue." });
      return;
    }

    // 2. Process AI (Streaming)
    addMessage({ role: 'user', text });
    addMessage({ role: 'assistant', text: '' });
    setStreaming(true);

    // [AI Streaming Logic here - calling your /api/ai/chat]
    
    // 3. Deduct "Thinking Fee" (0.05 ETB per request)
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - 0.05 })
      .eq('user_id', userId);

    setStreaming(false);
  };

  return { sendMessage };
};
