async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  site: () => request('/api/site.php'),
  products: (cat) => request('/api/products.php' + (cat ? `?cat=${encodeURIComponent(cat)}` : '')),
  product: (slug) => request(`/api/products.php?slug=${encodeURIComponent(slug)}`),
  order: (payload) => request('/api/orders.php', { method: 'POST', body: JSON.stringify(payload) }),
};

export const rupees = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

/** Fallback WhatsApp link when the API is unreachable, so a sale is never lost. */
export function waLink(number, text) {
  const digits = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
