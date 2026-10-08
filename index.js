const express = require("express");
const dns = require("dns");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const urls = new Map();
let nextShortUrl = 1;

// Root route with form
app.get("/", (req, res) => {
  res.send(`
    <h2>URL Shortener Microservice</h2>
    <form action="/api/shorturl" method="post">
      <input type="text" name="url" placeholder="Enter a URL" />
      <button type="submit">Shorten</button>
    </form>
  `);
});

// POST route to create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, (error) => {
    if (error) {
      return res.json({ error: "invalid url" });
    }

    // Check if URL already exists
    for (const [shortUrl, savedUrl] of urls) {
      if (savedUrl === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: shortUrl
        });
      }
    }

    // Save new short URL
    const shortUrl = nextShortUrl;
    urls.set(shortUrl, originalUrl);
    nextShortUrl++;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET route to redirect
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);
  const originalUrl = urls.get(shortUrl);

  if (!originalUrl) {
    return res.json({
      error: "No short URL found for the given input"
    });
  }

  res.redirect(originalUrl);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
