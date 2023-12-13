document.addEventListener("DOMContentLoaded", function () {
    const originalImage = document.getElementById("originalImage");
    const modifiedImage = document.getElementById("modifiedImage");
    const filterSelect = document.getElementById("filterSelect");
    const parameterAdjustments = document.getElementById("parameterAdjustments");
    const changeImageBtn = document.getElementById("changeImageBtn");
    const toggleLookingGlassBtn= document.getElementById("toggleLookingGlassBtn");

    // Define filters and their parameters
    const filters = {
        grayscale: {
            name: "Grayscale",
            rich: {
                label: "Rich Grayscale",
                type: "range",
                min: 0,
                max: 1,
                step: 1,
                value: 0
            }
        },
        invert: {
            name: "Invert"
        },
        blur: {
            name: "Gaussian Blur",
            radius: {
                label: "Radius",
                type: "range",
                min: 0,
                max: 10,
                step: 1,
                value: 0
            }
        },
        median: {
            name: "Median",
            radius: {
                label: "Radius",
                type: "range",
                min: 0,
                max: 8,
                step: 1,
                value: 0
            },
        },
        kmeans: {
            name: "K-Means Segmentation",
            regions: {
                label: "Regions",
                type: "range",
                min: 2,
                max: 10,
                step: 1,
                value: 3
            },
        },
        kuwahara: {
            name: "My Modified Generalised Kuwahara",
            radius: {
                label: "Radius",
                type: "range",
                min: 0,
                max: 10,
                step: 1,
                value: 6
            },
            q: {
                label: "Hardness",
                type: "range",
                min: 0,
                max: 20,
                step: 0.1,
                value: 10
            },
            hardness: {
                label: "Granule Size",
                type: "range",
                min: 0,
                max: 1,
                step: 0.01,
                value: 0.5
            },
        },
        quantization: {
            name: "Quantization with Dithering",
            levels: {
                label: "Levels",
                type: "range",
                min: 2,
                max: 16,
                step: 1,
                value: 8
            },
            n: {
                label: "Dither Size",
                type: "range",
                min: 1,
                max: 3,
                step: 1,
                value: 3
            },
            spread : {
                label: "Dither Spread",
                type: "range",
                min: 0,
                max: 0.5,
                step: 0.01,
                value: 0.1
            }
        },
        pallete: {
            name: "Quantization with OKLAB Palette",
            levels: {
                label: "Levels",
                type: "range",
                min: 2,
                max: 16,
                step: 1,
                value: 8
            },
        },
        kuwahara2: {
            name: "Generalised Kuwahara (~25s Load)",
            kernelRadius: {
                label: "Kernel Size",
                type: "range",
                min: 0,
                max: 10,
                step: 1,
                value: 4
            },
            q: {
                label: "Hardness",
                type: "range",
                min: 0,
                max: 20,
                step: 0.1,
                value: 5
            },
            hardness: {
                label: "Granule Size",
                type: "range",
                min: 0,
                max: 1,
                step: 0.1,
                value: 10
            },
        },
    };

    // Populate filter options in the dropdown
    for (const filter in filters) {
        const option = document.createElement("option");
        option.value = filter;
        option.text = filters[filter].name;
        filterSelect.add(option);
    }

    filterSelect.addEventListener("change", updateFilter);
    changeImageBtn.addEventListener("click", changeImage);

    // Initialize with the default filter (grayscale)
    let palette=randomizePalette();
    const randomizePaletteBtn = document.getElementById("randomizePaletteBtn");
    randomizePaletteBtn.addEventListener("click", () => {
        palette=randomizePalette();
        applyFilter(filterSelect.value, getFilterParameters(filterSelect.value));
    });
    init();

    function init() {
        filterSelect.value = "grayscale";
        updateFilter();
    }

    function updateFilter() {
        const selectedFilter = filterSelect.value;
        const filterParameters = filters[selectedFilter];

        // Remove previous parameter inputs
        parameterAdjustments.innerHTML = "";

        // Add parameter inputs based on the selected filter
        for (const paramName in filterParameters) {
            if (paramName !== "name") {
                const param = filterParameters[paramName];
                const input = document.createElement("input");
                input.id = paramName;
                input.type = param.type;
                input.min = param.min;
                input.max = param.max;
                input.step = param.step;
                input.value = param.value;

                const label = document.createElement("label");
                label.htmlFor = paramName;
                label.textContent = `${param.label}: ${param.value}`;

                input.addEventListener("input", (event) => {
                    label.textContent = `${param.label}: ${event.target.value}`;
                    applyFilter(selectedFilter, getFilterParameters(selectedFilter));
                });

                parameterAdjustments.appendChild(label);
                parameterAdjustments.appendChild(input);
            }
        }

        // Show/hide the Randomize Palette button based on the selected filter
        const randomizePaletteBtn = document.getElementById("randomizePaletteBtn");
        if (selectedFilter === "pallete" || selectedFilter === "kmeans") {
            randomizePaletteBtn.style.display = "initial";
        } else {
            randomizePaletteBtn.style.display = "none";
        }

        // Apply the selected filter
        applyFilter(selectedFilter, getFilterParameters(selectedFilter));
    }

    function getFilterParameters(filter) {
        const parameters = {};
        for (const paramName in filters[filter]) {
            if (paramName !== "name") {
                parameters[paramName] = document.getElementById(paramName).value;
            }
        }
        return parameters;
    }

    async function applyFilter(filter, parameters) {
        // Retrieve the image data
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        context.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        // Get the imageData object
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Apply the selected filter function
        const filterModule = await import(`./filters/${filter}.js`);
        if (filter=='pallete' || filter=='kmeans')
            filterModule.default(imageData, parameters,palette);
        else   
            filterModule.default(imageData, parameters);

        // Update the modified image
        context.putImageData(imageData, 0, 0);
        modifiedImage.src = canvas.toDataURL();
    }

    function randomizePalette() {
        return {
            hueBase: Math.random(),
            hueContrast: Math.random(),
            saturationBase: Math.random(),
            saturationContrast: Math.random(),
            luminanceBase: Math.random()*0.5+0.5,
            luminanceContrast: Math.random(),
            fixed: Math.random(),
            saturationConstant: true,
            colorCount: 4,
        }
    }

    function changeImage() {
        const currentImageSrc = originalImage.src;
    
        if (currentImageSrc.includes("lena.bmp")) {
            originalImage.src = "images/rose.jpg";
        } else if (currentImageSrc.includes("images/rose.jpg")) {
            originalImage.src = "images/bladerunner.jpg";
        } else {
            originalImage.src = "images/lena.bmp";
        }
    
        // Force the browser to reload the image
        originalImage.onload = () => {
            // Reapply the current filter when changing the image
            applyFilter(filterSelect.value, getFilterParameters(filterSelect.value));
        };
    }

    // save
    // Create a looking glass element
    const lookingGlass = document.createElement("div");
    lookingGlass.classList.add("looking-glass");
    document.body.appendChild(lookingGlass);

    // Create a canvas for the looking glass
    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");
    lookingGlass.appendChild(canvas);

    // Add mousemove event listeners to both original and modified images
    originalImage.addEventListener("mousemove", (event) => showLookingGlass(originalImage, event));
    modifiedImage.addEventListener("mousemove", (event) => showLookingGlass(modifiedImage, event));

    // Hide the looking glass when the mouse leaves the images
    originalImage.addEventListener("mouseleave", hideLookingGlass);
    modifiedImage.addEventListener("mouseleave", hideLookingGlass);

    toggleLookingGlassBtn.addEventListener("click", toggleLookingGlass);

    let lookingGlassEnabled = true;

    function showLookingGlass(image, event) {
        if (!lookingGlassEnabled) return;
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const pixelSize = 30; // Adjust as needed

        // Get pixel data around the mouse coordinates
        const pixelData = getPixelData(image, mouseX, mouseY, pixelSize);
        // Set the looking glass position based on the mouse coordinates
        lookingGlass.style.left = mouseX + 20 + "px"; // Adjust as needed
        lookingGlass.style.top = mouseY + "px"; // Adjust as needed

        // Draw the pixel data on the existing canvas
        canvas.width =  200;
        canvas.height = 200;
        context.putImageData(pixelData, 0, 0);

        // Show the looking glass
        lookingGlass.style.display = "block";
    }

    function hideLookingGlass() {
        if (!lookingGlassEnabled) return;
        // Hide the looking glass when the mouse leaves the original image
        lookingGlass.style.display = "none";
    }

    // Function to get pixel data around the mouse coordinates
    function getPixelData(image, x, y, size) {
        // Disable smoothing
        context.imageSmoothingEnabled = false;

        // Round the coordinates to avoid half pixels
        const roundedX = Math.round(x - size / 2);
        const roundedY = Math.round(y - size / 2);

        context.fillStyle = '#00081d';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the portion of the image onto the canvas with rounded coordinates
        const imgRect = image.getBoundingClientRect();
        const relativeX = roundedX - imgRect.left;
        const relativeY = roundedY - imgRect.top;
        context.imageSmoothingEnabled = false;
    

        context.drawImage(image, relativeX, relativeY, size, size, 0, 0, canvas.width, canvas.height);

        // Get the imageData object
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    function toggleLookingGlass() {
        // Toggle the looking glass visibility
        lookingGlassEnabled = !lookingGlassEnabled;

        // Hide the looking glass if it's disabled
        if (!lookingGlassEnabled) {
            lookingGlass.style.display = "none";
        }
    }
    
});