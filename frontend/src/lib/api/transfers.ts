// frontend/src/lib/api/transfers.ts
import { supabase } from '@/lib/supabase';

export async function sendMoney(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
) {
    const { data, error } = await supabase.rpc('secure_transfer', {
        p_from_user_id: fromUserId,
        p_to_user_id: toUserId,
        p_amount: amount,
        p_transfer_type: 'p2p',
        p_description: description,
        p_idempotency_key: `${fromUserId}_${Date.now()}_${Math.random()}`
    });
    
    if (error) throw error;
    return data;
}

// Police check at immigration (Bole Airport)
export async function checkTravelRestriction(nationalId: string) {
    const { data, error } = await supabase.rpc('check_travel_restriction', {
        p_national_id: nationalId
    });
    
    return data;
}
