export default function applyOklabPalette(imageData, parameters,palette) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const levels = parameters.levels;
    const n=8;
    const ditherTexture = createDitherTexture(n);
    palette.colorCount=levels;
    const oklabPalette = generateOKLCH("triadic complementary", palette);
    let m=0
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const currentIndex = (y * width + x) * 4;

            // Get the original RGB values
            let originalRed = data[currentIndex];
            let originalGreen = data[currentIndex + 1];
            let originalBlue = data[currentIndex + 2];

            // Desaturate the image
            const desaturatedValue = 0.21 * originalRed + 0.72 * originalGreen + 0.07 * originalBlue;

            // Apply dithering
            const spread=0.1;
            const ditherValue = spread*(ditherTexture[x%n][y%n]/(n**2)-0.5)*256;
            const desaturatedDitheredValue = Math.max(Math.min(desaturatedValue + ditherValue,255),0);
            
            const oklabColor = oklabPalette[Math.max(Math.min(Math.floor(desaturatedDitheredValue/256.0*(levels-1)+0.5),levels-1),0)];

            // Apply the Oklab color to the pixel
            data[currentIndex] = oklabColor[0];
            data[currentIndex + 1] = oklabColor[1];
            data[currentIndex + 2] = oklabColor[2];
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
