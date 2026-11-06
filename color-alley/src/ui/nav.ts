import { useStore } from '../store/useStore';
import { SHOPS, STOPS } from '../scene/layout';

/** Scroll the alley (ScrollControls' scroll container) to an offset in 0..1. */
export function goToOffset(offset: number, smooth = true) {
  const el = useStore.getState().scrollEl;
  if (!el) return;
  const top = offset * (el.scrollHeight - el.clientHeight);
  el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}

// remember where the last button/key press was heading, so quick repeated
// presses advance stop-by-stop instead of reading the still-moving position
let last = { target: 0, at: 0 };

export function step(dir: 1 | -1) {
  const live = useStore.getState().progress;
  const p = performance.now() - last.at < 1500 ? last.target : live;
  const next = dir > 0 ? STOPS.find((s) => s > p + 0.012) ?? 1 : [...STOPS].reverse().find((s) => s < p - 0.012) ?? 0;
  last = { target: next, at: performance.now() };
  goToOffset(next);
}

/** Walk to a shop and open its panel. */
export function visitShop(id: string) {
  const s = useStore.getState();
  if (!s.lit) s.lightUp();
  if (id === 'workshop') goToOffset(1, false);
  else {
    const shop = SHOPS.find((x) => x.id === id);
    if (shop) goToOffset(shop.offset, false);
  }
  s.setFocus(id);
}

/** Close the panel and return to the path in front of the shop. */
export function leaveShop() {
  const { focus, setFocus } = useStore.getState();
  const shop = SHOPS.find((x) => x.id === focus);
  setFocus(null);
  if (shop) goToOffset(shop.offset, false);
  else if (focus === 'workshop') goToOffset(1, false);
}
