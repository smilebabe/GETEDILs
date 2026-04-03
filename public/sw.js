// public/sw.js
const CACHE_NAME = 'getedil-v1';
const CRDT_SYNC_TAG = 'crdt-sync';

self.addEventListener('sync', (event) => {
    if (event.tag === CRDT_SYNC_TAG) {
        event.waitUntil(syncCRDT());
    }
});

async function syncCRDT() {
    // Open IndexedDB and get pending operations
    const db = await openDB();
    const pendingOps = await getPendingOps(db);
    
    if (pendingOps.length === 0) return;
    
    // Send to server
    const response = await fetch('/api/sync/crdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: pendingOps })
    });
    
    if (response.ok) {
        const result = await response.json();
        await clearSyncedOps(db, result.successfulIds);
    }
}

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('GETEDIL_CRDT_v2', 2);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
