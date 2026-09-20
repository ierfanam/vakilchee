/**
 * Cloudflare Pages & Workers Reverse Proxy for Gemini Live WebSockets & REST API
 * Bypasses Iranian censorship & Google geoblocks by routing traffic through Cloudflare Edge.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. CORS Preflight Handling
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const upgradeHeader = request.headers.get("Upgrade")?.toLowerCase();
    const isWebSocket = upgradeHeader === "websocket";
    const isGeminiPath =
      url.pathname.includes("generativelanguage") ||
      url.pathname.includes("GenerativeService") ||
      url.pathname.startsWith("/ws") ||
      url.pathname.startsWith("/v1alpha") ||
      url.pathname.startsWith("/v1beta");

    // 2. Gemini Live WebSocket and API Reverse Proxy
    if (isWebSocket || isGeminiPath) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "generativelanguage.googleapis.com";
      targetUrl.protocol = "https:";
      targetUrl.port = "";

      // Inject server-side secret GEMINI_API_KEY if client didn't supply one or supplied placeholder
      const secretKey = env?.GEMINI_API_KEY || env?.API_KEY;
      const currentQueryKey = targetUrl.searchParams.get("key");
      if (secretKey && (!currentQueryKey || currentQueryKey === "undefined" || currentQueryKey === "PROXY_INJECTED_OR_MISSING" || currentQueryKey === "NO_KEY_PROVIDED")) {
        targetUrl.searchParams.set("key", secretKey);
      }

      const forwardHeaders = new Headers(request.headers);
      forwardHeaders.set("Host", "generativelanguage.googleapis.com");
      if (secretKey) {
        const headerKey = forwardHeaders.get("x-goog-api-key");
        if (!headerKey || headerKey === "undefined" || headerKey === "PROXY_INJECTED_OR_MISSING") {
          forwardHeaders.set("x-goog-api-key", secretKey);
        }
      }

      // WebSocket Upgrade Proxy to Google Generative Language
      if (isWebSocket) {
        return fetch(targetUrl.toString(), {
          headers: forwardHeaders,
        });
      }

      // HTTP REST API Proxy to Google Generative Language
      const upstreamResponse = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "*");

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    }

    // 3. Static Assets serving for Cloudflare Pages / Workers Sites
    if (env?.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      // SPA fallback: return index.html for client-side routing
      if (assetResponse.status === 404 && request.method === "GET" && !url.pathname.includes(".")) {
        const indexUrl = new URL("/index.html", request.url);
        return env.ASSETS.fetch(new Request(indexUrl, request));
      }
      return assetResponse;
    }

    return new Response("Not Found", { status: 404 });
  },
};
