import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Advanced Web Resource Downloader
 * Attempts to replicate browser network inspection for web-based resource extraction
 */
class AdvancedWebResourceDownloader {
    // Helper: like downloadSingleResource, but returns fileData for further processing
    async downloadSingleResourceWithReturn(url) {
        if (this.downloadedUrls.has(url)) {
            return null; // Already downloaded
        }
        try {
            const response = await this.fetchWithCORS(url);
            const contentType = this.getContentType(response);
            const content = await this.getResponseContent(response, contentType);
            const filename = this.generateFilename(url, contentType);
            const fileType = this.determineFileType(filename, contentType);
            const fileData = {
                content: content,
                size: this.getContentSize(content),
                type: fileType,
                url: url,
                contentType: contentType
            };
            this.saveFile(filename, fileData);
            this.downloadedUrls.add(url);
            return fileData;
        } catch (error) {
            throw new Error(`Failed to download ${url}: ${error.message}`);
        }
    }

    // Extract all url(...) from CSS content, resolve relative to baseUrl
    extractUrlsFromCss(css, baseUrl) {
        const urls = new Set();
        const urlRegex = /url\((['"]?)([^'"\)]+)\1\)/g;
        let match;
        while ((match = urlRegex.exec(css)) !== null) {
            let rawUrl = match[2].trim();
            if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('#')) continue;
            try {
                const absUrl = new URL(rawUrl, baseUrl).href;
                urls.add(absUrl);
            } catch (e) {}
        }
        return urls;
    }
    constructor() {
        this.downloadedFiles = new Map();
        this.downloadedUrls = new Set();
        this.isDownloading = false;
        this.startTime = null;
        this.stats = {
            totalFiles: 0,
            sourceFiles: 0,
            jsFiles: 0,
            cssFiles: 0,
            imageFiles: 0,
            totalSize: 0
        };
        
        this.initializeEventListeners();
    }

    // =====================================
    // INITIALIZATION & EVENT HANDLING
    // =====================================

    initializeEventListeners() {
        document.getElementById('start-download').addEventListener('click', () => this.startDownload());
        document.getElementById('stop-download').addEventListener('click', () => this.stopDownload());
        document.getElementById('download-zip').addEventListener('click', () => this.downloadAsZip());
        document.getElementById('reset-download').addEventListener('click', () => this.resetDownload());
    }

    // =====================================
    // UI & LOGGING METHODS
    // =====================================

    log(message, level = 'info') {
        const logContainer = document.getElementById('log-container');
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        logContainer.textContent += logMessage + '\n';
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Console logging with appropriate level
        if (level === 'error') {
            console.error(`[Advanced Downloader] ${message}`);
        } else if (level === 'warn') {
            console.warn(`[Advanced Downloader] ${message}`);
        } else {
            console.log(`[Advanced Downloader] ${message}`);
        }
    }

    updateProgress(percentage, message = '') {
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${percentage}%`;
        progressFill.textContent = `${Math.round(percentage)}%`;
        
        if (message) {
            this.log(message);
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
        this.log(message, 'error');
    }

    showSuccess(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> ${message}
            </div>
        `;
    }

    // =====================================
    // MAIN DOWNLOAD ORCHESTRATION
    // =====================================

    async startDownload() {
        const targetUrl = document.getElementById('target-url').value.trim();
        
        if (!this.validateInput(targetUrl)) {
            return;
        }

        this.initializeDownload(targetUrl);

        try {
            await this.executeDownloadProcess(targetUrl);
        } catch (error) {
            this.handleDownloadError(error);
        } finally {
            this.finalizeDownload();
        }
    }

    validateInput(targetUrl) {
        if (!targetUrl) {
            this.showError('Please enter a valid URL');
            return false;
        }

        if (!this.isValidUrl(targetUrl)) {
            this.showError('Please enter a valid HTTP/HTTPS URL');
            return false;
        }

        return true;
    }

    initializeDownload(targetUrl) {
        this.isDownloading = true;
        this.startTime = Date.now();
        this.downloadedFiles.clear();
        this.downloadedUrls.clear();
        this.resetStats();

        // UI state
        document.getElementById('progress-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('start-download').disabled = true;
        document.getElementById('log-container').textContent = '';
        
        this.log('🚀 Starting advanced download process...');
        this.updateProgress(0, 'Initializing advanced browser simulation...');
    }

    async executeDownloadProcess(targetUrl) {
        // Phase 1: Download main HTML page
        this.updateProgress(5, '📄 Phase 1: Downloading main HTML page...');
        const html = await this.downloadMainPage(targetUrl);
        
        // Phase 2: Extract and download static resources
        this.updateProgress(20, '📦 Phase 2: Extracting static resources...');
        const resourceUrls = await this.extractStaticResources(html, targetUrl);
        
        // Phase 3: Download all static resources
        this.updateProgress(40, '⬇️ Phase 3: Downloading static resources...');
        await this.downloadStaticResources(resourceUrls);
        
        // Phase 4: Process JavaScript files for source maps
        this.updateProgress(70, '🗺️ Phase 4: Processing source maps...');
        await this.processSourceMaps();
        
        // Phase 5: Search for dynamic resources
        this.updateProgress(85, '🔍 Phase 5: Searching for dynamic resources...');
        await this.findDynamicResources();
        
        // Phase 6: Generate final report
        this.updateProgress(95, '📊 Phase 6: Generating report...');
        this.generateFinalReport();
        
        this.updateProgress(100, '🎉 Advanced extraction completed!');
        this.showResults();
    }

    handleDownloadError(error) {
        this.log(`❌ Download failed: ${error.message}`, 'error');
        this.showError(`Download failed: ${error.message}`);
    }

    finalizeDownload() {
        this.isDownloading = false;
        document.getElementById('start-download').disabled = false;
    }

    // =====================================
    // PHASE 1: MAIN PAGE DOWNLOAD
    // =====================================

    async downloadMainPage(targetUrl) {
        try {
            const response = await this.fetchWithCORS(targetUrl);
            const html = await response.text();
            
            this.saveFile('index.html', {
                content: html,
                size: html.length,
                type: 'html',
                url: targetUrl,
                contentType: 'text/html'
            });
            
            this.log('✅ Main HTML downloaded successfully');
            return html;
            
        } catch (error) {
            throw new Error(`Failed to download main page: ${error.message}`);
        }
    }

    // =====================================
    // PHASE 2: STATIC RESOURCE EXTRACTION
    // =====================================

    async extractStaticResources(html, baseUrl) {
        const resourceUrls = new Set();
        const base = new URL(baseUrl);
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract different types of resources
            this.extractScripts(doc, base, resourceUrls);
            this.extractStylesheets(doc, base, resourceUrls);
            this.extractImages(doc, base, resourceUrls);
            this.extractOtherResources(doc, base, resourceUrls);
            
            const urls = Array.from(resourceUrls);
            this.log(`📦 Found ${urls.length} static resources in HTML`);
            
            return urls;
            
        } catch (error) {
            this.log(`⚠️ Error parsing HTML: ${error.message}`, 'warn');
            return [];
        }
    }

    extractScripts(doc, base, resourceUrls) {
        doc.querySelectorAll('script[src]').forEach(script => {
            const src = script.getAttribute('src');
            this.addResourceUrl(src, base, resourceUrls, 'script');
        });
    }

    extractStylesheets(doc, base, resourceUrls) {
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            this.addResourceUrl(href, base, resourceUrls, 'stylesheet');
        });
    }

    extractImages(doc, base, resourceUrls) {
        doc.querySelectorAll('img[src]').forEach(img => {
            const src = img.getAttribute('src');
            this.addResourceUrl(src, base, resourceUrls, 'image');
        });
    }

    extractOtherResources(doc, base, resourceUrls) {
        // Manifests, favicons, fonts, etc.
        doc.querySelectorAll('link[href]:not([rel="stylesheet"])').forEach(link => {
            const href = link.getAttribute('href');
            this.addResourceUrl(href, base, resourceUrls, 'other');
        });
    }

    addResourceUrl(url, base, resourceUrls, type) {
        if (!url || url.startsWith('data:') || url.startsWith('#') || 
            url.startsWith('mailto:') || url.startsWith('tel:')) {
            return;
        }

        try {
            const fullUrl = new URL(url, base).href;
            if (fullUrl.startsWith('http')) {
                resourceUrls.add(fullUrl);
            }
        } catch (error) {
            this.log(`⚠️ Invalid URL: ${url}`, 'warn');
        }
    }

    // =====================================
    // PHASE 3: STATIC RESOURCE DOWNLOAD
    // =====================================

    async downloadStaticResources(resourceUrls) {
        let downloaded = 0;
        const total = resourceUrls.length;
        const cssResources = new Set();
        for (const resourceUrl of resourceUrls) {
            if (!this.isDownloading) break;
            try {
                const fileData = await this.downloadSingleResourceWithReturn(resourceUrl);
                downloaded++;
                const progress = 40 + (downloaded / total) * 30; // 40-70%
                const filename = this.getFilenameFromUrl(resourceUrl);
                this.updateProgress(progress, `✅ Downloaded: ${filename}`);
                // If CSS, parse for url(...) and queue discovered resources
                if (fileData && fileData.contentType && fileData.contentType.includes('css') && typeof fileData.content === 'string') {
                    const found = this.extractUrlsFromCss(fileData.content, resourceUrl);
                    found.forEach(url => cssResources.add(url));
                }
            } catch (error) {
                this.log(`❌ Failed to download ${resourceUrl}: ${error.message}`, 'warn');
            }
        }
        // Download resources found in CSS
        if (cssResources.size > 0) {
            this.log(`� Found ${cssResources.size} resources in CSS. Downloading...`);
            for (const cssUrl of cssResources) {
                if (!this.isDownloading) break;
                try {
                    await this.downloadSingleResource(cssUrl);
                } catch (error) {
                    this.log(`❌ Failed to download CSS resource ${cssUrl}: ${error.message}`, 'warn');
                }
            }
        }
        this.log(`�📦 Downloaded ${downloaded}/${total} static resources (+CSS resources)`);
    }

    async downloadSingleResource(url) {
        if (this.downloadedUrls.has(url)) {
            return; // Already downloaded
        }
        
        try {
            const response = await this.fetchWithCORS(url);
            const contentType = this.getContentType(response);
            const content = await this.getResponseContent(response, contentType);
            
            const filename = this.generateFilename(url, contentType);
            const fileType = this.determineFileType(filename, contentType);
            
            this.saveFile(filename, {
                content: content,
                size: this.getContentSize(content),
                type: fileType,
                url: url,
                contentType: contentType
            });
            
            this.downloadedUrls.add(url);
            
        } catch (error) {
            throw new Error(`Failed to download ${url}: ${error.message}`);
        }
    }

    // =====================================
    // PHASE 4: SOURCE MAP PROCESSING
    // =====================================

    async processSourceMaps() {
        const jsFiles = this.getJavaScriptFiles();
        this.log(`📂 Found ${jsFiles.length} JavaScript files to process`);
        
        let totalSourceFiles = 0;
        
        for (const { filename, file } of jsFiles) {
            if (!this.isDownloading) break;
            
            try {
                const sourceMapUrl = this.findSourceMapUrl(file);
                if (sourceMapUrl) {
                    this.log(`🗺️ Found source map for ${filename}: ${sourceMapUrl}`);
                    const extractedCount = await this.processSourceMap(sourceMapUrl, filename);
                    totalSourceFiles += extractedCount;
                    this.log(`✅ Extracted ${extractedCount} source files from ${filename}`);
                } else {
                    this.log(`ℹ️ No source map found for ${filename}`);
                }
                
            } catch (error) {
                this.log(`❌ Error processing ${filename}: ${error.message}`, 'error');
            }
        }
        
        this.log(`✅ Total source files extracted: ${totalSourceFiles}`);
    }

    getJavaScriptFiles() {
        const jsFiles = [];
        
        for (const [filename, file] of this.downloadedFiles) {
            if (this.isJavaScriptFile(filename, file)) {
                jsFiles.push({ filename, file });
            }
        }
        
        return jsFiles;
    }

    isJavaScriptFile(filename, file) {
        return (
            (filename.endsWith('.js') || 
             file.type === 'script' || 
             file.contentType?.includes('javascript')) &&
            typeof file.content === 'string'
        );
    }

    findSourceMapUrl(file) {
        try {
            this.log(`🔍 Searching for source map URL in file (${file.content.length} bytes)`, 'info');
            
            const mapMatch = file.content.match(/\/\/[@#]\s*sourceMappingURL=(.+)$/m);
            if (!mapMatch) {
                this.log(`❌ No source map URL found in file`, 'warn');
                return null;
            }
            
            const mapPath = mapMatch[1].trim();
            this.log(`📍 Found source map reference: ${mapPath}`, 'info');
            
            let fullUrl;
            if (mapPath.startsWith('http')) {
                fullUrl = mapPath;
            } else {
                fullUrl = new URL(mapPath, file.url).href;
            }
            
            this.log(`🌐 Full source map URL: ${fullUrl}`, 'info');
            return fullUrl;
            
        } catch (error) {
            this.log(`⚠️ Error finding source map URL: ${error.message}`, 'warn');
            return null;
        }
    }

    async processSourceMap(sourceMapUrl, jsFilename) {
        try {
            this.log(`🔄 Downloading source map: ${sourceMapUrl}`, 'info');
            
            // Download source map
            const mapResponse = await this.fetchWithCORS(sourceMapUrl);
            const mapContent = await mapResponse.text();
            
            this.log(`✅ Source map downloaded, size: ${mapContent.length} bytes`, 'info');
            
            // Save source map file
            const mapFilename = this.generateFilename(sourceMapUrl, 'application/json');
            this.saveFile(mapFilename, {
                content: mapContent,
                size: mapContent.length,
                type: 'sourcemap',
                url: sourceMapUrl,
                contentType: 'application/json'
            });
            
            this.log(`💾 Source map saved as: ${mapFilename}`, 'info');
            
            // Extract source files from map
            const extractedCount = await this.extractSourceFilesFromMap(mapContent, jsFilename);
            
            this.log(`📂 Extracted ${extractedCount} source files from source map`, 'info');
            
            return extractedCount;
            
        } catch (error) {
            this.log(`❌ Failed to process source map ${sourceMapUrl}: ${error.message}`, 'error');
            return 0;
        }
    }

    async extractSourceFilesFromMap(mapContent, jsFilename) {
        try {
            this.log(`🔍 Parsing source map for ${jsFilename}...`, 'info');
            
            const sourceMap = JSON.parse(mapContent);
            
            this.log(`📋 Source map parsed successfully`, 'info');
            this.log(`   Sources: ${sourceMap.sources ? sourceMap.sources.length : 'undefined'}`, 'info');
            this.log(`   SourcesContent: ${sourceMap.sourcesContent ? sourceMap.sourcesContent.length : 'undefined'}`, 'info');
            
            if (!sourceMap.sources || !sourceMap.sourcesContent) {
                this.log(`⚠️ Source map missing sources or sourcesContent`, 'warn');
                return 0;
            }
            
            this.log(`📂 Processing ${sourceMap.sources.length} sources from source map...`);
            
            let extractedCount = 0;
            
            for (let i = 0; i < sourceMap.sources.length; i++) {
                const sourcePath = sourceMap.sources[i];
                const sourceContent = sourceMap.sourcesContent[i];
                
                if (this.shouldExtractSource(sourcePath, sourceContent)) {
                    const cleanPath = this.cleanSourcePath(sourcePath);
                    const sourceFilename = `src/${cleanPath}`;
                    
                    this.saveFile(sourceFilename, {
                        content: sourceContent,
                        size: sourceContent.length,
                        type: 'source',
                        url: null,
                        originalPath: sourcePath
                    });
                    
                    extractedCount++;
                    
                    // Log first few extractions for debugging
                    if (extractedCount <= 5) {
                        this.log(`   📄 Extracted: ${sourceFilename}`, 'info');
                    }
                }
            }
            
            this.log(`✅ Successfully extracted ${extractedCount} source files`, 'info');
            return extractedCount;
            
        } catch (error) {
            this.log(`❌ Failed to parse source map: ${error.message}`, 'error');
            this.log(`❌ Error details: ${error.stack}`, 'error');
            return 0;
        }
    }

    shouldExtractSource(sourcePath, sourceContent) {
        if (!sourceContent || !sourcePath) return false;
        
        // Skip webpack internals
        const skipPatterns = [
            'webpack/',
            'node_modules/',
            'webpack:///',
            '(webpack)',
            'webpack/bootstrap',
            'webpack/runtime'
        ];
        
        return !skipPatterns.some(pattern => sourcePath.includes(pattern));
    }

    cleanSourcePath(sourcePath) {
        return sourcePath
            .replace(/^\//, '')
            .replace(/^webpack:\/\/[^/]*\//, '')
            .replace(/^webpack:\/\//, '')
            .replace(/^\.\//, '')
            .replace(/\?.*$/, '')
            .replace(/[<>:"|?*]/g, '_');
    }

    // =====================================
    // PHASE 5: DYNAMIC RESOURCE DISCOVERY
    // =====================================

    async findDynamicResources() {
        const endpoints = this.extractEndpointsFromCode();
        this.log(`🔍 Found ${endpoints.size} potential dynamic endpoints`);
        
        let downloadedCount = 0;
        
        for (const endpoint of endpoints) {
            if (!this.isDownloading) break;
            
            try {
                await this.downloadSingleResource(endpoint);
                downloadedCount++;
                this.log(`✅ Downloaded dynamic resource: ${endpoint}`);
            } catch (error) {
                // Many endpoints might fail, that's expected
                this.log(`⚠️ Dynamic endpoint failed: ${endpoint}`, 'warn');
            }
        }
        
        this.log(`📡 Downloaded ${downloadedCount} dynamic resources`);
    }

    extractEndpointsFromCode() {
        const endpoints = new Set();
        const baseUrl = this.downloadedFiles.get('index.html')?.url;
        
        if (!baseUrl) return endpoints;
        
        for (const [filename, file] of this.downloadedFiles) {
            if (file.type === 'script' && typeof file.content === 'string') {
                this.extractApiEndpoints(file.content, baseUrl, endpoints);
                this.extractResourceUrls(file.content, endpoints);
            }
        }
        
        return endpoints;
    }

    extractApiEndpoints(content, baseUrl, endpoints) {
        const apiMatches = content.match(/['"`]\/api\/[^'"`\s]+['"`]/g);
        if (apiMatches) {
            for (const match of apiMatches) {
                try {
                    const endpoint = match.slice(1, -1); // Remove quotes
                    const fullUrl = new URL(endpoint, baseUrl).href;
                    endpoints.add(fullUrl);
                } catch (error) {
                    // Invalid URL, skip
                }
            }
        }
    }

    extractResourceUrls(content, endpoints) {
        const urlMatches = content.match(/['"`]https?:\/\/[^'"`\s]+['"`]/g);
        if (urlMatches) {
            for (const match of urlMatches) {
                try {
                    const url = match.slice(1, -1); // Remove quotes
                    if (!this.downloadedUrls.has(url)) {
                        endpoints.add(url);
                    }
                } catch (error) {
                    // Invalid URL, skip
                }
            }
        }
    }

    // =====================================
    // NETWORK & CORS HANDLING
    // =====================================

    async fetchWithCORS(url) {
        this.log(`🌐 Attempting to fetch: ${url}`, 'info');
        try {
            // Use Vercel CORS proxy endpoint
            const proxyUrl = `https://your-vercel-app.vercel.app/api/cors-proxy/${url}`;
            this.log(`🔄 Rewriting URL to: ${proxyUrl}`, 'info');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000);
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'x-requested-with': 'XMLHttpRequest',
                    'origin': window.location.origin
                }
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Fetch failed with status ${response.status}`);
            }
            this.log(`✅ Fetch successful`, 'info');
            return response;
        } catch (error) {
            this.log(`❌ Fetch failed: ${error.message}`, 'error');
            throw new Error(`Fetch failed for ${url}: ${error.message}`);
        }
    }

    // =====================================
    // FILE MANAGEMENT
    // =====================================

    saveFile(filename, fileData) {
        this.downloadedFiles.set(filename, fileData);
        
        // Update stats
        this.stats.totalFiles++;
        this.stats.totalSize += fileData.size;
        
        if (filename.startsWith('src/')) {
            this.stats.sourceFiles++;
        } else if (filename.endsWith('.js')) {
            this.stats.jsFiles++;
        } else if (filename.endsWith('.css')) {
            this.stats.cssFiles++;
        } else if (fileData.type === 'image') {
            this.stats.imageFiles++;
        }
    }

    // =====================================
    // UTILITY METHODS
    // =====================================

    getContentType(response) {
        if (response.headers && response.headers.get) {
            return response.headers.get('content-type') || 'application/octet-stream';
        }
        return 'application/octet-stream';
    }

    async getResponseContent(response, contentType) {
        if (contentType.includes('text') || 
            contentType.includes('javascript') || 
            contentType.includes('json') || 
            contentType.includes('css')) {
            return await response.text();
        } else {
            try {
                return await response.arrayBuffer();
            } catch (e) {
                return await response.text();
            }
        }
    }

    getContentSize(content) {
        return content.length || content.byteLength || 0;
    }

    generateFilename(url, contentType) {
        try {
            const urlObj = new URL(url);
            let pathname = urlObj.pathname;
            
            // Handle root paths
            if (!pathname || pathname === '/' || pathname.endsWith('/')) {
                return this.getDefaultFilename(contentType);
            }
            
            let filename = pathname.split('/').pop();
            
            // Handle query parameters
            const hasExtension = filename.includes('.');
            if (urlObj.search && !hasExtension) {
                filename = filename + '_' + urlObj.search.slice(1).replace(/[=&]/g, '_').substring(0, 20);
            }
            
            filename = filename.split('?')[0]; // Remove query params
            
            // Add extension if missing
            if (!hasExtension) {
                filename += this.getExtensionFromContentType(contentType);
            }
            
            // Clean filename
            return filename.replace(/[<>:"|?*]/g, '_') || `resource_${Date.now()}.bin`;
            
        } catch (e) {
            return `resource_${Date.now()}.bin`;
        }
    }

    getDefaultFilename(contentType) {
        if (contentType.includes('html')) return 'index.html';
        if (contentType.includes('css')) return 'index.css';
        if (contentType.includes('javascript')) return 'index.js';
        return 'index.bin';
    }

    getExtensionFromContentType(contentType) {
        const extensions = {
            'text/html': '.html',
            'text/css': '.css',
            'application/javascript': '.js',
            'text/javascript': '.js',
            'application/json': '.json',
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/gif': '.gif',
            'image/svg+xml': '.svg'
        };
        
        for (const [mimeType, ext] of Object.entries(extensions)) {
            if (contentType.includes(mimeType.split('/')[1])) {
                return ext;
            }
        }
        
        return '.bin';
    }

    determineFileType(filename, contentType) {
        if (contentType.includes('javascript')) return 'script';
        if (contentType.includes('css')) return 'stylesheet';
        if (contentType.includes('image')) return 'image';
        if (contentType.includes('html')) return 'html';
        
        const ext = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'script', 'jsx': 'script', 'ts': 'script', 'tsx': 'script',
            'css': 'stylesheet', 'scss': 'stylesheet',
            'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'svg': 'image',
            'html': 'html', 'htm': 'html',
            'map': 'sourcemap'
        };
        
        return typeMap[ext] || 'other';
    }

    getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.split('/').pop() || 'index';
        } catch (e) {
            return 'resource';
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    resetStats() {
        this.stats = {
            totalFiles: 0,
            sourceFiles: 0,
            jsFiles: 0,
            cssFiles: 0,
            imageFiles: 0,
            totalSize: 0
        };
    }

    // =====================================
    // REPORTING & RESULTS
    // =====================================

    generateFinalReport() {
        this.log(`📊 Final Statistics:`);
        this.log(`   Total Files: ${this.stats.totalFiles}`);
        this.log(`   Total Size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        this.log(`   Source Files: ${this.stats.sourceFiles}`);
        this.log(`   JavaScript Files: ${this.stats.jsFiles}`);
        this.log(`   CSS Files: ${this.stats.cssFiles}`);
        this.log(`   Image Files: ${this.stats.imageFiles}`);
    }

    showResults() {
        document.getElementById('results-section').style.display = 'block';
        
        const downloadTime = Math.round((Date.now() - this.startTime) / 1000);
        
        document.getElementById('total-files').textContent = this.stats.totalFiles;
        document.getElementById('total-size').textContent = `${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`;
        document.getElementById('download-time').textContent = `${downloadTime}s`;
        
        // Update source files count if element exists
        const sourceFilesElement = document.getElementById('source-files');
        if (sourceFilesElement) {
            sourceFilesElement.textContent = this.stats.sourceFiles;
        }
        
        this.updateFileList();
        this.showSuccess(`Successfully downloaded ${this.stats.totalFiles} files using advanced extraction!`);
    }

    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        const sortedFiles = Array.from(this.downloadedFiles.entries())
            .sort(([a], [b]) => a.localeCompare(b));
        
        for (const [filename, file] of sortedFiles) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const icon = this.getFileIcon(file.type);
            const size = this.formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div>
                    <i class="fas ${icon} file-icon"></i>
                    <span>${filename}</span>
                    <small style="color: #666; margin-left: 10px;">${size}</small>
                </div>
                <button class="btn-secondary" onclick="downloader.downloadSingleFile('${filename}')">
                    <i class="fas fa-download"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        }
    }

    getFileIcon(type) {
        const icons = {
            'script': 'fa-file-code',
            'stylesheet': 'fa-file-css',
            'image': 'fa-file-image',
            'source': 'fa-file-code',
            'sourcemap': 'fa-file-alt',
            'html': 'fa-file-code',
            'other': 'fa-file'
        };
        return icons[type] || 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // =====================================
    // FILE OPERATIONS
    // =====================================

    async downloadAsZip() {
        this.log('📦 Creating ZIP file...');
        
        const zip = new JSZip();
        
        for (const [filename, file] of this.downloadedFiles) {
            if (typeof file.content === 'string') {
                zip.file(filename, file.content);
            } else {
                zip.file(filename, file.content);
            }
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const targetUrl = document.getElementById('target-url').value;
        const domain = new URL(targetUrl).hostname;
        
        saveAs(content, `${domain}-advanced-resources.zip`);
        this.log('✅ ZIP file downloaded!');
    }

    downloadSingleFile(filename) {
        const file = this.downloadedFiles.get(filename);
        if (!file) return;
        
        let blob;
        if (typeof file.content === 'string') {
            blob = new Blob([file.content], { type: 'text/plain' });
        } else {
            blob = new Blob([file.content]);
        }
        
        saveAs(blob, filename);
    }

    stopDownload() {
        this.isDownloading = false;
        this.log('⛔ Download stopped by user');
        document.getElementById('start-download').disabled = false;
    }

    resetDownload() {
        this.downloadedFiles.clear();
        this.downloadedUrls.clear();
        this.isDownloading = false;
        this.resetStats();
        
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-container').innerHTML = '';
        document.getElementById('start-download').disabled = false;
    }
}

export default AdvancedWebResourceDownloader;
