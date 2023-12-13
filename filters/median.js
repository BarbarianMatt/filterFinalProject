export default function applyMedianFilter(imageData, parameters) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = parseInt(parameters.radius, 10);
    const kernelSize = radius * 2 + 1;
    const copy = new Uint8ClampedArray(data);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const redValues = [];
            const greenValues = [];
            const blueValues = [];

            for (let i = 0; i < kernelSize; i++) {
                for (let j = 0; j < kernelSize; j++) {
                    const pixelX = x + i - radius;
                    const pixelY = y + j - radius;

                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                        const index = (pixelY * width + pixelX) * 4;
                        redValues.push(copy[index]);
                        greenValues.push(copy[index + 1]);
                        blueValues.push(copy[index + 2]);
                    }
                }
            }

            redValues.sort((a, b) => a - b);
            greenValues.sort((a, b) => a - b);
            blueValues.sort((a, b) => a - b);

            const currentIndex = (y * width + x) * 4;
            data[currentIndex] = redValues[Math.floor(redValues.length / 2)];
            data[currentIndex + 1] = greenValues[Math.floor(greenValues.length / 2)];
            data[currentIndex + 2] = blueValues[Math.floor(blueValues.length / 2)];
        }
    }
}
