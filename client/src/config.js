// Base URL of the API/socket server. Empty string = same origin, which is the
// production setup where Express serves the built client.
export const API_URL = import.meta.env.VITE_API_URL ?? '';
