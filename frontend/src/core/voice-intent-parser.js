export const parseIntent = (text) => {
  const t = text.toLowerCase();

  if (t.includes('job') || t.includes('sira')) {
    return { pillar: 'Get Hired' };
  }

  if (t.includes('house') || t.includes('real estate')) {
    return { pillar: 'Real Estate' };
  }

  if (t.includes('logistics') || t.includes('transport')) {
    return { pillar: 'Logistics' };
  }

  return null;
};
