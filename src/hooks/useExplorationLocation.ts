import { useGame } from "../lib/store";
import { useSimulation } from "../lib/developer/DeveloperLocation";
import type { NavigationPosition } from "../lib/navigation/position";
/** One tagged position drives Catia, map distances and routing; the game store keeps device GPS only. */
export function useExplorationLocation() {
  const game = useGame(),
    simulation = useSimulation();
  const position: NavigationPosition = simulation.enabled
    ? {
        source: "developer-preview",
        fix: simulation.fix,
        previewKey: `${simulation.epoch}:${simulation.teleport}`,
      }
    : { source: "device", fix: game.fix };
  return {
    ...simulation,
    position,
    fix: position.fix,
    gps: simulation.enabled ? "MODE TEST — GPS SIMULÉ" : game.gps,
  };
}
