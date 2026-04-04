export const getSuggestion = (context) => {
  switch (context) {
    case 'Get Hired':
      return 'Want me to find jobs or optimize your CV?';

    case 'Real Estate':
      return 'Looking to buy, rent, or list a property?';

    case 'Logistics':
      return 'Track delivery or request transport?';

    default:
      return 'How can I assist you today?';
  }
};
