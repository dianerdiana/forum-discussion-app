import { createJwt } from './auth/jwt-service';

export const api = createJwt({ baseURL: import.meta.env.VITE_BASE_API_URL });
