// POST /api/paypal/webhook
// 处理 PayPal 订阅事件（续费、取消等）

import { json } from './_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const db = env.DB

  let event
  try {
    event = await request.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const eventType = event.event_type
  const resource = event.resource

  try {
    switch (eventType) {
      // 订阅激活（首次付款成功）
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const googleId = resource.custom_id
        if (!googleId) break

        // 设置 pro 计划，有效期 31 天
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 31)

        await db.prepare(`
          UPDATE users
          SET plan = 'pro', plan_expires_at = ?, subscription_id = ?
          WHERE google_id = ?
        `).bind(expiresAt.toISOString(), resource.id, googleId).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_activated', ?, datetime('now'))
        `).bind(googleId, `Subscription ${resource.id} activated`).run()

        break
      }

      // 订阅续费成功
      case 'PAYMENT.SALE.COMPLETED': {
        // 通过 billing agreement 找用户
        const billingAgreementId = resource.billing_agreement_id
        if (!billingAgreementId) break

        const user = await db.prepare(`
          SELECT google_id FROM users WHERE subscription_id = ?
        `).bind(billingAgreementId).first()

        if (!user) break

        // 延续 pro 31 天
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 31)

        await db.prepare(`
          UPDATE users SET plan = 'pro', plan_expires_at = ? WHERE google_id = ?
        `).bind(expiresAt.toISOString(), user.google_id).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_renewed', ?, datetime('now'))
        `).bind(user.google_id, `Sale ${resource.id} - plan extended`).run()

        break
      }

      // 订阅取消
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const googleId = resource.custom_id
        if (!googleId) break

        await db.prepare(`
          UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE google_id = ?
        `).bind(googleId).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_cancelled', ?, datetime('now'))
        `).bind(googleId, `Subscription ${resource.id} ${eventType}`).run()

        break
      }

      default:
        // 其他事件忽略
        break
    }

    return json({ received: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}
