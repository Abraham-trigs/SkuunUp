// redis.test.ts

import { Redis } from "@upstash/redis";

describe("Redis Integration", () => {
  let redis: Redis;
  const testKey = "jest:test-key";

  beforeAll(() => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "Missing Redis environment variables. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set."
      );
    }

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  });

  it("should connect to Redis", async () => {
    const pong = await redis.ping();
    expect(pong).toBe("PONG");
  });

  it("should set and get a value", async () => {
    await redis.set(testKey, "hello world", { ex: 10 });
    const value = await redis.get(testKey);
    expect(value).toBe("hello world");
  });

  it("should delete a value", async () => {
    await redis.del(testKey);
    const value = await redis.get(testKey);
    expect(value).toBeNull();
  });

  // Remove afterAll quit
  // afterAll(async () => {
  //   await redis.quit();
  // });
});
