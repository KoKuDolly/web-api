(function () {
  let isDrawing = false;
  var canvas = document.querySelector("canvas");
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.fillStyle = "hotpink";

  function draw(x, y) {
    if (isDrawing) {
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 10, 0, Math.PI * 2);
      canvasCtx.closePath();
      canvasCtx.fill();
    }
  }

  canvas.addEventListener("mousemove", (event) =>
    draw(event.offsetX, event.offsetY)
  );
  canvas.addEventListener("mousedown", () => (isDrawing = true));
  canvas.addEventListener("mouseup", () => (isDrawing = false));

  // Optional frames per second argument.
  var stream = canvas.captureStream(25);
  var recordedChunks = [];

  console.log(stream);
  var options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();

  function handleDataAvailable(event) {
    console.log("data-available", event);
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
      console.log(recordedChunks);
      download();
    } else {
      // ...
    }
  }
  function download() {
    var blob = new Blob(recordedChunks, {
      type: "video/webm",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "test.webm";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // demo: to download after 9sec
  setTimeout((event) => {
    console.log("stopping");
    mediaRecorder.stop();
  }, 9000);
})();
