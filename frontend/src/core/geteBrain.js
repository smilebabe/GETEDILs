export const getSuggestion = (context) => {
  // Normalize context for safety
  const ctx = context?.trim();

  switch (ctx) {
    case 'Get Hired':
    case 'Sira':
      return 'Ready to optimize your CV or search the Addis job market?';

    case 'Real Estate':
    case 'Bet':
      return 'Looking for a verified listing in Bole or a rental nearby?';

    case 'Logistics':
    case 'Izig':
      return 'Need to track a delivery or calculate cross-city transport?';

    case 'Federal Police':
      return 'Enter a name or ID to run a background trust-level check.';

    case 'Consultancy':
      return 'How can I assist with your business architecture today?';

    default:
      return 'Awaiting your command. How can I assist you today?';
  }
};
