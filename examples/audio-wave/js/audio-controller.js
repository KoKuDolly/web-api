(function () {
  // import SVG from "@svgdotjs/svg.js";
  // const SVG = require("@svgdotjs/svg.js");

  // const draw = SVG().addTo("#draw");
  const canvas = document.getElementById("canvas");
  canvas.width = 1000;
  canvas.height = 64;
  let canvasCtx;

  if (canvas.getContext) {
    canvasCtx = canvas.getContext("2d");
  } else {
    alert(
      "your browser unsupported canvas, please update your browser to modern"
    );
  }

  let polyline;
  // 固定容器宽度，暂时设置1000 px
  const svgWidth = 1000;
  const canvasWidth = 1000;
  // 1秒的像素值，也是1秒的波形采样次数
  let perSecPx = 0;
  function displayBuffer(buff) {
    const height = 128;
    const halfHight = height / 2;
    const absmaxHalf = 1 / halfHight;
    perSecPx = svgWidth / buff.duration;
    const peaks = getPeaks(buff, perSecPx);

    // svgWidth = buff.duration * perSecPx;
    draw.size(svgWidth, height);

    const points = [];
    for (let i = 0; i < peaks.length; i += 2) {
      const peak1 = peaks[i] || 0;
      const peak2 = peaks[i + 1] || 0;

      const h1 = Math.round(peak1 / absmaxHalf);
      const h2 = Math.round(peak2 / absmaxHalf);
      points.push([i, halfHight - h1]);
      points.push([i, halfHight - h2]);
    }

    polyline = draw.polyline(points);
    polyline.fill("#000").stroke({ width: 1 });
  }

  function getPeaks(buffer, perSecPx) {
    const { numberOfChannels, sampleRate, length } = buffer;
    const sampleSize = ~~(sampleRate / perSecPx);
    const first = 0;
    const last = ~~(length / sampleSize);
    const peaks = [];
    const chan = buffer.getChannelData(0);
    for (let i = first; i <= last; i++) {
      const start = i * sampleSize;
      const end = start + sampleSize;
      let max = 0;
      let min = 0;
      for (let j = start; j < end; j++) {
        const value = chan[j];
        if (value > max) {
          max = value;
        }
        if (value < min) {
          min = value;
        }
      }

      peaks[2 * i] = max;
      peaks[2 * i + 1] = min;
    }

    return peaks;
  }

  function displayBufferByCanvas(buff) {
    perSecPx = canvasWidth / buff.duration;
    // 获取左右声道声音最大振幅数据
    const { peaksL, peaksR } = getPeaksTop(buff, perSecPx);

    canvasCtx.fillStyle = "rgb(218, 218, 218)";
    canvasCtx.strokeStyle = "rgb(218, 218, 218)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    drawCanvas(peaksL, "left");
    // drawCanvas(peaksR, "right");
  }

  function drawCanvas(peaksTop, channalFlag) {
    const height = 64;
    const halfHight = height / 2;
    const absmaxHalf = 1 / halfHight;
    let points;
    if (channalFlag === "left") {
      points = peaksTop.map((v) => height - v * height * 0.8);
    } else {
      points = peaksTop.map((v) => (v / absmaxHalf) * 0.8);
    }

    console.log(points);
    const length = points.length;

    canvasCtx.lineWidth = 1;
    canvasCtx.fillStyle =
      channalFlag === "left" ? "rgb(189, 189, 189)" : "rgb(189, 189, 189)";
    canvasCtx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / length;
    let x = 0;

    for (let i = 0; i < length; i++) {
      const y = channalFlag === "left" ? points[i] : 64 + points[i];

      if (i === 0) {
        canvasCtx.moveTo(x, height);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height);
    canvasCtx.stroke();
    canvasCtx.fill();
  }

  function getPeaksTop(buffer, perSecPx) {
    const peaksL = getChannelDatas(buffer, perSecPx * 3, 0);
    const peaksR = getChannelDatas(buffer, perSecPx * 3, 1);
    return {
      peaksL,
      peaksR,
    };
  }

  // 获取每个声道的数据
  function getChannelDatas(buffer, perSecPx, channal) {
    const { numberOfChannels, sampleRate, length } = buffer;
    // console.log(numberOfChannels);
    const sampleSize = ~~(sampleRate / perSecPx);
    const first = 0;
    const last = ~~(length / sampleSize);
    const peaks = [];
    const chan = buffer.getChannelData(channal);
    for (let i = first; i <= last; i++) {
      const start = i * sampleSize;
      const end = start + sampleSize;
      let max = 0;
      for (let j = start; j < end; j++) {
        const value = chan[j];
        if (value > max) {
          max = value;
        }
      }

      peaks[i] = max;
    }

    return peaks;
  }

  // 上传文本的方式
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let file;
  function uploadMusic(event) {
    file = event.target.files[0];

    const reader = new FileReader();

    reader.readAsArrayBuffer(file);

    reader.onload = (evt) => {
      const encodedBuffer = evt.currentTarget.result;
      // 小文件采取这种方式
      audioCtx.decodeAudioData(encodedBuffer, (decodeBuffer) => {
        displayBuffer(decodeBuffer);
      });
    };
  }

  let scaleX = 0;

  function zoom(event) {
    // 阻止页面滚动
    event.preventDefault();

    scaleX += event.deltaY * -0.01;
    if (scaleX > 0) {
      draw.width(svgWidth * scaleX);
      polyline.width(svgWidth * scaleX);
    } else {
      scaleX = 0;
    }
  }

  // document.getElementById("draw").onwheel = zoom;

  // audio 元素的自定义控件
  const audioElement = new Audio();

  // ajax方式
  function getMusic() {
    const ajaxRequest = new XMLHttpRequest();

    ajaxRequest.open("GET", "http://127.0.0.1:3333/", true);

    ajaxRequest.responseType = "blob";

    ajaxRequest.onload = function () {
      const blob = ajaxRequest.response;
      blob.arrayBuffer().then((audioData) => {
        audioCtx.decodeAudioData(
          audioData,
          function (buffer) {
            // audio 可视化
            // svg 方式
            // displayBuffer(buffer);
            // canvas 方式
            displayBufferByCanvas(buffer);
          },
          function (err) {
            // todo some err handler
          }
        );
      });
      // 播放功能
      const mediaSrc = window.URL.createObjectURL(blob);
      audioElement.src = mediaSrc;

      // 下载功能
      const a = document.createElement("a");
      a.href = mediaSrc;
      // 遇到问题，就在问题处去查找该位置的技术文档，还有哪些是没有对其有认知的
      // 添加 download 属性，就不会被打开了
      a.download = "";
      a.target = "_blank";
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 4e4); // 40s
      setTimeout(function () {
        // a.click();
      }, 0);
    };

    ajaxRequest.send();
  }

  getMusic();

  // 播放控制模块
  const rect = document.querySelector(".rect");
  const dragTrigger = document.querySelector(".trigger-drag");
  let duration = 0;
  audioElement.addEventListener("loadeddata", () => {
    duration = audioElement.duration;
    // 每秒播放的像素值
    perSecPx = svgWidth / duration;
    // !!! 坑。。。
    // 将audio 标签交给了 AudioContext后，失去了audio元素的控制权
    // const source = audioCtx.createMediaElementSource(audioElement);
  });

  // 每次移动的初始位置
  let initoffset = 0;
  // 之前多次移动累积距离
  let oldoffset = 0;
  // 进度条最终距离
  let value = 0;
  let drawer;
  function keyevent(e) {
    if (event.keyCode === 32) {
      e.preventDefault();
      if (audioElement.paused || audioElement.ended) {
        audioElement.play();
        const draws = function () {
          drawer = window.requestAnimationFrame(draws);
          // 如何获取设备刷新率
          value += perSecPx / 60;
          rect.style.width = value + "px";
          dragTrigger.style.left = value + "px";
        };
        draws();
      } else {
        window.cancelAnimationFrame(drawer);
        audioElement.pause();
      }
    }
  }

  document.onkeydown = keyevent;

  audioElement.addEventListener(
    "ended",
    function () {
      window.cancelAnimationFrame(drawer);
    },
    false
  );
  // 拖动控制进度条
  dragTrigger.addEventListener("mousedown", moveStart, false);
  function moveStart(e) {
    initoffset = e.pageX;
    oldoffset = value;
    document.addEventListener("mousemove", handleMove, false);
    document.addEventListener("mouseup", handleUp, false);
  }

  function handleMove(e) {
    // 每次移动和上次位置的差值
    let offset = e.pageX - initoffset;
    value = oldoffset + offset;
    dragTrigger.style.left = value + "px";
    rect.style.width = value + "px";
    audioElement.currentTime = (value / svgWidth) * duration;
  }
  function handleUp(e) {
    document.removeEventListener("mousemove", handleMove, false);
    document.removeEventListener("mouseup", handleUp, false);
  }

  audioElement.addEventListener(
    "ended",
    function () {
      window.cancelAnimationFrame(drawer);
      value = 0;
      dragTrigger.style.left = value + "px"; //TODO 这里有问题
      rect.style.width = value + "px";
      audioElement.currentTime = (value / svgWidth) * duration;
    },
    false
  );
})();
