const cache = {};

export const prefetchPillar = (key, importer) => {
  if (!cache[key]) {
    cache[key] = importer();
  }
};
