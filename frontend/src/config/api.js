const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocalhost
  ? "http://localhost/invoice-portal/backend/api"
  : "https://invoiceportal.rf.gd/backend/api";

if (isLocalhost) {
  console.log("API_BASE_URL:", API_BASE_URL);
}
