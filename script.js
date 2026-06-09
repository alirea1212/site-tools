const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const fmtFa = (n) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
const pad = (n) => String(n).padStart(2, "0");
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1700);
};
const copy = async (text) => {
  try { await navigator.clipboard.writeText(text); toast("کپی شد ✅"); }
  catch { toast("کپی نشد؛ مرورگر اجازه نداد"); }
};
const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const setResult = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

window.addEventListener("load", () => setTimeout(() => $("#loader").classList.add("hide"), 650));

// Scroll progress + cursor glow
document.addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  $("#scrollProgress").style.width = `${Math.min(100, (scrollY / h) * 100)}%`;
});
document.addEventListener("pointermove", (e) => {
  const glow = $("#cursorGlow");
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
  setResult("mouseOut", `X: ${Math.round(e.clientX)} | Y: ${Math.round(e.clientY)}`);
});

// Background particles
const pCanvas = $("#particleCanvas");
const pCtx = pCanvas.getContext("2d");
let particles = [];
function resizeParticles(){
  pCanvas.width = innerWidth * devicePixelRatio;
  pCanvas.height = innerHeight * devicePixelRatio;
  pCtx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  particles = Array.from({length: Math.min(110, Math.floor(innerWidth/12))}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    vx:(Math.random()-.5)*.55, vy:(Math.random()-.5)*.55, r:Math.random()*2+0.5
  }));
}
function drawParticles(){
  pCtx.clearRect(0,0,innerWidth,innerHeight);
  pCtx.fillStyle = "rgba(255,255,255,.68)";
  pCtx.strokeStyle = "rgba(0,245,255,.14)";
  particles.forEach((p,i)=>{
    p.x += p.vx; p.y += p.vy;
    if(p.x<0 || p.x>innerWidth) p.vx *= -1;
    if(p.y<0 || p.y>innerHeight) p.vy *= -1;
    pCtx.beginPath(); pCtx.arc(p.x,p.y,p.r,0,Math.PI*2); pCtx.fill();
    for(let j=i+1;j<particles.length;j++){
      const q = particles[j], dx=p.x-q.x, dy=p.y-q.y, d=Math.hypot(dx,dy);
      if(d<115){
        pCtx.globalAlpha = 1-d/115;
        pCtx.beginPath(); pCtx.moveTo(p.x,p.y); pCtx.lineTo(q.x,q.y); pCtx.stroke();
        pCtx.globalAlpha = 1;
      }
    }
  });
  requestAnimationFrame(drawParticles);
}
resizeParticles(); drawParticles(); addEventListener("resize", resizeParticles);

// Matrix rain
const mCanvas = $("#matrixCanvas");
const mCtx = mCanvas.getContext("2d");
let matrixDrops = [];
function resizeMatrix(){
  mCanvas.width = innerWidth * devicePixelRatio;
  mCanvas.height = innerHeight * devicePixelRatio;
  mCtx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  matrixDrops = Array.from({ length: Math.floor(innerWidth / 18) }, () => Math.random() * -80);
}
function drawMatrix(){
  mCtx.fillStyle = "rgba(0,0,0,.055)";
  mCtx.fillRect(0,0,innerWidth,innerHeight);
  mCtx.fillStyle = "rgba(0,245,255,.72)";
  mCtx.font = "14px Orbitron";
  matrixDrops.forEach((y, i) => {
    const char = Math.random() > .5 ? "1" : "0";
    mCtx.fillText(char, i * 18, y * 18);
    matrixDrops[i] = y * 18 > innerHeight && Math.random() > .975 ? 0 : y + 1;
  });
  requestAnimationFrame(drawMatrix);
}
resizeMatrix(); drawMatrix(); addEventListener("resize", resizeMatrix);

// Iran time
let apiBaseTime = null;
let clientBaseTime = null;

async function syncIranTime(){
  try{
    $("#apiState").textContent = "در حال اتصال";
    $("#timeStatus").textContent = "اتصال به WorldTimeAPI...";
    const res = await fetch("https://worldtimeapi.org/api/timezone/Asia/Tehran", { cache:"no-store" });
    if(!res.ok) throw new Error("Time API failed");
    const data = await res.json();
    apiBaseTime = data.unixtime * 1000;
    clientBaseTime = Date.now();
    $("#apiState").textContent = "متصل";
    $("#timeStatus").textContent = "همگام با API زمان ایران";
  }catch{
    apiBaseTime = null;
    clientBaseTime = null;
    $("#apiState").textContent = "آفلاین";
    $("#timeStatus").textContent = "API قطع بود؛ از زمان سیستم با تایم‌زون ایران استفاده شد";
  }
}
function getIranNow(){
  return apiBaseTime && clientBaseTime ? new Date(apiBaseTime + Date.now() - clientBaseTime) : new Date();
}
function formatInTZ(date, timeZone, opts){
  return new Intl.DateTimeFormat("fa-IR", { timeZone, ...opts }).format(date);
}
function updateClock(){
  const now = getIranNow();
  $("#digitalTime").textContent = formatInTZ(now, "Asia/Tehran", {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  $("#iranDate").textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {timeZone:"Asia/Tehran",weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(now);
  const parts = new Intl.DateTimeFormat("en-US", {timeZone:"Asia/Tehran",hour:"numeric",minute:"numeric",second:"numeric",hour12:false}).formatToParts(now);
  const part = (t) => Number(parts.find(p=>p.type===t)?.value || 0);
  const h = part("hour") % 12, m = part("minute"), s = part("second");
  $("#hourHand").style.transform = `translateX(-50%) rotate(${h*30 + m*.5}deg)`;
  $("#minuteHand").style.transform = `translateX(-50%) rotate(${m*6 + s*.1}deg)`;
  $("#secondHand").style.transform = `translateX(-50%) rotate(${s*6}deg)`;

  setResult("iranTimeOut", $("#digitalTime").textContent);
  setResult("persianDateOut", $("#iranDate").textContent);
  setResult("calendarMixOut", [
    "شمسی: " + new Intl.DateTimeFormat("fa-IR-u-ca-persian", {timeZone:"Asia/Tehran",dateStyle:"full"}).format(now),
    "میلادی: " + new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {timeZone:"Asia/Tehran",dateStyle:"full"}).format(now),
    "قمری: " + new Intl.DateTimeFormat("fa-IR-u-ca-islamic", {timeZone:"Asia/Tehran",dateStyle:"full"}).format(now)
  ].join("\n"));
  updateWorldClocks();
  updateNowruz();
}
$("#syncTimeBtn").addEventListener("click", syncIranTime);
syncIranTime(); setInterval(syncIranTime, 5*60*1000); setInterval(updateClock, 1000);

// UI
$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("ali-v2-theme", document.body.classList.contains("light") ? "light" : "dark");
});
if(localStorage.getItem("ali-v2-theme")==="light") document.body.classList.add("light");
$("#panicBtn").addEventListener("click", () => { document.body.classList.toggle("turbo"); toast("Turbo FX تغییر کرد ⚡"); });

// Tool data
const tools = [
  {id:"iran-time",cat:"زمان",icon:"⏰",title:"ساعت دقیق ایران",desc:"API + fallback آفلاین",html:`<div class="result big-result" id="iranTimeOut">--:--:--</div><button onclick="syncIranTime()">همگام‌سازی</button>`},
  {id:"persian-date",cat:"زمان",icon:"📅",title:"تاریخ شمسی ایران",desc:"Persian Calendar",html:`<div class="result" id="persianDateOut">---</div>`},
  {id:"calendar-mix",cat:"زمان",icon:"🗓️",title:"تقویم سه‌گانه",desc:"شمسی، میلادی، قمری",html:`<pre class="result" id="calendarMixOut">---</pre>`},
  {id:"world-clock",cat:"زمان",icon:"🌍",title:"ساعت شهرهای جهان",desc:"Tehran / Berlin / Tokyo / NY",html:`<div class="result" id="worldClockOut">---</div>`},
  {id:"nowruz",cat:"زمان",icon:"🌱",title:"شمارش تا نوروز",desc:"تقریبی تا ۲۰ مارس",html:`<div class="result big-result" id="nowruzOut">---</div>`},
  {id:"custom-countdown",cat:"زمان",icon:"🚀",title:"شمارش معکوس دلخواه",desc:"تاریخ خودت",html:`<input id="customDate" type="datetime-local"><button id="customCountdownBtn">شروع</button><div class="result" id="customCountdownOut">تاریخ انتخاب کن</div>`},
  {id:"alarm",cat:"زمان",icon:"🔔",title:"آلارم مرورگری",desc:"هشدار محلی",html:`<input id="alarmTime" type="time"><button id="alarmBtn">تنظیم آلارم</button><div class="result" id="alarmOut">آلارمی تنظیم نشده</div>`},
  {id:"pomodoro",cat:"زمان",icon:"🎯",title:"تایمر تمرکز",desc:"دقیقه قابل تنظیم",html:`<div class="row"><input id="pomoMin" type="number" value="25" min="1"><button id="pomoSet">ست</button></div><div class="result big-result" id="pomoOut">25:00</div><div class="button-row"><button id="pomoStart">شروع</button><button id="pomoPause">توقف</button><button id="pomoReset">ریست</button></div>`},
  {id:"stopwatch",cat:"زمان",icon:"⏱️",title:"کرنومتر حرفه‌ای",desc:"صدم ثانیه",html:`<div class="result big-result" id="swOut">00:00.00</div><div class="button-row"><button id="swStart">شروع</button><button id="swStop">توقف</button><button id="swReset">ریست</button></div>`},
  {id:"time-converter",cat:"زمان",icon:"🔁",title:"مبدل زمان",desc:"ثانیه به دقیقه/ساعت/روز",html:`<input id="timeInput" type="number" placeholder="ثانیه"><button id="timeConvertBtn">تبدیل</button><div class="result" id="timeConvertOut">---</div>`},

  {id:"calculator",cat:"محاسبات",icon:"🧮",title:"ماشین‌حساب حرفه‌ای",desc:"عملیات اصلی",html:`<div class="result calc-display" id="calcDisplay">0</div><div class="calc-grid">${["AC","⌫","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","(",")","="].map(x=>`<button data-calc="${x}" class="${x==="AC"?"danger":x==="="?"equal":x==="0"?"wide":""}">${x}</button>`).join("")}</div>`},
  {id:"scientific",cat:"محاسبات",icon:"🧠",title:"ماشین‌حساب علمی کوچک",desc:"sin cos sqrt pow",html:`<input id="sciNum" type="number" placeholder="عدد"><div class="button-row"><button data-sci="sqrt">√</button><button data-sci="square">x²</button><button data-sci="sin">sin</button><button data-sci="cos">cos</button></div><div class="result" id="sciOut">---</div>`},
  {id:"percent",cat:"محاسبات",icon:"٪",title:"درصدگیر سریع",desc:"محاسبه درصد",html:`<div class="row"><input id="percentA" type="number" placeholder="عدد"><input id="percentB" type="number" placeholder="درصد"></div><button id="percentBtn">محاسبه</button><div class="result" id="percentOut">---</div>`},
  {id:"discount",cat:"محاسبات",icon:"🏷️",title:"محاسبه تخفیف",desc:"قیمت نهایی",html:`<div class="row"><input id="discountPrice" type="number" placeholder="قیمت"><input id="discountRate" type="number" placeholder="درصد تخفیف"></div><button id="discountBtn">محاسبه</button><div class="result" id="discountOut">---</div>`},
  {id:"age",cat:"محاسبات",icon:"🎂",title:"محاسبه سن",desc:"تقریبی",html:`<input id="birthDate" type="date"><button id="ageBtn">محاسبه</button><div class="result" id="ageOut">---</div>`},
  {id:"bmi",cat:"محاسبات",icon:"⚖️",title:"محاسبه BMI",desc:"شاخص بدن",html:`<div class="row"><input id="bmiH" type="number" placeholder="قد cm"><input id="bmiW" type="number" placeholder="وزن kg"></div><button id="bmiBtn">محاسبه</button><div class="result" id="bmiOut">---</div>`},
  {id:"bmr",cat:"محاسبات",icon:"🔥",title:"محاسبه کالری پایه",desc:"فرمول تقریبی Mifflin",html:`<div class="row"><input id="bmrAge" type="number" placeholder="سن"><input id="bmrH" type="number" placeholder="قد cm"></div><div class="row"><input id="bmrW" type="number" placeholder="وزن kg"><select id="bmrSex"><option value="male">پسر/مرد</option><option value="female">دختر/زن</option></select></div><button id="bmrBtn">محاسبه</button><div class="result" id="bmrOut">---</div>`},
  {id:"random-number",cat:"محاسبات",icon:"🎲",title:"عدد تصادفی",desc:"بین دو عدد",html:`<div class="row"><input id="randMin" type="number" value="1"><input id="randMax" type="number" value="100"></div><button id="randBtn">بساز</button><div class="result big-result" id="randOut">---</div>`},
  {id:"dice",cat:"محاسبات",icon:"🎲",title:"تاس چندطرفه",desc:"D6 / D20",html:`<div class="row"><input id="diceCount" type="number" value="2" min="1"><select id="diceSides"><option>6</option><option>8</option><option>12</option><option>20</option><option>100</option></select></div><button id="diceBtn">بنداز</button><div class="result" id="diceOut">---</div>`},
  {id:"coin",cat:"محاسبات",icon:"🪙",title:"شیر یا خط",desc:"تصادفی",html:`<button id="coinBtn">پرتاب</button><div class="result big-result" id="coinOut">---</div>`},

  {id:"length",cat:"مبدل",icon:"📏",title:"مبدل طول",desc:"cm/m/in/ft",html:`<div class="row"><input id="lengthVal" type="number" placeholder="عدد"><select id="lengthUnit"><option value="cm">cm</option><option value="m">m</option><option value="in">inch</option><option value="ft">foot</option></select></div><button id="lengthBtn">تبدیل همه</button><div class="result" id="lengthOut">---</div>`},
  {id:"weight",cat:"مبدل",icon:"🏋️",title:"مبدل وزن",desc:"kg/g/lb",html:`<div class="row"><input id="weightVal" type="number" placeholder="عدد"><select id="weightUnit"><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option></select></div><button id="weightBtn">تبدیل</button><div class="result" id="weightOut">---</div>`},
  {id:"temperature",cat:"مبدل",icon:"🌡️",title:"مبدل دما",desc:"C/F/K",html:`<div class="row"><input id="tempVal" type="number" placeholder="عدد"><select id="tempUnit"><option value="c">°C</option><option value="f">°F</option><option value="k">K</option></select></div><button id="tempBtn">تبدیل</button><div class="result" id="tempOut">---</div>`},
  {id:"speed",cat:"مبدل",icon:"🏎️",title:"مبدل سرعت",desc:"km/h m/s mph",html:`<div class="row"><input id="speedVal" type="number" placeholder="عدد"><select id="speedUnit"><option value="kmh">km/h</option><option value="ms">m/s</option><option value="mph">mph</option></select></div><button id="speedBtn">تبدیل</button><div class="result" id="speedOut">---</div>`},
  {id:"data-size",cat:"مبدل",icon:"💾",title:"مبدل حجم داده",desc:"KB MB GB",html:`<div class="row"><input id="dataVal" type="number" placeholder="عدد"><select id="dataUnit"><option value="kb">KB</option><option value="mb">MB</option><option value="gb">GB</option></select></div><button id="dataBtn">تبدیل</button><div class="result" id="dataOut">---</div>`},
  {id:"currency-demo",cat:"مبدل",icon:"💱",title:"مبدل نمایشی ارز",desc:"با نرخ دستی",html:`<div class="row"><input id="curAmount" type="number" placeholder="مبلغ"><input id="curRate" type="number" placeholder="نرخ تبدیل"></div><button id="curBtn">محاسبه</button><div class="result" id="curOut">---</div>`},

  {id:"ohm",cat:"الکترونیک",icon:"⚡",title:"قانون اهم",desc:"V I R",html:`<div class="row"><input id="ohmV" type="number" placeholder="V"><input id="ohmI" type="number" placeholder="I"><input id="ohmR" type="number" placeholder="R"></div><button id="ohmBtn">محاسبه مجهول</button><div class="result" id="ohmOut">یکی را خالی بگذار</div>`},
  {id:"power",cat:"الکترونیک",icon:"🔌",title:"محاسبه توان",desc:"P=VI",html:`<div class="row"><input id="powV" type="number" placeholder="V"><input id="powI" type="number" placeholder="A"></div><button id="powBtn">محاسبه</button><div class="result" id="powOut">---</div>`},
  {id:"led-resistor",cat:"الکترونیک",icon:"💡",title:"مقاومت LED",desc:"R=(Vs-Vf)/I",html:`<div class="row"><input id="ledVs" type="number" placeholder="Vs"><input id="ledVf" type="number" placeholder="Vf"></div><input id="ledI" type="number" placeholder="جریان mA"><button id="ledBtn">محاسبه</button><div class="result" id="ledOut">---</div>`},
  {id:"voltage-divider",cat:"الکترونیک",icon:"📉",title:"تقسیم ولتاژ",desc:"Vout",html:`<div class="row"><input id="vdVin" type="number" placeholder="Vin"><input id="vdR1" type="number" placeholder="R1"><input id="vdR2" type="number" placeholder="R2"></div><button id="vdBtn">محاسبه</button><div class="result" id="vdOut">---</div>`},
  {id:"resistors",cat:"الکترونیک",icon:"🧩",title:"مقاومت سری/موازی",desc:"با کاما جدا کن",html:`<input id="resList" placeholder="100, 220, 1000"><button id="resBtn">محاسبه</button><div class="result" id="resOut">---</div>`},
  {id:"capacitor",cat:"الکترونیک",icon:"🔋",title:"ثابت زمانی RC",desc:"τ = R×C",html:`<div class="row"><input id="rcR" type="number" placeholder="R Ohm"><input id="rcC" type="number" placeholder="C uF"></div><button id="rcBtn">محاسبه</button><div class="result" id="rcOut">---</div>`},
  {id:"battery-runtime",cat:"الکترونیک",icon:"🔋",title:"زمان کار باتری",desc:"تقریبی",html:`<div class="row"><input id="batMah" type="number" placeholder="mAh"><input id="batV" type="number" placeholder="V"></div><input id="batW" type="number" placeholder="مصرف W"><button id="batBtn">محاسبه</button><div class="result" id="batOut">---</div>`},
  {id:"liion-pack",cat:"الکترونیک",icon:"🪫",title:"پک لیتیوم یون",desc:"S/P",html:`<div class="row"><input id="packS" type="number" placeholder="S" value="3"><input id="packP" type="number" placeholder="P" value="1"><input id="cellMah" type="number" placeholder="mAh سلول" value="2200"></div><button id="packBtn">محاسبه</button><div class="result" id="packOut">---</div>`},
  {id:"wire-drop",cat:"الکترونیک",icon:"🧵",title:"افت ولتاژ سیم",desc:"تقریبی مس",html:`<div class="row"><input id="wireLen" type="number" placeholder="طول متر"><input id="wireA" type="number" placeholder="جریان A"></div><input id="wireMm" type="number" placeholder="سطح مقطع mm²"><button id="wireBtn">محاسبه</button><div class="result" id="wireOut">---</div>`},

  {id:"text-counter",cat:"متن",icon:"✍️",title:"شمارنده متن",desc:"کلمه و حرف",html:`<textarea id="textCountIn" placeholder="متن..."></textarea><div class="result" id="textCountOut">۰ کلمه • ۰ حرف</div>`},
  {id:"case-tool",cat:"متن",icon:"🔤",title:"تبدیل حروف",desc:"Case tools",html:`<textarea id="caseIn" placeholder="Text..."></textarea><div class="button-row"><button id="upperBtn">UPPER</button><button id="lowerBtn">lower</button><button id="titleBtn">Title</button></div>`},
  {id:"reverse-text",cat:"متن",icon:"↩️",title:"برعکس‌ساز متن",desc:"Reverse",html:`<textarea id="reverseIn"></textarea><button id="reverseBtn">برعکس کن</button><div class="result" id="reverseOut">---</div>`},
  {id:"slug",cat:"متن",icon:"🔗",title:"اسلاگ‌ساز لینک",desc:"URL slug",html:`<input id="slugIn" placeholder="عنوان سایت من"><button id="slugBtn">بساز</button><div class="result" id="slugOut">---</div>`},
  {id:"base64",cat:"متن",icon:"🧬",title:"Base64",desc:"Encode / Decode",html:`<textarea id="baseIn"></textarea><div class="button-row"><button id="baseEnc">Encode</button><button id="baseDec">Decode</button></div><div class="result" id="baseOut">---</div>`},
  {id:"url-code",cat:"متن",icon:"🌐",title:"URL Encode",desc:"Encode / Decode",html:`<textarea id="urlIn"></textarea><div class="button-row"><button id="urlEnc">Encode</button><button id="urlDec">Decode</button></div><div class="result" id="urlOut">---</div>`},
  {id:"json-format",cat:"متن",icon:"{}",title:"فرمت‌کننده JSON",desc:"Pretty print",html:`<textarea id="jsonIn" placeholder='{"name":"alireza"}'></textarea><button id="jsonBtn">Format</button><pre class="result" id="jsonOut">---</pre>`},
  {id:"html-escape",cat:"متن",icon:"&lt;/&gt;",title:"HTML Escape",desc:"ایمن‌سازی متن",html:`<textarea id="htmlIn" placeholder="<h1>Hi</h1>"></textarea><button id="htmlBtn">Escape</button><div class="result" id="htmlOut">---</div>`},
  {id:"regex",cat:"متن",icon:"🧪",title:"تست Regex",desc:"match finder",html:`<input id="regexPattern" placeholder="\\d+"><textarea id="regexText" placeholder="متن تست"></textarea><button id="regexBtn">تست</button><div class="result" id="regexOut">---</div>`},
  {id:"text-to-speech",cat:"متن",icon:"🗣️",title:"خواندن متن",desc:"Speech API",html:`<textarea id="speakText" placeholder="متن برای خواندن"></textarea><button id="speakBtn">بخوان</button><div class="result">اگر مرورگر پشتیبانی کند، متن خوانده می‌شود.</div>`},

  {id:"password",cat:"طراحی و ابزار",icon:"🔐",title:"پسوردساز قوی",desc:"Crypto API",html:`<label>طول: <b id="passLenText">18</b></label><input id="passLen" type="range" min="8" max="48" value="18"><button id="passBtn">ساخت رمز</button><div class="result" id="passOut">---</div>`},
  {id:"qr",cat:"طراحی و ابزار",icon:"🔳",title:"QR Code",desc:"API QRServer",html:`<input id="qrText" placeholder="متن یا لینک"><button id="qrBtn">ساخت QR</button><img class="qr-img" id="qrImg" alt="QR">`},
  {id:"palette",cat:"طراحی و ابزار",icon:"🎨",title:"پالت رنگ نئونی",desc:"کلیک برای کپی",html:`<button id="paletteBtn">پالت جدید</button><div class="color-strip" id="paletteOut"></div>`},
  {id:"hex-rgb",cat:"طراحی و ابزار",icon:"🌈",title:"HEX به RGB",desc:"Color converter",html:`<input id="hexIn" placeholder="#00f5ff"><button id="hexBtn">تبدیل</button><div class="result" id="hexOut">---</div>`},
  {id:"gradient",cat:"طراحی و ابزار",icon:"🪄",title:"گرادینت‌ساز CSS",desc:"Linear gradient",html:`<div class="row"><input id="gradA" type="color" value="#00f5ff"><input id="gradB" type="color" value="#ff2bd6"></div><button id="gradBtn">ساخت</button><div class="result" id="gradOut">---</div>`},
  {id:"clamp",cat:"طراحی و ابزار",icon:"📐",title:"CSS Clamp",desc:"Responsive font",html:`<div class="row"><input id="clampMin" type="number" value="18"><input id="clampMax" type="number" value="64"></div><button id="clampBtn">بساز</button><div class="result" id="clampOut">---</div>`},
  {id:"shadow",cat:"طراحی و ابزار",icon:"🌘",title:"Box Shadow ساز",desc:"CSS shadow",html:`<div class="row"><input id="shadowBlur" type="number" value="30"><input id="shadowOpacity" type="number" value="25"></div><button id="shadowBtn">بساز</button><div class="result" id="shadowOut">---</div>`},
  {id:"glass",cat:"طراحی و ابزار",icon:"🧊",title:"Glassmorphism ساز",desc:"CSS glass",html:`<button id="glassBtn">کد شیشه‌ای</button><div class="result" id="glassOut">---</div>`},

  {id:"notes",cat:"ذخیره و سیستم",icon:"📝",title:"یادداشت محلی",desc:"LocalStorage",html:`<textarea id="noteIn" placeholder="یادداشت..."></textarea><div class="button-row"><button id="noteSave">ذخیره</button><button id="noteClear">پاک</button></div><div class="result" id="noteOut">---</div>`},
  {id:"todo",cat:"ذخیره و سیستم",icon:"✅",title:"کارهای روزانه",desc:"LocalStorage",html:`<div class="row"><input id="todoIn" placeholder="کار جدید"><button id="todoAdd">+</button></div><div class="list" id="todoList"></div>`},
  {id:"expense",cat:"ذخیره و سیستم",icon:"💸",title:"هزینه‌نگار ساده",desc:"جمع هزینه‌ها",html:`<div class="row"><input id="expenseName" placeholder="عنوان"><input id="expenseAmount" type="number" placeholder="مبلغ"></div><button id="expenseAdd">اضافه</button><div class="list" id="expenseList"></div><div class="result" id="expenseTotal">جمع: 0</div>`},
  {id:"habit",cat:"ذخیره و سیستم",icon:"📌",title:"Habit Tracker",desc:"پیگیری عادت",html:`<input id="habitName" placeholder="نام عادت"><button id="habitAdd">اضافه/امروز انجام شد</button><div class="list" id="habitList"></div>`},
  {id:"device",cat:"ذخیره و سیستم",icon:"📱",title:"اطلاعات دستگاه",desc:"Browser info",html:`<button id="deviceBtn">نمایش</button><pre class="result" id="deviceOut">---</pre>`},
  {id:"battery-api",cat:"ذخیره و سیستم",icon:"🔋",title:"وضعیت باتری",desc:"Battery API",html:`<button id="batteryBtn">خواندن باتری</button><div class="result" id="batteryOut">---</div>`},
  {id:"network",cat:"ذخیره و سیستم",icon:"📶",title:"وضعیت اینترنت",desc:"Network info",html:`<button id="networkBtn">بررسی</button><div class="result" id="networkOut">---</div>`},
  {id:"key-tester",cat:"ذخیره و سیستم",icon:"⌨️",title:"تست کلید کیبورد",desc:"Key event",html:`<input id="keyInput" placeholder="اینجا کلیک کن و کلید بزن"><div class="result big-result" id="keyOut">---</div>`},
  {id:"mouse",cat:"ذخیره و سیستم",icon:"🖱️",title:"ردیاب موس",desc:"Pointer position",html:`<div class="result big-result" id="mouseOut">X: 0 | Y: 0</div>`},
  {id:"reaction",cat:"ذخیره و سیستم",icon:"⚡",title:"بازی سرعت واکنش",desc:"Reaction test",html:`<button id="reactionBtn">شروع</button><div class="result big-result" id="reactionOut">---</div>`}
];

const grid = $("#featureGrid");
const cats = ["همه", ...new Set(tools.map(t => t.cat))];
let activeCat = "همه";

function renderTabs(){
  $("#categoryTabs").innerHTML = cats.map(c => `<button class="tab ${c===activeCat?"active":""}" data-cat="${c}">${c}</button>`).join("");
  $$(".tab").forEach(b => b.onclick = () => { activeCat = b.dataset.cat; renderTools(); renderTabs(); });
}
function renderTools(){
  const term = $("#toolSearch").value.trim().toLowerCase();
  const filtered = tools.filter(t => (activeCat==="همه" || t.cat===activeCat) && [t.title,t.desc,t.cat,t.id].join(" ").toLowerCase().includes(term));
  grid.innerHTML = filtered.map(t => `
    <article class="feature-card glass cyber-border" id="tool-${t.id}" data-title="${t.title}" data-cat="${t.cat}">
      <span class="category-pill">${t.cat}</span>
      <div class="card-head">
        <span class="icon">${t.icon}</span>
        <div><h3>${t.title}</h3><p>${t.desc}</p></div>
      </div>
      <div class="tool-body">${t.html}</div>
    </article>
  `).join("");
  wireTools();
  updateLiveSystem();
  requestAnimationFrame(()=>initTilt());
}
$("#toolSearch").addEventListener("input", renderTools);
renderTabs(); renderTools();

function initTilt(){
  $$(".feature-card").forEach(card=>{
    card.onmousemove = e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateX(${y*-5}deg) rotateY(${x*7}deg) translateY(-2px)`;
    };
    card.onmouseleave = () => card.style.transform = "";
  });
}

function updateWorldClocks(){
  const now = getIranNow();
  const zones = [
    ["تهران","Asia/Tehran"],["برلین","Europe/Berlin"],["توکیو","Asia/Tokyo"],["نیویورک","America/New_York"],["دبی","Asia/Dubai"]
  ];
  setResult("worldClockOut", zones.map(([name,tz]) => `${name}: ${formatInTZ(now,tz,{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}`).join(" | "));
}
function updateNowruz(){
  const now = getIranNow();
  let target = new Date(now.getFullYear(), 2, 20, 0, 0, 0);
  if(now > target) target = new Date(now.getFullYear()+1, 2, 20, 0, 0, 0);
  const diff = target - now;
  const d = Math.floor(diff/86400000), h = Math.floor(diff%86400000/3600000);
  setResult("nowruzOut", `${fmtFa(d)} روز • ${fmtFa(h)} ساعت`);
}

// Timers
let customTimer = null, alarmTimer = null, pomoTimer = null, pomoSeconds = 1500, swTimer = null, swStart = 0, swElapsed = 0, reactionStarted = 0, reactionTimeout = null;

function beep(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = 880; gain.gain.value = .08; osc.start();
  setTimeout(()=>{osc.stop(); ctx.close();}, 500);
}
function renderPomo(){
  setResult("pomoOut", `${pad(Math.floor(pomoSeconds/60))}:${pad(pomoSeconds%60)}`);
}
function renderSW(){
  const e = swTimer ? Date.now() - swStart + swElapsed : swElapsed;
  setResult("swOut", `${pad(Math.floor(e/60000))}:${pad(Math.floor(e%60000/1000))}.${pad(Math.floor(e%1000/10))}`);
}

// Persistent data
let todos = JSON.parse(localStorage.getItem("ali-v2-todos") || "[]");
let expenses = JSON.parse(localStorage.getItem("ali-v2-expenses") || "[]");
let habits = JSON.parse(localStorage.getItem("ali-v2-habits") || "{}");

function saveTodos(){ localStorage.setItem("ali-v2-todos", JSON.stringify(todos)); }
function saveExpenses(){ localStorage.setItem("ali-v2-expenses", JSON.stringify(expenses)); }
function saveHabits(){ localStorage.setItem("ali-v2-habits", JSON.stringify(habits)); }

function wireTools(){
  // custom countdown
  $("#customCountdownBtn")?.addEventListener("click",()=>{
    clearInterval(customTimer);
    const target = new Date($("#customDate").value).getTime();
    if(!target) return setResult("customCountdownOut","تاریخ معتبر انتخاب کن");
    customTimer = setInterval(()=>{
      const diff = target - Date.now();
      if(diff <= 0){ setResult("customCountdownOut","زمان رسید!"); clearInterval(customTimer); beep(); return; }
      const d = Math.floor(diff/86400000), h = Math.floor(diff%86400000/3600000), m = Math.floor(diff%3600000/60000), s = Math.floor(diff%60000/1000);
      setResult("customCountdownOut",`${d} روز ${h} ساعت ${m} دقیقه ${s} ثانیه`);
    },1000);
  });
  $("#alarmBtn")?.addEventListener("click",()=>{
    clearTimeout(alarmTimer);
    const v = $("#alarmTime").value;
    if(!v) return setResult("alarmOut","ساعت انتخاب کن");
    const [h,m] = v.split(":").map(Number);
    const now = new Date(), target = new Date();
    target.setHours(h,m,0,0);
    if(target < now) target.setDate(target.getDate()+1);
    alarmTimer = setTimeout(()=>{ beep(); toast("آلارم فعال شد 🔔"); }, target-now);
    setResult("alarmOut",`آلارم برای ${v} تنظیم شد`);
  });
  $("#pomoSet")?.addEventListener("click",()=>{pomoSeconds = Math.max(1, safeNumber($("#pomoMin").value,25))*60; renderPomo();});
  $("#pomoStart")?.addEventListener("click",()=>{ if(pomoTimer) return; pomoTimer=setInterval(()=>{pomoSeconds=Math.max(0,pomoSeconds-1); renderPomo(); if(!pomoSeconds){clearInterval(pomoTimer);pomoTimer=null;beep();}},1000);});
  $("#pomoPause")?.addEventListener("click",()=>{clearInterval(pomoTimer);pomoTimer=null;});
  $("#pomoReset")?.addEventListener("click",()=>{clearInterval(pomoTimer);pomoTimer=null;pomoSeconds=Math.max(1,safeNumber($("#pomoMin")?.value,25))*60;renderPomo();});
  $("#swStart")?.addEventListener("click",()=>{ if(swTimer) return; swStart=Date.now(); swTimer=setInterval(renderSW,30);});
  $("#swStop")?.addEventListener("click",()=>{ if(!swTimer)return; swElapsed += Date.now()-swStart; clearInterval(swTimer); swTimer=null; renderSW();});
  $("#swReset")?.addEventListener("click",()=>{ clearInterval(swTimer); swTimer=null; swElapsed=0; renderSW();});
  $("#timeConvertBtn")?.addEventListener("click",()=>{ const s=safeNumber($("#timeInput").value); setResult("timeConvertOut",`${s} ثانیه = ${(s/60).toFixed(2)} دقیقه = ${(s/3600).toFixed(2)} ساعت = ${(s/86400).toFixed(4)} روز`); });

  // Calculator
  let calc = "";
  $("[data-calc]") && $$("[data-calc]").forEach(b => b.onclick = () => {
    const v = b.dataset.calc;
    if(v==="AC") calc = "";
    else if(v==="⌫") calc = calc.slice(0,-1);
    else if(v==="="){
      try{
        const safe = calc.replace(/%/g,"/100");
        if(!/^[0-9+\-*/().\s]+$/.test(safe)) throw new Error();
        calc = String(Math.round(Function(`"use strict";return (${safe})`)()*1e10)/1e10);
      }catch{ calc = "خطا"; }
    } else calc += v;
    $("#calcDisplay").textContent = calc || "0";
    if(calc==="خطا") calc = "";
  });
  $$("[data-sci]").forEach(b => b.onclick = () => {
    const x = safeNumber($("#sciNum").value);
    const op = b.dataset.sci;
    const out = op==="sqrt" ? Math.sqrt(x) : op==="square" ? x*x : op==="sin" ? Math.sin(x*Math.PI/180) : Math.cos(x*Math.PI/180);
    setResult("sciOut", out.toFixed(6));
  });
  $("#percentBtn")?.addEventListener("click",()=>{ const a=safeNumber($("#percentA").value), b=safeNumber($("#percentB").value); setResult("percentOut",`${b}% از ${a} = ${(a*b/100).toFixed(2)}`);});
  $("#discountBtn")?.addEventListener("click",()=>{ const p=safeNumber($("#discountPrice").value), r=safeNumber($("#discountRate").value); setResult("discountOut",`تخفیف: ${(p*r/100).toFixed(0)} | قیمت نهایی: ${(p*(1-r/100)).toFixed(0)}`);});
  $("#ageBtn")?.addEventListener("click",()=>{ const b=new Date($("#birthDate").value); if(!b.getTime()) return; const days=Math.floor((Date.now()-b)/86400000); setResult("ageOut",`حدود ${Math.floor(days/365.25)} سال، ${Math.floor(days%365.25/30.44)} ماه، ${Math.floor(days%30.44)} روز`);});
  $("#bmiBtn")?.addEventListener("click",()=>{ const h=safeNumber($("#bmiH").value)/100,w=safeNumber($("#bmiW").value); const bmi=w/(h*h); setResult("bmiOut", h&&w ? `BMI: ${bmi.toFixed(1)}` : "قد و وزن بده");});
  $("#bmrBtn")?.addEventListener("click",()=>{ const age=safeNumber($("#bmrAge").value), h=safeNumber($("#bmrH").value), w=safeNumber($("#bmrW").value), s=$("#bmrSex").value; const bmr=10*w+6.25*h-5*age+(s==="male"?5:-161); setResult("bmrOut",`BMR تقریبی: ${Math.round(bmr)} کالری در روز`);});
  $("#randBtn")?.addEventListener("click",()=>{ const a=safeNumber($("#randMin").value,1), b=safeNumber($("#randMax").value,100); setResult("randOut", Math.floor(Math.random()*(b-a+1)+a));});
  $("#diceBtn")?.addEventListener("click",()=>{ const c=Math.max(1,safeNumber($("#diceCount").value,1)), sides=safeNumber($("#diceSides").value,6); const arr=Array.from({length:c},()=>Math.floor(Math.random()*sides)+1); setResult("diceOut",`${arr.join(" + ")} = ${arr.reduce((a,b)=>a+b,0)}`);});
  $("#coinBtn")?.addEventListener("click",()=>setResult("coinOut",Math.random()>.5?"شیر":"خط"));

  // Converters
  $("#lengthBtn")?.addEventListener("click",()=>{ const v=safeNumber($("#lengthVal").value), u=$("#lengthUnit").value; const m=u==="cm"?v/100:u==="in"?v*.0254:u==="ft"?v*.3048:v; setResult("lengthOut",`${(m*100).toFixed(2)} cm | ${m.toFixed(4)} m | ${(m/0.0254).toFixed(2)} inch | ${(m/0.3048).toFixed(2)} ft`);});
  $("#weightBtn")?.addEventListener("click",()=>{ const v=safeNumber($("#weightVal").value), u=$("#weightUnit").value; const kg=u==="g"?v/1000:u==="lb"?v/2.20462:v; setResult("weightOut",`${kg.toFixed(3)} kg | ${(kg*1000).toFixed(1)} g | ${(kg*2.20462).toFixed(2)} lb`);});
  $("#tempBtn")?.addEventListener("click",()=>{ const v=safeNumber($("#tempVal").value), u=$("#tempUnit").value; const c=u==="f"?(v-32)*5/9:u==="k"?v-273.15:v; setResult("tempOut",`${c.toFixed(2)} °C | ${((c*9/5)+32).toFixed(2)} °F | ${(c+273.15).toFixed(2)} K`);});
  $("#speedBtn")?.addEventListener("click",()=>{ const v=safeNumber($("#speedVal").value), u=$("#speedUnit").value; const ms=u==="kmh"?v/3.6:u==="mph"?v*0.44704:v; setResult("speedOut",`${(ms*3.6).toFixed(2)} km/h | ${ms.toFixed(2)} m/s | ${(ms/0.44704).toFixed(2)} mph`);});
  $("#dataBtn")?.addEventListener("click",()=>{ const v=safeNumber($("#dataVal").value), u=$("#dataUnit").value; const kb=u==="mb"?v*1024:u==="gb"?v*1024*1024:v; setResult("dataOut",`${kb.toFixed(2)} KB | ${(kb/1024).toFixed(2)} MB | ${(kb/1024/1024).toFixed(4)} GB`);});
  $("#curBtn")?.addEventListener("click",()=>setResult("curOut",`نتیجه: ${(safeNumber($("#curAmount").value)*safeNumber($("#curRate").value)).toLocaleString("fa-IR")}`));

  // Electronics
  $("#ohmBtn")?.addEventListener("click",()=>{ const V=$("#ohmV").value, I=$("#ohmI").value, R=$("#ohmR").value; let out="یکی را خالی بگذار"; if(V && I && !R) out=`R = ${(V/I).toFixed(3)} Ω`; if(V && R && !I) out=`I = ${(V/R).toFixed(3)} A`; if(I && R && !V) out=`V = ${(I*R).toFixed(3)} V`; setResult("ohmOut",out);});
  $("#powBtn")?.addEventListener("click",()=>setResult("powOut",`توان: ${(safeNumber($("#powV").value)*safeNumber($("#powI").value)).toFixed(3)} W`));
  $("#ledBtn")?.addEventListener("click",()=>{ const r=(safeNumber($("#ledVs").value)-safeNumber($("#ledVf").value))/(safeNumber($("#ledI").value)/1000); setResult("ledOut",`R ≈ ${Math.max(0,r).toFixed(0)} Ω | توان مقاومت حداقل ${(Math.max(0,r)*Math.pow(safeNumber($("#ledI").value)/1000,2)).toFixed(3)} W`);});
  $("#vdBtn")?.addEventListener("click",()=>{ const vin=safeNumber($("#vdVin").value), r1=safeNumber($("#vdR1").value), r2=safeNumber($("#vdR2").value); setResult("vdOut",`Vout = ${(vin*r2/(r1+r2)).toFixed(3)} V`);});
  $("#resBtn")?.addEventListener("click",()=>{ const arr=$("#resList").value.split(",").map(x=>Number(x.trim())).filter(x=>x>0); const series=arr.reduce((a,b)=>a+b,0); const parallel=1/arr.reduce((a,b)=>a+1/b,0); setResult("resOut",`سری: ${series.toFixed(2)} Ω | موازی: ${parallel.toFixed(2)} Ω`);});
  $("#rcBtn")?.addEventListener("click",()=>{ const r=safeNumber($("#rcR").value), c=safeNumber($("#rcC").value)*1e-6; setResult("rcOut",`τ = ${(r*c).toFixed(4)} s | 5τ ≈ ${(5*r*c).toFixed(4)} s`);});
  $("#batBtn")?.addEventListener("click",()=>{ const mah=safeNumber($("#batMah").value), v=safeNumber($("#batV").value), w=safeNumber($("#batW").value); setResult("batOut",`انرژی: ${(mah/1000*v).toFixed(2)} Wh | زمان تقریبی: ${w?((mah/1000*v)/w).toFixed(2):"---"} ساعت`);});
  $("#packBtn")?.addEventListener("click",()=>{ const s=safeNumber($("#packS").value), p=safeNumber($("#packP").value), mah=safeNumber($("#cellMah").value); setResult("packOut",`نامی: ${(s*3.7).toFixed(1)}V | فول شارژ: ${(s*4.2).toFixed(1)}V | ظرفیت: ${p*mah}mAh`);});
  $("#wireBtn")?.addEventListener("click",()=>{ const L=safeNumber($("#wireLen").value), I=safeNumber($("#wireA").value), A=safeNumber($("#wireMm").value); const drop=2*0.0175*L*I/A; setResult("wireOut",`افت تقریبی مس: ${drop.toFixed(3)} V`);});

  // Text
  $("#textCountIn")?.addEventListener("input",e=>{ const text=e.target.value.trim(); setResult("textCountOut",`${fmtFa(text?text.split(/\s+/).length:0)} کلمه • ${fmtFa(e.target.value.length)} حرف`);});
  $("#upperBtn")?.addEventListener("click",()=>{$("#caseIn").value=$("#caseIn").value.toUpperCase();});
  $("#lowerBtn")?.addEventListener("click",()=>{$("#caseIn").value=$("#caseIn").value.toLowerCase();});
  $("#titleBtn")?.addEventListener("click",()=>{$("#caseIn").value=$("#caseIn").value.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());});
  $("#reverseBtn")?.addEventListener("click",()=>setResult("reverseOut",[...$("#reverseIn").value].reverse().join("")));
  $("#slugBtn")?.addEventListener("click",()=>setResult("slugOut",$("#slugIn").value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"")));
  $("#baseEnc")?.addEventListener("click",()=>setResult("baseOut",btoa(unescape(encodeURIComponent($("#baseIn").value)))));
  $("#baseDec")?.addEventListener("click",()=>{try{setResult("baseOut",decodeURIComponent(escape(atob($("#baseIn").value))))}catch{setResult("baseOut","Base64 نامعتبر")}});
  $("#urlEnc")?.addEventListener("click",()=>setResult("urlOut",encodeURIComponent($("#urlIn").value)));
  $("#urlDec")?.addEventListener("click",()=>{try{setResult("urlOut",decodeURIComponent($("#urlIn").value))}catch{setResult("urlOut","URL نامعتبر")}});
  $("#jsonBtn")?.addEventListener("click",()=>{try{setResult("jsonOut",JSON.stringify(JSON.parse($("#jsonIn").value),null,2))}catch{setResult("jsonOut","JSON نامعتبر")}});
  $("#htmlBtn")?.addEventListener("click",()=>setResult("htmlOut",$("#htmlIn").value.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))));
  $("#regexBtn")?.addEventListener("click",()=>{try{const re=new RegExp($("#regexPattern").value,"g"); const matches=$("#regexText").value.match(re)||[]; setResult("regexOut",matches.join(" | ") || "چیزی پیدا نشد")}catch{setResult("regexOut","Regex نامعتبر")}});
  $("#speakBtn")?.addEventListener("click",()=>{ const u=new SpeechSynthesisUtterance($("#speakText").value); u.lang="fa-IR"; speechSynthesis.speak(u); });

  // Design tools
  $("#passLen")?.addEventListener("input",()=>$("#passLenText").textContent=$("#passLen").value);
  $("#passBtn")?.addEventListener("click",()=>{ const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*_-+=?"; const len=Number($("#passLen").value); const arr=new Uint32Array(len); crypto.getRandomValues(arr); const pass=[...arr].map(n=>chars[n%chars.length]).join(""); setResult("passOut",pass); copy(pass);});
  $("#qrBtn")?.addEventListener("click",()=>{ const text=$("#qrText").value.trim(); if(!text)return; const img=$("#qrImg"); img.src=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`; img.style.display="block";});
  $("#paletteBtn")?.addEventListener("click",makePalette);
  $("#hexBtn")?.addEventListener("click",()=>{ const h=$("#hexIn").value.trim().replace("#",""); if(!/^[0-9a-f]{6}$/i.test(h)) return setResult("hexOut","HEX نامعتبر"); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4),16); setResult("hexOut",`rgb(${r}, ${g}, ${b})`);});
  $("#gradBtn")?.addEventListener("click",()=>{ const css=`linear-gradient(135deg, ${$("#gradA").value}, ${$("#gradB").value})`; setResult("gradOut",css); copy(`background: ${css};`);});
  $("#clampBtn")?.addEventListener("click",()=>{ const min=safeNumber($("#clampMin").value,18), max=safeNumber($("#clampMax").value,64); const css=`font-size: clamp(${min}px, 5vw, ${max}px);`; setResult("clampOut",css);});
  $("#shadowBtn")?.addEventListener("click",()=>{ const b=safeNumber($("#shadowBlur").value,30), o=safeNumber($("#shadowOpacity").value,25)/100; const css=`box-shadow: 0 18px ${b}px rgba(0,245,255,${o});`; setResult("shadowOut",css);});
  $("#glassBtn")?.addEventListener("click",()=>setResult("glassOut","background: rgba(255,255,255,.08); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,.18);"));

  // Storage/system
  const note = localStorage.getItem("ali-v2-note") || "";
  if($("#noteIn")) $("#noteIn").value = note;
  $("#noteSave")?.addEventListener("click",()=>{localStorage.setItem("ali-v2-note",$("#noteIn").value);setResult("noteOut","ذخیره شد ✅");});
  $("#noteClear")?.addEventListener("click",()=>{$("#noteIn").value="";localStorage.removeItem("ali-v2-note");setResult("noteOut","پاک شد");});
  $("#todoAdd")?.addEventListener("click",()=>{ const v=$("#todoIn").value.trim(); if(v){todos.unshift({text:v,done:false});$("#todoIn").value="";saveTodos();renderTodos();}});
  renderTodos();
  $("#expenseAdd")?.addEventListener("click",()=>{ const name=$("#expenseName").value.trim()||"هزینه", amount=safeNumber($("#expenseAmount").value); if(amount){expenses.unshift({name,amount});saveExpenses();renderExpenses();}});
  renderExpenses();
  $("#habitAdd")?.addEventListener("click",()=>{ const n=$("#habitName").value.trim(); if(!n)return; habits[n]=(habits[n]||0)+1; saveHabits(); renderHabits();});
  renderHabits();
  $("#deviceBtn")?.addEventListener("click",()=>setResult("deviceOut",`UserAgent: ${navigator.userAgent}\nLanguage: ${navigator.language}\nScreen: ${screen.width}×${screen.height}\nViewport: ${innerWidth}×${innerHeight}\nCPU threads: ${navigator.hardwareConcurrency||"?"}\nRAM: ${navigator.deviceMemory||"?"} GB`));
  $("#batteryBtn")?.addEventListener("click",async()=>{ if(!navigator.getBattery) return setResult("batteryOut","این مرورگر Battery API را پشتیبانی نمی‌کند"); const b=await navigator.getBattery(); setResult("batteryOut",`شارژ: ${Math.round(b.level*100)}% | شارژر: ${b.charging?"وصل":"قطع"}`);});
  $("#networkBtn")?.addEventListener("click",updateNetwork);
  updateNetwork();
  $("#keyInput")?.addEventListener("keydown",e=>setResult("keyOut",`${e.key} | ${e.code}`));
  $("#reactionBtn")?.addEventListener("click",()=>{
    const btn=$("#reactionBtn"), out=$("#reactionOut");
    btn.disabled=true; out.textContent="صبر کن تا سبز شود...";
    reactionTimeout=setTimeout(()=>{
      reactionStarted=Date.now(); btn.disabled=false; btn.textContent="حالا کلیک کن!";
      btn.onclick=()=>{ const t=Date.now()-reactionStarted; setResult("reactionOut",`${t} ms`); btn.textContent="شروع"; btn.onclick=null; wireTools(); };
    }, 1000 + Math.random()*2600);
  });
  makePalette();
}
function makePalette(){
  const out=$("#paletteOut"); if(!out) return;
  out.innerHTML="";
  for(let i=0;i<5;i++){
    const color = "#" + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");
    const div=document.createElement("div");
    div.className="swatch"; div.style.background=`linear-gradient(135deg,${color},#111827)`; div.textContent=color;
    div.onclick=()=>copy(color);
    out.appendChild(div);
  }
}
function renderTodos(){
  const el=$("#todoList"); if(!el)return;
  el.innerHTML = todos.map((t,i)=>`<div class="list-item ${t.done?"done":""}"><span>${t.text}</span><div><button data-todo-done="${i}">✓</button><button data-todo-del="${i}">×</button></div></div>`).join("") || `<div class="result">کاری نیست</div>`;
  $$("[data-todo-done]").forEach(b=>b.onclick=()=>{todos[b.dataset.todoDone].done=!todos[b.dataset.todoDone].done;saveTodos();renderTodos();});
  $$("[data-todo-del]").forEach(b=>b.onclick=()=>{todos.splice(b.dataset.todoDel,1);saveTodos();renderTodos();});
}
function renderExpenses(){
  const el=$("#expenseList"); if(!el)return;
  el.innerHTML = expenses.map((e,i)=>`<div class="list-item"><span>${e.name}: ${e.amount.toLocaleString("fa-IR")}</span><button data-exp-del="${i}">×</button></div>`).join("") || `<div class="result">هزینه‌ای ثبت نشده</div>`;
  setResult("expenseTotal",`جمع: ${expenses.reduce((a,b)=>a+b.amount,0).toLocaleString("fa-IR")}`);
  $$("[data-exp-del]").forEach(b=>b.onclick=()=>{expenses.splice(b.dataset.expDel,1);saveExpenses();renderExpenses();});
}
function renderHabits(){
  const el=$("#habitList"); if(!el)return;
  el.innerHTML = Object.entries(habits).map(([k,v])=>`<div class="list-item"><span>${k}</span><b>${fmtFa(v)} بار</b></div>`).join("") || `<div class="result">عادتی ثبت نشده</div>`;
}
function updateNetwork(){
  const c = navigator.connection || {};
  setResult("networkOut",`وضعیت: ${navigator.onLine?"آنلاین":"آفلاین"} | نوع: ${c.effectiveType || "نامشخص"} | سرعت حدودی: ${c.downlink || "?"}Mbps`);
}
addEventListener("online",updateNetwork); addEventListener("offline",updateNetwork);
function updateLiveSystem(){
  setResult("liveSystem",`${navigator.onLine?"آنلاین":"آفلاین"} • ${innerWidth}×${innerHeight} • ${navigator.language}`);
}

// Command palette
const palette = $("#commandPalette"), commandInput = $("#commandInput"), commandResults = $("#commandResults");
function openCommand(){ palette.classList.add("open"); commandInput.focus(); renderCommand(); }
function closeCommand(){ palette.classList.remove("open"); }
$("#openCommand").onclick = openCommand;
palette.addEventListener("click", e => { if(e.target === palette) closeCommand(); });
document.addEventListener("keydown", e => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); openCommand(); }
  if(e.key === "Escape") closeCommand();
});
function renderCommand(){
  const term = commandInput.value.trim().toLowerCase();
  commandResults.innerHTML = tools.filter(t=>t.title.toLowerCase().includes(term) || t.cat.toLowerCase().includes(term) || t.id.includes(term)).slice(0,12)
    .map(t=>`<button class="command-item" data-jump="${t.id}">${t.icon} ${t.title}<br><small>${t.cat} • ${t.desc}</small></button>`).join("");
  $$("[data-jump]").forEach(b => b.onclick = () => jumpToTool(b.dataset.jump));
}
commandInput.addEventListener("input",renderCommand);
function jumpToTool(id){
  activeCat = "همه"; $("#toolSearch").value = ""; renderTabs(); renderTools(); closeCommand();
  setTimeout(()=>document.getElementById(`tool-${id}`)?.scrollIntoView({behavior:"smooth", block:"center"}),50);
}
$("#randomToolBtn").onclick = () => jumpToTool(tools[Math.floor(Math.random()*tools.length)].id);

// First renders
setInterval(()=>{ updateLiveSystem(); }, 2500);
setInterval(updateClock, 1000);
setTimeout(updateClock, 300);
