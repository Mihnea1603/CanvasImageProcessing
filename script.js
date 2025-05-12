function mirrorImage(imgData, slice) {
    const width = imgData.width;
    const height = imgData.height;
    const pixels = imgData.data;

    for (let i = Math.round(slice * height / 4); i < Math.round((slice + 1) * height / 4); i++) {
        for (let j = 0; j < width / 2; j++) {
            const idx1 = (i * width + j) * 4;
            const idx2 = (i * width - j + width - 1) * 4;
            for (let k = 0; k < 4; k++) {
                const temp = pixels[idx1 + k];
                pixels[idx1 + k] = pixels[idx2 + k];
                pixels[idx2 + k] = temp;
            }
        }
    }
}

function laplacian(imgData, slice) {
    const width = imgData.width;
    const height = imgData.height;
    const pixels = imgData.data;
    const laplacianKernel = [
        0, -1, 0,
        -1, 4, -1,
        0, -1, 0
    ];
    for (let i = Math.round(slice * height / 4); i < Math.round((slice + 1) * height / 4); i++) {
        for (let j = 0; j < width; j++) {
            const idx = (i * width + j) * 4;
            let sum = 0;
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    const pixelX = j + x;
                    const pixelY = i + y;
                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                        const pixelIdx = (pixelY * width + pixelX) * 4;
                        const intensity = 0.3 * pixels[pixelIdx] + 0.6 * pixels[pixelIdx + 1] + 0.1 * pixels[pixelIdx + 2];
                        sum += intensity * laplacianKernel[(y + 1) * 3 + x + 1];
                    }
                }
            }
            if (sum > 240) {
                sum = 255;
            }
            else {
                sum = 0;
            }
            pixels[idx] = sum;
            pixels[idx + 1] = sum;
            pixels[idx + 2] = sum;
        }
    }
}

async function processImage(modifyImage, imgData) {
    for (let button of buttons) {
        button.disabled = true;
    }
    for (let k = 0; k < 4; k++) {
        if (k != 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        modifyImage(imgData, k);
        context.putImageData(imgData, 0, 0);
    }
    for (let button of buttons) {
        button.disabled = false;
    }
}

async function getImage() {
    try {
        const response = await fetch("https://images-api.nasa.gov/search?q=Falcon&media_type=image&year_start=2023");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        const img = document.getElementsByTagName('img')[0];
        img.src = json.collection.items[Math.floor(Math.random() * json.collection.items.length)].links[0].href;
        img.crossOrigin = 'anonymous';
        await new Promise(resolve => img.onload = resolve);

        await new Promise(resolve => setTimeout(resolve, 500));
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
}

async function main() {
    let imgData = await getImage();
    buttons[0].onclick = async () => {
        for (let button of buttons) {
            button.disabled = true;
        }
        imgData = await getImage();
        for (let button of buttons) {
            button.disabled = false;
        }
    };
    buttons[1].onclick = () => {
        processImage(mirrorImage, context.getImageData(0, 0, canvas.width, canvas.height));
    };
    buttons[2].onclick = () => {
        processImage(laplacian, context.getImageData(0, 0, canvas.width, canvas.height));
    }
    buttons[3].onclick = () => {
        processImage(mirrorImage, context.getImageData(0, 0, canvas.width / 2, canvas.height));
    };
    buttons[4].onclick = () => context.putImageData(imgData, 0, 0);
}

const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d', { willReadFrequently: true });
const buttons = document.getElementsByTagName('button');
main();