(() => {
  "use strict";

  const index = window.CONTENT_INDEX || [];
  window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};
  const pending = new Map();

  function meta(id) {
    return index.find(item => item.id === id) || null;
  }

  function list(filters = {}) {
    return index.filter(item =>
      Object.entries(filters).every(([key, value]) => item[key] === value)
    );
  }

  function validate(content, expectedId) {
    if (!content || typeof content !== "object") throw new Error("Content file did not register an object.");
    if (content.id !== expectedId) throw new Error(`Content id mismatch: expected ${expectedId}.`);
    if (!content.language || !content.renderer) throw new Error(`Content ${expectedId} is missing language/renderer metadata.`);
    return content;
  }

  function load(id) {
    if (window.CONTENT_REGISTRY[id]) return Promise.resolve(validate(window.CONTENT_REGISTRY[id], id));
    if (pending.has(id)) return pending.get(id);

    const item = meta(id);
    if (!item) return Promise.reject(new Error(`Unknown content id: ${id}`));
    if (!item.source) return Promise.reject(new Error(`Content ${id} has no source file yet.`));

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = item.source;
      script.async = true;
      script.dataset.contentId = id;
      script.onload = () => {
        try { resolve(validate(window.CONTENT_REGISTRY[id], id)); }
        catch (error) { reject(error); }
        finally { pending.delete(id); }
      };
      script.onerror = () => {
        pending.delete(id);
        reject(new Error(`Could not load content file: ${item.source}`));
      };
      document.head.appendChild(script);
    });

    pending.set(id, promise);
    return promise;
  }

  window.ContentStore = {
    version: window.CONTENT_INDEX_VERSION || 1,
    index,
    meta,
    list,
    load,
    get(id) { return window.CONTENT_REGISTRY[id] || null; }
  };
})();
