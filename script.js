// ---- 時計 ----
function updateClock() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  document.getElementById("clock").textContent =
    `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}(${days[now.getDay()]}) ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}
setInterval(updateClock, 1000);
updateClock();

// ---- 名言（日替わり） ----
const quotes = [
  "憧れで初めて、殺意で続けろ",
  "でっかい猫飼いたいな〜。でっかい声でにゃ〜んて鳴くのかな",
  "花の色は うつりにけりな いたづらに  サラダチキンは びしょびしょの肉",
  "生きるとは世界からの嫌がらせに他ならない",
  "みんながGOOD DAYなら、おれもGOOD DAY",
  "宝が喋ったらそれはミミック",
  "多い方が正しいなら地球はまだ平らなままですよ",
  "死んでるように生きるのはもうやめだ  咲けよ",
  "キレを宵越しするやつはクソ",
  "結局は安心と納得と我慢で出来てるこの世界。難しいようで簡単なんだぜ",
  "みんな私のことが好き！と思いながら生活すると小さなことが気にならなくなる",
  "辛いことがあった時ほど人生って面白いなあって思うようにする",
  "「ありがとう」ってみんな沁みこまなくなってきてる",
  "褒められても実感を得ないので闇雲に毎日が怖い",
  "無理を通すのが仕事。堂々としてりゃいいのよ",
  "傘の立ち方は一つしかないけど倒れ方はいくらでもある",
  "いつかできる傑作のための駄作",
  "こういう風になりたくないってジジイに最終的になっちゃう",
  "(偉い人が沢山いるパーティで)ここ爆破したら経験値すごいね",
  "コンテンツのフォアグラになるんじゃねえぞ！！",
  "人生がパンなら気まずさはジャムだろ",
  "根っこが腐っていてはジューシーフルーツは実らない",
  "なんで幸せになるのに、誰かが苦労する前提で話を進めるの？",
  "最悪……。かなり最悪に近い。でも、最高にも近いかも  最悪タンバリン",
  "欠損を許せ",
  "お前は俺かもな。俺はお前じゃないけど。",
  "実は人生って2回ある、だから大丈夫",
  "わからなさを嫌わないで",
  "自己というものは社会的に多面的なもの",
  "退屈は犯罪ではございません！！",
  "100円稼ぐのも大変",
  "俺が先、カロリーは後",
  "「ありがとう」ってみんな沁みこまなくなってきてる",
  "褒められても実感を得ないので闇雲に毎日が怖い",
  "無理を通すのが仕事。堂々としてりゃいいのよ",
  "傘の立ち方は一つしかないけど倒れ方はいくらでもある",
  "いつかできる傑作のための駄作",
  "こういう風になりたくないってジジイに最終的になっちゃう",
  "(偉い人が沢山いるパーティで)ここ爆破したら経験値すごいね",
  "コンテンツのフォアグラになるんじゃねえぞ！！",
];
function showDailyQuote() {
  const today = new Date();
  document.getElementById("quote-text").textContent = quotes[today.getDate() % quotes.length];
}
showDailyQuote();

// ---- 天気 ----
function weatherDescription(code) { return { 0: "快晴", 1: "ほぼ快晴", 2: "晴れ時々曇り", 3: "曇り", 45: "霧", 48: "濃い霧", 51: "小雨", 61: "雨", 71: "雪", 95: "雷雨" }[code] || "不明"; }
function weatherIcon(code) { return { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌦️", 61: "🌧️", 71: "❄️", 95: "⛈️" }[code] || "❓"; }
async function loadWeather() {
  const settings = JSON.parse(localStorage.getItem("settings")) || { lat: "35.6895", lon: "139.6917" };
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}&current=temperature_2m,weathercode&timezone=Asia%2FTokyo`);
    const d = await res.json();
    document.getElementById("today-weather").innerHTML = `${weatherIcon(d.current.weathercode)} ${d.current.temperature_2m.toFixed(1)}℃ ${weatherDescription(d.current.weathercode)}`;
  } catch { document.getElementById("today-weather").textContent = "天気取得失敗"; }
}
loadWeather();

// ---- 週間天気予報 ----
async function loadWeeklyWeather() {
  const settings = JSON.parse(localStorage.getItem("settings")) || { lat: "35.6895", lon: "139.6917" };
  const container = document.getElementById("weekly-weather");

  // コンテナが存在しない場合はスキップ
  if (!container) return;

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`);
    const data = await res.json();

    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = data.daily.time.map((date, i) => {
      const d = new Date(date);
      const dayName = days[d.getDay()];
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const isToday = date === today;
      const icon = weatherIcon(data.daily.weathercode[i]);
      const high = Math.round(data.daily.temperature_2m_max[i]);
      const low = Math.round(data.daily.temperature_2m_min[i]);
      const precip = data.daily.precipitation_probability_max[i];

      return `
        <div class="weather-day ${isToday ? 'today' : ''}">
          <span class="day-name">${dayName}</span>
          <span class="day-date">${dateStr}</span>
          <span class="weather-icon">${icon}</span>
          <span class="temp-high">${high}°</span>
          <span class="temp-low">${low}°</span>
          ${precip > 0 ? `<span class="precip">💧${precip}%</span>` : ''}
        </div>
      `;
    }).join('');
  } catch (e) {
    if (container) container.innerHTML = '<p style="color:#ff4c6d;">週間天気の取得に失敗しました</p>';
  }
}
loadWeeklyWeather();

// ---- ニュースフィード ----
async function loadNewsFeed() {
  const container = document.getElementById("news-feed");

  // 複数のRSSソースを試す（Google Newsを優先）
  const rssSources = [
    { url: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja", name: "Google" },
    { url: "https://www3.nhk.or.jp/rss/news/cat0.xml", name: "NHK" },
    { url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml", name: "ITmedia" }
  ];

  for (const source of rssSources) {
    try {
      const rssUrl = encodeURIComponent(source.url);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
      const data = await res.json();

      if (data.status === "ok" && data.items && data.items.length > 0) {
        container.innerHTML = data.items.slice(0, 8).map(item => {
          const pubDate = new Date(item.pubDate);
          const timeAgo = getTimeAgo(pubDate);

          return `
            <div class="news-item">
              <a href="${item.link}" target="_blank">${item.title}</a>
              <div class="news-source">
                <span class="news-category">${source.name}</span>
                <span>${timeAgo}</span>
              </div>
            </div>
          `;
        }).join('');
        return; // 成功したらループを抜ける
      }
    } catch (e) {
      console.log(`${source.name} fetch failed, trying next...`);
    }
  }

  // すべて失敗した場合はダミーニュース
  showDummyNews(container);
}

function showDummyNews(container) {
  const dummyNews = [
    { title: "本日のトップニュース - 最新情報をお届け", category: "国内" },
    { title: "経済市場動向 - 株価・為替の最新情報", category: "経済" },
    { title: "テクノロジー最前線 - 新製品発表", category: "IT" },
    { title: "エンタメ情報 - 話題の映画・音楽", category: "エンタメ" },
    { title: "スポーツニュース - 本日の試合結果", category: "スポーツ" }
  ];

  container.innerHTML = dummyNews.map(item => `
    <div class="news-item">
      <a href="https://news.yahoo.co.jp/" target="_blank">${item.title}</a>
      <div class="news-source">
        <span class="news-category">${item.category}</span>
        <span>デモデータ</span>
      </div>
    </div>
  `).join('');
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${diffDays}日前`;
}

loadNewsFeed();

// ---- データ管理 ----
function getData() { return JSON.parse(localStorage.getItem("categories") || "[]"); }
function saveData(data) { localStorage.setItem("categories", JSON.stringify(data)); }

// ---- カテゴリ描画 ----
let dragSrcEl = null;
let dragType = null; // 'category' or 'item'
let dragSrcIndex = null;
let dragSrcParentIndex = null;

function handleDragStart(e) {
  dragSrcEl = this;
  dragType = this.classList.contains('category-card') ? 'category' : 'item';
  dragSrcIndex = parseInt(this.dataset.index);
  if (dragType === 'item') {
    dragSrcParentIndex = parseInt(this.dataset.parentIndex);
  }
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
  e.stopPropagation();
}

function handleDragOver(e) {
  if (e.preventDefault) e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();
  this.classList.remove('drag-over');

  const dropTargetType = this.classList.contains('category-card') ? 'category' : 'item';

  // カテゴリの並び替え
  if (dragType === 'category' && dropTargetType === 'category') {
    const dropIndex = parseInt(this.dataset.index);
    if (dragSrcIndex !== dropIndex) {
      const categories = getData();
      const [moved] = categories.splice(dragSrcIndex, 1);
      categories.splice(dropIndex, 0, moved);
      saveData(categories);
      loadCategories();
    }
  }

  // アイテムの並び替え・移動
  if (dragType === 'item') {
    let dropParentIndex, dropIndex;

    if (dropTargetType === 'item') {
      dropParentIndex = parseInt(this.dataset.parentIndex);
      dropIndex = parseInt(this.dataset.index);
    } else if (dropTargetType === 'category') {
      // カテゴリにドロップした場合、そのカテゴリの末尾に追加
      dropParentIndex = parseInt(this.dataset.index);
      dropIndex = null; // 末尾扱い
    }

    if (dropParentIndex !== undefined) {
      const categories = getData();
      const [movedItem] = categories[dragSrcParentIndex].items.splice(dragSrcIndex, 1);

      if (dropIndex !== null) {
        categories[dropParentIndex].items.splice(dropIndex, 0, movedItem);
      } else {
        categories[dropParentIndex].items.push(movedItem);
      }

      saveData(categories);
      loadCategories();
    }
  }

  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  const items = document.querySelectorAll('.category-card, .item');
  items.forEach(item => item.classList.remove('drag-over'));
}

function loadCategories() {
  const container = document.getElementById("category-list");
  container.innerHTML = "";
  let categories = getData();

  // 古いデータ互換
  categories = categories.map(cat => {
    if (typeof cat === "string") return { name: cat, items: [] };
    if (!cat.items) cat.items = [];
    return cat;
  });
  saveData(categories);

  categories.forEach((cat, catIndex) => {
    const card = document.createElement("div");
    card.className = "category-card draggable";
    card.setAttribute('draggable', 'true');
    card.dataset.index = catIndex;

    // Drag events for Category
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);

    // ヘッダー
    const header = document.createElement("div");
    header.className = "category-header";

    const title = document.createElement("h3");
    title.textContent = cat.name;

    const btns = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.className = "edit-btn";
    editBtn.onclick = (e) => {
      e.stopPropagation(); // ドラッグ防止
      const newName = prompt("ジャンル名を編集", cat.name);
      if (newName) { categories[catIndex].name = newName; saveData(categories); loadCategories(); }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.className = "delete-btn";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("本当に削除しますか？")) {
        categories.splice(catIndex, 1);
        saveData(categories);
        loadCategories();
      }
    };

    btns.appendChild(editBtn);
    btns.appendChild(delBtn);
    header.appendChild(title);
    header.appendChild(btns);
    card.appendChild(header);

    // アイテムリスト
    const itemList = document.createElement("div");
    itemList.className = "item-list";
    cat.items.forEach((it, itIndex) => {
      const item = document.createElement("div");
      item.className = "item draggable";
      item.setAttribute('draggable', 'true');
      item.dataset.index = itIndex;
      item.dataset.parentIndex = catIndex;

      // Drag events for Item
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragenter', handleDragEnter);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);

      const link = document.createElement("a");
      link.href = it.url;
      link.target = "_blank";

      const icon = document.createElement("img");
      icon.className = "favicon";
      try {
        const domain = new URL(it.url).hostname;
        icon.src = `https://www.google.com/s2/favicons?domain=${domain}`;
      } catch (e) {
        icon.src = "https://www.google.com/s2/favicons?domain=example.com";
      }

      const text = document.createElement("span");
      text.textContent = it.title;

      link.appendChild(icon);
      link.appendChild(text);

      const del = document.createElement("button");
      del.textContent = "✖";
      del.className = "delete-btn";
      del.onclick = (e) => {
        e.stopPropagation();
        if (confirm("このアイテムを削除しますか？")) {
          categories[catIndex].items.splice(itIndex, 1);
          saveData(categories);
          loadCategories();
        }
      };

      item.appendChild(link);
      item.appendChild(del);
      itemList.appendChild(item);
    });
    card.appendChild(itemList);

    // アイテム追加フォーム
    const form = document.createElement("div");
    form.className = "bookmark-form";
    form.style.display = "none";
    // フォームクリックでドラッグ開始しないように
    form.addEventListener('mousedown', (e) => e.stopPropagation());

    const titleInput = document.createElement("input");
    titleInput.placeholder = "タイトル";

    const urlInput = document.createElement("input");
    urlInput.placeholder = "URL";
    urlInput.type = "url";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.onclick = () => {
      if (!titleInput.value || !urlInput.value) return;
      categories[catIndex].items.push({ title: titleInput.value, url: urlInput.value });
      saveData(categories);
      loadCategories();
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "キャンセル";
    cancelBtn.className = "cancel";
    cancelBtn.onclick = () => { form.style.display = "none"; };

    form.appendChild(titleInput);
    form.appendChild(urlInput);
    form.appendChild(saveBtn);
    form.appendChild(cancelBtn);

    const addItemBtn = document.createElement("button");
    addItemBtn.textContent = "＋アイテム追加";
    addItemBtn.className = "add-item-btn";
    addItemBtn.onclick = (e) => {
      e.stopPropagation();
      form.style.display = "flex";
    };

    card.appendChild(addItemBtn);
    card.appendChild(form);

    container.appendChild(card);
  });
}

// ---- ジャンル追加フォーム ----
document.getElementById("toggle-category-form").addEventListener("click", () => {
  document.getElementById("category-form").style.display = "flex";
});
document.getElementById("cancel-category").addEventListener("click", () => {
  document.getElementById("category-form").style.display = "none";
  document.getElementById("category-name").value = "";
});
document.getElementById("save-category").addEventListener("click", () => {
  const name = document.getElementById("category-name").value.trim();
  if (!name) return;
  const categories = getData();
  categories.push({ name, items: [] });
  saveData(categories);
  document.getElementById("category-name").value = "";
  document.getElementById("category-form").style.display = "none";
  loadCategories();
});

// ---- 編集モード切替 ----
document.getElementById("toggle-edit").addEventListener("click", () => {
  document.body.classList.toggle("edit-mode");
});

// ---- データバックアップ ----
document.getElementById("export-data").addEventListener("click", () => {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my_start_page_backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-data").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        saveData(data);
        loadCategories();
        alert("復元しました！");
      } else {
        alert("データ形式が正しくありません");
      }
    } catch (err) {
      alert("読み込みエラー: " + err);
    }
  };
  reader.readAsText(file);
});

// ---- 設定管理 ----
function getSettings() {
  const defaultSettings = {
    bgUrl: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lat: "35.6895",
    lon: "139.6917"
  };
  return JSON.parse(localStorage.getItem("settings")) || defaultSettings;
}

function saveSettingsToStorage(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}

function applySettings() {
  const settings = getSettings();
  document.body.style.backgroundImage = `url("${settings.bgUrl}")`;
  loadWeather();
  loadWeeklyWeather();
}

// Modal Event Listeners
const modal = document.getElementById("settings-modal");
document.getElementById("open-settings").addEventListener("click", () => {
  const settings = getSettings();
  document.getElementById("bg-url-input").value = settings.bgUrl;
  document.getElementById("lat-input").value = settings.lat;
  document.getElementById("lon-input").value = settings.lon;

  // カレンダーログアウトセクションの表示/非表示
  const logoutSection = document.getElementById("calendar-logout-section");
  if (logoutSection) {
    logoutSection.style.display = calendarState && calendarState.isLoggedIn ? "block" : "none";
  }

  modal.style.display = "flex";
});

// カレンダーログアウトボタン
document.getElementById("calendar-logout-btn")?.addEventListener("click", () => {
  if (typeof handleCalendarLogout === 'function') {
    handleCalendarLogout();
    document.getElementById("calendar-logout-section").style.display = "none";
  }
});

document.getElementById("close-settings").addEventListener("click", () => {
  modal.style.display = "none";
});

document.getElementById("save-settings").addEventListener("click", () => {
  const newSettings = {
    bgUrl: document.getElementById("bg-url-input").value,
    lat: document.getElementById("lat-input").value,
    lon: document.getElementById("lon-input").value
  };
  saveSettingsToStorage(newSettings);
  applySettings();
  modal.style.display = "none";
});

// Apply settings on load
applySettings();

// 初期表示
loadCategories();

// =====================================================
// カスタムカレンダー with Google Calendar API (Worker版)
// =====================================================

// Cloudflare Worker URL
const OAUTH_WORKER_URL = 'https://calendar-oauth.kazukittin.workers.dev';

// カレンダー状態
const calendarState = {
  currentDate: new Date(),
  view: 'month', // 'month' or 'week'
  events: [],
  weeklyWeatherData: null,
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null
};

// DOM要素
const calendarElements = {
  loginBtn: document.getElementById('google-login-btn'),
  loginText: document.getElementById('login-text'),
  viewMonthBtn: document.getElementById('view-month'),
  viewWeekBtn: document.getElementById('view-week'),
  prevBtn: document.getElementById('cal-prev'),
  nextBtn: document.getElementById('cal-next'),
  todayBtn: document.getElementById('cal-today'),
  calTitle: document.getElementById('cal-title'),
  monthView: document.getElementById('month-view'),
  weekView: document.getElementById('week-view'),
  monthGrid: document.getElementById('month-grid'),
  weekGrid: document.getElementById('week-grid'),
  agendaList: document.getElementById('agenda-list'),
  eventModal: document.getElementById('event-modal'),
  closeEventModal: document.getElementById('close-event-modal'),
  eventTitle: document.getElementById('event-title'),
  eventDate: document.getElementById('event-date'),
  eventStartTime: document.getElementById('event-start-time'),
  eventEndTime: document.getElementById('event-end-time'),
  saveEventBtn: document.getElementById('save-event'),
  clientIdInput: document.getElementById('client-id-input')
};

// 初期化
function initCalendar() {
  renderCalendar();
  setupCalendarEventListeners();
  loadWeatherForCalendar();

  // URLフラグメントからトークンを取得（OAuthコールバック後）
  handleOAuthCallback();

  // 保存されたトークンを復元
  restoreSavedToken();
}

// OAuthコールバック処理（Worker経由でリダイレクトされた後）
function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresIn = parseInt(params.get('expires_in')) || 3600;

  if (accessToken) {
    calendarState.accessToken = accessToken;
    calendarState.refreshToken = refreshToken;
    calendarState.isLoggedIn = true;

    // トークンを保存
    const tokenData = {
      accessToken,
      refreshToken,
      expires: Date.now() + expiresIn * 1000
    };
    localStorage.setItem('calendarTokens', JSON.stringify(tokenData));

    updateLoginButton();
    fetchCalendarEvents();

    // URLからハッシュを削除
    history.replaceState(null, '', window.location.pathname);
  }
}

// 保存されたトークンを復元
async function restoreSavedToken() {
  const savedData = localStorage.getItem('calendarTokens');
  if (!savedData) return;

  try {
    const { accessToken, refreshToken, expires } = JSON.parse(savedData);

    if (!refreshToken) {
      localStorage.removeItem('calendarTokens');
      return;
    }

    calendarState.refreshToken = refreshToken;

    // アクセストークンが期限切れの場合はリフレッシュ
    if (Date.now() > expires) {
      console.log('Access token expired, refreshing...');
      await refreshAccessToken();
    } else {
      calendarState.accessToken = accessToken;
      calendarState.isLoggedIn = true;
      updateLoginButton();
      fetchCalendarEvents();
    }
  } catch (e) {
    console.error('Token restore error:', e);
    localStorage.removeItem('calendarTokens');
  }
}

// アクセストークンをリフレッシュ
async function refreshAccessToken() {
  if (!calendarState.refreshToken) return false;

  try {
    const response = await fetch(`${OAUTH_WORKER_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: calendarState.refreshToken })
    });

    const data = await response.json();

    if (data.access_token) {
      calendarState.accessToken = data.access_token;
      calendarState.isLoggedIn = true;

      // 新しいトークンを保存
      const tokenData = {
        accessToken: data.access_token,
        refreshToken: calendarState.refreshToken,
        expires: Date.now() + (data.expires_in || 3600) * 1000
      };
      localStorage.setItem('calendarTokens', JSON.stringify(tokenData));

      updateLoginButton();
      fetchCalendarEvents();
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.error('Refresh failed:', data.error);
      localStorage.removeItem('calendarTokens');
      calendarState.isLoggedIn = false;
      calendarState.refreshToken = null;
      updateLoginButton();
      return false;
    }
  } catch (e) {
    console.error('Refresh error:', e);
    return false;
  }
}

// ログインボタンクリック
function handleLoginClick() {
  if (calendarState.isLoggedIn) {
    // ログイン中はGoogleカレンダーを開く
    window.open('https://calendar.google.com', '_blank');
  } else {
    // ログイン - Workerにリダイレクト
    window.location.href = `${OAUTH_WORKER_URL}/auth`;
  }
}

// ログアウト（設定画面から呼び出し）
function handleCalendarLogout() {
  calendarState.isLoggedIn = false;
  calendarState.accessToken = null;
  calendarState.refreshToken = null;
  calendarState.events = [];
  localStorage.removeItem('calendarTokens');
  updateLoginButton();
  renderCalendar();
  renderAgenda();
  alert('Googleカレンダーからログアウトしました');
}

// ログインボタン更新
function updateLoginButton() {
  if (calendarState.isLoggedIn) {
    calendarElements.loginBtn.classList.add('logged-in');
    calendarElements.loginText.textContent = 'Googleカレンダー';
    calendarElements.loginBtn.title = 'Googleカレンダーを開く';
  } else {
    calendarElements.loginBtn.classList.remove('logged-in');
    calendarElements.loginText.textContent = 'Googleでログイン';
    calendarElements.loginBtn.title = '';
  }
}

// カレンダーイベント取得
async function fetchCalendarEvents() {
  if (!calendarState.accessToken) return;

  const startOfMonth = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth(), 1);
  const endOfMonth = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 2, 0);

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startOfMonth.toISOString()}&` +
      `timeMax=${endOfMonth.toISOString()}&` +
      `singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${calendarState.accessToken}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      calendarState.events = data.items || [];
      renderCalendar();
      renderAgenda();
    } else if (response.status === 401) {
      // トークン期限切れ
      calendarState.isLoggedIn = false;
      calendarState.accessToken = null;
      updateLoginButton();
    }
  } catch (e) {
    console.error('Calendar fetch error:', e);
  }
}

// イベント作成
async function createCalendarEvent(title, date, startTime, endTime) {
  if (!calendarState.accessToken) {
    alert('先にGoogleにログインしてください');
    return false;
  }

  let event;
  if (startTime && endTime) {
    // 時間指定あり
    event = {
      summary: title,
      start: { dateTime: `${date}T${startTime}:00`, timeZone: 'Asia/Tokyo' },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: 'Asia/Tokyo' }
    };
  } else {
    // 終日イベント
    event = {
      summary: title,
      start: { date: date },
      end: { date: date }
    };
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${calendarState.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (response.ok) {
      await fetchCalendarEvents();
      return true;
    } else {
      const err = await response.json();
      alert('イベント作成に失敗しました: ' + (err.error?.message || ''));
      return false;
    }
  } catch (e) {
    console.error('Event create error:', e);
    alert('エラーが発生しました');
    return false;
  }
}

// カレンダー描画
function renderCalendar() {
  updateCalendarTitle();
  if (calendarState.view === 'month') {
    renderMonthView();
  } else {
    renderWeekView();
  }
}

// タイトル更新
function updateCalendarTitle() {
  const year = calendarState.currentDate.getFullYear();
  const month = calendarState.currentDate.getMonth() + 1;
  if (calendarState.view === 'month') {
    calendarElements.calTitle.textContent = `${year}年${month}月`;
  } else {
    const weekStart = getWeekStart(calendarState.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    calendarElements.calTitle.textContent =
      `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
  }
}

// 週の開始日取得（日曜始まり）
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

// 月ビュー描画
function renderMonthView() {
  const year = calendarState.currentDate.getFullYear();
  const month = calendarState.currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let html = '';
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isOtherMonth = date.getMonth() !== month;
    const isToday = dateStr === todayStr;
    const dayOfWeek = date.getDay();
    const hasEvents = calendarState.events.some(e => {
      const eventDate = e.start.date || e.start.dateTime?.split('T')[0];
      return eventDate === dateStr;
    });

    let classes = 'day-cell';
    if (isOtherMonth) classes += ' other-month';
    if (isToday) classes += ' today';
    if (dayOfWeek === 0) classes += ' sun';
    if (dayOfWeek === 6) classes += ' sat';
    if (hasEvents) classes += ' has-events';

    html += `
      <div class="${classes}" data-date="${dateStr}">
        <span class="day-number">${date.getDate()}</span>
      </div>
    `;
  }

  calendarElements.monthGrid.innerHTML = html;

  // 日付クリックで予定追加
  document.querySelectorAll('.day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      openEventModal(cell.dataset.date);
    });
  });
}

// 週ビュー描画
function renderWeekView() {
  const weekStart = getWeekStart(calendarState.currentDate);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let html = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayOfWeek = date.getDay();

    // この日のイベント取得
    const dayEvents = calendarState.events.filter(e => {
      const eventDate = e.start.date || e.start.dateTime?.split('T')[0];
      return eventDate === dateStr;
    });

    // 天気取得
    let weatherHtml = '';
    if (calendarState.weeklyWeatherData && calendarState.weeklyWeatherData.daily) {
      const weatherIndex = calendarState.weeklyWeatherData.daily.time.indexOf(dateStr);
      if (weatherIndex !== -1) {
        const icon = weatherIcon(calendarState.weeklyWeatherData.daily.weathercode[weatherIndex]);
        const high = Math.round(calendarState.weeklyWeatherData.daily.temperature_2m_max[weatherIndex]);
        const low = Math.round(calendarState.weeklyWeatherData.daily.temperature_2m_min[weatherIndex]);
        weatherHtml = `
          <div class="week-weather">
            <span>${icon}</span>
            <span class="temp">${high}°/${low}°</span>
          </div>
        `;
      }
    }

    let classes = 'week-day-row';
    if (isToday) classes += ' today';
    if (dayOfWeek === 0) classes += ' sun';
    if (dayOfWeek === 6) classes += ' sat';

    html += `
      <div class="${classes}" data-date="${dateStr}">
        <div class="week-day-info">
          <span class="week-day-name">${days[dayOfWeek]}</span>
          <span class="week-day-date">${date.getDate()}</span>
          ${weatherHtml}
        </div>
        <div class="week-events">
          ${dayEvents.map(e => `
            <div class="week-event-item">${e.summary || '(タイトルなし)'}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  calendarElements.weekGrid.innerHTML = html;

  // 日付クリックで予定追加
  document.querySelectorAll('.week-day-row').forEach(row => {
    row.addEventListener('click', () => {
      openEventModal(row.dataset.date);
    });
  });
}

// アジェンダ描画
function renderAgenda() {
  if (!calendarState.isLoggedIn || calendarState.events.length === 0) {
    calendarElements.agendaList.innerHTML = '<div class="agenda-empty">ログインして予定を表示</div>';
    return;
  }

  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const upcomingEvents = calendarState.events
    .filter(e => {
      const eventDate = new Date(e.start.date || e.start.dateTime);
      return eventDate >= new Date(new Date().setHours(0, 0, 0, 0));
    })
    .slice(0, 10);

  if (upcomingEvents.length === 0) {
    calendarElements.agendaList.innerHTML = '<div class="agenda-empty">今後の予定はありません</div>';
    return;
  }

  calendarElements.agendaList.innerHTML = upcomingEvents.map(e => {
    const startDate = new Date(e.start.date || e.start.dateTime);
    const timeStr = e.start.dateTime
      ? new Date(e.start.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      : '終日';

    return `
      <div class="agenda-item">
        <div class="agenda-date">
          <span class="month">${startDate.getMonth() + 1}月</span>
          <span class="day">${startDate.getDate()}</span>
          <span class="weekday">${days[startDate.getDay()]}</span>
        </div>
        <div class="agenda-content">
          <span class="event-title">${e.summary || '(タイトルなし)'}</span>
          <span class="event-time">${timeStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

// 予定追加モーダルを開く
function openEventModal(dateStr) {
  if (!calendarState.isLoggedIn) {
    alert('予定を追加するにはGoogleにログインしてください');
    return;
  }
  calendarElements.eventDate.value = dateStr;
  calendarElements.eventTitle.value = '';
  calendarElements.eventStartTime.value = '';
  calendarElements.eventEndTime.value = '';
  calendarElements.eventModal.style.display = 'flex';
}

// モーダルを閉じる
function closeEventModalFn() {
  calendarElements.eventModal.style.display = 'none';
}

// 予定保存
async function saveEvent() {
  const title = calendarElements.eventTitle.value.trim();
  const date = calendarElements.eventDate.value;
  const startTime = calendarElements.eventStartTime.value;
  const endTime = calendarElements.eventEndTime.value;

  if (!title) {
    alert('タイトルを入力してください');
    return;
  }
  if (!date) {
    alert('日付を選択してください');
    return;
  }

  const success = await createCalendarEvent(title, date, startTime, endTime);
  if (success) {
    closeEventModalFn();
  }
}

// カレンダー用天気読み込み
async function loadWeatherForCalendar() {
  const settings = JSON.parse(localStorage.getItem("settings")) || { lat: "35.6895", lon: "139.6917" };
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`);
    calendarState.weeklyWeatherData = await res.json();
    if (calendarState.view === 'week') {
      renderWeekView();
    }
  } catch (e) {
    console.error('Weather fetch error:', e);
  }
}

// イベントリスナー設定
function setupCalendarEventListeners() {
  // ログインボタン
  calendarElements.loginBtn.addEventListener('click', handleLoginClick);

  // アジェンダセクション要素
  const agendaSection = document.getElementById('agenda-section');

  // ビュー切替
  calendarElements.viewMonthBtn.addEventListener('click', () => {
    calendarState.view = 'month';
    calendarElements.viewMonthBtn.classList.add('active');
    calendarElements.viewWeekBtn.classList.remove('active');
    calendarElements.monthView.style.display = 'block';
    calendarElements.weekView.style.display = 'none';
    if (agendaSection) agendaSection.style.display = 'block'; // 月ビューで表示
    renderCalendar();
  });

  calendarElements.viewWeekBtn.addEventListener('click', () => {
    calendarState.view = 'week';
    calendarElements.viewWeekBtn.classList.add('active');
    calendarElements.viewMonthBtn.classList.remove('active');
    calendarElements.weekView.style.display = 'block';
    calendarElements.monthView.style.display = 'none';
    if (agendaSection) agendaSection.style.display = 'none'; // 週ビューで非表示
    renderCalendar();
  });

  // ナビゲーション
  calendarElements.prevBtn.addEventListener('click', () => {
    if (calendarState.view === 'month') {
      calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() - 1);
    } else {
      calendarState.currentDate.setDate(calendarState.currentDate.getDate() - 7);
    }
    renderCalendar();
    if (calendarState.isLoggedIn) fetchCalendarEvents();
  });

  calendarElements.nextBtn.addEventListener('click', () => {
    if (calendarState.view === 'month') {
      calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + 1);
    } else {
      calendarState.currentDate.setDate(calendarState.currentDate.getDate() + 7);
    }
    renderCalendar();
    if (calendarState.isLoggedIn) fetchCalendarEvents();
  });

  calendarElements.todayBtn.addEventListener('click', () => {
    calendarState.currentDate = new Date();
    renderCalendar();
    if (calendarState.isLoggedIn) fetchCalendarEvents();
  });

  // 予定モーダル
  calendarElements.closeEventModal.addEventListener('click', closeEventModalFn);
  calendarElements.saveEventBtn.addEventListener('click', saveEvent);

  // モーダル外クリックで閉じる
  calendarElements.eventModal.addEventListener('click', (e) => {
    if (e.target === calendarElements.eventModal) {
      closeEventModalFn();
    }
  });
}

// 設定にClient IDを追加
const originalGetSettings = getSettings;
window.getSettings = function () {
  const defaultSettings = {
    bgUrl: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lat: "35.6895",
    lon: "139.6917",
    clientId: ""
  };
  const saved = JSON.parse(localStorage.getItem("settings")) || {};
  return { ...defaultSettings, ...saved };
};

// 設定モーダルの開閉処理を拡張
const originalOpenSettings = document.getElementById("open-settings").onclick;
document.getElementById("open-settings").addEventListener("click", () => {
  const settings = getSettings();
  if (calendarElements.clientIdInput) {
    calendarElements.clientIdInput.value = settings.clientId || '';
  }
});

// 設定保存を拡張
const originalSaveSettings = document.getElementById("save-settings");
originalSaveSettings.addEventListener("click", () => {
  // 既存の保存処理は維持しつつ、clientIdも保存
  setTimeout(() => {
    const settings = getSettings();
    settings.clientId = calendarElements.clientIdInput?.value || '';
    saveSettingsToStorage(settings);
    // OAuth再初期化
    if (settings.clientId) {
      initGoogleAuth();
    }
  }, 0);
}, true);

// カレンダー初期化
initCalendar();
