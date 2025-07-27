/**
 * Cloudflare Worker CORS Proxy
 * Handles CORS requests for the Advanced Web Resource Downloader
 * Supports large files up to 100MB (much better than Netlify's 6MB limit)
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, User-Agent, x-requested-with, origin',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // Get the target URL from query parameters
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      console.log(`[CORS Proxy] Fetching: ${targetUrl}`);

      // Fetch the resource with timeout and better headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(targetUrl, {
        method: request.method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      });

      clearTimeout(timeoutId);

      console.log(`[CORS Proxy] Response status: ${response.status}`);

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: `Failed to fetch resource: ${response.status} ${response.statusText}` 
        }), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Create new response with CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent, x-requested-with, origin',
      };

      // Copy relevant headers from the original response
      const headersToForward = [
        'content-type',
        'content-length',
        'last-modified',
        'etag',
        'cache-control',
        'expires',
      ];

      headersToForward.forEach(headerName => {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          corsHeaders[headerName] = headerValue;
        }
      });

      // Return the response with CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: corsHeaders,
      });

      console.log(`[CORS Proxy] Successfully proxied ${targetUrl}`);
      return newResponse;

    } catch (error) {
      console.error(`[CORS Proxy] Error: ${error.message}`);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
