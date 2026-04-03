// frontend/src/lib/sync-engine/crdt-engine.js (Enhanced Version)

class CRDTEngine {
    constructor(config = {}) {
        this.clientId = config.clientId || this.generateClientId();
        this.userId = config.userId;
        this.supabase = config.supabase;
        this.eventBus = config.eventBus;
        
        // CRDT State with persistence
        this.addSet = new Map();
        this.removeSet = new Map();
        this.vectorClock = new Map();
        this.pendingOperations = [];
        this.failedOperations = [];
        
        // Sync state
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncInterval = config.syncInterval || 30000;
        this.maxRetries = config.maxRetries || 5;
        this.retryDelay = config.retryDelay || 5000;
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 100; // 100ms between requests
        
        // Initialize
        this.init();
    }
    
    generateClientId() {
        let id = localStorage.getItem('crdt_client_id');
        if (!id) {
            id = `${window.navigator.userAgent.includes('Mobile') ? 'm' : 'w'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('crdt_client_id', id);
        }
        return id;
    }
    
    async init() {
        await this.loadState();
        this.startAutoSync();
        
        // Listen to online/offline events with debounce
        window.addEventListener('online', () => {
            console.log('[CRDT] Online detected, syncing...');
            setTimeout(() => this.sync(), 100);
        });
        
        window.addEventListener('offline', () => {
            console.log('[CRDT] Offline mode activated');
            this.handleOffline();
        });
        
        // Periodic health check
        setInterval(() => this.healthCheck(), 60000);
        
        console.log(`[CRDT] Engine v2.0 initialized: ${this.clientId}`);
    }
    
    async loadState() {
        try {
            const db = await this.openIndexedDB();
            
            // Load all state in parallel
            const [addSet, removeSet, vectorClock, pending, failed] = await Promise.all([
                this.getFromDB(db, 'addSet'),
                this.getFromDB(db, 'removeSet'),
                this.getFromDB(db, 'vectorClock'),
                this.getFromDB(db, 'pendingOperations'),
                this.getFromDB(db, 'failedOperations')
            ]);
            
            if (addSet) this.addSet = new Map(JSON.parse(addSet));
            if (removeSet) this.removeSet = new Map(JSON.parse(removeSet));
            if (vectorClock) this.vectorClock = new Map(JSON.parse(vectorClock));
            if (pending) this.pendingOperations = pending;
            if (failed) this.failedOperations = failed;
            
            // Clean up old tombstones (> 7 days)
            this.cleanupTombstones();
            
        } catch (error) {
            console.error('[CRDT] Failed to load state:', error);
            // Initialize with empty state
            this.addSet = new Map();
            this.removeSet = new Map();
            this.vectorClock = new Map();
            this.pendingOperations = [];
            this.failedOperations = [];
        }
    }
    
    async getFromDB(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['crdt'], 'readonly');
            const store = tx.objectStore('crdt');
            const request = store.get(storeName);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async persistState() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction(['crdt'], 'readwrite');
            const store = tx.objectStore('crdt');
            
            await Promise.all([
                store.put(JSON.stringify(Array.from(this.addSet.entries())), 'addSet'),
                store.put(JSON.stringify(Array.from(this.removeSet.entries())), 'removeSet'),
                store.put(JSON.stringify(Array.from(this.vectorClock.entries())), 'vectorClock'),
                store.put(this.pendingOperations, 'pendingOperations'),
                store.put(this.failedOperations, 'failedOperations')
            ]);
            
            await tx.done;
        } catch (error) {
            console.error('[CRDT] Failed to persist state:', error);
        }
    }
    
    cleanupTombstones() {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const [key, value] of this.removeSet.entries()) {
            if (value.timestamp < sevenDaysAgo) {
                this.removeSet.delete(key);
                this.addSet.delete(key);
            }
        }
    }
    
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GETEDIL_CRDT_v2', 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('crdt')) {
                    const store = db.createObjectStore('crdt');
                    // Create indexes for better performance
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    async createTransaction(transaction) {
        // Rate limiting check
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval));
        }
        this.lastRequestTime = Date.now();
        
        const operation = {
            id: this.generateOperationId(),
            clientId: this.clientId,
            timestamp: Date.now(),
            vectorClock: this.incrementVectorClock(),
            type: transaction.type,
            amount: Math.abs(transaction.amount),
            counterpartyId: transaction.counterpartyId,
            pillarId: transaction.pillarId,
            referenceId: transaction.referenceId,
            description: transaction.description,
            metadata: transaction.metadata || {},
            retryCount: 0,
            createdAt: Date.now()
        };
        
        // Validate balance locally first (optimistic)
        if (operation.type === 'debit') {
            const currentBalance = await this.getCurrentBalance();
            if (currentBalance < operation.amount) {
                throw new Error(`Insufficient balance: ${currentBalance} < ${operation.amount}`);
            }
        }
        
        // Add to local state
        this.addSet.set(operation.id, {
            value: operation,
            timestamp: operation.timestamp,
            clientId: this.clientId
        });
        
        this.pendingOperations.push(operation);
        await this.persistState();
        
        // Try immediate sync if online
        let syncResult = { success: false, queued: true };
        if (navigator.onLine) {
            syncResult = await this.syncNow([operation]);
        }
        
        // Emit events
        if (this.eventBus) {
            this.eventBus.emit('transaction:created', {
                ...operation,
                synced: syncResult.success,
                queued: !syncResult.success
            });
        }
        
        return {
            success: true,
            operationId: operation.id,
            status: syncResult.success ? 'completed' : 'queued',
            operation,
            syncError: syncResult.error
        };
    }
    
    async syncNow(operations = null) {
        if (this.isSyncing) {
            return { success: false, error: 'Already syncing' };
        }
        
        this.isSyncing = true;
        
        try {
            const opsToSync = operations || this.pendingOperations;
            if (opsToSync.length === 0) {
                return { success: true, synced: 0 };
            }
            
            // Prepare batch for server
            const batchOperations = opsToSync.map(op => ({
                operation_id: op.id,
                user_id: this.userId,
                increment: op.type === 'credit' ? op.amount : -op.amount,
                expected_version: null // Let server handle version check
            }));
            
            // Call Supabase RPC with batch
            const { data, error } = await this.supabase.rpc('batch_update_wallet_balance', {
                p_operations: batchOperations
            });
            
            if (error) throw error;
            
            // Process results
            const successful = [];
            const failed = [];
            
            for (const result of data) {
                if (result.success) {
                    successful.push(result.operation_id);
                    // Update local balance
                    await this.updateLocalBalance(result.new_balance);
                } else {
                    failed.push({
                        operation_id: result.operation_id,
                        error: result.error_message
                    });
                }
            }
            
            // Remove successful operations from pending
            this.pendingOperations = this.pendingOperations.filter(
                op => !successful.includes(op.id)
            );
            
            // Add failed to failed queue with retry tracking
            for (const fail of failed) {
                const op = this.pendingOperations.find(o => o.id === fail.operation_id);
                if (op) {
                    op.retryCount = (op.retryCount || 0) + 1;
                    op.lastError = fail.error;
                    op.lastRetryAt = Date.now();
                    
                    if (op.retryCount >= this.maxRetries) {
                        this.failedOperations.push(op);
                    } else {
                        // Keep in pending for retry
                        this.pendingOperations.push(op);
                    }
                }
            }
            
            // Remove from pending if moved to failed
            this.pendingOperations = this.pendingOperations.filter(
                op => !failed.some(f => f.operation_id === op.id) || op.retryCount < this.maxRetries
            );
            
            await this.persistState();
            
            // Schedule retries for failed operations
            if (this.pendingOperations.length > 0) {
                setTimeout(() => this.sync(), this.retryDelay);
            }
            
            return {
                success: true,
                synced: successful.length,
                failed: failed.length,
                errors: failed
            };
            
        } catch (error) {
            console.error('[CRDT] Sync failed:', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
            this.lastSyncTime = Date.now();
        }
    }
    
    async sync() {
        if (this.pendingOperations.length === 0) return;
        await this.syncNow();
    }
    
    generateOperationId() {
        return `${this.clientId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    }
    
    incrementVectorClock() {
        const current = this.vectorClock.get(this.clientId) || 0;
        const newClock = current + 1;
        this.vectorClock.set(this.clientId, newClock);
        
        // Prune vector clock if too large
        if (this.vectorClock.size > 100) {
            const sorted = Array.from(this.vectorClock.entries())
                .sort((a, b) => a[1] - b[1]);
            const toKeep = sorted.slice(-50);
            this.vectorClock.clear();
            toKeep.forEach(([k, v]) => this.vectorClock.set(k, v));
        }
        
        return Object.fromEntries(this.vectorClock);
    }
    
    async updateLocalBalance(newBalance) {
        if (this.eventBus) {
            this.eventBus.emit('wallet:updated', { 
                balance: newBalance,
                timestamp: Date.now(),
                source: 'sync'
            });
        }
        
        // Also update any local store (Zustand, Redux, etc)
        if (window.__GETEDIL_STORE__) {
            window.__GETEDIL_STORE__.setState({ walletBalance: newBalance });
        }
    }
    
    async getCurrentBalance() {
        let balance = 0;
        
        for (const [_, op] of this.addSet) {
            if (this.removeSet.has(op.value.id)) continue;
            
            if (op.value.type === 'credit') {
                balance += op.value.amount;
            } else if (op.value.type === 'debit') {
                balance -= op.value.amount;
            }
        }
        
        // Also check server balance if online and recently synced
        if (navigator.onLine && (Date.now() - (this.lastSyncTime || 0)) < 60000) {
            try {
                const { data } = await this.supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', this.userId)
                    .single();
                
                if (data) {
                    balance = Math.max(balance, data.balance);
                }
            } catch (error) {
                console.warn('[CRDT] Failed to fetch server balance:', error);
            }
        }
        
        return Math.max(0, balance);
    }
    
    async retryFailedOperations() {
        if (this.failedOperations.length === 0) return;
        
        // Reset retry count and move back to pending
        for (const op of this.failedOperations) {
            op.retryCount = 0;
            op.lastError = null;
            this.pendingOperations.push(op);
        }
        
        this.failedOperations = [];
        await this.persistState();
        await this.sync();
    }
    
    async getPendingCount() {
        return {
            pending: this.pendingOperations.length,
            failed: this.failedOperations.length,
            total: this.pendingOperations.length + this.failedOperations.length
        };
    }
    
    handleOffline() {
        if (this.eventBus) {
            this.eventBus.emit('sync:offline', {
                pendingOperations: this.pendingOperations.length,
                timestamp: Date.now()
            });
        }
    }
    
    startAutoSync() {
        setInterval(() => {
            if (navigator.onLine && this.pendingOperations.length > 0 && !this.isSyncing) {
                this.sync();
            }
        }, this.syncInterval);
    }
    
    async healthCheck() {
        const status = {
            clientId: this.clientId,
            isSyncing: this.isSyncing,
            pendingCount: this.pendingOperations.length,
            failedCount: this.failedOperations.length,
            lastSyncTime: this.lastSyncTime,
            vectorClockSize: this.vectorClock.size,
            addSetSize: this.addSet.size,
            removeSetSize: this.removeSet.size,
            isOnline: navigator.onLine
        };
        
        console.log('[CRDT] Health check:', status);
        
        if (this.eventBus) {
            this.eventBus.emit('sync:health', status);
        }
        
        return status;
    }
    
    async clearState() {
        this.addSet.clear();
        this.removeSet.clear();
        this.vectorClock.clear();
        this.pendingOperations = [];
        this.failedOperations = [];
        
        await this.persistState();
        console.log('[CRDT] State cleared');
    }
}

export default CRDTEngine;
