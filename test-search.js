const fetch = require('node-fetch');

async function testSearch() {
  const from = 'cm87qoxp40003y4f7tys07ofj'; // صنعاء (example UUID if known, or whatever exists)
  const to = 'cm87qoy2f0004y4f7vntp6o4u'; // عدن
  const date = '2026-03-25';
  
  try {
     const res = await fetch(`http://localhost:3000/api/transport/booking/search?from=${from}&to=${to}&date=${date}`);
     const data = await res.json();
     console.log(JSON.stringify(data, null, 2));
  } catch (e) {
     console.error(e);
  }
}

testSearch();
