// =====================================================
// 天気関連
// =====================================================

// ---- 天気 ----
function weatherDescription(code) {
    return { 0: "快晴", 1: "ほぼ快晴", 2: "晴れ時々曇り", 3: "曇り", 45: "霧", 48: "濃い霧", 51: "小雨", 61: "雨", 71: "雪", 95: "雷雨" }[code] || "不明";
}

function weatherIcon(code) {
    return { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌦️", 61: "🌧️", 71: "❄️", 95: "⛈️" }[code] || "❓";
}

async function loadWeather() {
    // getSettings()を使用（settings.jsで定義）
    const settings = typeof getSettings === 'function' ? getSettings() : { lat: "35.6895", lon: "139.6917" };
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}&current=temperature_2m,weathercode&timezone=Asia%2FTokyo`);
        const d = await res.json();
        document.getElementById("today-weather").innerHTML = `${weatherIcon(d.current.weathercode)} ${d.current.temperature_2m.toFixed(1)}℃ ${weatherDescription(d.current.weathercode)}`;
    } catch {
        document.getElementById("today-weather").textContent = "天気取得失敗";
    }
}
loadWeather();

// ---- 週間天気予報 ----
async function loadWeeklyWeather() {
    // getSettings()を使用（settings.jsで定義）
    const settings = typeof getSettings === 'function' ? getSettings() : { lat: "35.6895", lon: "139.6917" };
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
