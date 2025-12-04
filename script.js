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
}

// Modal Event Listeners
const modal = document.getElementById("settings-modal");
document.getElementById("open-settings").addEventListener("click", () => {
  const settings = getSettings();
  document.getElementById("bg-url-input").value = settings.bgUrl;
  document.getElementById("lat-input").value = settings.lat;
  document.getElementById("lon-input").value = settings.lon;
  modal.style.display = "flex";
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
