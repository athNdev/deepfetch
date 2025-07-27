# Web Resource Downloader

A powerful WASM-based web application that runs locally in your browser to download and extract all resources from any website. This tool provides a modern, user-friendly interface for web scraping and resource extraction.

## 🚀 Features

### Core Functionality
- **Complete Resource Extraction**: Downloads HTML, CSS, JavaScript, images, fonts, and more
- **Source Map Processing**: Automatically extracts original source files from JavaScript source maps
- **XHR/API Capture**: Downloads dynamic content loaded via AJAX/fetch requests
- **DOM Resource Mining**: Finds and downloads resources referenced in the DOM
- **Interactive Content Loading**: Triggers page interactions to load dynamic content

### Advanced Features
- **Real-time Progress Tracking**: Visual progress bars and detailed logging
- **Selective Resource Filtering**: Choose which types of resources to download
- **ZIP Archive Creation**: Bundle all downloaded files into a convenient ZIP archive
- **Individual File Download**: Download specific files separately
- **CORS Proxy Support**: Automatically handles cross-origin resource sharing issues
- **Modern UI**: Beautiful, responsive interface with dark theme logging

### Browser-Based Operation
- **No Installation Required**: Runs entirely in your web browser
- **Local Processing**: All operations happen locally for privacy and security
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Mobile Friendly**: Responsive design works on tablets and smartphones

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ installed on your system
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Quick Start

1. **Clone or extract the project**:
   ```bash
   cd web-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   The app will automatically open at `http://localhost:8080`

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory, which you can serve from any web server.

## 🎯 How to Use

### Basic Usage

1. **Enter Target URL**: Input the website URL you want to download resources from
2. **Configure Options**: 
   - ✅ Extract source files from source maps
   - ✅ Download XHR/API responses
   - ✅ Trigger page interactions
   - ✅ Extract DOM resources

3. **Select Resource Types**:
   - Images (PNG, JPG, SVG, etc.)
   - Scripts (JS files)
   - Stylesheets (CSS files)
   - Fonts (WOFF, TTF, etc.)

4. **Set Timeout**: Adjust the timeout for resource loading (10-120 seconds)

5. **Start Download**: Click the "Start Download" button and watch the progress

### Advanced Features

- **Real-time Monitoring**: Watch the download progress with detailed logs
- **Selective Downloads**: Use checkboxes to filter specific resource types
- **ZIP Export**: Download all resources as a single ZIP file
- **Individual Files**: Download specific files using the download buttons
- **Error Handling**: Automatic retry logic for failed downloads

## 📁 Downloaded Content Structure

The downloader organizes files in a logical structure:

```
downloads/
├── index.html              # Main page HTML
├── static/
│   ├── css/
│   │   └── main.css        # Stylesheets
│   └── js/
│       ├── main.js         # JavaScript files
│       └── main.js.map     # Source maps
├── src/                    # Extracted source files
│   ├── components/
│   ├── pages/
│   └── services/
├── images/                 # Images and media
├── fonts/                  # Font files
└── api/                    # API responses (JSON)
```

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure JavaScript with modern ES6+ features
- **Bundling**: Webpack 5 with optimized configuration
- **Resource Processing**: JSZip for archive creation, File-saver for downloads
- **CORS Handling**: Automatic fallback to proxy services when needed
- **Error Recovery**: Robust error handling with retry mechanisms

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Limitations
- **CORS Restrictions**: Some sites may block cross-origin requests
- **Dynamic Content**: JavaScript-heavy sites may require multiple interaction attempts
- **Rate Limiting**: Some servers may throttle rapid requests
- **File Size**: Very large files may cause memory issues in browser

## 🛡️ Privacy & Security

- **Local Processing**: All operations happen in your browser
- **No Data Collection**: No analytics or tracking
- **No Server Communication**: Downloads happen directly from source to browser
- **HTTPS Support**: Secure connections for all external requests

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**:
- The app automatically tries proxy services
- Some sites block all cross-origin requests
- Try accessing the site directly first

**Slow Downloads**:
- Increase timeout in settings
- Check your internet connection
- Some sites rate-limit requests

**Missing Resources**:
- Enable all interaction options
- Some resources load dynamically
- Try increasing the timeout

**Large Memory Usage**:
- Download smaller sites first
- Clear browser cache
- Close other browser tabs

## 📈 Performance Tips

1. **Start Small**: Test with simple websites first
2. **Selective Filtering**: Disable resource types you don't need
3. **Timeout Tuning**: Adjust timeout based on site complexity
4. **Memory Management**: Close the app tab after large downloads

## 🤝 Contributing

This is a standalone web application. To contribute:

1. Fork the repository
2. Make your changes
3. Test thoroughly across browsers
4. Submit a pull request

## 📜 License

MIT License - feel free to use, modify, and distribute.

## 🆘 Support

For issues and questions:
- Check the browser console for detailed error messages
- Ensure you have a stable internet connection
- Try the download with a simpler website first
- Verify the target URL is accessible

---

**Happy Resource Downloading! 🎉**
