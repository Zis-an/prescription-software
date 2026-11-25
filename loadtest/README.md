# Clinical OS load-test harness

Requires [k6](https://k6.io/docs/get-started/installation/).

```bash
# Default base URL http://localhost:3001 (or Nginx :8080)
k6 run loadtest/k6-smoke.js
k6 run loadtest/k6-search-burst.js

# Against load-balanced Nginx
k6 run -e BASE_URL=http://localhost:8080 loadtest/k6-search-burst.js
```

Smoke covers health, login, and ranked medicine search.  
Burst stresses search endpoints — the path Super Admin ranking must stay fast under load.
