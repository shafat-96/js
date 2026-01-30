import http from "http";
import https from "https";
import { URL } from "url";

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const target = urlObj.searchParams.get("url");

    if (!target) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(JSON.stringify({ error: "Missing ?url=" }));
    }

    const targetUrl = new URL(target);
    const client = targetUrl.protocol === "https:" ? https : http;

    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
    };

    const proxyReq = client.request(targetUrl, options, proxyRes => {
      // CORS
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      });

      proxyRes.pipe(res);
    });

    proxyReq.on("error", err => {
      res.writeHead(500);
      res.end(err.message);
    });

    // Forward body
    if (req.method !== "GET" && req.method !== "HEAD") {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }

  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
  console.log(`Usage: http://localhost:${PORT}/?url=https://example.com`);
});
