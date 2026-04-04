// frontend/src/hooks/useWallet.js
import { supabase } from '../lib';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

let crdtEngine = null;

export function useWallet() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [pendingOperations, setPendingOperations] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!user) return;
        
        // Initialize CRDT engine once
        if (!crdtEngine) {
            const CRDTEngineClass = require('@/lib/sync-engine/crdt-engine').default;
            crdtEngine = new CRDTEngineClass({
                clientId: localStorage.getItem('device_id'),
                userId: user.id,
                supabase: supabase,
                eventBus: eventBus,
                syncInterval: 30000
            });
        }
        
        // Load initial balance
        loadBalance();
        
        // Subscribe to events
        const unsubscribeBalance = eventBus.on('wallet:updated', ({ balance }) => {
            setBalance(balance);
        });
        
        const unsubscribeSync = eventBus.on('sync:complete', (data) => {
            setIsSyncing(false);
            setPendingOperations(0);
        });
        
        const unsubscribeHealth = eventBus.on('sync:health', (status) => {
            setIsSyncing(status.isSyncing);
            setPendingOperations(status.pendingCount);
        });
        
        return () => {
            unsubscribeBalance();
            unsubscribeSync();
            unsubscribeHealth();
        };
    }, [user]);
    
    const loadBalance = async () => {
        if (!crdtEngine) return;
        const currentBalance = await crdtEngine.getCurrentBalance();
        setBalance(currentBalance);
        
        const pending = await crdtEngine.getPendingCount();
        setPendingOperations(pending.pending);
    };
    
    const sendMoney = async (amount, toUserId, metadata = {}) => {
        setError(null);
        
        try {
            const result = await crdtEngine.createTransaction({
                type: 'debit',
                amount: amount,
                counterpartyId: toUserId,
                pillarId: 'P6_GetPaid',
                referenceId: `transfer_${Date.now()}`,
                description: `Transfer to ${toUserId}`,
                metadata
            });
            
            if (!result.success) {
                throw new Error('Transaction failed');
            }
            
            // Refresh balance
            await loadBalance();
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    
    const receiveMoney = async (amount, fromUserId, metadata = {}) => {
        setError(null);
        
        try {
            const result = await crdtEngine.createTransaction({
                type: 'credit',
                amount: amount,
                counterpartyId: fromUserId,
                pillarId: 'P6_GetPaid',
                referenceId: `receive_${Date.now()}`,
                description: `Received from ${fromUserId}`,
                metadata
            });
            
            await loadBalance();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    
    const retryFailed = async () => {
        if (crdtEngine) {
            await crdtEngine.retryFailedOperations();
            await loadBalance();
        }
    };
    
    return {
        balance,
        pendingOperations,
        isSyncing,
        error,
        sendMoney,
        receiveMoney,
        retryFailed,
        refreshBalance: loadBalance
    };
}
