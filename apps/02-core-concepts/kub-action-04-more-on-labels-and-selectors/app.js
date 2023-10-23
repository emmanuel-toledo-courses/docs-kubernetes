const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <h1>Hello from this NodeJS app</h1>
    <p>Try sending a request to /error and see what happens</p>
    <p>This is a new update </p>
    <hr />
  `);
});

app.get('/error', (req, res) => {
  process.exit(1);
});

app.listen(8080);
