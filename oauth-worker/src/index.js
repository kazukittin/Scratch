/**
 * Google Calendar OAuth Worker
 * リフレッシュトークンを使用した永久ログイン用バックエンド
 */

// CORSヘッダー
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // ルーティング
        switch (url.pathname) {
            case '/':
                return new Response('Calendar OAuth Worker is running!', {
                    headers: { 'Content-Type': 'text/plain', ...corsHeaders }
                });

            case '/auth':
                return handleAuth(url, env);

            case '/callback':
                return handleCallback(url, env);

            case '/refresh':
                return handleRefresh(request, env);

            default:
                return new Response('Not Found', { status: 404, headers: corsHeaders });
        }
    }
};

// OAuth認証開始
function handleAuth(url, env) {
    const clientId = env.GOOGLE_CLIENT_ID;
    const redirectUri = `${url.origin}/callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return Response.redirect(authUrl.toString(), 302);
}

// 認可コード受取 & トークン交換
async function handleCallback(url, env) {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return new Response(`Error: ${error}`, { status: 400, headers: corsHeaders });
    }

    if (!code) {
        return new Response('Missing authorization code', { status: 400, headers: corsHeaders });
    }

    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${url.origin}/callback`;

    // トークン交換
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
        return new Response(`Token error: ${tokens.error}`, { status: 400, headers: corsHeaders });
    }

    // フロントエンドにリダイレクト（トークンをURLフラグメントで渡す）
    const frontendUrl = new URL(env.FRONTEND_URL);
    frontendUrl.hash = `access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ''}&expires_in=${tokens.expires_in}`;

    return Response.redirect(frontendUrl.toString(), 302);
}

// リフレッシュトークンでアクセストークン更新
async function handleRefresh(request, env) {
    try {
        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return new Response(JSON.stringify({ error: 'Missing refresh token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_CLIENT_SECRET;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token'
            })
        });

        const tokens = await tokenResponse.json();

        return new Response(JSON.stringify(tokens), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
