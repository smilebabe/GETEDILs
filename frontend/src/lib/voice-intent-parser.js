/**
 * GETEDIL-OS Voice & Text Intent Parser
 * Maps Amharic and English inputs to Pillar IDs.
 */

const INTENT_MAP = {
  P4_GetHired: {
    keywords: ['job', 'work', 'hire', 'vacancy', 'career', 'employment', 'sera', 'shira', 'ስራ', 'መስራት'],
    weight: 1.0
  },
  P6_GetPaid: {
    keywords: ['pay', 'wallet', 'money', 'birr', 'transfer', 'chapa', 'telebirr', 'deposit', 'kifia', 'ክፍያ', 'ገንዘብ'],
    weight: 1.0
  },
  P2_GetHome: {
    keywords: ['house', 'rent', 'buy', 'apartment', 'home', 'real estate', 'bet', 'ቤት', 'ኪራይ'],
    weight: 1.0
  },
  P5_GetSkills: {
    keywords: ['learn', 'course', 'skill', 'study', 'education', 'training', 'timhirt', 'ትምህርት', 'ስልጠና'],
    weight: 1.0
  },
  P19_GetProfiled: {
    keywords: ['me', 'profile', 'id', 'identity', 'kyc', 'account', 'maninet', 'ማንነት'],
    weight: 1.0
  }
};

export const parseIntent = (input) => {
  if (!input) return 'P0_Onboarding';
  
  const normalized = input.toLowerCase().trim();
  let bestMatch = { id: 'HomePage', score: 0 };

  for (const [pillarId, config] of Object.entries(INTENT_MAP)) {
    let currentScore = 0;
    
    config.keywords.forEach(keyword => {
      // Direct match
      if (normalized.includes(keyword)) {
        currentScore += 1;
      }
      
      // Simple Phonetic/Fuzzy check for Amharic-to-English scripts
      // Example: 'shira' matching 'sera'
      if (pillarId === 'P4_GetHired' && (normalized.includes('shira') || normalized.includes('sera'))) {
        currentScore += 0.8;
      }
    });

    if (currentScore > bestMatch.score) {
      bestMatch = { id: pillarId, score: currentScore };
    }
  }

  // Threshold to ensure we don't route on noise
  return bestMatch.score > 0.5 ? bestMatch.id : 'HomePage';
};

/**
 * Example Usage:
 * parseIntent("I need to find a new job") -> "P4_GetHired"
 * parseIntent("Sera mifelleg") -> "P4_GetHired"
 * parseIntent("Telebirr deposit") -> "P6_GetPaid"
 */
