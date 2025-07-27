exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent, x-requested-with, origin',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        // Get the target URL from query parameters
        const url = event.queryStringParameters?.url;
        
        if (!url) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing url parameter' }),
            };
        }

        // Validate URL
        let targetUrl;
        try {
            targetUrl = new URL(url);
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
                throw new Error('Invalid protocol');
            }
        } catch (error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid URL format' }),
            };
        }

        console.log(`[CORS Proxy] Fetching: ${url}`);

        // Fetch the resource
        const response = await fetch(url, {
            method: event.httpMethod,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });

        console.log(`[CORS Proxy] Response status: ${response.status}`);

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Failed to fetch resource: ${response.status} ${response.statusText}` 
                }),
            };
        }

        // Get content type
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Determine if content is binary
        const isBinary = !contentType.includes('text') && 
                        !contentType.includes('javascript') && 
                        !contentType.includes('json') && 
                        !contentType.includes('css') && 
                        !contentType.includes('html') &&
                        !contentType.includes('xml');

        let body;
        if (isBinary) {
            // For binary content, convert to base64
            const arrayBuffer = await response.arrayBuffer();
            body = Buffer.from(arrayBuffer).toString('base64');
        } else {
            // For text content, return as string
            body = await response.text();
        }

        // Forward response headers (filtered)
        const responseHeaders = { ...headers };
        
        // Copy relevant headers from the original response
        const headersToForward = [
            'content-type',
            'content-length',
            'last-modified',
            'etag',
            'cache-control',
        ];
        
        headersToForward.forEach(headerName => {
            const headerValue = response.headers.get(headerName);
            if (headerValue) {
                responseHeaders[headerName] = headerValue;
            }
        });

        console.log(`[CORS Proxy] Successfully proxied ${url} (${body.length} bytes)`);

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: body,
            isBase64Encoded: isBinary,
        };

    } catch (error) {
        console.error(`[CORS Proxy] Error: ${error.message}`);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            }),
        };
    }
};
