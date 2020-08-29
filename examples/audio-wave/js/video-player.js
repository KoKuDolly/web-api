(function () {
  "use strict";

  const supportsVideo = !!document.createElement("video").canPlayType;

  if (supportsVideo) {
    const videoContainer = document.getElementById("videoContainer");
    const video = document.getElementById("video");
    const videoControls = document.getElementById("video-controls");

    video.controls = false;

    videoControls.setAttribute("data-state", "visible");

    const playpause = document.getElementById("playpause");
    const stop = document.getElementById("stop");
    const mute = document.getElementById("mute");
    const volinc = document.getElementById("volinc");
    const voldec = document.getElementById("voldec");
    const progress = document.getElementById("progress");
    const progressBar = document.getElementById("progress-bar");
    const fullscreen = document.getElementById("fs");

    const supportsProgress =
      document.createElement("progress").max !== undefined;
    if (!supportsProgress) progress.setAttribute("data-state", fake);
    // fullscreen 能力检测
    const fullScreenEnabled = !!(
      document.fullscreenEnabled ||
      document.mozFullscreenEnabled ||
      document.msFullscreenEnabled ||
      document.webkitSupportsFullscreen ||
      document.webkitFullscreenEnabled ||
      document.createElement("video").webkitRequestFullScreen
    );

    if (!fullScreenEnabled) {
      fullscreen.style.display = "none";
    }
    const changeButtonState = function (type) {
      if (type === "playpause") {
        if (video.paused || video.ended) {
          playpause.setAttribute("data-state", "play");
        } else {
          playpause.setAttribute("data-state", "pause");
        }
      } else if (type === "mute") {
        mute.setAttribute("data-state", video.muted ? "unmute" : "mute");
      }
    };

    const checkVolume = function (dir) {
      if (dir) {
        const currentVolume = Math.floor(video.volume * 10) / 10;
        if (dir === "+") {
          if (currentVolume < 1) video.volume += 0.1;
        } else if (dir === "-") {
          if (currentVolume > 0) video.volume -= 0.1;
        }
        if (currentVolume < 0) {
          video.muted = true;
        } else {
          video.muted = false;
        }
      }
      changeButtonState("mute");
    };

    const alterVolume = function (dir) {
      checkVolume(dir);
    };

    const setFullscreenData = function (state) {
      videoContainer.setAttribute("data-fullscreen", !!state);
      fullscreen.setAttribute(
        "data-state",
        !!state ? "cancel-fullscreen" : "go-fullscreen"
      );
    };

    const isFullScreen = function () {
      return !!(
        document.fullScreen ||
        document.webkitIsFullScreen ||
        document.mozFullScreen ||
        document.msFullscreenElement ||
        document.fullscreenElement
      );
    };

    const handleFullscreen = function () {
      if (isFullScreen()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitCancelFullScreen)
          document.webkitCancelFullScreen;
        else if (document.msExitFullscreen) document.msExitFullscreen;
        setFullscreenData(false);
      } else {
        if (videoContainer.requestFullscreen)
          videoContainer.requestFullscreen();
        else if (videoContainer.mozRequestFullScreen)
          videoContainer.mozRequestFullScreen();
        else if (videoContainer.webkitRequestFullScreen) {
          // Safari 5.1 only allows proper fullscreen on the video element. This also works fine on other WebKit browsers as the following CSS (set in styles.css) hides the default controls that appear again, and
          // ensures that our custom controls are visible:
          // figure[data-fullscreen=true] video::-webkit-media-controls { display:none !important; }
          // figure[data-fullscreen=true] .controls { z-index:2147483647; }
          video.webkitRequestFullScreen();
        } else if (videoContainer.msRequestFullscreen)
          videoContainer.msRequestFullscreen();
        setFullscreenData(true);
      }
    };

    if (document.addEventListener) {
      video.addEventListener("loadedmetadata", function () {
        // console.log("loadedmetadata");
        progress.setAttribute("max", video.duration);
      });
      video.addEventListener(
        "play",
        function () {
          changeButtonState("playpause");
        },
        false
      );
      video.addEventListener(
        "pause",
        function () {
          changeButtonState("playpause");
        },
        false
      );
      video.addEventListener(
        "volumechange",
        function () {
          checkVolume();
        },
        false
      );

      playpause.addEventListener("click", function (e) {
        if (video.paused || video.ended) video.play();
        else video.pause();
      });
      stop.addEventListener("click", function (e) {
        video.pause();
        video.currentTime = 0;
        progress.value = 0;
        changeButtonState("playpause");
      });
      mute.addEventListener("click", function (e) {
        video.muted = !video.muted;
        changeButtonState("mute");
      });
      volinc.addEventListener("click", function (e) {
        alterVolume("+");
      });
      voldec.addEventListener("click", function (e) {
        alterVolume("-");
      });
      fullscreen.addEventListener("click", function (e) {
        handleFullscreen();
      });

      // As the video is playing, update the progress bar
      video.addEventListener("timeupdate", function () {
        // For mobile browsers, ensure that the progress element's max attribute is set
        if (!progress.getAttribute("max"))
          progress.setAttribute("max", video.duration);
        progress.value = video.currentTime;
        progressBar.style.width =
          Math.floor((video.currentTime / video.duration) * 100) + "%";
      });

      // React to the user clicking within the progress bar
      progress.addEventListener("click", function (e) {
        //var pos = (e.pageX  - this.offsetLeft) / this.offsetWidth; // Also need to take the parent into account here as .controls now has position:relative
        var pos =
          (e.pageX - (this.offsetLeft + this.offsetParent.offsetLeft)) /
          this.offsetWidth;
        video.currentTime = pos * video.duration;
      });

      // Listen for fullscreen change events (from other controls, e.g. right clicking on the video itself)
      document.addEventListener("fullscreenchange", function (e) {
        setFullscreenData(
          !!(document.fullScreen || document.fullscreenElement)
        );
      });
      document.addEventListener("webkitfullscreenchange", function () {
        setFullscreenData(!!document.webkitIsFullScreen);
      });
      document.addEventListener("mozfullscreenchange", function () {
        setFullscreenData(!!document.mozFullScreen);
      });
      document.addEventListener("msfullscreenchange", function () {
        setFullscreenData(!!document.msFullscreenElement);
      });
    }
  }
})();
