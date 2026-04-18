// src/ts/utils/methd.ts
function onAllMethods(owner, callback, skipOwn = true, nested = false) {
  let proto = owner;
  while (proto && proto !== Object.prototype) {
    for (const method of Object.getOwnPropertyNames(proto)) {
      if (method === "constructor") continue;
      if (nested && skipOwn && Object.prototype.hasOwnProperty.call(owner, method)) continue;
      if ("function" === typeof Object.getOwnPropertyDescriptor(proto, method)?.value) callback(method, owner);
    }
    proto = Object.getPrototypeOf(proto), nested = true;
  }
}
function bindAllMethods(owner) {
  onAllMethods(owner, (method, owner2) => {
    owner2[method] = owner2[method].bind(owner2);
  });
}
function guardAllMethods(owner, guardFn = guardMethod, bound = true) {
  onAllMethods(owner, (method, owner2) => {
    owner2[method] = guardFn(bound ? owner2[method].bind(owner2) : owner2[method]);
  });
}
function guardMethod(fn, onError = (e) => console.error(e)) {
  return ((...args) => {
    try {
      const result = fn(...args);
      return result instanceof Promise ? result.catch((e) => onError(e)) : result;
    } catch (e) {
      onError(e);
    }
  });
}

// src/ts/utils/fn.ts
function setTimeout(handler, timeout, ...args) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : void 0;
  if (sig?.aborted) return -1;
  const win = args[0] instanceof Window ? args.shift() : window;
  if (!sig) return win.setTimeout(handler, timeout, ...args);
  const id = win.setTimeout(() => (sig.removeEventListener("abort", kill), "string" === typeof handler ? new Function(handler) : handler(...args)), timeout), kill = () => win.clearTimeout(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}
function setInterval(handler, timeout, ...args) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : void 0;
  if (sig?.aborted) return -1;
  const win = args[0] instanceof Window ? args.shift() : window, id = win.setInterval(handler, timeout, ...args);
  return sig?.addEventListener("abort", () => win.clearInterval(id), { once: true }), id;
}
function requestAnimationFrame(callback, sig, win = window) {
  if (sig?.aborted) return -1;
  if (!sig) return win.requestAnimationFrame(callback);
  const id = win.requestAnimationFrame((t) => (sig.removeEventListener("abort", kill), callback(t))), kill = () => win.cancelAnimationFrame(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}

// src/ts/utils/num.ts
function clamp(min = 0, val, max = Infinity) {
  return Math.min(Math.max(val, min), max);
}

export {
  onAllMethods,
  bindAllMethods,
  guardAllMethods,
  guardMethod,
  setTimeout,
  setInterval,
  requestAnimationFrame,
  clamp
};
