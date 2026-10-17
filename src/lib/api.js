const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

export async function api(url, options = {}) {
  const token = window.localStorage.getItem("school_admin_token");
  const response = await fetch(`${API_BASE_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("API 서버에 연결할 수 없어요. 백엔드 배포 후 REACT_APP_API_BASE_URL 설정을 확인해 주세요.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && url !== "/api/admin/login") window.localStorage.removeItem("school_admin_token");
    throw new Error(data.error || "요청을 처리하지 못했어요.");
  }
  if (data.token) window.localStorage.setItem("school_admin_token", data.token);
  return data;
}
