import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL;
const baseURL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

export const getSummary = () =>
    api.get("/dashboard/summary").then((r) => r.data);

export const getHotspots = (limit = 10) =>
    api.get("/zones/hotspots", { params: { limit } }).then((r) => r.data);

export const getFlows = (limit = 10) =>
    api.get("/flows/od", { params: { limit } }).then((r) => r.data);

export const getForecast = (hours = 72) =>
    api.get("/demand/forecast", { params: { hours } }).then((r) => r.data);

export const getModels = () =>
    api.get("/predict/status").then((r) => r.data);