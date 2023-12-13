export default function applyGeneralizedKuwahara(imageData, parameters) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;


    const kernelRadius = parseInt(parameters.kernelRadius, 10);
    const N = 8;
    const hardness = parameters.hardness*10;
    const q = parameters.q;

    let zeta = 2 / kernelRadius;
    let zeroCrossing = 1.5*Math.PI/8;
    let eta = (zeta + Math.cos(zeroCrossing)) / (Math.sin(zeroCrossing) * Math.sin(zeroCrossing));

    let n=0;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const pixelIndex = (y * width + x) * 4;
            const color = [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]];
            let m=[];
            let s=[];
            for (let k = 0; k < N; k++) {
                m.push([0.0,0.0,0.0,0.0]);
                s.push([0.0,0.0,0.0]);
            }
            
            
            for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                    let vx = kx / kernelRadius;
                    let vy = ky / kernelRadius;

                    const cx = Math.max(0, Math.min(width-1, x+kx));
                    const cy = Math.max(0, Math.min(height-1, y+ky));

                    const c = getPixelColor(imageData, cx, cy);

                    let vxx = zeta - eta * vx * vx;
                    let vyy = zeta - eta * vy * vy;
                    let w=new Array(8);
                    let sum=0;

                    let weights = [
                        Math.max(0, vy + vxx),
                        Math.max(0, -vx + vyy),
                        Math.max(0, -vy + vxx),
                        Math.max(0, vx + vyy),
                    ];

                    for (let k = 0; k < 4; k++){
                        w[k*2]=weights[k]**2;
                        sum+=w[k*2];
                    }

                    vx = Math.sqrt(2.0) / 2.0 * (vx - vy);
                    vy = Math.sqrt(2.0) / 2.0 * (vx + vy);
                    vxx = zeta - eta * vx * vx
                    vyy = zeta - eta * vy * vy;

                    weights = [
                        Math.max(0, vy + vxx),
                        Math.max(0, -vx + vyy),
                        Math.max(0, -vy + vxx),
                        Math.max(0, vx + vyy),
                    ];

                    for (let k = 0; k < 4; k++){
                        w[k*2+1]=weights[k]**2;
                        sum+=w[k*2+1];
                    }
                    const g = Math.exp(-3.125 * (vx * vx + vy * vy)) / sum;

                    for (let k = 0; k < 8; ++k) {
                        const wk = w[k] * g;
                        m[k]=[m[k][0]+c[0]*wk,m[k][1]+c[1]*wk,m[k][2]+c[2]*wk,m[k][3]+wk];
                        s[k]=[s[k][0]+c[0]**2*wk, s[k][1]+c[1]**2*wk, s[k][2]+c[2]**2*wk];
                    }
                    
                }
            }
            
            let outputColor = [0, 0, 0, 0];
            for (let k = 0; k < N; k++) {
                m[k][0]= m[k][0]/m[k][3]; m[k][1]= m[k][1]/m[k][3]; m[k][2]= m[k][2]/m[k][3];
                s[k]=s[k].map((e,j)=>Math.abs(e/m[k][3]-m[k][j]**2))
                const sigma2 = s[k][0]+s[k][1]+s[k][2];

                const w = 1 / (1 + Math.pow(1000 * hardness * sigma2, 0.5 * q));

                outputColor=[outputColor[0]+w*m[k][0],outputColor[1]+w*m[k][1],outputColor[2]+w*m[k][2],outputColor[3]+w]
            }
            

            const currentIndex = (y * width + x) * 4;
            data[currentIndex] = Math.round(outputColor[0]/outputColor[3]);
            data[currentIndex + 1] = Math.round(outputColor[1]/outputColor[3]);
            data[currentIndex + 2] = Math.round(outputColor[2]/outputColor[3]);
        }
    }
}

function getPixelColor(imageData, x, y) {
    const width = imageData.width;
    const pixelX = Math.floor(x);
    const pixelY = Math.floor(y);
    const pixelIndex = (pixelY * width + pixelX) * 4;
    return [
        imageData.data[pixelIndex],
        imageData.data[pixelIndex + 1],
        imageData.data[pixelIndex + 2],
        imageData.data[pixelIndex + 3],
    ];
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
