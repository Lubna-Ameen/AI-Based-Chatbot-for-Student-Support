import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";
let csrfToken = "";

const setCsrfToken = (token) => {
  csrfToken = token || "";
};

const get = async (path, config = {}) => {
  const response = await axios.get(`${API_BASE}/admin${path}`, {
    ...config,
    withCredentials: true,
  });
  if (path === "/auth/csrf") setCsrfToken(response.data.csrfToken);
  return response;
};

const requestCsrfToken = async () => {
  if (!csrfToken) await get("/auth/csrf");
  return csrfToken;
};

const post = async (path, data, options = {}) => {
  const headers = { ...options.headers };
  if (options.csrf) headers["X-CSRF-Token"] = await requestCsrfToken();
  const response = await axios.post(`${API_BASE}/admin${path}`, data, {
    ...options,
    headers,
    withCredentials: true,
  });
  if (response.data?.csrfToken) setCsrfToken(response.data.csrfToken);
  if (path === "/auth/logout" || path === "/auth/change-password") setCsrfToken("");
  return response;
};

const put = async (path, data, config = {}) => {
  const headers = {
    ...config.headers,
    "X-CSRF-Token": await requestCsrfToken(),
  };
  return axios.put(`${API_BASE}/admin${path}`, data, {
    ...config,
    headers,
    withCredentials: true,
  });
};

export { get, post, put, setCsrfToken };
