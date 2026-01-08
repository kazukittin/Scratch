// =====================================================
// カスタムカレンダー with Google Calendar API (Worker版)
// =====================================================

// Cloudflare Worker URL
// Cloudflare Worker URL
// 配布時は空文字か、ユーザー自身のWorker URLを設定するように案内してください
const DEFAULT_WORKER_URL = 'https://calendar-oauth.kazukittin.workers.dev';

// Worker URLの取得（IndexedDBからの読み込み後に更新）
let OAUTH_WORKER_URL = DEFAULT_WORKER_URL;

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
async function initCalendar() {
    // Worker URLを更新
    if (typeof getSettings === 'function') {
        const settings = getSettings();
        if (settings.workerUrl) {
            OAUTH_WORKER_URL = settings.workerUrl;
        }
    }

    renderCalendar();
    setupCalendarEventListeners();
    loadWeatherForCalendar();

    // URLフラグメントからトークンを取得（OAuthコールバック後）
    await handleOAuthCallback();

    // 保存されたトークンを復元
    await restoreSavedToken();
}

// OAuthコールバック処理（Worker経由でリダイレクトされた後）
async function handleOAuthCallback() {
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

        // トークンをIndexedDBに保存
        const tokenData = {
            accessToken,
            refreshToken,
            expires: Date.now() + expiresIn * 1000
        };
        await StorageDB.set('calendarTokens', tokenData);

        updateLoginButton();
        fetchCalendarEvents();

        // URLからハッシュを削除
        history.replaceState(null, '', window.location.pathname);
    }
}

// 保存されたトークンを復元（IndexedDBから）
async function restoreSavedToken() {
    try {
        const savedData = await StorageDB.get('calendarTokens', null);
        if (!savedData) return;

        const { accessToken, refreshToken, expires } = savedData;

        if (!refreshToken) {
            await StorageDB.remove('calendarTokens');
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
        await StorageDB.remove('calendarTokens');
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

            // 新しいトークンをIndexedDBに保存
            const tokenData = {
                accessToken: data.access_token,
                refreshToken: calendarState.refreshToken,
                expires: Date.now() + (data.expires_in || 3600) * 1000
            };
            await StorageDB.set('calendarTokens', tokenData);

            updateLoginButton();
            fetchCalendarEvents();
            console.log('Token refreshed successfully');
            return true;
        } else {
            console.error('Refresh failed:', data.error);
            await StorageDB.remove('calendarTokens');
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
async function handleCalendarLogout() {
    calendarState.isLoggedIn = false;
    calendarState.accessToken = null;
    calendarState.refreshToken = null;
    calendarState.events = [];
    await StorageDB.remove('calendarTokens');
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

async function loadWeatherForCalendar() {
    // getSettings()を使用（settings.jsで定義）
    const settings = typeof getSettings === 'function' ? getSettings() : { lat: "35.6895", lon: "139.6917" };
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

// カレンダー初期化
initCalendar();
