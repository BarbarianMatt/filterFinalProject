export default function applyMultiRegionKMeans(imageData, parameters, palette) {
    const data = imageData.data;

    const grayscaleData = convertToGrayscale(data);
    const kMeansCenters = performKMeans(grayscaleData, parameters.regions);

    palette.colorCount = kMeansCenters.length;
    const oklabPalette = generateOKLCH("triadic complementary", palette);
    applyMultiRegionSegmentation(data, grayscaleData, kMeansCenters, oklabPalette);
}

function performKMeans(data, k) {
    let clusterCenters = [];
    for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * data.length);
        clusterCenters.push(data[randomIndex]);
    }

    const maxIterations = 100;
    for (let iter = 0; iter < maxIterations; iter++) {
        const assignments = assignToClusters(data, clusterCenters);

        clusterCenters = updateClusterCenters(data, assignments, k);
    }

    return clusterCenters;
}

function assignToClusters(data, clusterCenters) {
    const assignments = [];
    for (let i = 0; i < data.length; i++) {
        const pixelValue = data[i];
        let minDistance = Infinity;
        let assignedCluster = -1;

        for (let j = 0; j < clusterCenters.length; j++) {
            const distance = Math.abs(pixelValue - clusterCenters[j]);
            if (distance < minDistance) {
                minDistance = distance;
                assignedCluster = j;
            }
        }

        assignments.push(assignedCluster);
    }
    return assignments;
}

function updateClusterCenters(data, assignments, k) {
    const clusterSums = new Array(k).fill(0);
    const clusterCounts = new Array(k).fill(0);

    for (let i = 0; i < data.length; i++) {
        const pixelValue = data[i];
        const assignedCluster = assignments[i];

        clusterSums[assignedCluster] += pixelValue;
        clusterCounts[assignedCluster]++;
    }

    const clusterCenters = [];
    for (let j = 0; j < k; j++) {
        if (clusterCounts[j] > 0) {
            clusterCenters.push(clusterSums[j] / clusterCounts[j]);
        } else {
            const randomIndex = Math.floor(Math.random() * data.length);
            clusterCenters.push(data[randomIndex]);
        }
    }

    return clusterCenters;
}

function applyMultiRegionSegmentation(data, grayscaleData, clusterCenters, palette) {
    for (let i = 0; i < data.length; i += 4) {
        const pixelValue = grayscaleData[Math.floor(i / 4)];

        const clusterIndex = findNearestClusterIndex(pixelValue, clusterCenters);
        const color = palette[clusterIndex];

        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
    }
}

function findNearestClusterIndex(pixelValue, clusterCenters) {
    let minDistance = Infinity;
    let nearestClusterIndex = -1;

    for (let j = 0; j < clusterCenters.length; j++) {
        const distance = Math.abs(pixelValue - clusterCenters[j]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestClusterIndex = j;
        }
    }

    return nearestClusterIndex;
}


function convertToGrayscale(data) {
    const grayscaleData = [];
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const grayscale = 0.21 * red + 0.72 * green + 0.07 * blue;
        grayscaleData.push(grayscale);
    }
    return grayscaleData;
}


function generateOKLCH(HUE_MODE, settings) {
    let oklchColors = []
  
    let hueBase = settings.hueBase * 2 * Math.PI;
    let hueContrast = Lerp(0.33, 1.0, settings.hueContrast);
  
    let chromaBase = Lerp(0.01, 0.1, settings.saturationBase);
    let chromaContrast = Lerp(0.075, 0.125 - chromaBase, settings.saturationContrast);
    let chromaFixed = Lerp(0.01, 0.125, settings.fixed);
  
    let lightnessBase = Lerp(0.3, 0.6, settings.luminanceBase);
    let lightnessContrast = Lerp(0.3, 1.0 - lightnessBase, settings.luminanceContrast);
    let lightnessFixed = Lerp(0.6, 0.9, settings.fixed)
  
    let chromaConstant = settings.saturationConstant;
    let lightnessConstant = !chromaConstant;
  
    if (HUE_MODE == "monochromatic") {
      chromaConstant = false;
      lightnessConstant = false;
    }
  
    for (let i = 0; i < settings.colorCount; ++i) {
      let linearIterator = (i) / (settings.colorCount - 1);
  
      let hueOffset = linearIterator * hueContrast * 2 * Math.PI + (Math.PI / 4);
  
      if (HUE_MODE == "monochromatic") hueOffset *= 0.0;
      if (HUE_MODE == "analagous") hueOffset *= 0.25;
      if (HUE_MODE == "complementary") hueOffset *= 0.33;
      if (HUE_MODE == "triadic complementary") hueOffset *= 0.66;
      if (HUE_MODE == "tetradic complementary") hueOffset *= 0.75;
  
      if (HUE_MODE != "monochromatic")
        hueOffset += (Math.random() * 2 - 1) * 0.01;
  
      let chroma = chromaBase + linearIterator * chromaContrast;
      let lightness = lightnessBase + linearIterator * lightnessContrast;
  
      if (chromaConstant) chroma = chromaFixed;
      if (lightnessConstant) lightness = lightnessFixed;
  
      let lab = oklch_to_oklab(lightness, chroma, hueBase + hueOffset);
      let rgb = oklab_to_linear_srgb(lab[0], lab[1], lab[2]);
  
      rgb[0] = Math.round(Math.max(0.0, Math.min(rgb[0], 1.0)) * 255);
      rgb[1] = Math.round(Math.max(0.0, Math.min(rgb[1], 1.0)) * 255);
      rgb[2] = Math.round(Math.max(0.0, Math.min(rgb[2], 1.0)) * 255);
  
      oklchColors.push(rgb);
    }
  
    return oklchColors;
  }

function Lerp(min, max, t) {
    return min + (max - min) * t;
  }

function oklab_to_linear_srgb(L, a, b) {
    let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  
    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;
  
    return [
      (+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      (-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      (-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    ];
}
function oklch_to_oklab(L, c, h) {
    return [(L), (c * Math.cos(h)), (c * Math.sin(h))];
}