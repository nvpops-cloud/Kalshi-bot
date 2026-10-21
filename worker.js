// Relay between your Commodity Bot page and Kalshi. Paste into a Cloudflare Worker.
// Only your page is allowed to use it, and it only talks to Kalshi.
const PAGE = "https://nvpops-cloud.github.io";
const KALSHI = {
  prod: "https://api.elections.kalshi.com/trade-api/v2",
  demo: "https://demo-api.kalshi.co/trade-api/v2",
};
const PASS = ["Content-Type", "Accept", "KALSHI-ACCESS-KEY", "KALSHI-ACCESS-TIMESTAMP", "KALSHI-ACCESS-SIGNATURE"];

export default {
  async fetch(req) {
    const cors = {
      "Access-Control-Allow-Origin": PAGE,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": PASS.join(", "),
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    if (req.headers.get("Origin") !== PAGE) return new Response("Forbidden", { status: 403 });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    const [, env, ...rest] = url.pathname.split("/");
    const base = KALSHI[env];
    if (!base) return new Response("Not found", { status: 404, headers: cors });

    const headers = new Headers();
    for (const k of PASS) { const v = req.headers.get(k); if (v) headers.set(k, v); }
    const r = await fetch(base + "/" + rest.join("/") + url.search, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : await req.text(),
    });
    const out = new Headers(cors);
    out.set("Content-Type", r.headers.get("Content-Type") || "application/json");
    return new Response(await r.text(), { status: r.status, headers: out });
  },
};
