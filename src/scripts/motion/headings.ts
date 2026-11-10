// Every section heading marked [data-split] rises line by line through a mask as it comes into view.
// The hero headline is handled by the hero module (it plays on load, not on scroll).
import { riseLines } from './text';
import { qa } from './util';

export function headings() {
  qa('[data-split]:not([data-hero-title])').forEach((el) => riseLines(el));
}
