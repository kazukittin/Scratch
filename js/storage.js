// =====================================================
// 永続ストレージ (IndexedDB)
// ブラウザ履歴・Cookie削除後もデータを保持
// =====================================================

const StorageDB = (function() {
    const DB_NAME = 'MyStartPageDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'appData';
    
    let db = null;
    let dbReady = null;
    
    // データベース初期化
    function initDB() {
        if (dbReady) return dbReady;
        
        dbReady = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('IndexedDB initialized successfully');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                // オブジェクトストア作成
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    console.log('Object store created');
                }
            };
        });
        
        return dbReady;
    }
    
    // データ取得
    async function get(key, defaultValue = null) {
        try {
            await initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result.value);
                    } else {
                        // IndexedDBにデータがない場合、localStorageからマイグレーション
                        const localData = localStorage.getItem(key);
                        if (localData) {
                            try {
                                const parsed = JSON.parse(localData);
                                // IndexedDBに保存してlocalStorageから削除
                                set(key, parsed).then(() => {
                                    console.log(`Migrated "${key}" from localStorage to IndexedDB`);
                                });
                                resolve(parsed);
                            } catch {
                                resolve(defaultValue);
                            }
                        } else {
                            resolve(defaultValue);
                        }
                    }
                };
                
                request.onerror = () => {
                    console.error('Error getting data:', request.error);
                    // フォールバック: localStorageから取得
                    const localData = localStorage.getItem(key);
                    if (localData) {
                        try {
                            resolve(JSON.parse(localData));
                        } catch {
                            resolve(defaultValue);
                        }
                    } else {
                        resolve(defaultValue);
                    }
                };
            });
        } catch (error) {
            console.error('IndexedDB not available, using localStorage:', error);
            const localData = localStorage.getItem(key);
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch {
                    return defaultValue;
                }
            }
            return defaultValue;
        }
    }
    
    // データ保存
    async function set(key, value) {
        try {
            await initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({ key, value });
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error('Error saving data:', request.error);
                    // フォールバック: localStorageに保存
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    }
                };
            });
        } catch (error) {
            console.error('IndexedDB not available, using localStorage:', error);
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                throw e;
            }
        }
    }
    
    // データ削除
    async function remove(key) {
        try {
            await initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);
                
                request.onsuccess = () => {
                    // localStorageからも削除
                    localStorage.removeItem(key);
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error('Error removing data:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('IndexedDB error:', error);
            localStorage.removeItem(key);
            return true;
        }
    }
    
    // 全データ取得（エクスポート用）
    async function getAll() {
        try {
            await initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const result = {};
                    request.result.forEach(item => {
                        result[item.key] = item.value;
                    });
                    resolve(result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting all data:', error);
            return {};
        }
    }
    
    // データベース初期化を開始
    initDB().catch(console.error);
    
    return {
        get,
        set,
        remove,
        getAll,
        initDB
    };
})();

// グローバルにアクセス可能にする
window.StorageDB = StorageDB;
