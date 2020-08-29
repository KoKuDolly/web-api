const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer();

server.on("request", (req, res) => {
  fs.readFile(
    path.resolve(__dirname, "../musics/7!! - 虹色.mp3"),
    (err, data) => {
      if (err) throw new Error(err);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "audio/mpeg; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename='filename.jpg'"
      );
      res.end(data);
    }
  );
});

http: server.listen(3333, function () {
  console.log("server listen at http://127.0.0.1:3333");
});
