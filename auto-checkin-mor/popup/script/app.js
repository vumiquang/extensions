const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const yearEle = document.getElementById("year");
const monthEle = document.getElementById("month");
const projectEle = document.getElementById("project");
const btnSubmit = document.getElementById("run-script");
const timeEle = document.getElementById("time");
const tableBodyEle = document.getElementById("table-body");
const urlDateOfMonth =
  "https://api.checkin.mor.com.vn/api/daily/daily-report-data/user/?month=";
const urlListAllProject =
  "https://api.checkin.mor.com.vn/api/project/?name=&status=&type=&start_date=&end_date=";
const urlHoliday =
  "https://api.checkin.mor.com.vn/api/calendars/holidays/?year=";
const listHolidaty = [];

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

async function fetchData(method, url) {
  const cookieMor = await getCookieMor();
  if (cookieMor == "") return { ok: false };
  const config = {
    method,
    headers: new Headers({
      Authorization: "jwt " + cookieMor,
      "Content-Type": "application/json",
    }),
  };
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

  let listProject = [];
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
  const data = {
    year: yearEle.value,
    month: monthEle.value,
    time: timeEle.value,
    project_id: projectEle.value,
  };
  console.log("data", data);

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
  if (res.ok) {
    dataMonth = res.data.data.project_time;
  }
  console.log(indexStartDate);
  let i = 0;
  let indexDataMonth = 0;
  let html = "";
  for (let row = 0; row < 6; row++) {
    let htmlRow = "<tr>";
    for (let col = 0; col < 7; col++) {
      let htmlCol;
      if (i >= indexStartDate && dataMonth[indexDataMonth]) {
        const date = new Date(dataMonth[indexDataMonth].date);
        htmlCol = `<td>${date.getDate()}</td>`;
        indexDataMonth++;
      } else {
        htmlCol = `<td>aaa</td>`;
      }
      i++;
      htmlRow += htmlCol;
    }
    htmlRow += " </tr>";
    html += htmlRow;
  }
  tableBodyEle.innerHTML = html;
}
