const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const yearEle = document.getElementById("year");
const monthEle = document.getElementById("month");
const projectEle = document.getElementById("project");
const btnSubmit = document.getElementById("run-script");
const timeEle = document.getElementById("time");
const tableBodyEle = document.getElementById("table-body");
const tableDateEle = document.querySelector(".table-date");
const btnCheckIn = document.getElementById("checkin");
const poupCheckIn = document.querySelector(".popup-checkin");
const btnClosePopupCheckInEle = document.querySelector(".close-popup-checkin");
const listDateCheckInEle = document.querySelector(".list-date-check");
const showProjectEle = document.querySelector(".show-project");
const showTimeEle = document.querySelector(".show-time");
const btnCancelPopupCheckIn = document.querySelector(".popup-checkin .cancel");
const btnCheckInOkEle = document.querySelector(".popup-checkin .ok-checkin");
const loadingEle = document.querySelector(".loading");
let listProject = [];
let listDateCheckIn = [];
const urlDateOfMonth =
  "https://api.checkin.mor.com.vn/api/daily/daily-report-data/user/?month=";
const urlListAllProject =
  "https://api.checkin.mor.com.vn/api/project/?name=&status=&type=&start_date=&end_date=";
const urlHoliday =
  "https://api.checkin.mor.com.vn/api/calendars/holidays/?year=";
const listHolidaty = [];
const urlCheckin = "https://api.checkin.mor.com.vn/api/daily/daily-report/";

initApp();

function initApp() {
  generateYear();
  generateMonth();
  //generate list project
  generateProject();
  generateTime();
}

async function getCookieMor() {
  const listCookie = await chrome.cookies.getAll({
    url: "https://checkin.mor.com.vn",
    name: "jwt",
  });
  if (!!listCookie.length) return listCookie[0].value;
  return "";
}

async function fetchData(method, url, data = null) {
  const cookieMor = await getCookieMor();
  if (cookieMor == "") return { ok: false };
  const config = {
    method,
    headers: new Headers({
      Authorization: "jwt " + cookieMor,
      "Content-Type": "application/json",
    }),
  };
  if (data) {
    config.body = data;
  }
  const res = await fetch(url, config);
  if (res.ok) return { data: await res.json(), ok: true };
  return { ok: false };
}

function generateYear() {
  const yearLocalStorage = localStorage.getItem("year");
  let html = "";
  for (let i = currentYear; i > currentYear - 2; i--) {
    html += `<option value='${i}' ${
      yearLocalStorage === i.toString() ? "selected" : ""
    }>${i}</option>`;
  }
  yearEle.innerHTML = html;
}

function generateMonth() {
  let html = "";
  const monthLocalStorage = localStorage.getItem("month");

  for (let i = 1; i < 13; i++) {
    html += `<option value='${i}' ${
      monthLocalStorage === i.toString() ? "selected" : ""
    }>${i}</option>`;
  }
  monthEle.innerHTML = html;
}

async function generateProject() {
  const res = await fetchData("get", urlListAllProject);
  const saveProject = localStorage.getItem("project");

  if (res.ok) {
    listProject = res.data.data;
  }
  let html = "";
  listProject.forEach((project) => {
    html += `<option value='${project.id}' ${
      saveProject === project.id.toString() ? "selected" : ""
    }>${project.name}</option>`;
  });
  projectEle.innerHTML = html;
}

function generateTime() {
  const saveTime = localStorage.getItem("time");
  if (saveTime) {
    timeEle.value = saveTime;
  } else {
    timeEle.value = "8";
  }
}

yearEle.addEventListener("change", (e) => {
  localStorage.setItem("year", yearEle.value);
});

monthEle.addEventListener("change", (e) => {
  localStorage.setItem("month", monthEle.value);
});

projectEle.addEventListener("change", (e) => {
  localStorage.setItem("project", projectEle.value);
});

timeEle.addEventListener("input", (e) => {
  localStorage.setItem("time", timeEle.value);
});

btnSubmit.addEventListener("click", async () => {
  await generateTableDate();
});

async function generateTableDate() {
  const year = yearEle.value;
  const month = monthEle.value.padStart(2, "0");
  const payload = urlDateOfMonth + year + "-" + month;

  const dayStartMonth = new Date(`${year}-${month}-01`).getDay();
  const indexStartDate = [6, 0, 1, 2, 3, 4, 5][dayStartMonth];
  const res = await fetchData("get", payload);
  let dataMonth = [];
  console.log(res);
  if (res.ok) {
    dataMonth = res.data.data.project_time;
  } else {
    return;
  }
  let i = 0;
  let indexDataMonth = 0;
  let html = "";
  for (let row = 0; row < 6; row++) {
    let htmlRow = "<tr>";
    for (let col = 0; col < 7; col++) {
      let htmlCol;
      if (i >= indexStartDate && dataMonth[indexDataMonth]) {
        const date = new Date(dataMonth[indexDataMonth].date);
        let classCheckIn =
          dataMonth[indexDataMonth].actual_time != ""
            ? "checkin"
            : "checked empty";
        if (date.getDay() == 0 || date.getDay() == 6) classCheckIn = "bg-red";
        if (
          new Date().getTime() <
          new Date(dataMonth[indexDataMonth].date).getTime()
        )
          classCheckIn = "bg-red";
        htmlCol = `<td class="${classCheckIn}" data-date="${formatDateToString(
          date
        )}">${date.getDate()}</td>`;
        indexDataMonth++;
      } else {
        htmlCol = `<td class="no-cursor bg-red"></td>`;
      }
      i++;
      htmlRow += htmlCol;
    }
    htmlRow += " </tr>";
    html += htmlRow;
  }
  tableBodyEle.innerHTML = html;
  addEventForEmptyCheckin();
  tableDateEle.style.display = "block";
}

function formatDateToString(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function addEventForEmptyCheckin() {
  const listCheckEle = document.querySelectorAll(".empty");
  listCheckEle.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("checked");
    });
  });
}

btnCheckIn.addEventListener("click", () => {
  const listDateEleCheckIn = tableBodyEle.querySelectorAll(".checked");
  if (listDateEleCheckIn.length == 0) return;
  const listDate = [...listDateEleCheckIn].map((ele) =>
    ele.getAttribute("data-date")
  );
  listDateCheckIn = listDate;
  showPopupCheckin(listDate);
});

function showPopupCheckin(listDate) {
  showProjectEle.innerHTML = listProject.find(
    (project) => project.id.toString() == projectEle.value
  ).name;
  showTimeEle.innerHTML = timeEle.value;
  listDateCheckInEle.innerHTML = listDate
    .map((date) => {
      return `<li>${date}</li>`;
    })
    .join("");
  poupCheckIn.classList.remove("d-none");
}

btnCancelPopupCheckIn.addEventListener("click", () => {
  poupCheckIn.classList.add("d-none");
});
btnClosePopupCheckInEle.addEventListener("click", () => {
  poupCheckIn.classList.add("d-none");
});
btnCheckInOkEle.addEventListener("click", async () => {
  loadingEle.classList.remove("d-none");
  const failDateCheckIn = [];
  for (let i = 0; i < listDateCheckIn.length; i++) {
    const data = {
      date: listDateCheckIn[i],
      next_day_work: [
        {
          project_id: Number(projectEle.value),
          actual_time: timeEle.value,
        },
      ],
      today_work: [
        {
          project_id: Number(projectEle.value),
          actual_time: timeEle.value,
        },
      ],
    };
    const res = await fetchData("post", urlCheckin, JSON.stringify(data));
    if (!res.ok) {
      failDateCheckIn.push(listDateCheckIn[i]);
    }
  }
  generateTableDate();
  if (failDateCheckIn.length == 0) {
    alert("Check in success");
  } else {
    let strDateFail = listDateCheckIn.join("\n");
    alert("Check in false: \n" + strDateFail);
  }
  loadingEle.classList.add("d-none");
  poupCheckIn.classList.add("d-none");
  const [currentTab] = await getCurrentTab();
  if (currentTab) {
    chrome.tabs.reload(currentTab.id);
  }
});

async function getCurrentTab() {
  return await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
}
