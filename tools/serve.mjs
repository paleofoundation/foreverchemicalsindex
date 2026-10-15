import http from "node:http"
import handler from "serve-handler"
http.createServer((req, res) => handler(req, res, { public: "public", cleanUrls: true }))
  .listen(8080, "127.0.0.1", () => console.log("Local preview: http://127.0.0.1:8080"))
