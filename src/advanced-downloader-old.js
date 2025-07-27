import JSZip from 'jszip';
import { saveAs } from 'file-saver';

class AdvancedWebResourceDownloader {
    constructor() {
        this.downloadedFiles = new Map();
        this.downloadedUrls = new Set();
        this.isDownloading = false;
        this.startTime = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('start-download').addEventListener('click', () => this.startDownload());
        document.getElementById('stop-download').addEventListener('click', () => this.stopDownload());
        document.getElementById('download-zip').addEventListener('click', () => this.downloadAsZip());
        document.getElementById('reset-download').addEventListener('click', () => this.resetDownload());
    }

    log(message) {
        const logContainer = document.getElementById('log-container');
        const timestamp = new Date().toLocaleTimeString();
        logContainer.textContent += `[${timestamp}] ${message}\n`;
        logContainer.scrollTop = logContainer.scrollHeight;
        console.log(`[Advanced Downloader] ${message}`);
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
    }

    showSuccess(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> ${message}
            </div>
        `;
    }

    async startDownload() {
        const targetUrl = document.getElementById('target-url').value.trim();
        
        if (!targetUrl) {
            this.showError('Please enter a valid URL');
            return;
        }

        if (!this.isValidUrl(targetUrl)) {
            this.showError('Please enter a valid HTTP/HTTPS URL');
            return;
        }

        this.isDownloading = true;
        this.startTime = Date.now();
        this.downloadedFiles.clear();
        this.downloadedUrls.clear();

        document.getElementById('progress-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('start-download').disabled = true;
        document.getElementById('log-container').textContent = '';
        
        this.log('🚀 Starting advanced download process...');
        this.updateProgress(0, 'Initializing advanced browser simulation...');

        try {
            await this.downloadResourcesAdvanced(targetUrl);
        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
            this.showError(`Download failed: ${error.message}`);
        } finally {
            this.isDownloading = false;
            document.getElementById('start-download').disabled = false;
        }
    }

    async downloadResourcesAdvanced(targetUrl) {
        this.updateProgress(5, '🌐 Starting comprehensive resource extraction...');
        
        try {
            // Step 1: Download the main HTML page
            this.updateProgress(10, '📄 Downloading main HTML page...');
            const response = await this.fetchWithCORS(targetUrl);
            const html = await response.text();
            
            this.downloadedFiles.set('index.html', {
                content: html,
                size: html.length,
                type: 'text/html',
                url: targetUrl
            });
            
            this.log('✅ Main HTML downloaded');
            
            // Step 2: Parse HTML and extract ALL resource URLs
            this.updateProgress(20, '🔍 Parsing HTML for all resource URLs...');
            const resourceUrls = await this.extractAllResourceUrlsFromHTML(html, targetUrl);
            this.log(`📦 Found ${resourceUrls.length} resources in HTML`);
            
            // Step 3: Download all found resources
            this.updateProgress(30, '⬇️ Downloading all resources...');
            let downloaded = 0;
            const total = resourceUrls.length;
            
            for (const resourceUrl of resourceUrls) {
                if (!this.isDownloading) break;
                
                try {
                    await this.downloadSingleResource(resourceUrl);
                    downloaded++;
                    
                    const progress = 30 + (downloaded / total) * 40;
                    this.updateProgress(progress, `✅ Downloaded: ${this.getFilenameFromUrl(resourceUrl)}`);
                    
                } catch (error) {
                    this.log(`❌ Failed: ${resourceUrl} - ${error.message}`);
                }
            }
            
            // Step 4: Process ALL JavaScript files for source maps
            this.updateProgress(70, '🗺️ Processing source maps for ALL JavaScript files...');
            await this.processAllJavaScriptFiles();
            
            // Step 5: Try to find additional API endpoints and dynamic resources
            this.updateProgress(85, '🌐 Searching for API endpoints and dynamic resources...');
            await this.findDynamicResources();
            
            // Step 6: Final statistics
            this.updateProgress(95, '📊 Finalizing...');
            await this.finalizeDownload();
            
            this.updateProgress(100, '🎉 Advanced extraction completed!');
            this.showResults();
            
        } catch (error) {
            throw new Error(`Failed to download resources: ${error.message}`);
        }
    }
    
    async extractAllResourceUrlsFromHTML(html, baseUrl) {
        const resourceUrls = new Set();
        const base = new URL(baseUrl);
        
        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract scripts (most important for source maps)
        doc.querySelectorAll('script[src]').forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                try {
                    resourceUrls.add(new URL(src, base).href);
                } catch (e) {}
            }
        });
        
        // Extract stylesheets
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('data:')) {
                try {
                    resourceUrls.add(new URL(href, base).href);
                } catch (e) {}
            }
        });
        
        // Extract images
        doc.querySelectorAll('img[src]').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                try {
                    resourceUrls.add(new URL(src, base).href);
                } catch (e) {}
            }
        });
        
        // Extract other resources
        doc.querySelectorAll('link[href], [src]').forEach(el => {
            const url = el.getAttribute('href') || el.getAttribute('src');
            if (url && !url.startsWith('data:') && !url.startsWith('#') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
                try {
                    const fullUrl = new URL(url, base).href;
                    if (fullUrl.startsWith('http')) {
                        resourceUrls.add(fullUrl);
                    }
                } catch (e) {}
            }
        });
        
        return Array.from(resourceUrls);
    }
    
    async downloadSingleResource(url) {
        if (this.downloadedUrls.has(url)) return;
        
        try {
            const response = await this.fetchWithCORS(url);
            let content;
            let contentType = 'application/octet-stream';
            
            // Try to get content type
            if (response.headers && response.headers.get) {
                contentType = response.headers.get('content-type') || contentType;
            }
            
            // Get content based on type
            if (contentType.includes('text') || contentType.includes('javascript') || contentType.includes('json') || contentType.includes('css')) {
                content = await response.text();
            } else {
                try {
                    content = await response.arrayBuffer();
                } catch (e) {
                    content = await response.text();
                }
            }
            
            const filename = this.getProperFilename(url, contentType);
            const fileType = this.getFileTypeFromContentType(contentType) || this.getFileTypeFromExtension(filename);
            
            this.downloadedFiles.set(filename, {
                content: content,
                size: content.length || content.byteLength || 0,
                type: fileType,
                url: url,
                contentType: contentType
            });
            
            this.downloadedUrls.add(url);
            
        } catch (error) {
            throw new Error(`Failed to download ${url}: ${error.message}`);
        }
    }
    
    async processAllJavaScriptFiles() {
        const jsFiles = [];
        
        // Find all JavaScript files
        for (const [filename, file] of this.downloadedFiles) {
            if ((filename.endsWith('.js') || file.type === 'script' || file.contentType?.includes('javascript')) && typeof file.content === 'string') {
                jsFiles.push({ filename, file });
            }
        }
        
        this.log(`📂 Found ${jsFiles.length} JavaScript files to process for source maps`);
        
        let totalSourceFiles = 0;
        
        for (const { filename, file } of jsFiles) {
            try {
                // Look for source map in the JavaScript content
                const mapMatch = file.content.match(/\/\/[@#]\s*sourceMappingURL=(.+)$/m);
                
                if (mapMatch) {
                    const mapPath = mapMatch[1].trim();
                    let mapUrl;
                    
                    // Construct absolute URL for source map
                    if (mapPath.startsWith('http')) {
                        mapUrl = mapPath;
                    } else {
                        mapUrl = new URL(mapPath, file.url).href;
                    }
                    
                    this.log(`🗺️ Found source map for ${filename}: ${mapUrl}`);
                    
                    try {
                        // Download the source map
                        const mapResponse = await this.fetchWithCORS(mapUrl);
                        const mapContent = await mapResponse.text();
                        
                        // Save source map
                        const mapFilename = this.getProperFilename(mapUrl, 'application/json');
                        this.downloadedFiles.set(mapFilename, {
                            content: mapContent,
                            size: mapContent.length,
                            type: 'sourcemap',
                            url: mapUrl
                        });
                        
                        // Extract source files
                        const extractedCount = await this.extractSourceFilesFromMap(mapContent, filename);
                        totalSourceFiles += extractedCount;
                        
                        this.log(`✅ Extracted ${extractedCount} source files from ${filename}`);
                        
                    } catch (error) {
                        this.log(`❌ Failed to process source map: ${error.message}`);
                    }
                }
                
            } catch (error) {
                this.log(`❌ Error processing ${filename}: ${error.message}`);
            }
        }
        
        this.log(`✅ Total source files extracted: ${totalSourceFiles}`);
    }
    
    async extractSourceFilesFromMap(mapContent, jsFilename) {
        try {
            const sourceMap = JSON.parse(mapContent);
            let extractedCount = 0;
            
            if (sourceMap.sources && sourceMap.sourcesContent) {
                this.log(`📂 Extracting ${sourceMap.sources.length} source files from source map...`);
                
                for (let i = 0; i < sourceMap.sources.length; i++) {
                    const sourcePath = sourceMap.sources[i];
                    const sourceContent = sourceMap.sourcesContent[i];
                    
                    if (sourceContent && sourcePath) {
                        // Clean up the source path (same as Node.js version)
                        let cleanPath = sourcePath
                            .replace(/^\//, '')
                            .replace(/^webpack:\/\/[^/]*\//, '')
                            .replace(/^webpack:\/\//, '')
                            .replace(/^\.\//, '')
                            .replace(/\?.*$/, '')
                            .replace(/[<>:"|?*]/g, '_');
                        
                        // Skip webpack internals (same filters as Node.js version)
                        if (cleanPath.includes('webpack/') || 
                            cleanPath.includes('node_modules/') ||
                            cleanPath.includes('webpack:///') ||
                            cleanPath.startsWith('(webpack)') ||
                            cleanPath.includes('webpack/bootstrap') ||
                            cleanPath.includes('webpack/runtime')) {
                            continue;
                        }
                        
                        // Skip empty paths
                        if (!cleanPath || cleanPath.length < 2) {
                            continue;
                        }
                        
                        const sourceFilename = `src/${cleanPath}`;
                        
                        this.downloadedFiles.set(sourceFilename, {
                            content: sourceContent,
                            size: sourceContent.length,
                            type: 'source',
                            url: null,
                            originalPath: sourcePath
                        });
                        
                        extractedCount++;
                    }
                }
            }
            
            return extractedCount;
            
        } catch (error) {
            this.log(`❌ Failed to parse source map: ${error.message}`);
            return 0;
        }
    }
    
    async findDynamicResources() {
        // Look for API endpoints and dynamic resources in the JavaScript code
        const apiEndpoints = new Set();
        
        for (const [filename, file] of this.downloadedFiles) {
            if (file.type === 'script' && typeof file.content === 'string') {
                // Look for API endpoints in the code
                const apiMatches = file.content.match(/['"`]\/api\/[^'"`\s]+['"`]/g);
                if (apiMatches) {
                    for (const match of apiMatches) {
                        const endpoint = match.slice(1, -1); // Remove quotes
                        const baseUrl = this.downloadedFiles.get('index.html').url;
                        try {
                            const fullUrl = new URL(endpoint, baseUrl).href;
                            apiEndpoints.add(fullUrl);
                        } catch (e) {}
                    }
                }
                
                // Look for other resource URLs
                const urlMatches = file.content.match(/['"`]https?:\/\/[^'"`\s]+['"`]/g);
                if (urlMatches) {
                    for (const match of urlMatches) {
                        const url = match.slice(1, -1); // Remove quotes
                        if (!this.downloadedUrls.has(url)) {
                            apiEndpoints.add(url);
                        }
                    }
                }
            }
        }
        
        this.log(`🔍 Found ${apiEndpoints.size} potential API endpoints`);
        
        // Try to download API endpoints
        for (const endpoint of apiEndpoints) {
            if (!this.isDownloading) break;
            
            try {
                await this.downloadSingleResource(endpoint);
                this.log(`✅ Downloaded API: ${endpoint}`);
            } catch (error) {
                // Many API endpoints might fail, that's OK
            }
        }
    }
    
    getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.split('/').pop() || 'index';
        } catch (e) {
            return 'resource';
        }
    }

    async finalizeDownload() {
        // Sort files and generate final statistics
        const totalFiles = this.downloadedFiles.size;
        let totalSize = 0;
        let sourceFiles = 0;
        let jsFiles = 0;
        let cssFiles = 0;
        let imageFiles = 0;
        
        for (const [filename, file] of this.downloadedFiles) {
            totalSize += file.size;
            
            if (filename.startsWith('src/')) sourceFiles++;
            else if (filename.endsWith('.js')) jsFiles++;
            else if (filename.endsWith('.css')) cssFiles++;
            else if (file.type === 'image') imageFiles++;
        }
        
        this.log(`📊 Final Statistics:`);
        this.log(`   Total Files: ${totalFiles}`);
        this.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        this.log(`   Source Files: ${sourceFiles}`);
        this.log(`   JavaScript Files: ${jsFiles}`);
        this.log(`   CSS Files: ${cssFiles}`);
        this.log(`   Image Files: ${imageFiles}`);
    }

    async fetchWithCORS(url) {
        // Enhanced CORS handling with multiple fallback strategies
        try {
            // Try direct fetch first
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                return response;
            }
        } catch (error) {
            // CORS failed, try proxy
        }
        
        // Fallback to CORS proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        // Create a fake Response object
        return {
            ok: true,
            status: 200,
            headers: new Map([['content-type', 'text/plain']]),
            text: () => Promise.resolve(data.contents),
            json: () => Promise.resolve(JSON.parse(data.contents)),
            arrayBuffer: () => Promise.resolve(new TextEncoder().encode(data.contents))
        };
    }

    getFileTypeFromContentType(contentType) {
        if (!contentType) return null;
        
        if (contentType.includes('javascript')) return 'script';
        if (contentType.includes('css')) return 'stylesheet';
        if (contentType.includes('image')) return 'image';
        if (contentType.includes('html')) return 'html';
        
        return 'other';
    }

    getFileTypeFromExtension(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const typeMap = {
            'js': 'script',
            'jsx': 'script',
            'ts': 'script',
            'tsx': 'script',
            'css': 'stylesheet',
            'scss': 'stylesheet',
            'sass': 'stylesheet',
            'less': 'stylesheet',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'svg': 'image',
            'webp': 'image',
            'ico': 'image',
            'html': 'html',
            'htm': 'html',
            'map': 'sourcemap'
        };
        
        return typeMap[ext] || 'other';
    }

    getProperFilename(url, contentType) {
        try {
            const urlObj = new URL(url);
            let pathname = urlObj.pathname;
            
            // Handle root paths
            if (!pathname || pathname === '/' || pathname.endsWith('/')) {
                if (contentType && contentType.includes('html')) {
                    return 'index.html';
                } else if (contentType && contentType.includes('css')) {
                    return 'index.css';
                } else if (contentType && contentType.includes('javascript')) {
                    return 'index.js';
                } else {
                    return 'index.bin';
                }
            }
            
            // Get the filename from the path
            let filename = pathname.split('/').pop();
            
            // Remove query parameters but preserve them if no extension
            const hasExtension = filename.includes('.');
            if (urlObj.search && !hasExtension) {
                // For URLs like /api/data?id=123, create a meaningful filename
                filename = filename + '_' + urlObj.search.slice(1).replace(/[=&]/g, '_').substring(0, 20);
            }
            
            filename = filename.split('?')[0]; // Remove query params from filename
            
            // Add extension based on content type if missing
            if (!hasExtension && contentType) {
                const extensions = {
                    'text/html': '.html',
                    'text/css': '.css',
                    'application/javascript': '.js',
                    'text/javascript': '.js',
                    'application/json': '.json',
                    'image/png': '.png',
                    'image/jpeg': '.jpg',
                    'image/gif': '.gif',
                    'image/svg+xml': '.svg',
                    'image/webp': '.webp',
                    'font/woff': '.woff',
                    'font/woff2': '.woff2',
                    'font/ttf': '.ttf',
                    'application/font-woff': '.woff',
                    'application/font-woff2': '.woff2',
                    'application/xml': '.xml',
                    'text/xml': '.xml'
                };
                
                for (const [mimeType, ext] of Object.entries(extensions)) {
                    if (contentType.includes(mimeType.split('/')[1])) {
                        filename += ext;
                        break;
                    }
                }
                
                if (!filename.includes('.')) {
                    filename += '.bin';
                }
            }
            
            // Clean up filename
            filename = filename.replace(/[<>:"|?*]/g, '_');
            
            return filename || 'resource.bin';
            
        } catch (e) {
            return `resource_${Date.now()}.bin`;
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

    showResults() {
        document.getElementById('results-section').style.display = 'block';
        
        const totalFiles = this.downloadedFiles.size;
        let totalSize = 0;
        let sourceFilesCount = 0;
        
        for (const [filename, file] of this.downloadedFiles) {
            totalSize += file.size;
            if (filename.startsWith('src/')) {
                sourceFilesCount++;
            }
        }
        
        const downloadTime = Math.round((Date.now() - this.startTime) / 1000);
        
        document.getElementById('total-files').textContent = totalFiles;
        document.getElementById('total-size').textContent = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
        document.getElementById('download-time').textContent = `${downloadTime}s`;
        
        // Update source files count if element exists
        const sourceFilesElement = document.getElementById('source-files');
        if (sourceFilesElement) {
            sourceFilesElement.textContent = sourceFilesCount;
        }
        
        this.updateFileList();
        this.showSuccess(`Successfully downloaded ${totalFiles} files using advanced extraction!`);
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
        
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-container').innerHTML = '';
        document.getElementById('start-download').disabled = false;
    }
}

export default AdvancedWebResourceDownloader;
