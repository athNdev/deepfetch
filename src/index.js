import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import AdvancedWebResourceDownloader from './advanced-downloader.js';

class WebResourceDownloader extends AdvancedWebResourceDownloader {
    // This class now inherits all functionality from AdvancedWebResourceDownloader
}

// Initialize the advanced downloader when the page loads
window.downloader = new WebResourceDownloader();

console.log('🚀 Advanced Web Resource Downloader initialized!');
