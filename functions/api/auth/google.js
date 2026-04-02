// functions/api/auth/google.js
// 处理 Google OAuth callback，换取用户信息并存入 D1

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return Response.redirect(new URL('/?error=no_code', url.origin), 302)
  }

  try {
    // 用 code 换取 access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return Response.redirect(new URL('/?error=token_failed', url.origin), 302)
    }

    // 获取用户信息
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const user = await userRes.json()

    // 存入 D1
    await env.DB.prepare(`
      INSERT INTO users (google_id, email, name, avatar, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(google_id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        avatar = excluded.avatar,
        updated_at = excluded.updated_at
    `).bind(user.id, user.email, user.name, user.picture).run()

    // 生成简单 session token（base64 编码用户信息）
    const sessionData = JSON.stringify({ id: user.id, email: user.email, name: user.name, avatar: user.picture })
    const sessionToken = btoa(sessionData)

    // 设置 cookie 并跳回首页
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    })
  } catch (err) {
    return Response.redirect(new URL('/?error=auth_failed', url.origin), 302)
  }
}
