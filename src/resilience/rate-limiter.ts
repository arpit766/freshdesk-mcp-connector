/**
 * Simple in-process token bucket limiter.
 * Does not coordinate across multiple MCP server processes or hosts.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillPerMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.tokens = maxTokens;
    this.lastRefill = this.now();
  }

  private refill(): void {
    const current = this.now();
    const elapsed = current - this.lastRefill;
    if (elapsed <= 0) return;
    const added = elapsed * this.refillPerMs;
    this.tokens = Math.min(this.maxTokens, this.tokens + added);
    this.lastRefill = current;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const deficit = 1 - this.tokens;
    const waitMs = Math.ceil(deficit / this.refillPerMs);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }
}
