// Types
type Dataset = Record<string, string | number>;
type Style = Partial<CSSStyleDeclaration>;

// Element Factory

/**
 * Creates an HTML element with the specified tag and properties.
 * @param tag The tag name of the element to create.
 * @param props Optional properties to set on the element.
 * @param dataset Optional dataset attributes for the element.
 * @param styles Optional CSS styles for the element.
 * @returns The created HTML element.
 */
export function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): HTMLElementTagNameMap[K];
export function createEl(tag: string, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): HTMLElement | null;
export function createEl(tag: string, props?: Record<string, unknown>, dataset?: Dataset, styles?: Style, el = tag ? document?.createElement(tag) : null): HTMLElement | null {
  return assignEl(el, props, dataset, styles);
}

/**
 * Assigns properties, dataset attributes, and styles to an HTML element.
 * @param el The HTML element to assign properties to.
 * @param props Optional properties to set on the element.
 * @param dataset Optional dataset attributes for the element.
 * @param styles Optional CSS styles for the element.
 * @return The modified HTML element to allow signature swaps with `createEl()`.
 */
export function assignEl<El extends HTMLElement>(el?: El | null, props?: Partial<El>, dataset?: Dataset, styles?: Style, nodiff?: boolean): El | null;
export function assignEl<El extends HTMLElement>(el?: El | null, props?: Partial<El>, dataset?: Dataset, styles?: Style, nodiff?: boolean): El | null;
export function assignEl(el?: HTMLElement | null, props?: Record<string, unknown>, dataset?: Dataset, styles?: Style, nodiff = true): HTMLElement | null {
  if (!el) return null;
  if (props) for (const k of Object.keys(props)) if (props[k] !== undefined) if (nodiff || (el as any)[k] !== props[k]) (el as unknown as Record<string, unknown>)[k] = props[k];
  if (dataset) for (const k of Object.keys(dataset)) if (dataset[k] !== undefined) if (nodiff || (el.dataset as any)[k] !== dataset[k]) (el.dataset as DOMStringMap)[k] = String(dataset[k]);
  if (styles) for (const k of Object.keys(styles)) if (styles[k as keyof Style] !== undefined) if (nodiff || (el.style as any)[k] !== styles[k as any]) (el.style as unknown as Record<string, unknown>)[k] = styles[k as keyof Style];
  return el;
}

/** Get the currently active element, traversing into shadow roots if necessary.
 * @param root Root node to start searching from, defaults to the main document.
 * @returns The active element or null if none found.
 */
export function getActiveEl(root?: Document | ShadowRoot | null): Element | null {
  const activeEl = (root ?? document).activeElement;
  return !activeEl ? null : activeEl.shadowRoot ? getActiveEl(activeEl.shadowRoot) : activeEl;
}
