export default function applyQuantizationDither(imageData, parameters) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const levels = parseInt(parameters.levels, 10);
    const n = 2**parameters.n;
    const ditherTexture = createDitherTexture(n);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const currentIndex = (y * width + x) * 4;

            // Get the original RGB values
            let originalRed = data[currentIndex];
            let originalGreen = data[currentIndex + 1];
            let originalBlue = data[currentIndex + 2];
            const ditherValue = parameters.spread*(ditherTexture[x%n][y%n]/(n**2)-0.5)*256;
            const newRed = originalRed+ditherValue;
            const newGreen = originalGreen+ditherValue;
            const newBlue = originalBlue+ditherValue;

            // Quantize the RGB values
            const quantizedRed = Math.max(Math.min(Math.floor(Math.floor(newRed/256.0*(levels-1)+0.5)/(levels-1)*256),255),0);
            const quantizedGreen =Math.max(Math.min(Math.floor(Math.floor(newGreen/256.0*(levels-1)+0.5)/(levels-1)*256),255),0);
            const quantizedBlue = Math.max(Math.min(Math.floor(Math.floor(newBlue/256.0*(levels-1)+0.5)/(levels-1)*256),255),0);

            // Apply quantized and dithered values to the pixel
            data[currentIndex] = quantizedRed;
            data[currentIndex + 1] = quantizedGreen;
            data[currentIndex + 2] = quantizedBlue;
        }
    }
}

function createDitherTexture(m) {
    if (m==2){
        const ditherTexture = [
            [0, 2],
            [3, 1]
        ];
        return ditherTexture;
    }
    else if (m == 4){
        const ditherTexture = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ];
        return ditherTexture;
    }
    else {
        const ditherTexture = [
            [0, 32, 8, 40, 2, 34, 10, 42],
            [48, 16, 56, 24, 50, 18, 58, 26],  
            [12, 44,  4, 36, 14, 46,  6, 38], 
            [60, 28, 52, 20, 62, 30, 54, 22],  
            [3, 35, 11, 43,  1, 33,  9, 41],  
            [51, 19, 59, 27, 49, 17, 57, 25], 
            [15, 47,  7, 39, 13, 45,  5, 37], 
            [63, 31, 55, 23, 61, 29, 53, 21]
        ];
        return ditherTexture;
    }
}
