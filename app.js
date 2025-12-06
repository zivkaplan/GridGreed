// Constants
const MAX_IMAGE_SIZE = 10000; // Max width or height in pixels
const RULER_OFFSET = 56;
const RULER_WIDTH = 48;
const RULER_LINE_WIDTH = 3;

// State
let state = {
    widthValue: 0,
    heightValue: 0,
    ratio: null,
    imgRatio: null, // always width / height
    imageUrl: "",
    imageObj: null,
    strokeColor: "#ff0000",
    strokeWidth: 2,
    errorMessage: ""
};

// DOM elements
let elements = {};

// Initialize the application
function init() {
    // Cache DOM elements
    elements = {
        fileInput: document.getElementById('file-input'),
        errorDiv: document.getElementById('error-message'),
        canvasContainer: document.getElementById('canvas-container'),
        canvas: document.getElementById('main-canvas'),
        heightInput: document.getElementById('height-input'),
        widthInput: document.getElementById('width-input'),
        ratioDisplay: document.getElementById('ratio-display'),
        colorInput: document.getElementById('color-input'),
        strokeWidthInput: document.getElementById('stroke-width-input'),
        strokeWidthDisplay: document.getElementById('stroke-width-display')
    };

    // Attach event listeners
    elements.fileInput.addEventListener('change', handleFileChange);
    elements.heightInput.addEventListener('input', onHeightBoxInput);
    elements.widthInput.addEventListener('input', onWidthBoxInput);
    elements.colorInput.addEventListener('input', (e) => {
        state.strokeColor = e.target.value;
        drawCanvas();
    });
    elements.strokeWidthInput.addEventListener('input', (e) => {
        state.strokeWidth = parseInt(e.target.value);
        elements.strokeWidthDisplay.textContent = `${state.strokeWidth}px`;
        drawCanvas();
    });
    // Dropdown download options
    document.getElementById('download-file').addEventListener('click', (e) => {
        e.preventDefault();
        downloadCanvas('file');
    });
    document.getElementById('download-photo').addEventListener('click', (e) => {
        e.preventDefault();
        downloadCanvas('photo');
    });
}

// Create HTML structure

// Handle file selection
function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file.");
        return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showError("Image file is too large. Please select an image under 10MB.");
        return;
    }

    clearError();

    // Revoke previous object URL to avoid memory leaks
    if (state.imageUrl) {
        URL.revokeObjectURL(state.imageUrl);
    }
    state.imageUrl = URL.createObjectURL(file);
    loadImage();
}

// Load image into an Image object for canvas drawing
function loadImage() {
    if (!state.imageUrl) return;
    const img = new Image();
    img.onload = () => {
        // Validate image dimensions
        if (
            img.naturalWidth > MAX_IMAGE_SIZE ||
            img.naturalHeight > MAX_IMAGE_SIZE
        ) {
            showError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE}x${MAX_IMAGE_SIZE} pixels.`);
            URL.revokeObjectURL(state.imageUrl);
            state.imageUrl = "";
            return;
        }
        state.imageObj = img;
        updateImageDimensions();
        showCanvas();
        drawCanvas();
    };
    img.onerror = () => {
        state.imageObj = null;
        showError("Failed to load image. Please try a different file.");
        URL.revokeObjectURL(state.imageUrl);
        state.imageUrl = "";
    };
    img.src = state.imageUrl;
}

// Update image dimensions and ratio
function updateImageDimensions() {
    if (!state.imageObj) return;
    const w = state.imageObj.naturalWidth;
    const h = state.imageObj.naturalHeight;
    if (w && h) {
        state.widthValue = w;
        state.heightValue = h;
        state.imgRatio = w / h;
        state.ratio = (
            Math.min(state.widthValue, state.heightValue) /
            Math.max(state.widthValue, state.heightValue)
        ).toFixed(3);
        
        // Update UI
        elements.heightInput.value = state.heightValue;
        elements.widthInput.value = state.widthValue;
        elements.ratioDisplay.textContent = `Ratio (short/long): ${state.ratio}`;
    }
}

// Handle width input
function onWidthBoxInput(e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && state.imgRatio && state.imgRatio > 0) {
        state.widthValue = val;
        state.heightValue = +(val / state.imgRatio).toFixed(2);
        elements.heightInput.value = state.heightValue;
        updateRatio();
    }
}

// Handle height input
function onHeightBoxInput(e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && state.imgRatio && state.imgRatio > 0) {
        state.heightValue = val;
        state.widthValue = +(val * state.imgRatio).toFixed(2);
        elements.widthInput.value = state.widthValue;
        updateRatio();
    }
}

// Update ratio display
function updateRatio() {
    if (state.widthValue > 0 && state.heightValue > 0) {
        state.ratio = (
            Math.min(state.widthValue, state.heightValue) /
            Math.max(state.widthValue, state.heightValue)
        ).toFixed(3);
        elements.ratioDisplay.textContent = `Ratio (short/long): ${state.ratio}`;
    }
}

// Draw canvas with grid overlay
function drawCanvas() {
    if (!elements.canvas || !state.imageObj) return;
    
    const canvas = elements.canvas;
    canvas.width = state.imageObj.naturalWidth;
    canvas.height = state.imageObj.naturalHeight;
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.imageObj, 0, 0);
    ctx.save();
    ctx.strokeStyle = state.strokeColor;
    ctx.lineWidth = state.strokeWidth;

    const w = canvas.width;
    const h = canvas.height;
    
    // Center lines
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Quadrant diagonals
    drawDiagonals(ctx, 0, 0, w / 2, h / 2);
    drawDiagonals(ctx, w / 2, 0, w, h / 2);
    drawDiagonals(ctx, 0, h / 2, w / 2, h);
    drawDiagonals(ctx, w / 2, h / 2, w, h);

    drawRulers(ctx, w, h);
    ctx.restore();
}

// Draw diagonal lines in a quadrant
function drawDiagonals(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    // Diagonal TL to BR
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    // Diagonal TR to BL
    ctx.moveTo(x1, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
}

// Draw ruler lines
function drawRulers(ctx, w, h) {
    drawHeightRulerLine(ctx, w, h);
    drawWidthRulerLine(ctx, w, h);
}

// Draw vertical ruler line
function drawHeightRulerLine(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = RULER_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(w + 12, 0);
    ctx.lineTo(w + 12, h);
    ctx.stroke();
    ctx.restore();
}

// Draw horizontal ruler line
function drawWidthRulerLine(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = RULER_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, h + 12);
    ctx.lineTo(w, h + 12);
    ctx.stroke();
    ctx.restore();
}

// Download canvas as PNG
function downloadCanvas() {
    if (!elements.canvas) return;
    let mode = arguments[0] || 'file';
    elements.canvas.toBlob((blob) => {
        if (!blob) {
            showError("Failed to generate image. Please try again.");
            return;
        }
        const url = URL.createObjectURL(blob);
        if (mode === 'file') {
            const a = document.createElement("a");
            a.href = url;
            a.download = `grid-overlay-${Date.now()}.png`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            requestAnimationFrame(() => {
                URL.revokeObjectURL(url);
            });
        } else if (mode === 'photo') {
            window.open(url, '_blank');
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000);
        }
    }, "image/png");
}

// Show error message
function showError(message) {
    state.errorMessage = message;
    elements.errorDiv.textContent = message;
    elements.errorDiv.style.display = 'block';
}

// Clear error message
function clearError() {
    state.errorMessage = "";
    elements.errorDiv.textContent = "";
    elements.errorDiv.style.display = 'none';
}

// Show canvas container
function showCanvas() {
    elements.canvasContainer.style.display = 'block';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (state.imageUrl) {
        URL.revokeObjectURL(state.imageUrl);
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
