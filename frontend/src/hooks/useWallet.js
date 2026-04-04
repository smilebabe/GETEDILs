/**
 * GETEDIL-OS Wallet Hook
 * Optimized for CRDT Sync & Vercel Build Compatibility
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, eventBus } from '../lib';
import { useAuth } from './useAuth';

// Use a relative path for the CRDT engine to avoid alias resolution errors
import CRDTEngineClass from '../lib/sync-engine/crdt-engine';

let crdtEngine = null;

export function useWallet() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [pendingOperations, setPendingOperations] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    
    // Wrapped in useCallback to prevent unnecessary re-renders in other hooks
    const loadBalance = useCallback(async () => {
        if (!crdtEngine) return;
        try {
            const currentBalance = await crdtEngine.getCurrentBalance();
            setBalance(currentBalance);
            
            const pending = await crdtEngine.getPendingCount();
            setPendingOperations(pending.pending);
        } catch (err) {
            console.error("Balance Load Error:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        
        // Initialize CRDT engine once using a stable singleton pattern
        if (!crdtEngine) {
            crdtEngine = new CRDTEngineClass({
                clientId: localStorage.getItem('device_id') || 'browser_client',
                userId: user.id,
                supabase: supabase,
                eventBus: eventBus,
                syncInterval: 30000
            });
        }
        
        loadBalance();
        
        // Subscribe to events via EventBus
        const unsubscribeBalance = eventBus.on('wallet:updated', ({ balance }) => {
            setBalance(balance);
        });
        
        const unsubscribeSync = eventBus.on('sync:complete', () => {
            setIsSyncing(false);
            setPendingOperations(0);
        });
        
        const unsubscribeHealth = eventBus.on('sync:health', (status) => {
            setIsSyncing(status.isSyncing);
            setPendingOperations(status.pendingCount);
        });
        
        return () => {
            if (unsubscribeBalance) unsubscribeBalance();
            if (unsubscribeSync) unsubscribeSync();
            if (unsubscribeHealth) unsubscribeHealth();
        };
    }, [user, loadBalance]);
    
    const sendMoney = async (amount, toUserId, metadata = {}) => {
        setError(null);
        if (!crdtEngine) return { success: false, message: 'Engine not ready' };
        
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
            
            if (!result.success) throw new Error('Transaction failed');
            
            await loadBalance();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    
    const receiveMoney = async (amount, fromUserId, metadata = {}) => {
        setError(null);
        if (!crdtEngine) return { success: false, message: 'Engine not ready' };

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
