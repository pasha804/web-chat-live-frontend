const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function apiPost(path, body) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  return res.json();
}

export { BACKEND_URL };
