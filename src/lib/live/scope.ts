/** Preview events are accepted only by the ephemeral live scope, never by the saved scope. */
export function canUseLiveScope(preview: boolean, simulationEnabled: boolean) {
  return preview === simulationEnabled;
}
export function canPersistLiveScope(
  preview: boolean,
  simulationEnabled: boolean,
) {
  return !preview && !simulationEnabled;
}
