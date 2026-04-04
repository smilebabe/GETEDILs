import { useState } from 'react';

export const usePillarNavigation = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);

  const openPillar = (name) => {
    if (name === 'Real Estate' || name === 'Logistics') {
      setActiveOverlay(name);
    }
  };

  const closeOverlay = () => setActiveOverlay(null);

  return {
    activeOverlay,
    openPillar,
    closeOverlay
  };
};
