export default function applyCircularBlur(imageData, parameters) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = parseInt(parameters.radius, 10);
    const q = parameters.q;

    // Create a circular kernel
    const kernel = createCircularKernel(radius);
    const sectorKernel= createSectorKernel(radius);
    let n=0;
    // Create a copy of the original pixel data
    const copy = new Uint8ClampedArray(data);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {

            const sectors = {};

            // Initialize RunningStats instances in the object
            for (let i = 1; i <= 8; i++) {
                sectors[i] = new RunningStats();
            }

            for (let i = 0; i < kernel.length; i++) {
                for (let j = 0; j < kernel[i].length; j++) {
                    if (kernel[i][j]>0){
                        const pixelX = x + i - radius;
                        const pixelY = y + j - radius;
                        
                        
                        if (i==(kernel.length-1)/2 && j==(kernel.length-1)/2){
                            const index = (pixelY * width + pixelX) * 4;
                            for (let k = 1; k <= 8; k++) {
                                sectors[k].update([copy[index],copy[index+1],copy[index+2]],1);
                            }
                        }
                        else if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height){
                            const index = (pixelY * width + pixelX) * 4;
                            sectors[sectorKernel[i][j]].update([copy[index],copy[index+1],copy[index+2]],1);
                        }

                    }
                }
            }
            let totalWeight=[0,0,0];
            let totalColor=[0,0,0];
            for (let i = 1; i <= 8; i++) {
                const weight= sectors[i].getStandardDeviation().map((e) => 1/(1+Math.pow(parameters.hardness*e,q*0.5)));
                const color=weight.map((e,j) => e*sectors[i].getMean()[j]);
                totalColor=totalColor.map((e,j)=>e+color[j]);
                totalWeight=totalWeight.map((e,j)=>e+weight[j]);
            }

            const currentIndex = (y * width + x) * 4;
            data[currentIndex] = Math.round(totalColor[0]/totalWeight[0]);
            data[currentIndex + 1] = Math.round(totalColor[1]/totalWeight[1]);
            data[currentIndex + 2] = Math.round(totalColor[2]/totalWeight[2]);
        }
    }
}

function createCircularKernel(radius) {
    if (radius === 0) {
        // Edge case for radius zero
        return [[1]];
    }

    const kernelSize = radius * 2 + 1;
    const kernel = [];
    //let sum=0;
    for (let i = 0; i < kernelSize; i++) {
        const row = [];
        
        for (let j = 0; j < kernelSize; j++) {
            const distance = Math.sqrt((i - radius) ** 2 + (j - radius) ** 2);
            if (distance <= radius) {
                //let weight = Math.exp(-(distance ** 2) / (2 * radius ** 2)) / (2 * Math.PI * radius ** 2);
                let weight = 1;
                row.push(weight);
                //sum+=weight;
            } else {
                row.push(0);
            }
        }
        kernel.push(row);
    }

    return kernel;
}

function createSectorKernel(radius) {
    if (radius === 0) {
        return [[1]];
    }

    const kernelSize = radius * 2 + 1;
    const kernel = [];

    for (let i = 0; i < kernelSize; i++) {
        const row = [];

        for (let j = 0; j < kernelSize; j++) {
            const angle = Math.atan2(j - radius, i - radius);
            let sector = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
            row.push(sector+1);
        }
        kernel.push(row);
    }

    return kernel;
}


class RunningStats {
    constructor() {
      this.count = 0;
      this.mean = [0, 0, 0];
      this.m2 = [0, 0, 0];
    }
  
    update(value, weight = 1) {
        if (value.length !== this.mean.length) {
            throw new Error('Input dimensions do not match the expected dimensions.');
        }
        if (Math.abs(weight)>0){

            this.count += weight;

            for (let i = 0; i < value.length; i++) {
                const delta = value[i] - this.mean[i];
                this.mean[i] += (delta * weight) / this.count;
                const delta2 = value[i] - this.mean[i];
                this.m2[i] += delta * delta2 * weight;
            }
        }
    }
  
    getMean() {
      return this.mean;
    }
  
    getVariance() {
      if (this.count < 2) {
        return [0, 0, 0]; // Not enough data for variance
      }
  
      return this.m2.map((m2) => m2 / this.count);
    }

    getStandardDeviation() {
      const variance = this.getVariance();
      return variance.map((variance) => Math.sqrt(variance));
    }
}