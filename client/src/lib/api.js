const API_BASE_URL = (process.env.API_BASE_URL || "").replace(/\/$/, "");

export async function api(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했어요.");
  return data;
}
