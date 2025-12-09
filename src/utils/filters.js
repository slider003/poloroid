export const applyPolaroidFilter = (imageData) => {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Sepia (0.4) - Blend 40% Sepia with Original
        // Sepia formulas
        const sR = (r * 0.393) + (g * 0.769) + (b * 0.189);
        const sG = (r * 0.349) + (g * 0.686) + (b * 0.168);
        const sB = (r * 0.272) + (g * 0.534) + (b * 0.131);

        r = r * 0.6 + sR * 0.4;
        g = g * 0.6 + sG * 0.4;
        b = b * 0.6 + sB * 0.4;

        // 2. Contrast (1.2)
        // Factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
        // But simple linear approximation: (C - 128) * contrast + 128
        r = (r - 128) * 1.2 + 128;
        g = (g - 128) * 1.2 + 128;
        b = (b - 128) * 1.2 + 128;

        // 3. Brightness (1.1)
        r = r * 1.1;
        g = g * 1.1;
        b = b * 1.1;

        // 4. Saturate (0.8) - Blend 80% Original with Grayscale
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = r * 0.8 + gray * 0.2;
        g = g * 0.8 + gray * 0.2;
        b = b * 0.8 + gray * 0.2;

        // Clamp values
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
    }

    return imageData;
};
