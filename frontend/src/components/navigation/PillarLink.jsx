import { prefetchPillar } from '@/core/prefetch';
import { useAgenticRouter } from '@/core/AgenticRouter';

export default function PillarLink({ pillar }) {
  const { routeTo } = useAgenticRouter();

  const handlePrefetch = () => {
    if (pillar.importer) {
      prefetchPillar(pillar.id, pillar.importer);
    }
  };

  return (
    <div
      onMouseEnter={handlePrefetch}
      onClick={() => routeTo(pillar.path)}
      className="cursor-pointer p-6 rounded-xl hover:bg-white/10 transition"
    >
      <div className="text-sm opacity-50">{pillar.id}</div>
      <div className="text-lg">{pillar.name}</div>
    </div>
  );
}
