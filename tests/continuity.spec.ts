import { describe, it, expect } from "vitest";
import { reactive } from "@src/ts";
import { PersistModule, TemporalModule, AsyncStorageAdapter, type StorageAdapterConfig } from "@src/ts/modules";

class AsyncMemoryAdapter extends AsyncStorageAdapter<StorageAdapterConfig> {
  public static store = new Map<string, any>();

  protected delay<T>(value: T, ms = 5): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
  }

  public async get(key: string): Promise<any> {
    return this.delay(AsyncMemoryAdapter.store.get(key));
  }

  public async set(key: string, value: any): Promise<boolean> {
    AsyncMemoryAdapter.store.set(key, value);
    return this.delay(true);
  }

  public async remove(key: string): Promise<boolean> {
    AsyncMemoryAdapter.store.delete(key);
    return this.delay(true);
  }

  public async clear(): Promise<boolean> {
    AsyncMemoryAdapter.store.clear();
    return this.delay(true);
  }
}

class FlakyAsyncMemoryAdapter extends AsyncMemoryAdapter {
  public static failGetOnce = true;

  public override async get(key: string): Promise<any> {
    if (FlakyAsyncMemoryAdapter.failGetOnce) {
      FlakyAsyncMemoryAdapter.failGetOnce = false;
      throw new Error("simulated read failure");
    }
    return super.get(key);
  }
}

const wait = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Continuity proof: async persistence + temporal", () => {
  it("restores frame parity and replay output after a reload-like re-bootstrap", async () => {
    AsyncMemoryAdapter.store.clear();

    // Session A
    const temporalA = new TemporalModule().untrack();
    const persistA = new PersistModule({ key: "CONTINUITY", throttle: 0, adapter: AsyncMemoryAdapter, snapshot: true }).attach(temporalA.state, "temporal.state");
    const stateA = reactive({ count: 0 });

    stateA.use(persistA, "app").use(temporalA);
    persistA.state.once("hydrated", temporalA.track);

    await wait();

    stateA.count = 1;
    stateA.tick();
    stateA.count = 2;
    stateA.tick();
    stateA.count = 3;
    stateA.tick();

    await wait();

    const expectedHistoryLen = temporalA.state.history.length;
    const expectedFrame = temporalA.state.currentFrame;
    const expectedCount = stateA.count;

    // Session B (reload simulation)
    const temporalB = new TemporalModule().untrack();
    const persistB = new PersistModule({ key: "CONTINUITY", throttle: 0, adapter: AsyncMemoryAdapter, snapshot: true }).attach(temporalB.state, "temporal.state");
    const stateB = reactive({ count: 0 });

    stateB.use(persistB, "app").use(temporalB);
    persistB.state.once("hydrated", temporalB.track);

    await wait();

    expect(persistB.state.hydrated).toBe(true);
    expect(temporalB.state.history.length).toBe(expectedHistoryLen);
    expect(temporalB.state.currentFrame).toBe(expectedFrame);
    expect(stateB.count).toBe(expectedCount);

    temporalB.jumpTo(-1);
    expect(stateB.count).toBe(0);

    await temporalB.play();
    expect(stateB.count).toBe(expectedCount);
  });

  it("settles hydrated after one failed async read and recovers by persisting new writes", async () => {
    AsyncMemoryAdapter.store.clear();
    FlakyAsyncMemoryAdapter.failGetOnce = true;

    const temporal = new TemporalModule().untrack();
    const persist = new PersistModule({ key: "RECOVER", throttle: 0, adapter: FlakyAsyncMemoryAdapter, snapshot: true }).attach(temporal.state, "temporal.state");
    const state = reactive({ count: 0 });

    state.use(persist, "app").use(temporal);
    persist.state.once("hydrated", temporal.track);

    await wait();

    expect(persist.state.hydrated).toBe(true);
    expect(state.count).toBe(0);

    state.count = 7;
    state.tick();
    await wait();

    const saved = AsyncMemoryAdapter.store.get("RECOVER");
    expect(saved?.app?.count).toBe(7);
  });

  it("restores multi-reactor branches (app, ui, temporal.state) after reload", async () => {
    AsyncMemoryAdapter.store.clear();

    // Session A
    const temporalA = new TemporalModule().untrack();
    const uiA = reactive({ theme: "dark" });
    const persistA = new PersistModule({ key: "MULTI", throttle: 0, adapter: AsyncMemoryAdapter, snapshot: true }).attach(temporalA.state, "temporal.state").attach(uiA, "ui");
    const appA = reactive({ count: 0 });

    appA.use(persistA, "app").use(temporalA);
    persistA.state.once("hydrated", temporalA.track);

    await wait();

    appA.count = 2;
    appA.tick();
    uiA.theme = "light";
    uiA.tick();
    appA.count = 5;
    appA.tick();

    await wait();

    const expected = {
      appCount: appA.count,
      uiTheme: uiA.theme,
      historyLen: temporalA.state.history.length,
      frame: temporalA.state.currentFrame,
    };

    // Session B
    const temporalB = new TemporalModule().untrack();
    const uiB = reactive({ theme: "dark" });
    const persistB = new PersistModule({ key: "MULTI", throttle: 0, adapter: AsyncMemoryAdapter, snapshot: true }).attach(temporalB.state, "temporal.state").attach(uiB, "ui");
    const appB = reactive({ count: 0 });

    appB.use(persistB, "app");
    persistB.state.once("hydrated", temporalB.track);

    await wait();

    expect(persistB.state.hydrated).toBe(true);
    expect(appB.count).toBe(expected.appCount);
    expect(uiB.theme).toBe(expected.uiTheme);
    expect(temporalB.state.history.length).toBe(expected.historyLen);
    expect(temporalB.state.currentFrame).toBe(expected.frame);
  });
});
