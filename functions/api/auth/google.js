export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return Response.redirect(new URL('/?error=no_code', url.origin), 302)
  }

  const clientId = env.GOOGLE_CLIENT_ID
  const clientSecret = env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    // 环境变量未配置，返回明确错误
    return Response.redirect(new URL('/?error=token_failed&reason=env_vars_missing', url.origin), 302)
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
    return Response.redirect(new URL('/?error=network_error', url.origin), 302)
  }

  if (!tokenData.access_token) {
    const reason = encodeURIComponent(tokenData.error_description || tokenData.error || 'no_token')
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

  if (!user.id) {
    return Response.redirect(new URL('/?error=auth_failed', url.origin), 302)
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
