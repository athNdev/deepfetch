/**
 * Configuration for CORS Proxy endpoints
 * Update this file after deploying the Cloudflare Worker
 */

export const CORS_PROXY_CONFIG = {
    // Production Cloudflare Worker URL
    // This will be updated after first deployment
    PRODUCTION_URL: 'https://deepfetch-cors-proxy.athNdev.workers.dev',
    
    // Local development options
    LOCAL_DEV: {
        // Option 1: Use production Cloudflare Worker for local dev too (simplest)
        USE_PRODUCTION: true,
        
        // Option 2: Run local proxy server (future enhancement)
        LOCAL_SERVER_URL: 'http://localhost:3001/proxy',
        USE_LOCAL_SERVER: false
    }
};

/**
 * Get the appropriate CORS proxy URL based on environment
 */
export function getCorsProxyUrl() {
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0';
    
    if (isLocal && CORS_PROXY_CONFIG.LOCAL_DEV.USE_LOCAL_SERVER) {
        return CORS_PROXY_CONFIG.LOCAL_DEV.LOCAL_SERVER_URL;
    }
    
    // Use production URL for both local dev and production
    return CORS_PROXY_CONFIG.PRODUCTION_URL;
}
