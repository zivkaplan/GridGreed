<script>
    import { onDestroy } from "svelte";

    // Constants
    const MAX_IMAGE_SIZE = 10000; // Max width or height in pixels
    const RULER_OFFSET = 56;
    const RULER_WIDTH = 48;
    const RULER_LINE_WIDTH = 3;

    // State
    let widthValue = 0;
    let heightValue = 0;
    let ratio = null;
    let imgRatio = null; // always width / height

    let imageUrl = "";
    let imageObj = null;
    let canvasEl;
    let ctx;
    let strokeColor = "#ff0000";
    let strokeWidth = 2;
    let errorMessage = "";

    // Update ruler values and ratio only when the image changes
    let lastImageSrc = null;
    $: if (imageObj && imageObj.src !== lastImageSrc) {
        lastImageSrc = imageObj.src;
        const w = imageObj.naturalWidth;
        const h = imageObj.naturalHeight;
        if (w && h) {
            widthValue = w;
            heightValue = h;
            imgRatio = w / h;
            ratio = (
                Math.min(widthValue, heightValue) /
                Math.max(widthValue, heightValue)
            ).toFixed(2);
        }
    }
    function onWidthBoxInput(e) {
        const val = parseFloat(e.target.value);
        // Only update if valid positive number and ratio exists
        if (!isNaN(val) && val > 0 && imgRatio && imgRatio > 0) {
            widthValue = val;
            heightValue = +(val / imgRatio).toFixed(2);
        }
    }

    function onHeightBoxInput(e) {
        const val = parseFloat(e.target.value);
        // Only update if valid positive number and ratio exists
        if (!isNaN(val) && val > 0 && imgRatio && imgRatio > 0) {
            heightValue = val;
            widthValue = +(val * imgRatio).toFixed(2);
        }
    }

    // Keep ratio in sync when widthValue or heightValue changes
    $: if (widthValue > 0 && heightValue > 0) {
        ratio = (
            Math.min(widthValue, heightValue) /
            Math.max(widthValue, heightValue)
        ).toFixed(3);
    }

    // Draw a vertical black line to the right of the canvas for the height ruler
    function drawHeightRulerLine(w, h) {
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = RULER_LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(w + 12, 0);
        ctx.lineTo(w + 12, h);
        ctx.stroke();
        ctx.restore();
    }

    // Draw a horizontal black line below the canvas for the width ruler
    function drawWidthRulerLine(w, h) {
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = RULER_LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(0, h + 12);
        ctx.lineTo(w, h + 12);
        ctx.stroke();
        ctx.restore();
    }

    function drawRulers(w, h) {
        drawHeightRulerLine(w, h);
        drawWidthRulerLine(w, h);
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            errorMessage = "Please select a valid image file.";
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            errorMessage =
                "Image file is too large. Please select an image under 10MB.";
            return;
        }

        errorMessage = "";

        // Revoke previous object URL to avoid memory leaks
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        imageUrl = URL.createObjectURL(file);
        loadImage();
    }

    // Revoke object URL on component destroy
    onDestroy(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
    });

    // Load image into an Image object for canvas drawing
    function loadImage() {
        if (!imageUrl) return;
        const img = new window.Image();
        img.onload = () => {
            // Validate image dimensions
            if (
                img.naturalWidth > MAX_IMAGE_SIZE ||
                img.naturalHeight > MAX_IMAGE_SIZE
            ) {
                errorMessage = `Image is too large. Maximum size is ${MAX_IMAGE_SIZE}x${MAX_IMAGE_SIZE} pixels.`;
                URL.revokeObjectURL(imageUrl);
                imageUrl = "";
                return;
            }
            imageObj = img;
            drawCanvas();
        };
        img.onerror = () => {
            imageObj = null;
            errorMessage = "Failed to load image. Please try a different file.";
            URL.revokeObjectURL(imageUrl);
            imageUrl = "";
        };
        img.src = imageUrl;
    }

    // Redraw canvas when image or controls change
    $: if (imageObj && strokeColor && strokeWidth) {
        drawCanvas();
    }

    function drawCanvas() {
        if (!canvasEl || !imageObj) return;
        // Set canvas size to image size
        canvasEl.width = imageObj.naturalWidth;
        canvasEl.height = imageObj.naturalHeight;
        ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.drawImage(imageObj, 0, 0);
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        const w = canvasEl.width;
        const h = canvasEl.height;
        // Center lines
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Quadrant diagonals
        // Top-left
        drawDiagonals(0, 0, w / 2, h / 2);
        // Top-right
        drawDiagonals(w / 2, 0, w, h / 2);
        // Bottom-left
        drawDiagonals(0, h / 2, w / 2, h);
        // Bottom-right
        drawDiagonals(w / 2, h / 2, w, h);

        drawRulers(w, h);
        ctx.restore();
    }

    function drawDiagonals(x0, y0, x1, y1) {
        ctx.beginPath();
        // Diagonal TL to BR
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        // Diagonal TR to BL
        ctx.moveTo(x1, y0);
        ctx.lineTo(x0, y1);
        ctx.stroke();
    }

    function downloadCanvas() {
        if (!canvasEl) return;
        canvasEl.toBlob((blob) => {
            if (!blob) {
                errorMessage = "Failed to generate download. Please try again.";
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `grid-overlay-${Date.now()}.png`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();

            // Clean up immediately after click
            document.body.removeChild(a);
            // Revoke URL after a short delay to ensure download starts
            requestAnimationFrame(() => {
                URL.revokeObjectURL(url);
            });
        }, "image/png");
    }
</script>

<div>
    <input
        type="file"
        accept="image/*"
        capture="environment"
        on:change={handleFileChange}
        aria-label="Upload an image to overlay with grid"
    />
    {#if errorMessage}
        <div
            role="alert"
            style="color: #d32f2f; padding: 1rem; margin: 1rem 0; background: #ffebee; border-radius: 4px;"
        >
            {errorMessage}
        </div>
    {/if}
    {#if imageUrl}
        <div
            style="display: flex; flex-direction: row; align-items: flex-start; justify-content: center; margin: 1rem 0; width: 100%; max-width: 100vw; box-sizing: border-box;"
        >
            <div
                style="position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 100vw;"
            >
                <div style="position: relative; width: 100%; max-width: 100vw;">
                    <canvas
                        bind:this={canvasEl}
                        style="width: 100%; height: auto; max-width: 100vw; border: 1px solid #ccc; display: block;"
                    ></canvas>
                    {#if imageObj}
                        <!-- Right vertical ruler line and box, scaled with canvas -->
                        <div
                            style="position: absolute; top: 0; right: -{RULER_OFFSET}px; height: 100%; min-width: {RULER_WIDTH}px; display: flex; align-items: center;"
                        >
                            <div
                                style="position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background: #000; transform: translateX(-50%);"
                            ></div>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                bind:value={heightValue}
                                on:input={onHeightBoxInput}
                                aria-label="Image height"
                                style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: {RULER_WIDTH}px; background: #fff; border: 2px solid #000; text-align: center; z-index: 10; pointer-events: auto;"
                            />
                        </div>
                    {/if}
                </div>
                {#if imageObj}
                    <!-- Bottom horizontal ruler line and box, scaled with canvas -->
                    <div
                        style="position: relative; width: 100%; max-width: 100vw; height: 48px;"
                    >
                        <div
                            style="position: absolute; left: 0; top: 50%; width: 100%; height: 3px; background: #000; transform: translateY(-50%);"
                        ></div>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            bind:value={widthValue}
                            on:input={onWidthBoxInput}
                            aria-label="Image width"
                            style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: {RULER_WIDTH}px; background: #fff; border: 2px solid #000; text-align: center; z-index: 10; pointer-events: auto;"
                        />
                    </div>
                {/if}
            </div>
        </div>
        {#if ratio}
            <div style="margin-bottom: 1rem; font-size: 1.1em;">
                <strong>Ratio (short/long):</strong>
                {ratio}
            </div>
        {/if}
        <div
            style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;"
        >
            <label
                >Color:
                <input type="color" bind:value={strokeColor} />
            </label>
            <label
                >Width:
                <input type="range" min="1" max="20" bind:value={strokeWidth} />
                <span>{strokeWidth}px</span>
            </label>
        </div>
        <button type="button" on:click={downloadCanvas}>Download</button>
    {/if}
</div>
