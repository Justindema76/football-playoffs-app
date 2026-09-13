(() => {
  'use strict';

  // Marks the single canonical Yahoo sync client. Supabase rejects writes from
  // legacy/duplicate extensions that do not send this header.
  const WRITER_HEADER = 'x-fantasy-writer';
  const WRITER_VALUE = 'football-playoffs-app-v1';
  const SUPABASE_ORIGIN = 'https://bbodmhffnqebhfksjier.supabase.co';
  const nativeFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.startsWith(SUPABASE_ORIGIN)) return nativeFetch(input, init);

    const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});
    headers.set(WRITER_HEADER, WRITER_VALUE);
    return nativeFetch(input, { ...init, headers });
  };
})();
