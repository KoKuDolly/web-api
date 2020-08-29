(function () {
  var imageCapture;
  const downbycanvasEle = document.querySelector("#download-by-canvas");

  function onGetUserMediaButtonClick() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        // HTMLMediaElement关联的媒体源
        // 这个对象通常是 MediaStream
        // 但根据规范可以是 MediaSource， Blob 或者 File
        document.querySelector("video").srcObject = mediaStream;

        const track = mediaStream.getVideoTracks()[0];
        imageCapture = new ImageCapture(track);
      })
      .catch((error) => ChromeSamples.log(error));
  }

  function onGrabFrameButtonClick() {
    imageCapture
      .grabFrame()
      .then((imageBitmap) => {
        const canvas = document.querySelector("#grabFrameCanvas");
        drawCanvas(canvas, imageBitmap);
        downbycanvasEle.disabled = false;
        downbycanvasEle.addEventListener("click", () => {
          const src = canvas.toDataURL();
          // base64 string
          download(src);
        });
      })
      .catch((error) => ChromeSamples.log(error));
  }

  function onTakePhotoButtonClick() {
    imageCapture
      .takePhoto()
      .then((blob) => createImageBitmap(blob))
      .then((imageBitmap) => {
        const canvas = document.querySelector("#takePhotoCanvas");
        drawCanvas(canvas, imageBitmap);
      })
      .catch((error) => ChromeSamples.log(error));
  }

  function onDownload() {
    imageCapture.takePhoto().then((blob) => {
      const src = URL.createObjectURL(blob);
      // blob string
      download(src);
    });
  }

  function download(src) {
    console.log(src);
    // src blob or base64
    const a = document.createElement("a");
    a.href = src;
    a.download = "";
    a.target = "_blank";
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
    }, 4e4);
    setTimeout(() => {
      a.click();
    }, 0);
  }

  /* Utils */

  function drawCanvas(canvas, img) {
    canvas.width = getComputedStyle(canvas).width.split("px")[0];
    canvas.height = getComputedStyle(canvas).height.split("px")[0];
    let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    console.log(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas
      .getContext("2d")
      .drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        x,
        y,
        img.width * ratio,
        img.height * ratio
      );
  }

  document.querySelector("video").addEventListener("play", function () {
    document.querySelector("#grabFrameButton").disabled = false;
    document.querySelector("#takePhotoButton").disabled = false;
    document.querySelector("#download").disabled = false;
  });

  document
    .querySelector("#getUserMediaButton")
    .addEventListener("click", onGetUserMediaButtonClick);
  document
    .querySelector("#grabFrameButton")
    .addEventListener("click", onGrabFrameButtonClick);
  document
    .querySelector("#takePhotoButton")
    .addEventListener("click", onTakePhotoButtonClick);
  document.querySelector("#download").addEventListener("click", onDownload);
})();
