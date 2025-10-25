// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function injectBase(html: string, baseHref: string) {
  // Ensure a <base> tag so relative URLs resolve correctly
  if (/<base\s/i.test(html)) return html;
  const headIndex = html.indexOf('<head');
  if (headIndex !== -1) {
    const headClose = html.indexOf('>', headIndex);
    if (headClose !== -1) {
      return html.slice(0, headClose + 1) + `\n<base href="${baseHref}">\n` + html.slice(headClose + 1);
    }
  }
  // Fallback: prepend base at the start
  return `<!doctype html>\n<head><base href="${baseHref}"></head>` + html;
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type, authorization',
        }
      });
    }

    const urlObj = new URL(req.url);
    let target = urlObj.searchParams.get('url');

    if (!target && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const body = await req.json().catch(() => ({}));
      target = body?.url;
    }

    if (!target || !isValidUrl(target)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing url parameter' }), {
        status: 400,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const res = await fetch(target, { redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      // Return a simple HTML wrapper that navigates to the resource
      const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${target}"></head><body style="margin:0">
      <iframe src="${target}" style="border:0;width:100vw;height:100vh"></iframe>
      </body></html>`;
      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    let html = await res.text();
    html = injectBase(html, target);

    // Strip known CSP meta tags that may block resources in iframe context
    html = html.replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(`Proxy error: ${e instanceof Error ? e.message : 'unknown'}`, {
      status: 500,
      headers: { 'content-type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
