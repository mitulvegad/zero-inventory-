console.log("Testing with /api...");
fetch('https://zero-inventory.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test_live_' + Date.now() + '@gmail.com',
    password: 'password123',
    plan_name: 'Starter Shop'
  })
})
.then(async res => {
  console.log("With /api status:", res.status);
  const data = await res.json();
  console.log("With /api data:", data);
})
.catch(err => console.log("With /api err:", err.message))
.then(() => {
  console.log("\nTesting without /api...");
  return fetch('https://zero-inventory.onrender.com/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test_live_no_api_' + Date.now() + '@gmail.com',
      password: 'password123',
      plan_name: 'Starter Shop'
    })
  });
})
.then(async res => {
  console.log("Without /api status:", res.status);
  const text = await res.text();
  console.log("Without /api raw response (first 100 chars):", text.slice(0, 100));
})
.catch(err => console.log("Without /api err:", err.message));
