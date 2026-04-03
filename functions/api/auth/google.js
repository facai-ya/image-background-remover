// functions/api/auth/google.js
// 处理 Google OAuth callback，换取用户信息
// 注意：暂时跳过 D1 存储，先确保登录流程跑通

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return Response.redirect(new URL('/?error=no_code', url.origin), 302)
  }

  // 用 code 换取 access token
  let tokenData
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID || '',
        client_secret: env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${url.origin}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    })
    tokenData = await tokenRes.json()
  } catch (err) {
    return Response.redirect(new URL('/?error=network_error', url.origin), 302)
  }

  if (!tokenData.access_token) {
    // 把 Google 返回的错误原因带回前端，便于调试
    const reason = encodeURIComponent(tokenData.error || 'no_token')
    return Response.redirect(new URL(`/?error=token_failed&reason=${reason}`, url.origin), 302)
  }

  // 获取用户信息
  let user
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    user = await userRes.json()
  } catch (err) {
    return Response.redirect(new URL('/?error=userinfo_failed', url.origin), 302)
  }

  // 尝试存入 D1（如果未绑定则跳过，不影响登录）
  if (env.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO users (google_id, email, name, avatar, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(google_id) DO UPDATE SET
          email = excluded.email,
          name = excluded.name,
          avatar = excluded.avatar,
          updated_at = excluded.updated_at
      `).bind(user.id, user.email, user.name, user.picture).run()
    } catch (dbErr) {
      // D1 错误不影响登录，继续
      console.error('D1 error:', dbErr)
    }
  }

  // 生成 session token（base64 编码用户信息）
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
      'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
    },
  })
}
