// GET /api/user/info - 获取用户信息（积分、套餐等）
export async function onRequestGet(context) {
  const { request, env } = context
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (!match) {
    return json({ error: 'not_logged_in' }, 401)
  }

  let sessionUser
  try {
    sessionUser = JSON.parse(atob(match[1]))
  } catch {
    return json({ error: 'invalid_session' }, 401)
  }

  const db = env.DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  try {
    // 确保用户存在，如不存在则初始化（3积分）
    await db.prepare(`
      INSERT OR IGNORE INTO users (google_id, email, name, avatar, credits, plan, total_used)
      VALUES (?, ?, ?, ?, 3, 'free', 0)
    `).bind(sessionUser.id, sessionUser.email, sessionUser.name, sessionUser.avatar).run()

    const user = await db.prepare(`
      SELECT google_id, email, name, avatar, credits, plan, plan_expires_at, total_used
      FROM users WHERE google_id = ?
    `).bind(sessionUser.id).first()

    // 检查订阅是否过期
    if (user.plan === 'pro' && user.plan_expires_at) {
      const expires = new Date(user.plan_expires_at)
      if (expires < new Date()) {
        await db.prepare(`UPDATE users SET plan = 'free' WHERE google_id = ?`).bind(sessionUser.id).run()
        user.plan = 'free'
      }
    }

    return json({ user })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
