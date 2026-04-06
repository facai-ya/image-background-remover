// POST /api/paypal/create-subscription
// 创建 Monthly Pro 订阅

import { getPayPalToken, getSessionUser, json, PAYPAL_BASE } from './_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context

  const user = getSessionUser(request)
  if (!user) return json({ error: 'not_logged_in' }, 401)

  const planId = env.PAYPAL_PRO_PLAN_ID
  if (!planId) return json({ error: 'PayPal plan not configured' }, 500)

  try {
    const token = await getPayPalToken(env)

    const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sub-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: { given_name: user.name },
          email_address: user.email,
        },
        custom_id: user.id,
        application_context: {
          brand_name: 'Background Remover',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${new URL(request.url).origin}/payment/success?plan=pro`,
          cancel_url: `${new URL(request.url).origin}/pricing`,
        },
      }),
    })

    const sub = await res.json()

    if (!res.ok) {
      return json({ error: sub.message || 'Failed to create subscription', detail: sub }, 500)
    }

    // 找到 approve 链接
    const approveLink = sub.links?.find(l => l.rel === 'approve')?.href

    return json({
      subscriptionID: sub.id,
      approveUrl: approveLink,
    })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}
