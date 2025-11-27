export const formatNumber = (value) =>
  Intl.NumberFormat('en-US').format(Number(value) || 0);
