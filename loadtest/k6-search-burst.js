import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3001";
const QUERIES = ["napa", "omeprazole", "amlo", "metformin", "azithro", "seclo", "ace"];

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "40s", target: 50 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<300"],
  },
};

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(`${BASE}/medicines/search?q=${encodeURIComponent(q)}&limit=20`);
  check(res, {
    "search ok": (r) => r.status === 200,
    "has array body": (r) => {
      try {
        return Array.isArray(r.json());
      } catch {
        return false;
      }
    },
  });
  sleep(0.1);
}
