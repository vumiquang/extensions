chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  checkTabIsMorOfficeWebsite();
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
  checkTabIsMorOfficeWebsite();
});

async function checkTabIsMorOfficeWebsite() {
  const [currentTab] = await getCurrentTab();
  if (!currentTab) return;
  const urlMor = new URL("https://checkin.mor.com.vn");
  const currentUrl = currentTab?.url ?? "";
  const url = new URL(currentUrl);

  if (url.host === urlMor.host) {
    const ck = await getAllCookies();
    if (!!ck.length) {
      chrome.action.setPopup({
        tabId: currentTab.id,
        popup: "popup/index.html",
      });
    } else {
      chrome.action.setPopup({
        tabId: currentTab.id,
        popup: "popup/login.html",
      });
    }
  }
}

async function getCurrentTab() {
  return await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
}

async function getAllCookies() {
  return await chrome.cookies.getAll({
    url: "https://checkin.mor.com.vn",
    name: "jwt",
  });
}
