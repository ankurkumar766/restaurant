self.addEventListener("install", () => {
  console.log("Service Worker Installed");
});

self.addEventListener("fetch", (event) => {
  // future me offline caching yaha add kar sakte ho
});
