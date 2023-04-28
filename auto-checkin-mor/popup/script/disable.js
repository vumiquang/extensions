const btn = document.getElementById("goto");

btn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://checkin.mor.com.vn" });
});
