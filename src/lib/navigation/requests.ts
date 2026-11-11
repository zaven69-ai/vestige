export type RouteTicket = {
  key: string;
  token: number;
  controller: AbortController;
};
/** Shared by the real hook and tests: cancellation alone cannot guard a late transport response. */
export class RouteRequestGate {
  private generation = 0;
  pending: RouteTicket | null = null;
  cancel() {
    this.generation++;
    this.pending?.controller.abort();
    this.pending = null;
  }
  begin(key: string): RouteTicket {
    this.cancel();
    const ticket = {
      key,
      token: ++this.generation,
      controller: new AbortController(),
    };
    this.pending = ticket;
    return ticket;
  }
  owns(ticket: RouteTicket, currentKey: string, active: boolean) {
    return (
      active && ticket.token === this.generation && ticket.key === currentKey
    );
  }
  accepts(ticket: RouteTicket, currentKey: string, active: boolean) {
    return (
      this.owns(ticket, currentKey, active) && !ticket.controller.signal.aborted
    );
  }
  finish(ticket: RouteTicket) {
    if (this.pending?.token === ticket.token) this.pending = null;
  }
}
