import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  const ready = http.get(`${BASE}/ready`);
  check(ready, { "ready 200": (r) => r.status === 200 });

  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({
      email: "superadmin@clinicalos.local",
      password: "SuperAdmin123!",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login 201/200": (r) => r.status === 200 || r.status === 201 });

  const search = http.get(`${BASE}/medicines/search?q=napa&limit=20`);
  check(search, { "search 200": (r) => r.status === 200 });

  sleep(0.5);
}
