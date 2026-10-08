const express = require('express');
const dns = require('dns');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files
app.use('/public', express.static(`${process.cwd()}/public`));

// Store shortened URLs
const urls = {};
let idCounter = 1;

// Home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Create short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  // Must be HTTP or HTTPS
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Make sure there is a hostname
  if (!parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  // Check whether hostname exists
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = idCounter++;

    urls[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);

  if (!urls[shortUrl]) {
    return res.json({
      error: 'No short URL found for given input'
    });
  }

  res.redirect(urls[shortUrl]);
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});