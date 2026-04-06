// POST /api/paypal/capture-order
// 捕获订单并给用户加 10 credits

import { getPayPalToken, getSessionUser, json, PAYPAL_BASE } from './_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context

  const user = getSessionUser(request)
  if (!user) return json({ error: 'not_logged_in' }, 401)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const { orderID } = body
  if (!orderID) return json({ error: 'orderID required' }, 400)

  const db = env.DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  try {
    const token = await getPayPalToken(env)

    // 捕获付款
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await res.json()

    if (!res.ok || capture.status !== 'COMPLETED') {
      return json({ error: capture.message || 'Payment not completed', detail: capture }, 400)
    }

    // 支付成功，给用户加 10 credits
    await db.prepare(`
      UPDATE users SET credits = credits + 10 WHERE google_id = ?
    `).bind(user.id).run()

    // 记录购买日志
    await db.prepare(`
      INSERT INTO usage_logs (google_id, action, detail, created_at)
      VALUES (?, 'purchase_pack', ?, datetime('now'))
    `).bind(user.id, `PayPal order ${orderID} captured - +10 credits`).run()

    // 返回最新用户信息
    const updatedUser = await db.prepare(`
      SELECT credits, plan, total_used FROM users WHERE google_id = ?
    `).bind(user.id).first()

    return json({ success: true, credits: updatedUser.credits })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}
