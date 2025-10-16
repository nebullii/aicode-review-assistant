const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});