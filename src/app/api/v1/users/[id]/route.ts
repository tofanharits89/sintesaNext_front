// Proxy: /api/v1/users/[id] -> re-exports all methods from /api/users/[id]
export { GET, PUT, DELETE } from "../../../users/[id]/route";
