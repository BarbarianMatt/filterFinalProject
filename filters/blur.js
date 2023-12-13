

export default function applyBlur(imageData, parameters) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = parseInt(parameters.radius, 10);
    const kernelSize = radius * 2 + 1;
    const kernel = createGaussianKernel(radius);
    const copy = new Uint8ClampedArray(data);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let red = 0;
            let green = 0;
            let blue = 0;

            for (let i = 0; i < kernelSize; i++) {
                for (let j = 0; j < kernelSize; j++) {
                    const pixelX = x + i - radius;
                    const pixelY = y + j - radius;

                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                        const index = (pixelY * width + pixelX) * 4;
                        const weight = kernel[i][j];
                        red += copy[index] * weight;
                        green += copy[index + 1] * weight;
                        blue += copy[index + 2] * weight;
                    }
                }
            }

            const currentIndex = (y * width + x) * 4;
            data[currentIndex] = Math.round(red);
            data[currentIndex + 1] = Math.round(green);
            data[currentIndex + 2] = Math.round(blue);
        }
    }
}

function createGaussianKernel(radius) {
    if (radius === 0) {
        // Edge case for radius zero
        return [[1]];
    }
    const kernelSize = radius * 2 + 1;
    const kernel = [];
    for (let i = 0; i < kernelSize; i++) {
        const row = [];
        for (let j = 0; j < kernelSize; j++) {
            const distance = Math.sqrt((i - radius) ** 2 + (j - radius) ** 2);
            const weight = Math.exp(-(distance ** 2) / (2 * radius ** 2)) / (2 * Math.PI * radius ** 2);
            row.push(weight);
        }
        kernel.push(row);
    }
    // Normalize the kernel
    const sum = kernel.flat().reduce((acc, val) => acc + val, 0);
    for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
            kernel[i][j] /= sum;
        }
    }
    return kernel;
}

