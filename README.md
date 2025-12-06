# Grid Greed

Mobile-first web app for art students: upload a photo, overlay grid and diagonals, adjust line style, and download/share the result.

## 🚀 Live Demo

Visit the live app: [https://zivkaplan.github.io/GridGreed/](https://zivkaplan.github.io/GridGreed/)

## Quick Start

This is a vanilla JavaScript app - no build step required!

### Local Development

Simply open `index.html` in your browser, or use a simple HTTP server:

```sh
# Using Python 3
python3 -m http.server 8000

# Or using Node.js
npx serve

# Or using PHP
php -S localhost:8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Features
- ✅ Upload/capture photo (mobile-first)
- ✅ Draw center lines and diagonals in each quadrant
- ✅ Adjust line color and width
- ✅ Show aspect ratio
- ✅ Interactive dimension rulers
- ✅ Download processed image
- ✅ Canvas rendering and export

## GitHub Pages Deployment

The app automatically deploys to GitHub Pages when you push to the `main` branch.

### Manual Setup

1. Go to your repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Build and deployment", select:
   - Source: "GitHub Actions"
4. Push to main branch - the app will deploy automatically!

## Technology

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas API
- CSS3
- No build tools required

## Project Structure

```
.
├── index.html          # Main HTML file
├── app.js             # Application logic
├── styles.css         # Styling
└── .github/
    └── workflows/
        └── deploy.yml # GitHub Actions deployment
```

