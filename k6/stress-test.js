import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = 'http://localhost:3000';
const USERNAME = 'admin@gunshop.com';
const PASSWORD = 'SuperAdmin123!';

export default function () {
  // 1. Login to get the access token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: USERNAME,
    password: PASSWORD,
  });

  check(loginRes, {
    'login successful': (res) => res.status === 200,
    'got access token': (res) => res.json('accessToken') !== null,
  });

  const accessToken = loginRes.json('accessToken');

  if (accessToken) {
    const params = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    // 2. Fetch products
    const productsRes = http.get(`${BASE_URL}/products`, params);
    check(productsRes, {
      'get products successful': (res) => res.status === 200,
    });
  }

  sleep(1);
}
