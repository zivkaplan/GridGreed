<script>
    // Ruler values and sync logic
    let widthValue = 0;
    let heightValue = 0;
    let ratio = null;
    let suppressSync = false;
    let canvasRect = { width: 0, height: 0 };

    // Update ruler values and ratio when image changes
    $: if (imageObj) {
        const w = imageObj.naturalWidth;
        const h = imageObj.naturalHeight;
        if (w && h) {
            widthValue = w;
            heightValue = h;
            ratio = (
                Math.min(widthValue, heightValue) /
                Math.max(widthValue, heightValue)
            ).toFixed(3);
        }
    }

    // Keep ratio in sync when widthValue or heightValue changes
    $: if (!suppressSync && widthValue > 0 && heightValue > 0) {
        ratio = (
            Math.min(widthValue, heightValue) /
            Math.max(widthValue, heightValue)
        ).toFixed(3);
    }

    function onWidthInput(e) {
        suppressSync = true;
        widthValue = parseFloat(e.target.value) || 0;
        if (heightValue > 0) {
            if (widthValue >= heightValue) {
                heightValue = +(
                    heightValue *
                    (widthValue / widthValue)
                ).toFixed(2);
            } else {
                heightValue = +(
                    widthValue *
                    (heightValue / widthValue)
                ).toFixed(2);
            }
        }
        suppressSync = false;
    }

    function onHeightInput(e) {
        suppressSync = true;
        heightValue = parseFloat(e.target.value) || 0;
        if (widthValue < 0) {
            return;
        }

        if (heightValue >= widthValue) {
            widthValue = +(widthValue * (heightValue / heightValue)).toFixed(2);
        } else {
            widthValue = +(heightValue * (widthValue / heightValue)).toFixed(2);
        }
        suppressSync = false;
    }

    // Draw a vertical black line to the right of the canvas for the height ruler
    function drawHeightRulerLine(w, h) {
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
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
        ctx.lineWidth = 3;
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
    let imageFile = null;
    let imageUrl = "";
    let imageObj = null;
    let canvasEl;
    let ctx;
    let strokeColor = "#ff0000";
    let strokeWidth = 2;

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        console.log("[File] Selected:", file.name, file.size, file.type);
        imageFile = file;
        // Revoke previous object URL to avoid memory leaks
        if (imageUrl) {
            console.log("[Memory] Revoking previous object URL");
            URL.revokeObjectURL(imageUrl);
        }
        imageUrl = URL.createObjectURL(file);
        console.log("[File] Created object URL:", imageUrl);
        loadImage();
    }

    import { onDestroy } from "svelte";

    // Revoke object URL on component destroy
    onDestroy(() => {
        console.log("[Memory] Component destroyed, revoking object URL");
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
    });

    // Load image into an Image object for canvas drawing
    function loadImage() {
        if (!imageUrl) return;
        const img = new window.Image();
        img.onload = () => {
            imageObj = img;
            console.log(
                "[Image] Loaded:",
                img.naturalWidth,
                "x",
                img.naturalHeight
            );
            drawCanvas();
        };
        img.onerror = (e) => {
            imageObj = null;
            console.error("[Image] Failed to load", e);
        };
        img.src = imageUrl;
    }

    // Redraw canvas when image or controls change
    $: if (imageObj || strokeColor || strokeWidth) {
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
        // Only update canvasRect when the image changes (for initial layout, not on every overlay change)
        if (imageObj && canvasEl) {
            const rect = canvasEl.getBoundingClientRect();
            canvasRect = { width: rect.width, height: rect.height };
        }
        ctx.restore();
        console.log(
            "[Canvas] Redrawn with color:",
            strokeColor,
            "width:",
            strokeWidth
        );
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
                console.error("[Download] Failed to create blob");
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "great-grid.png";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("[Download] Blob URL revoked");
            }, 100);
            console.log("[Download] Image downloaded");
        }, "image/png");
    }
</script>

<div>
    <input
        type="file"
        accept="image/*"
        capture="environment"
        on:change={handleFileChange}
    />
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
                            style="position: absolute; top: 0; right: -56px; height: 100%; min-width: 48px; display: flex; align-items: center;"
                        >
                            <div
                                style="position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background: #000; transform: translateX(-50%);"
                            ></div>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                bind:value={heightValue}
                                on:input={onHeightInput}
                                style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 48px; background: #fff; border: 2px solid #000; text-align: center; z-index: 10; pointer-events: auto;"
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
                            on:input={onWidthInput}
                            style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 48px; background: #fff; border: 2px solid #000; text-align: center; z-index: 10; pointer-events: auto;"
                        />
                    </div>
                {/if}
            </div>
        </div>
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
            <button type="button" on:click={downloadCanvas}>Download</button>
        </div>
        {#if ratio}
            <div style="margin-bottom: 1rem; font-size: 1.1em;">
                <strong>Ratio (short/long):</strong>
                {ratio}
            </div>
        {/if}
    {/if}
</div>
