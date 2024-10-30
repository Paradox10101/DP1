// src/atoms/simulationAtoms.js
import { atom } from 'jotai';

export const simulationStatusAtom = atom('stopped'); // 'stopped', 'running', 'paused'
export const showControlsAtom = atom(true);
export const simulationErrorAtom = atom(null);
export const serverAvailableAtom = atom(true);
export const performanceMetricsAtom = atom({
  fps: 0,
  frameTime: 0,
  vehicleCount: 0,
  performanceLevel: 'MEDIUM'
});
