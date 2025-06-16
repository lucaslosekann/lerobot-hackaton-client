import "./style.css";

const ws = new WebSocket("ws://172.16.19.183:6969");

ws.addEventListener("open", () => {
    console.log("WebSocket connection established");
});

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
    throw new Error("Failed to get canvas context");
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("click", async () => {
    await canvas.requestPointerLock({
        unadjustedMovement: true,
    });
});

canvas.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas) {
        const movementX = event.movementX;
        const movementY = event.movementY;

        const y = movementY / canvas.height;
        const x = movementX / canvas.width;
        ws.send(
            JSON.stringify({
                type: "mousemove",
                x,
                y,
            })
        );
        console.log(`Mouse moved: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
    }
});

canvas.addEventListener("mousedown", (event) => {
    if (document.pointerLockElement === canvas) {
        console.log("Mouse down, button:", event.button);
        ws.send(
            JSON.stringify({
                type: "mousedown",
                button: event.button,
            })
        );
    }
});

canvas.addEventListener("mouseup", (event) => {
    if (document.pointerLockElement === canvas) {
        console.log("Mouse up, button:", event.button);
        ws.send(
            JSON.stringify({
                type: "mouseup",
                button: event.button,
            })
        );
    }
});

canvas.addEventListener("wheel", (event) => {
    if (document.pointerLockElement === canvas) {
        const deltaY = event.deltaY;
        console.log(`Mouse wheel: deltaY=${deltaY}`);
        ws.send(
            JSON.stringify({
                type: "wheel",
                delta: deltaY,
            })
        );
    }
});

document.addEventListener("keydown", (event) => {
    if (document.pointerLockElement === canvas) {
        const key = event.key;
        ws.send(
            JSON.stringify({
                type: "keydown",
                key,
            })
        );
    }
});

document.addEventListener("keyup", (event) => {
    if (document.pointerLockElement === canvas) {
        const key = event.key;
        ws.send(
            JSON.stringify({
                type: "keyup",
                key,
            })
        );
    }
});
const img = document.getElementById("video") as HTMLImageElement;
if (!img) {
    throw new Error("Failed to get video element");
}

function draw() {
    console.log("Drawing frame");
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
}

const webcamVideo = document.createElement("video");
webcamVideo.autoplay = true;
webcamVideo.muted = true;
webcamVideo.style.position = "fixed";
webcamVideo.style.right = "20px";
webcamVideo.style.bottom = "20px";
webcamVideo.style.width = "200px";
webcamVideo.style.height = "150px";
webcamVideo.style.zIndex = "1000";
webcamVideo.style.border = "2px solid #fff";
webcamVideo.style.borderRadius = "8px";
document.body.appendChild(webcamVideo);

navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
    webcamVideo.srcObject = stream;
});

// Create a hidden canvas for capturing webcam frames
const webcamCanvas = document.createElement("canvas");
webcamCanvas.width = 320;
webcamCanvas.height = 240;
webcamCanvas.style.display = "none";
document.body.appendChild(webcamCanvas);
const webcamCtx = webcamCanvas.getContext("2d");

// Function to capture and send webcam frame
function sendWebcamFrame() {
    if (webcamVideo.readyState === webcamVideo.HAVE_ENOUGH_DATA) {
        webcamCtx?.drawImage(webcamVideo, 0, 0, webcamCanvas.width, webcamCanvas.height);
        const dataUrl = webcamCanvas.toDataURL("image/jpeg", 0.7); // Compress for bandwidth
        ws.send(
            JSON.stringify({
                type: "webcam_frame",
                data: dataUrl,
            })
        );
    }
    setTimeout(sendWebcamFrame, 70);
}

// Start sending frames after webcam is ready
navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
        webcamVideo.srcObject = stream;
        webcamVideo.onloadedmetadata = () => {
            sendWebcamFrame();
        };
    })
    .catch((err) => {
        console.error("Webcam access denied:", err);
    });

img.onload = draw;
