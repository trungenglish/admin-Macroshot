const isBrowser = () => typeof window !== 'undefined';

export const storage = {
  get: (key) => {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(key);
  },
  set: (key, value) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, value);
  },
  remove: (key) => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
  },
};
