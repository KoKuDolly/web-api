(function () {
  // 工具集构造函数
  const Utils = {
    getElementLeft: function (element) {
      let left = element.offsetLeft;
      let parent = element.offsetParent;

      while (parent !== null) {
        left += parent.offsetLeft;
        parent = parent.offsetParent;
      }

      return left;
    },
  };
  const CustomAudio = function () {
    this.audioElement = new Audio();
    this.audioElement.muted = true;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  };
  /**
   *
   * @param {*} param0
   */
  const CustomAudioView = function ({
    canvasEl,
    dragEl,
    // triggerRiver,
    rectEl,
    scale = 200,
    width = 200,
    height = 64,
    perSecPx = 0,
    small = 0.9,
    leftColor = "rgb(189, 189, 189)",
    rightColor = "rgb(189, 189, 189)",
    channalNum = 2,
    wholeFillStyle = "rgb(218, 218, 218)",
    wholeStrokeStyle = "rgb(218, 218, 218)",
    lineWidth = 1,
  }) {
    this.rect = document.querySelector(rectEl);
    this.dragTrigger = document.querySelector(dragEl);
    // this.triggerRiver = document.querySelector(triggerRiver);
    this.canvas = document.getElementById(canvasEl);
    // 采样点 倍数
    this.scale = scale;
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.perSecPx = perSecPx;
    this.small = small;
    this.leftColor = leftColor;
    this.rightColor = rightColor;
    // 1 默认左声道  2 立体声
    this.channalNum = channalNum;

    // 设置画布大小，视图元素的自适应
    this.rect.style.maxHeight = this.height + "px";
    // this.dragTrigger.style.width = this.height / 16 + "px";
    this.dragTrigger.style.height = this.height + "px";
    // this.triggerRiver.style.width = this.width + "px";
    // this.triggerRiver.style.height = this.height / 16 + "px";

    if (this.canvas.getContext) {
      this.canvasCtx = this.canvas.getContext("2d");

      this.canvasCtx.fillStyle = wholeFillStyle;
      this.canvasCtx.strokeStyle = wholeStrokeStyle;
      this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.canvasCtx.lineWidth = lineWidth;
    } else {
      console.log(
        "your browser unsupported canvas, please update your browser to modern"
      );
    }
  };

  const CustomAudioRequest = function () {
    this.ajaxRequest = new XMLHttpRequest();
    this.ajaxRequest.open("GET", "http://127.0.0.1:3333/", true);
    this.ajaxRequest.responseType = "blob";
    this.ajaxRequest.send();

    this.blob = null;
  };

  const CustomAudioProgress = function () {
    // 依赖的注入
    this.inject = null;
    // 播放进度条控制模块
    this.rect = document.querySelector(".rect");
    this.dragTrigger = document.querySelector(".trigger-drag");
    this.duration = 0;

    this.start = Utils.getElementLeft(this.dragTrigger);

    // 每次移动的初始位置
    this.initoffset = 0;
    // 之前多次移动累积距离
    this.oldoffset = 0;
    // 进度条最终距离
    this.value = 0;
    this.drawer = null;
  };

  const CustomAudioController = function () {
    // 下载，播放暂停，音量控制模块
    this.playpause = document.getElementById("playpause");
    this.download = document.getElementById("download");
    this.volume = document.getElementById("volume");
    this.volumeSlider = document.getElementById("beans");
  };

  CustomAudioView.prototype.displayBufferByCanvas = function (buff) {
    this.perSecPx = this.width / buff.duration;
    // 获取左右声道声音最大振幅数据
    const { peaksL, peaksR } = this.getPeaksTop(buff, this.perSecPx);

    this.drawCanvas(peaksL, "left");
    if (this.channalNum === 2) {
      // 获取右声道数据
      this.drawCanvas(peaksR, "right");
      const y =
        this.height / 2 -
        (this.canvasCtx.lineWidth % 2 === 0
          ? this.canvasCtx.lineWidth
          : this.canvasCtx.lineWidth / 2);
      this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(0, y);
      this.canvasCtx.lineTo(this.width, y);
      this.canvasCtx.stroke();
    }
  };

  CustomAudioView.prototype.drawCanvas = function (peaksTop, channalFlag) {
    let points;
    if (channalFlag === "left") {
      points = peaksTop.map((v) => {
        if (this.channalNum === 2) {
          return (this.height - v * this.height * this.small) / 2;
        } else {
          return this.height - v * this.height * this.small;
        }
      });
    } else {
      points = peaksTop.map((v) => (v * this.height - this.height) / 2);
    }

    const length = points.length;

    this.canvasCtx.fillStyle =
      channalFlag === "left" ? this.leftColor : this.rightColor;
    this.canvasCtx.beginPath();

    const sliceWidth = (this.canvas.width * 1.0) / length;
    let x = 0;

    for (let i = 0; i < length; i++) {
      const y = channalFlag === "left" ? points[i] : points[i] + this.height;

      if (i === 0) {
        this.canvasCtx.moveTo(
          x,
          this.channalNum === 2 ? this.height / 2 : this.height
        );
      } else {
        this.canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasCtx.lineTo(
      this.canvas.width,
      this.channalNum === 2 ? this.canvas.height / 2 : this.canvas.height
    );
    this.canvasCtx.stroke();
    this.canvasCtx.fill();
  };

  CustomAudioView.prototype.getPeaksTop = function (buffer, perSecPx) {
    const peaksL = this.getChannelDatas(buffer, perSecPx * this.scale, 0);
    const peaksR = this.getChannelDatas(buffer, perSecPx * this.scale, 1);
    return {
      peaksL,
      peaksR,
    };
  };

  CustomAudioView.prototype.getChannelDatas = function (
    buffer,
    perSecPx,
    channal
  ) {
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
  };

  CustomAudioRequest.prototype.getMusic = function () {
    const self = this;
    this.ajaxRequest.onload = function () {
      const blob = self.ajaxRequest.response;
      blob.arrayBuffer().then((audioData) => {
        customAudio.audioCtx.decodeAudioData(
          audioData,
          function (buffer) {
            view.displayBufferByCanvas(buffer);
          },
          function (err) {
            // todo some err handler
          }
        );
      });
      // 播放功能
      const mediaSrc = window.URL.createObjectURL(blob);
      customAudio.audioElement.src = mediaSrc;

      self.blob = blob;
    };
  };

  CustomAudioProgress.prototype.init = function (inject) {
    this.inject = inject;
    document.onkeydown = this.keyevent.bind(this);
    // 拖动控制进度条
    this.dragTrigger.addEventListener(
      "mousedown",
      this.moveStart.bind(this),
      false
    );
  };

  CustomAudioProgress.prototype.keyevent = function (e) {
    const self = this;
    if (event.keyCode === 32) {
      e.preventDefault();
      if (customAudio.audioElement.paused || customAudio.audioElement.ended) {
        customAudio.audioElement.play();
        this.inject.playpause.classList.remove("custom-audio-play");
        this.inject.playpause.classList.add("custom-audio-pause");
        const draws = function () {
          self.drawer = window.requestAnimationFrame(draws);
          // 如何获取设备刷新率
          self.value += view.perSecPx / 60;
          self.rect.style.width = self.value + "px";
          self.dragTrigger.style.left = self.value + "px";
        };
        draws();
      } else {
        window.cancelAnimationFrame(self.drawer);
        this.inject.playpause.classList.add("custom-audio-play");
        this.inject.playpause.classList.remove("custom-audio-pause");
        customAudio.audioElement.pause();
      }
    }
  };

  CustomAudioProgress.prototype.moveStart = function (e) {
    this.initoffset = e.pageX;
    this.oldoffset = this.value;
    document.addEventListener("mousemove", handleMove, false);
    document.addEventListener("mouseup", handleUp, false);
  };

  const request = new CustomAudioRequest();
  const customAudio = new CustomAudio();
  const view = new CustomAudioView({
    canvasEl: "canvas",
    dragEl: ".trigger-drag",
    rectEl: ".rect",
    // triggerRiver: ".trigger-river",
    width: 1000,
    height: 200,
  });
  const progress = new CustomAudioProgress();
  const controller = new CustomAudioController();

  request.getMusic();

  progress.init(controller);

  // const triggerRiver = document.querySelector(".trigger-river");

  function handleMove(e) {
    // 每次移动和上次位置的差值
    let offset = e.pageX - progress.initoffset;
    progress.value = progress.oldoffset + offset;

    if (progress.value < 0 || progress.value > view.width) {
      progress.value = 0;
      document.removeEventListener("mousemove", handleMove, false);
      handleUp();
    }

    progress.dragTrigger.style.left = progress.value + "px";
    progress.rect.style.width = progress.value + "px";
    customAudio.audioElement.currentTime =
      (progress.value / view.width) * progress.duration;
  }

  function handleUp(e) {
    document.removeEventListener("mousemove", handleMove, false);
    document.removeEventListener("mouseup", handleUp, false);
  }

  customAudio.audioElement.addEventListener(
    "ended",
    function () {
      window.cancelAnimationFrame(progress.drawer);
      progress.value = 0;
      progress.dragTrigger.style.left = progress.value + "px";
      progress.rect.style.width = progress.value + "px";
      customAudio.audioElement.currentTime =
        (progress.value / view.width) * progress.duration;
    },
    false
  );

  customAudio.audioElement.addEventListener("loadeddata", function () {
    progress.duration = customAudio.audioElement.duration;
    // triggerRiver.addEventListener("click", hanldeRiverClick, false);
  });

  controller.download.addEventListener("click", handleDownloadAudio, false);
  controller.playpause.addEventListener("click", handlePlaypause, false);
  controller.volume.addEventListener("click", handleVolume, false);
  controller.volumeSlider.addEventListener("input", handleVolumeSize, false);

  function hanldeRiverClick(e) {
    progress.value = e.pageX - progress.start;
    progress.dragTrigger.style.left = progress.value + "px";
    progress.rect.style.width = progress.value + "px";
    customAudio.audioElement.currentTime =
      (progress.value / view.width) * progress.duration;
  }

  function handleDownloadAudio() {
    // 下载功能
    const a = document.createElement("a");
    a.href = URL.createObjectURL(request.blob);
    a.download = "";
    a.target = "_blank";
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 4e4); // 40s
    setTimeout(function () {
      a.click();
    }, 0);
  }

  function handlePlaypause() {
    if (customAudio.audioElement.paused || customAudio.audioElement.ended) {
      customAudio.audioElement.play();
      this.classList.remove("custom-audio-play");
      this.classList.add("custom-audio-pause");
      const draws = function () {
        progress.drawer = window.requestAnimationFrame(draws);
        // 如何获取设备刷新率
        progress.value += view.perSecPx / 60;
        progress.rect.style.width = progress.value + "px";
        progress.dragTrigger.style.left = progress.value + "px";
      };
      draws();
    } else {
      this.classList.add("custom-audio-play");
      this.classList.remove("custom-audio-pause");
      window.cancelAnimationFrame(progress.drawer);
      customAudio.audioElement.pause();
    }
  }

  function handleVolume() {
    // console.log(customAudio.audioElement.volume)
    const { volume } = customAudio.audioElement;
    if (customAudio.audioElement.muted) {
      customAudio.audioElement.muted = false;
      this.classList.add(
        `custom-audio-volume-${volume > 0.5 ? "full" : "half"}`
      );
      this.classList.remove("custom-audio-mute");
    } else {
      customAudio.audioElement.muted = true;
      this.classList.remove(
        `custom-audio-volume-${volume > 0.5 ? "full" : "half"}`
      );
      this.classList.add("custom-audio-mute");
    }
  }

  function handleVolumeSize(e) {
    const {
      target: { value },
    } = e;
    customAudio.audioElement.volume = value / 100;

    if (+value === 0) {
      customAudio.audioElement.muted = true;
      controller.volume.classList.add("custom-audio-mute");
      controller.volume.classList.remove("custom-audio-volume-half");
    } else {
      customAudio.audioElement.muted = false;
      controller.volume.classList.remove("custom-audio-mute");
      if (value < 50) {
        controller.volume.classList.add("custom-audio-volume-half");
        controller.volume.classList.remove("custom-audio-volume-full");
      } else {
        controller.volume.classList.add("custom-audio-volume-full");
        controller.volume.classList.remove("custom-audio-volume-half");
      }
    }
  }
})();
