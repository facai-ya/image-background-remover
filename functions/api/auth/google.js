export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')

  // 如果 Google 返回了 error 参数
  if (errorParam) {
    return htmlPage(`Google 授权错误: ${errorParam}`, 'error', url)
  }

  if (!code) {
    return htmlPage('未收到 code 参数', 'no_code', url)
  }

  const clientId = env.GOOGLE_CLIENT_ID
  const clientSecret = env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return htmlPage(`环境变量未配置 (clientId: ${!!clientId}, clientSecret: ${!!clientSecret})`, 'env_vars_missing', url)
  }

  // 用 code 换取 access token
  let tokenData
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${url.origin}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    })
    tokenData = await tokenRes.json()
  } catch (err) {
    return htmlPage(`网络错误: ${err.message}`, 'network_error', url)
  }

  if (!tokenData.access_token) {
    const reason = tokenData.error_description || tokenData.error || 'no_token'
    return htmlPage(`Token 获取失败: ${reason}`, 'token_failed', url)
  }

  // 获取用户信息
  let user
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    user = await userRes.json()
  } catch (err) {
    return htmlPage(`获取用户信息失败: ${err.message}`, 'userinfo_failed', url)
  }

  if (!user.id) {
    return htmlPage(`用户信息异常: ${JSON.stringify(user)}`, 'auth_failed', url)
  }

  // 尝试存入 D1（如果未绑定则跳过）
  const db = env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO users (google_id, email, name, avatar, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(google_id) DO UPDATE SET
          email = excluded.email,
          name = excluded.name,
          avatar = excluded.avatar,
          updated_at = excluded.updated_at
      `).bind(user.id, user.email, user.name, user.picture).run()
    } catch (dbErr) {
      console.error('D1 error:', dbErr)
    }
  }

  // 生成 session（base64 编码用户信息）
  const sessionData = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.picture,
  })
  const sessionToken = btoa(sessionData)

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `session=${sessionToken}; Path=/; Secure; SameSite=Lax; Max-Age=2592000`,
    },
  })
}

function htmlPage(message, errorCode, url) {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>登录调试</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #eee; padding: 40px; }
    .box { background: #16213e; border: 1px solid #444; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto; }
    h2 { color: #f44; margin-top: 0; }
    .info { color: #aaa; font-size: 13px; margin-top: 16px; word-break: break-all; }
    a { color: #4af; }
    .params { background: #0a0a1a; padding: 12px; border-radius: 4px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>⚠️ 登录回调调试信息</h2>
    <p><strong>错误：</strong>${message}</p>
    <p><strong>错误码：</strong>${errorCode}</p>
    <div class="params">
      <strong>收到的 URL 参数：</strong><br>
      ${Array.from(url.searchParams.entries()).map(([k,v]) => `${k}: ${v.substring(0, 50)}...`).join('<br>') || '（无参数）'}
    </div>
    <div class="info">
      完整 URL: ${url.toString().substring(0, 200)}<br><br>
      <a href="/">← 返回首页</a>
    </div>
  </div>
</body>
</html>`
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
