export default function applyGrayscale(imageData, parameters) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let average=0;
        if (parameters.rich==1){
            average=0.21 * data[i] + 0.72 * data[i + 1] + 0.07 * data[i + 2];
        }
        else {
            average = (data[i] + data[i + 1] + data[i + 2])/3;
        }
        data[i] = data[i + 1] = data[i + 2] = average;
    }
}
