export interface MessageStats {
  sent: number;
  received: number;
  failed: number;
}

export class MessageTracker {
  private stats: Record<string, MessageStats> = {};

  constructor(channels: string[]) {
    this.initializeChannels(channels);
  }

  private initializeChannels(channels: string[]): void {
    this.stats = channels.reduce((acc, channel) => {
      acc[channel] = { sent: 0, received: 0, failed: 0 };
      return acc;
    }, {} as Record<string, MessageStats>);
  }

  reset(): void {
    Object.keys(this.stats).forEach((channel) => {
      this.stats[channel] = { sent: 0, received: 0, failed: 0 };
    });
  }

  incrementSent(channel: string): void {
    if (this.stats[channel]) {
      this.stats[channel].sent++;
    }
  }

  incrementReceived(channel: string): void {
    if (this.stats[channel]) {
      this.stats[channel].received++;
    }
  }

  incrementFailed(channel: string): void {
    if (this.stats[channel]) {
      this.stats[channel].failed++;
    }
  }

  getChannelStats(channel: string): MessageStats | undefined {
    return this.stats[channel];
  }

  getAllStats(): Record<string, MessageStats> {
    return this.stats;
  }
}
