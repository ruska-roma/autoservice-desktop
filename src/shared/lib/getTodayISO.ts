export const getTodayISO = () => {
  return new Date().toISOString().slice(0, 10);
};
