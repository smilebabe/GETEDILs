import { supabase } from '../lib/supabase';
import { useGETEStore } from '../store/geteStore';

export const useGETEAI = () => {
  const { addMessage, setStreaming } = useGETEStore();

  const processAILogic = async (userId, userText) => {
    // 1. AUTH & BALANCE CHECK
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (wallet?.balance < 0.10) { // Cost per AI thought: 0.10 ETB
      addMessage({ role: 'assistant', text: "⚠️ INSUFFICIENT_FUNDS: Please top up your P6 Wallet to access GETE Intelligence." });
      return;
    }

    // 2. TRIGGER STREAMING
    setStreaming(true);
    addMessage({ role: 'user', text: userText });

    try {
      // Logic to call your Vercel Edge Function for AI
      // ... (Streaming response code)

      // 3. DEDUCT FEE (Self-Preservation)
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance - 0.10 })
        .eq('user_id', userId);

    } catch (err) {
      console.error("OS_CRITICAL_ERROR:", err);
    } finally {
      setStreaming(false);
    }
  };

  return { processAILogic };
};
