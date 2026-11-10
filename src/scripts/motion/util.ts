// Small helpers shared by the motion modules.
export const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel as string) as T | null;
export const qa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel as string));

/** True when the visitor has not asked for reduced motion (checked at call time). */
export const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
