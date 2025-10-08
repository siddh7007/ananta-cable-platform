// Simple telemetry store for tracking user actions
class TelemetryStore {
  private events: Array<{ event: string; data: Record<string, unknown>; timestamp: number }> = [];

  track(event: string, data: Record<string, unknown> = {}) {
    const telemetryEvent = {
      event,
      data,
      timestamp: Date.now()
    };

    this.events.push(telemetryEvent);

    // In a real app, you might send this to an analytics service
    console.log('Telemetry:', telemetryEvent);

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

export const telemetry = new TelemetryStore();