export function partitionGuidedPois<T extends { id: string }>(
  points: T[],
  routeIds: ReadonlySet<string>,
  matches: (point: T) => boolean,
) {
  const ordinary: T[] = [],
    route: T[] = [],
    visible: T[] = [];
  for (const point of points) {
    if (routeIds.has(point.id)) {
      route.push(point);
      visible.push(point);
    } else if (matches(point)) {
      ordinary.push(point);
      visible.push(point);
    }
  }
  return { ordinary, route, visible };
}
export function canPresentArrival(input: {
  stageKey: string;
  seen: ReadonlySet<string>;
  active: boolean;
  focused: boolean;
  arrived: boolean;
  blocked: boolean;
}) {
  return (
    input.active &&
    input.focused &&
    input.arrived &&
    !input.blocked &&
    !!input.stageKey &&
    !input.seen.has(input.stageKey)
  );
}
