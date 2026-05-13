export const API_CONFIG_KEY = "agentmash.api-config.v1";

export function loadApiConfig() {
  try {
    const stored = window.localStorage.getItem(API_CONFIG_KEY);
    if (!stored) {
      return defaultApiConfig();
    }
    const parsed = JSON.parse(stored);
    return {
      baseUrl: cleanBaseUrl(parsed.baseUrl),
      token: typeof parsed.token === "string" ? parsed.token : ""
    };
  } catch {
    return defaultApiConfig();
  }
}

export function saveApiConfig(config) {
  const normalized = {
    baseUrl: cleanBaseUrl(config.baseUrl),
    token: typeof config.token === "string" ? config.token.trim() : ""
  };
  window.localStorage.setItem(API_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function pullReviewQueue(config) {
  const response = await fetch(apiUrl(config.baseUrl, "/v1/review-queue?limit=100&includeImageData=true"), {
    headers: authHeaders(config.token)
  });
  return readApiJson(response);
}

export async function publishFeedbackBundle(config, bundle) {
  const response = await fetch(apiUrl(config.baseUrl, "/v1/feedback"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(config.token)
    },
    body: JSON.stringify(bundle)
  });
  return readApiJson(response);
}

export function defaultApiConfig() {
  return {
    baseUrl: "",
    token: ""
  };
}

function cleanBaseUrl(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\/+$/, "");
}

function apiUrl(baseUrl, path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanBaseUrl(baseUrl) ? `${cleanBaseUrl(baseUrl)}${cleanPath}` : cleanPath;
}

function authHeaders(token) {
  const cleanToken = typeof token === "string" ? token.trim() : "";
  return cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {};
}

async function readApiJson(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.message || payload?.error || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }

  return payload;
}
