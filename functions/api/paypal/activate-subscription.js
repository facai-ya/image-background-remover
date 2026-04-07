// POST /api/paypal/activate-subscription
// 用户订阅成功后前端调用，验证订阅真实有效并升级用户为 Pro

import { getPayPalToken, getSessionUser, json, PAYPAL_BASE } from './_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const db = env.DB

  const user = getSessionUser(request)
  if (!user) return json({ error: 'not_logged_in' }, 401)

  if (!db) return json({ error: 'db_not_configured' }, 500)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const { subscriptionID } = body
  if (!subscriptionID) return json({ error: 'subscriptionID required' }, 400)

  try {
    // 向 PayPal 验证订阅真实存在且状态是 ACTIVE
    const token = await getPayPalToken(env)
    const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionID}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      return json({ error: 'Failed to verify subscription' }, 400)
    }

    const sub = await res.json()

    if (sub.status !== 'ACTIVE') {
      return json({ error: `Subscription not active: ${sub.status}` }, 400)
    }

    // 验证 custom_id 是否匹配当前用户（防止冒用别人的订阅）
    if (sub.custom_id && sub.custom_id !== user.id) {
      return json({ error: 'Subscription does not belong to this user' }, 403)
    }

    // 升级用户为 Pro，有效期 31 天
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 31)

    await db.prepare(`
      UPDATE users
      SET plan = 'pro', plan_expires_at = ?, subscription_id = ?, credits = credits + 100
      WHERE google_id = ?
    `).bind(expiresAt.toISOString(), subscriptionID, user.id).run()

    // 写日志
    await db.prepare(`
      INSERT INTO usage_logs (google_id, action, detail, created_at)
      VALUES (?, 'subscription_activated', ?, datetime('now'))
    `).bind(user.id, `Subscription ${subscriptionID} activated via frontend`).run()

    // 返回最新用户信息
    const updatedUser = await db.prepare(`
      SELECT credits, plan, plan_expires_at, total_used FROM users WHERE google_id = ?
    `).bind(user.id).first()

    return json({
      success: true,
      plan: updatedUser.plan,
      credits: updatedUser.credits,
      plan_expires_at: updatedUser.plan_expires_at,
    })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}
