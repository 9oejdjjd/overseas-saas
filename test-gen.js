fetch("http://localhost:3000/api/transport/scheduler/generate", { method: "POST" })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
