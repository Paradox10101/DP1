"use client";
import { useAtom } from 'jotai';
import { performanceMetricsAtom } from '@/atoms/simulationAtoms';

const PerformanceMetrics = () => {
  const [metrics] = useAtom(performanceMetricsAtom);

  if (!metrics) return null;

  return (
    <div className="absolute top-2 right-12 z-[9999] bg-black bg-opacity-50 text-white p-2 rounded shadow-lg">
      <div>FPS: {Math.round(metrics.fps)}</div>
      <div className="text-xs opacity-75">Level: {metrics.performanceLevel}</div>
    </div>
  );
};

export default PerformanceMetrics;
