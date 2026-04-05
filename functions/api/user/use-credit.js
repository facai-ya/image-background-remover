// POST /api/user/use-credit - 扣减积分（处理图片前调用）
export async function onRequestPost(context) {
  const { request, env } = context
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (!match) return json({ error: 'not_logged_in' }, 401)

  let sessionUser
  try {
    sessionUser = JSON.parse(atob(match[1]))
  } catch {
    return json({ error: 'invalid_session' }, 401)
  }

  const db = env.DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  try {
    const user = await db.prepare(`
      SELECT google_id, credits, plan, plan_expires_at FROM users WHERE google_id = ?
    `).bind(sessionUser.id).first()

    if (!user) return json({ error: 'user_not_found' }, 404)

    // Pro 订阅中，不扣积分
    if (user.plan === 'pro' && user.plan_expires_at) {
      const expires = new Date(user.plan_expires_at)
      if (expires > new Date()) {
        // 只记录使用次数
        await db.prepare(`UPDATE users SET total_used = total_used + 1 WHERE google_id = ?`).bind(sessionUser.id).run()
        await db.prepare(`INSERT INTO usage_logs (user_id) SELECT id FROM users WHERE google_id = ?`).bind(sessionUser.id).run()
        return json({ ok: true, plan: 'pro', credits: null })
      }
    }

    // 免费用户检查积分
    if (user.credits <= 0) {
      return json({ error: 'no_credits', credits: 0 }, 403)
    }

    // 扣积分
    await db.prepare(`
      UPDATE users SET credits = credits - 1, total_used = total_used + 1 WHERE google_id = ?
    `).bind(sessionUser.id).run()
    await db.prepare(`INSERT INTO usage_logs (user_id) SELECT id FROM users WHERE google_id = ?`).bind(sessionUser.id).run()

    const newCredits = user.credits - 1
    return json({ ok: true, plan: 'free', credits: newCredits })
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
