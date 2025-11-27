export const createFetcher = () => async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
};
