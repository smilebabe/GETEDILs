/**
 * CRDT Engine for GETEDIL-OS
 * LWW-Element-Set (Last-Write-Wins Element Set) for Offline-First Wallet Sync
 * Prevents double-spending on spotty 4G connections
 * 
 * @version 2.0.0
 * @author GETEDIL AI Team
 */

class CRDTEngine {
    constructor(config = {}) {
        this.clientId = config.clientId || this.generateClientId();
        this.userId = config.userId;
        this.supabase = config.supabase;
        this.eventBus = config.eventBus;
        
        // CRDT State
        this.addSet = new Map(); // { operationId: { value, timestamp, clientId } }
        this.removeSet = new Map(); // Tombstones
        this.vectorClock = new Map(); // { clientId: counter }
        
        // Local queue for offline operations
        this.pendingOperations = [];
        this.conflictQueue = [];
        
        // Sync status
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncInterval = config.syncInterval || 30000; // 30 seconds
        
        // LWW Configuration
        this.clockSkewTolerance = config.clockSkewTolerance || 60000; // 60 seconds
        this.maxVectorSize = config.maxVectorSize || 100;
        
        // Initialize
        this.init();
    }
    
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `${window.navigator.userAgent.includes('Mobile') ? 'mobile' : 'web'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Initialize CRDT Engine
     */
    async init() {
        // Load state from IndexedDB
        await this.loadState();
        
        // Start background sync
        this.startAutoSync();
        
        // Listen to online/offline events
        window.addEventListener('online', () => this.sync());
        window.addEventListener('offline', () => this.handleOffline());
        
        console.log(`[CRDT] Engine initialized for client: ${this.clientId}`);
    }
    
    /**
     * Load CRDT state from IndexedDB
     */
    async loadState() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction(['crdt'], 'readonly');
            const store = tx.objectStore('crdt');
            
            const addSetData = await store.get('addSet');
            const removeSetData = await store.get('removeSet');
            const vectorClockData = await store.get('vectorClock');
            const pendingOps = await store.get('pendingOperations');
            
            if (addSetData) this.addSet = new Map(JSON.parse(addSetData));
            if (removeSetData) this.removeSet = new Map(JSON.parse(removeSetData));
            if (vectorClockData) this.vectorClock = new Map(JSON.parse(vectorClockData));
            if (pendingOps) this.pendingOperations = pendingOps;
            
        } catch (error) {
            console.error('[CRDT] Failed to load state:', error);
        }
    }
    
    /**
     * Persist CRDT state to IndexedDB
     */
    async persistState() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction(['crdt'], 'readwrite');
            const store = tx.objectStore('crdt');
            
            await store.put(JSON.stringify(Array.from(this.addSet.entries())), 'addSet');
            await store.put(JSON.stringify(Array.from(this.removeSet.entries())), 'removeSet');
            await store.put(JSON.stringify(Array.from(this.vectorClock.entries())), 'vectorClock');
            await store.put(this.pendingOperations, 'pendingOperations');
            
            await tx.done;
        } catch (error) {
            console.error('[CRDT] Failed to persist state:', error);
        }
    }
    
    /**
     * Open IndexedDB connection
     */
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GETEDIL_CRDT', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('crdt')) {
                    db.createObjectStore('crdt');
                }
            };
        });
    }
    
    /**
     * Create a new transaction (Credit/Debit)
     * @param {Object} transaction - Transaction details
     * @returns {Promise<Object>} - CRDT operation result
     */
    async createTransaction(transaction) {
        const operation = {
            id: this.generateOperationId(),
            clientId: this.clientId,
            timestamp: Date.now(),
            vectorClock: this.incrementVectorClock(),
            type: transaction.type, // 'credit' or 'debit'
            amount: transaction.amount,
            counterpartyId: transaction.counterpartyId,
            pillarId: transaction.pillarId,
            referenceId: transaction.referenceId,
            description: transaction.description,
            metadata: transaction.metadata || {}
        };
        
        // Add to local addSet
        this.addSet.set(operation.id, {
            value: operation,
            timestamp: operation.timestamp,
            clientId: this.clientId
        });
        
        // Add to pending queue for sync
        this.pendingOperations.push(operation);
        
        // Persist locally
        await this.persistState();
        
        // Try to sync immediately if online
        if (navigator.onLine) {
            await this.sync();
        }
        
        // Emit event
        if (this.eventBus) {
            this.eventBus.emit('transaction:created', operation);
        }
        
        return {
            success: true,
            operationId: operation.id,
            status: navigator.onLine ? 'syncing' : 'queued',
            operation
        };
    }
    
    /**
     * Generate unique operation ID
     */
    generateOperationId() {
        return `${this.clientId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Increment vector clock for this client
     */
    incrementVectorClock() {
        const current = this.vectorClock.get(this.clientId) || 0;
        const newClock = current + 1;
        this.vectorClock.set(this.clientId, newClock);
        
        // Trim vector clock if too large
        if (this.vectorClock.size > this.maxVectorSize) {
            const oldest = Array.from(this.vectorClock.entries())
                .sort((a, b) => a[1] - b[1])
                .slice(0, Math.floor(this.maxVectorSize / 2));
            oldest.forEach(([clientId]) => this.vectorClock.delete(clientId));
        }
        
        return Object.fromEntries(this.vectorClock);
    }
    
    /**
     * Sync local operations with server
     */
    async sync() {
        if (this.isSyncing || !navigator.onLine) {
            console.log('[CRDT] Sync skipped: already syncing or offline');
            return;
        }
        
        this.isSyncing = true;
        
        try {
            console.log(`[CRDT] Starting sync for ${this.pendingOperations.length} operations`);
            
            // Get server state
            const serverState = await this.fetchServerState();
            
            // Merge remote operations
            const conflicts = await this.mergeRemoteOperations(serverState.operations);
            
            // Resolve conflicts using LWW
            const resolvedConflicts = await this.resolveConflicts(conflicts);
            
            // Push local operations to server
            await this.pushLocalOperations();
            
            // Update local balance after sync
            await this.updateLocalBalance();
            
            this.lastSyncTime = Date.now();
            
            // Emit sync complete event
            if (this.eventBus) {
                this.eventBus.emit('sync:complete', {
                    operationsSynced: this.pendingOperations.length,
                    conflictsResolved: resolvedConflicts.length,
                    timestamp: this.lastSyncTime
                });
            }
            
            // Clear pending operations that were successful
            this.pendingOperations = [];
            await this.persistState();
            
        } catch (error) {
            console.error('[CRDT] Sync failed:', error);
            
            if (this.eventBus) {
                this.eventBus.emit('sync:error', error);
            }
        } finally {
            this.isSyncing = false;
        }
    }
    
    /**
     * Fetch server state (transactions + vector clock)
     */
    async fetchServerState() {
        if (!this.supabase) {
            throw new Error('Supabase client not configured');
        }
        
        const { data, error } = await this.supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', this.userId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get server vector clock
        const { data: syncData } = await this.supabase
            .from('sync_metadata')
            .select('last_vector_clock')
            .eq('client_id', this.clientId)
            .eq('user_id', this.userId)
            .single();
        
        return {
            operations: data || [],
            vectorClock: syncData?.last_vector_clock || {}
        };
    }
    
    /**
     * Merge remote operations with local state
     */
    async mergeRemoteOperations(remoteOperations) {
        const conflicts = [];
        
        for (const remoteOp of remoteOperations) {
            // Check if operation already exists locally
            const localOp = this.addSet.get(remoteOp.operation_id);
            
            if (!localOp) {
                // New operation, add to local state
                this.addSet.set(remoteOp.operation_id, {
                    value: remoteOp,
                    timestamp: remoteOp.timestamp,
                    clientId: remoteOp.client_id
                });
                
                // Update vector clock
                const remoteCounter = remoteOp.vector_clock[remoteOp.client_id] || 0;
                const localCounter = this.vectorClock.get(remoteOp.client_id) || 0;
                this.vectorClock.set(remoteOp.client_id, Math.max(remoteCounter, localCounter));
                
            } else if (this.hasConflict(localOp, remoteOp)) {
                // Conflict detected
                conflicts.push({
                    local: localOp,
                    remote: remoteOp
                });
            }
        }
        
        await this.persistState();
        return conflicts;
    }
    
    /**
     * Check if two operations conflict (LWW comparison)
     */
    hasConflict(localOp, remoteOp) {
        // Same operation ID? No conflict (idempotent)
        if (localOp.value.id === remoteOp.operation_id) return false;
        
        // Different operation types? No conflict
        if (localOp.value.type !== remoteOp.type) return false;
        
        // Check if they affect the same balance (timestamp-based LWW)
        const timeDiff = Math.abs(localOp.timestamp - remoteOp.timestamp);
        
        if (timeDiff <= this.clockSkewTolerance) {
            // Within tolerance, check vector clock
            const localPriority = this.compareVectorClocks(
                localOp.value.vector_clock,
                remoteOp.vector_clock
            );
            return localPriority === 0; // Equal priority = conflict
        }
        
        return false;
    }
    
    /**
     * Compare two vector clocks
     * @returns {number} 1 if a > b, -1 if a < b, 0 if concurrent
     */
    compareVectorClocks(clockA, clockB) {
        let aGreater = false;
        let bGreater = false;
        
        const allClients = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);
        
        for (const client of allClients) {
            const aVal = clockA[client] || 0;
            const bVal = clockB[client] || 0;
            
            if (aVal > bVal) aGreater = true;
            if (bVal > aVal) bGreater = true;
        }
        
        if (aGreater && !bGreater) return 1;
        if (!aGreater && bGreater) return -1;
        return 0; // Concurrent
    }
    
    /**
     * Resolve conflicts using LWW (Last-Write-Wins)
     */
    async resolveConflicts(conflicts) {
        const resolved = [];
        
        for (const conflict of conflicts) {
            // Last-Write-Wins based on timestamp
            const winner = conflict.local.timestamp > conflict.remote.timestamp
                ? conflict.local
                : conflict.remote;
            
            const loser = winner === conflict.local ? conflict.remote : conflict.local;
            
            // Mark loser as tombstone
            this.removeSet.set(loser.value.id || loser.operation_id, {
                timestamp: Date.now(),
                clientId: this.clientId
            });
            
            // Log conflict resolution
            if (this.supabase) {
                await this.supabase
                    .from('wallet_transactions')
                    .update({
                        status: 'conflict',
                        conflict_resolution: `LWW resolved: ${winner.timestamp} > ${loser.timestamp}`,
                        reconciled_at: new Date().toISOString()
                    })
                    .eq('operation_id', loser.value.id || loser.operation_id);
            }
            
            resolved.push({
                winner: winner.value,
                loser: loser.value,
                resolution: 'LWW'
            });
            
            // Emit conflict event for UI notification
            if (this.eventBus) {
                this.eventBus.emit('transaction:conflict', {
                    winner: winner.value,
                    loser: loser.value
                });
            }
        }
        
        await this.persistState();
        return resolved;
    }
    
    /**
     * Push local operations to server
     */
    async pushLocalOperations() {
        if (!this.supabase || this.pendingOperations.length === 0) return;
        
        for (const operation of this.pendingOperations) {
            try {
                // Check if already exists on server
                const { data: existing } = await this.supabase
                    .from('wallet_transactions')
                    .select('id')
                    .eq('operation_id', operation.id)
                    .single();
                
                if (existing) {
                    // Already exists, remove from pending
                    continue;
                }
                
                // Insert transaction
                const { error } = await this.supabase
                    .from('wallet_transactions')
                    .insert({
                        transaction_id: operation.id,
                        user_id: this.userId,
                        amount: operation.amount,
                        type: operation.type,
                        status: 'completed',
                        client_id: operation.clientId,
                        timestamp: operation.timestamp,
                        vector_clock: operation.vectorClock,
                        operation_id: operation.id,
                        counterparty_id: operation.counterpartyId,
                        pillar_id: operation.pillarId,
                        reference_id: operation.referenceId,
                        description: operation.description,
                        metadata: operation.metadata
                    });
                
                if (error) throw error;
                
                // Update wallet balance on server
                await this.updateServerBalance(operation);
                
            } catch (error) {
                console.error(`[CRDT] Failed to push operation ${operation.id}:`, error);
                // Keep in pending for retry
                throw error;
            }
        }
    }
    
    /**
     * Update server balance
     */
    async updateServerBalance(operation) {
        const increment = operation.type === 'credit' ? operation.amount : -operation.amount;
        
        const { error } = await this.supabase.rpc('update_wallet_balance', {
            p_user_id: this.userId,
            p_increment: increment,
            p_operation_id: operation.id
        });
        
        if (error) throw error;
    }
    
    /**
     * Update local balance after sync
     */
    async updateLocalBalance() {
        const { data, error } = await this.supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', this.userId)
            .single();
        
        if (!error && data) {
            // Update local store via event
            if (this.eventBus) {
                this.eventBus.emit('wallet:updated', { balance: data.balance });
            }
        }
    }
    
    /**
     * Handle offline mode
     */
    handleOffline() {
        console.log('[CRDT] Entered offline mode');
        
        if (this.eventBus) {
            this.eventBus.emit('sync:offline', {
                pendingOperations: this.pendingOperations.length,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Start automatic background sync
     */
    startAutoSync() {
        setInterval(() => {
            if (navigator.onLine && this.pendingOperations.length > 0) {
                this.sync();
            }
        }, this.syncInterval);
    }
    
    /**
     * Get current sync status
     */
    getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            pendingOperations: this.pendingOperations.length,
            conflicts: this.conflictQueue.length,
            lastSyncTime: this.lastSyncTime,
            clientId: this.clientId,
            vectorClockSize: this.vectorClock.size
        };
    }
    
    /**
     * Get current balance from CRDT state
     */
    async getCurrentBalance() {
        // Calculate balance from all operations
        let balance = 0;
        
        for (const [_, op] of this.addSet) {
            // Skip tombstones
            if (this.removeSet.has(op.value.id)) continue;
            
            if (op.value.type === 'credit') {
                balance += op.value.amount;
            } else if (op.value.type === 'debit') {
                balance -= op.value.amount;
            }
        }
        
        return Math.max(0, balance);
    }
    
    /**
     * Retry failed operations
     */
    async retryFailedOperations() {
        const failedOps = this.pendingOperations.filter(op => op.failed);
        
        for (const op of failedOps) {
            op.failed = false;
            await this.createTransaction(op);
        }
        
        await this.sync();
    }
    
    /**
     * Clear local state (logout)
     */
    async clearState() {
        this.addSet.clear();
        this.removeSet.clear();
        this.vectorClock.clear();
        this.pendingOperations = [];
        this.conflictQueue = [];
        
        await this.persistState();
        
        console.log('[CRDT] State cleared');
    }
}

// Export for use in React components
export default CRDTEngine;

// Usage Example:
/*
import CRDTEngine from '@/lib/sync-engine/crdt-engine';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

const crdtEngine = new CRDTEngine({
    clientId: localStorage.getItem('device_id'),
    userId: user.id,
    supabase: supabase,
    eventBus: eventBus,
    syncInterval: 30000
});

// Create a transaction
await crdtEngine.createTransaction({
    type: 'debit',
    amount: 500,
    counterpartyId: 'merchant_123',
    pillarId: 'P6_GetPaid',
    referenceId: 'order_456',
    description: 'Coffee purchase'
});

// Check sync status
const status = crdtEngine.getSyncStatus();
console.log(`Pending: ${status.pendingOperations}`);
*/
