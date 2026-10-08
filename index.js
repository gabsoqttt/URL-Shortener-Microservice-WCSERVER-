const express = require('express');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (optional if you have an index.html)
app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory storage for URLs
let urls = [];
let idCounter = 1;

// Root route
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = urlParser.parse(originalUrl);

    // Validate protocol
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // Validate host using dns.lookup
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Save URL
      const shortUrl = idCounter++;
      urls.push({ original_url: originalUrl, short_url: shortUrl });

      res.json({ original_url: originalUrl, short_url: shortUrl });
    });
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const entry = urls.find((u) => u.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No short URL found for given input' });
  }

  res.redirect(entry.original_url);
});

// IMPORTANT: Render requires process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
