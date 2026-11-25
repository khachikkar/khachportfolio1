(function () {
  const databaseName = 'khachik-portfolio-data';
  const storeName = 'portfolio';
  const recordKey = 'latest';
  const localStorageKey = 'khachik-portfolio-data-v1';

  function normalize(data) {
    if (Array.isArray(data)) {
      return {
        hero: window.PORTFOLIO_HERO_FALLBACK || { image: 'assets/hero-portrait.png', alt: '' },
        projects: data
      };
    }
    if (!data || !Array.isArray(data.projects)) throw new Error('Portfolio data is not valid.');
    return {
      hero: data.hero || window.PORTFOLIO_HERO_FALLBACK || { image: 'assets/hero-portrait.png', alt: '' },
      projects: data.projects
    };
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('Browser storage is unavailable.'));
        return;
      }
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
    });
  }

  async function readStored() {
    try {
      const database = await openDatabase();
      const record = await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).get(recordKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      database.close();
      if (record) return normalize(record);
    } catch {}

    try {
      const record = localStorage.getItem(localStorageKey);
      return record ? normalize(JSON.parse(record)) : null;
    } catch {
      return null;
    }
  }

  async function save(data) {
    const portfolio = normalize(data);
    try {
      const database = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).put(portfolio, recordKey);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('Could not save browser data.'));
        transaction.onabort = () => reject(transaction.error || new Error('Browser storage is full.'));
      });
      database.close();
      return 'saved';
    } catch (error) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(portfolio));
        return 'saved';
      } catch {
        throw error;
      }
    }
  }

  async function clear() {
    try {
      const database = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).delete(recordKey);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    } catch {}
    try { localStorage.removeItem(localStorageKey); } catch {}
  }

  async function load() {
    if (window.portfolioSupabase) {
      try {
        const { data, error } = await window.portfolioSupabase
          .from(window.SUPABASE_CONFIG.contentTable)
          .select('content')
          .eq('id', 'main')
          .maybeSingle();
        if (!error && data?.content) return normalize(data.content);
        if (error) console.warn('Could not load portfolio content from Supabase:', error.message);
      } catch (error) {
        console.warn('Could not reach Supabase; using the local portfolio copy.', error);
      }
    }

    const saved = await readStored();
    if (saved) return saved;
    try {
      const response = await fetch('projects.json');
      if (!response.ok) throw new Error('Could not load portfolio JSON.');
      return normalize(await response.json());
    } catch {
      return normalize({
        hero: window.PORTFOLIO_HERO_FALLBACK,
        projects: window.PORTFOLIO_PROJECTS_FALLBACK || []
      });
    }
  }

  window.PortfolioData = { load, save, clear, normalize };
})();
