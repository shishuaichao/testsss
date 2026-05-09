function pickBestBuyQuoteFromLatestC(C) {
  const list = Array.isArray(C) ? C : [];
  if (!list.length) return {};

  const toTime = (t) => {
    if (typeof t !== 'string') return Number.POSITIVE_INFINITY;

    // Support HH:mm:ss (e.g. 12:12:12) by converting to seconds of day.
    const hhmmss = t.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hhmmss) {
      const h = Number(hhmmss[1]);
      const m = Number(hhmmss[2]);
      const s = Number(hhmmss[3]);
      if (h <= 23 && m <= 59 && s <= 59) {
        return h * 3600 + m * 60 + s;
      }
      return Number.POSITIVE_INFINITY;
    }

    // Fallback to Date parsing for ISO and other full datetime strings.
    const ms = new Date(t).getTime();
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  };

  const numericPriceItems = list.filter((item) => Number.isFinite(item?.price));
  if (numericPriceItems.length) {
    numericPriceItems.sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      return toTime(a.t) - toTime(b.t);
    });
    return numericPriceItems[0] || {};
  }

  const bidItems = list.filter((item) => item?.price === 'Bid');
  if (bidItems.length) {
    bidItems.sort((a, b) => toTime(a.t) - toTime(b.t));
    return bidItems[0] || {};
  }

  return {};
}

// 示例
const C = [
//   { price: 101.2, count: 4, t: '2026-04-29T09:00:05.000Z', title: '机构A' },
//   { price: 100.8, count: 1, t: '2026-04-29T09:00:08.000Z', title: '机构B' },
  { price: 'Bid', count: 2, t: '12:12:22', title: '机构C' },
  { price: 'Bid', count: 7, t: '12:12:01', title: '机构D' }
];

const best = pickBestBuyQuoteFromLatestC(C);
console.log(best);
