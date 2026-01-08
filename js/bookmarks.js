// =====================================================
// ブックマーク & カテゴリ管理
// =====================================================

// ---- データ管理 (IndexedDB使用) ----
// キャッシュ: 非同期読み込み完了まで一時的に使用
let categoriesCache = [];
let categoriesLoaded = false;

// 同期的にキャッシュからデータを取得（互換性のため）
function getData() {
    return categoriesCache;
}

// データ保存（IndexedDBとキャッシュの両方に保存）
function saveData(data) {
    categoriesCache = data;
    StorageDB.set("categories", data).catch(err => {
        console.error('Failed to save categories:', err);
    });
}

// IndexedDBからデータを読み込み
async function loadCategoriesFromDB() {
    try {
        const data = await StorageDB.get("categories", []);
        categoriesCache = data;
        categoriesLoaded = true;
        return data;
    } catch (error) {
        console.error('Failed to load categories from IndexedDB:', error);
        return [];
    }
}

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
        if (cat.items && cat.items.length > 0 && typeof cat.items[0] === 'string') {
            cat.items = cat.items.map((url, i) => ({ title: `Link ${i + 1}`, url }));
        }
        return cat;
    });

    categories.forEach((cat, catIndex) => {
        const card = document.createElement("div");
        card.className = "category-card draggable";
        card.draggable = true;
        card.dataset.index = catIndex;
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        // ヘッダー
        const header = document.createElement("div");
        header.className = "category-header";
        const h3 = document.createElement("h3");
        h3.textContent = cat.name;
        header.appendChild(h3);

        // 編集・削除ボタン
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "✏️";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            const newName = prompt("ジャンル名を編集", cat.name);
            if (newName) {
                cat.name = newName;
                saveData(categories);
                loadCategories();
            }
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "🗑️";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`「${cat.name}」を削除しますか？`)) {
                categories.splice(catIndex, 1);
                saveData(categories);
                loadCategories();
            }
        };

        header.appendChild(editBtn);
        header.appendChild(deleteBtn);

        // アイテムリスト
        const list = document.createElement("div");
        list.className = "item-list";

        (cat.items || []).forEach((item, itemIndex) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "item draggable";
            itemDiv.draggable = true;
            itemDiv.dataset.index = itemIndex;
            itemDiv.dataset.parentIndex = catIndex;
            itemDiv.addEventListener('dragstart', handleDragStart);
            itemDiv.addEventListener('dragover', handleDragOver);
            itemDiv.addEventListener('dragenter', handleDragEnter);
            itemDiv.addEventListener('dragleave', handleDragLeave);
            itemDiv.addEventListener('drop', handleDrop);
            itemDiv.addEventListener('dragend', handleDragEnd);

            // Favicon取得
            let faviconUrl = '';
            try {
                const urlObj = new URL(item.url);
                faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
            } catch { }

            const link = document.createElement("a");
            link.href = item.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer"; // Security

            if (faviconUrl) {
                const img = document.createElement("img");
                img.src = faviconUrl;
                img.className = "favicon";
                img.alt = "";
                img.onerror = function () { this.style.display = 'none'; };
                link.appendChild(img);
            }

            link.appendChild(document.createTextNode(item.title));
            itemDiv.appendChild(link);

            const itemEditBtn = document.createElement("button");
            itemEditBtn.className = "edit-btn";
            itemEditBtn.textContent = "✏️";
            itemEditBtn.onclick = (e) => {
                e.stopPropagation();
                const newTitle = prompt("タイトルを編集", item.title);
                const newUrl = prompt("URLを編集", item.url);
                if (newTitle && newUrl) {
                    item.title = newTitle;
                    item.url = newUrl;
                    saveData(categories);
                    loadCategories();
                }
            };

            const itemDeleteBtn = document.createElement("button");
            itemDeleteBtn.className = "delete-btn";
            itemDeleteBtn.textContent = "🗑️";
            itemDeleteBtn.onclick = (e) => {
                e.stopPropagation();
                cat.items.splice(itemIndex, 1);
                saveData(categories);
                loadCategories();
            };

            itemDiv.appendChild(itemEditBtn);
            itemDiv.appendChild(itemDeleteBtn);
            list.appendChild(itemDiv);
        });

        // アイテム追加ボタン
        const addItemBtn = document.createElement("button");
        addItemBtn.className = "add-item-btn";
        addItemBtn.textContent = "＋ リンク追加";

        // アイテム追加フォーム
        const form = document.createElement("div");
        form.className = "bookmark-form";
        form.style.display = "none";
        form.innerHTML = `
      <input type="text" placeholder="タイトル" class="item-title-input">
      <input type="text" placeholder="URL" class="item-url-input">
      <button class="save-item">保存</button>
      <button class="cancel-item cancel">キャンセル</button>
    `;

        addItemBtn.onclick = (e) => {
            e.stopPropagation();
            form.style.display = "flex";
        };

        form.querySelector(".cancel-item").onclick = () => {
            form.style.display = "none";
            form.querySelector(".item-title-input").value = "";
            form.querySelector(".item-url-input").value = "";
        };

        form.querySelector(".save-item").onclick = (e) => {
            e.stopPropagation();
            const title = form.querySelector(".item-title-input").value.trim();
            const url = form.querySelector(".item-url-input").value.trim();
            if (title && url) {
                if (!cat.items) cat.items = [];
                cat.items.push({ title, url });
                saveData(categories);
                loadCategories();
            }
        };

        card.appendChild(header);
        card.appendChild(list);
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

// 初期表示（IndexedDBから非同期ロード）
async function initBookmarks() {
    await loadCategoriesFromDB();
    loadCategories();
}

// StorageDBの準備ができたら初期化
if (window.StorageDB) {
    initBookmarks();
} else {
    // StorageDBがまだロードされていない場合は少し待つ
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(initBookmarks, 50);
    });
}

