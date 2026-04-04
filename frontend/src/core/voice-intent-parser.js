export const parseIntent = (text) => {
  const t = text.toLowerCase();

  if (t.includes('job') || t.includes('sira')) {
    return { path: '/get-hired' };
  }

  if (t.includes('real estate')) {
    return { path: '/real-estate' };
  }

  if (t.includes('logistics')) {
    return { path: '/logistics' };
  }

  return null;
};
