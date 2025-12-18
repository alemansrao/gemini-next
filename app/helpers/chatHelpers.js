
// Chat helpers & constants
// /app/helpers/chatHelpers.js
export const API_KEY_STORAGE_KEY = 'geminiApiKey';
export const MODEL_STORAGE_KEY = 'selectedModel';

export const DEFAULT_MESSAGES = [];

// ----- Scroll helpers -----
export function updateHasScrollbar(el, setHasScrollbar, setIsAtTop) {
	if (!el || !setHasScrollbar) return;
	const has = el.scrollHeight > el.clientHeight;
	setHasScrollbar(has);
	if (setIsAtTop) setIsAtTop(el.scrollTop <= 0);
}
export function createScrollHandler(el, setIsAtTop) {
	if (!el || !setIsAtTop) return () => { };
	return function onScroll() {
		setIsAtTop(el.scrollTop <= 0);
	};
}
export function setupResizeObserver(el, cb) {
	if (!el || typeof ResizeObserver === 'undefined' || !cb) return null;
	const ro = new ResizeObserver(cb);
	ro.observe(el);
	return ro;
}
export function scrollToTop(el, hasScrollbar, setIsAtTop) {
	if (!el || !hasScrollbar) return;
	el.scrollTo({ top: 0, behavior: 'smooth' });
	if (setIsAtTop) setIsAtTop(true);
}