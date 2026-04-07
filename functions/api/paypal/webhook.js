// POST /api/paypal/webhook
// 处理 PayPal 订阅事件（续费、取消等）

import { getPayPalToken, json, PAYPAL_BASE } from './_utils.js'

// 验证 PayPal Webhook 签名
async function verifyWebhookSignature(request, env, bodyText) {
  const webhookId = env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    // 没配 WEBHOOK_ID 时跳过验签（开发阶段）
    console.warn('PAYPAL_WEBHOOK_ID not set, skipping signature verification')
    return true
  }

  const authAlgo = request.headers.get('paypal-auth-algo')
  const certUrl = request.headers.get('paypal-cert-url')
  const transmissionId = request.headers.get('paypal-transmission-id')
  const transmissionSig = request.headers.get('paypal-transmission-sig')
  const transmissionTime = request.headers.get('paypal-transmission-time')

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false
  }

  try {
    const token = await getPayPalToken(env)
    const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(bodyText),
      }),
    })

    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch (err) {
    console.error('Webhook verification error:', err)
    return false
  }
}

export async function onRequestPost(context) {
  const { request, env } = context
  const db = env.DB

  // 读取原始 body（验签需要原始文本）
  const bodyText = await request.text()
  let event
  try {
    event = JSON.parse(bodyText)
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  // 验证签名（防止伪造请求）
  const isValid = await verifyWebhookSignature(request, env, bodyText)
  if (!isValid) {
    return json({ error: 'invalid_signature' }, 401)
  }

  const eventType = event.event_type
  const resource = event.resource

  try {
    switch (eventType) {
      // 订阅激活（首次付款成功）
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const googleId = resource.custom_id
        if (!googleId) break

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 31)

        await db.prepare(`
          UPDATE users
          SET plan = 'pro', plan_expires_at = ?, subscription_id = ?, credits = credits + 100
          WHERE google_id = ?
        `).bind(expiresAt.toISOString(), resource.id, googleId).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_activated', ?, datetime('now'))
        `).bind(googleId, `Subscription ${resource.id} activated via webhook`).run()

        break
      }

      // 订阅续费成功（每月自动扣款）
      case 'PAYMENT.SALE.COMPLETED': {
        const billingAgreementId = resource.billing_agreement_id
        if (!billingAgreementId) break

        const user = await db.prepare(`
          SELECT google_id FROM users WHERE subscription_id = ?
        `).bind(billingAgreementId).first()

        if (!user) break

        // 延续 pro 31 天，补满 100 credits
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 31)

        await db.prepare(`
          UPDATE users SET plan = 'pro', plan_expires_at = ?, credits = 100 WHERE google_id = ?
        `).bind(expiresAt.toISOString(), user.google_id).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_renewed', ?, datetime('now'))
        `).bind(user.google_id, `Sale ${resource.id} - plan renewed`).run()

        break
      }

      // 订阅取消或过期
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const googleId = resource.custom_id
        if (!googleId) break

        await db.prepare(`
          UPDATE users SET plan = 'free', plan_expires_at = NULL, subscription_id = NULL WHERE google_id = ?
        `).bind(googleId).run()

        await db.prepare(`
          INSERT INTO usage_logs (google_id, action, detail, created_at)
          VALUES (?, 'subscription_cancelled', ?, datetime('now'))
        `).bind(googleId, `Subscription ${resource.id} - ${eventType}`).run()

        break
      }

      default:
        // 其他事件忽略，正常返回 200
        break
    }

    return json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return json({ error: String(err) }, 500)
  }
}
