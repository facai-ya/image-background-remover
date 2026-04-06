// POST /api/paypal/create-order
// 创建一次性积分包订单（$4.99 / 10 credits）

import { getPayPalToken, getSessionUser, json, PAYPAL_BASE } from './_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context

  const user = getSessionUser(request)
  if (!user) return json({ error: 'not_logged_in' }, 401)

  try {
    const token = await getPayPalToken(env)

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `order-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `pack_${user.id}`,
            description: 'Background Remover - Credit Pack (10 credits)',
            amount: {
              currency_code: 'USD',
              value: '4.99',
            },
            custom_id: user.id, // google_id，用于 webhook 关联
          },
        ],
        application_context: {
          brand_name: 'Background Remover',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${new URL(request.url).origin}/payment/success?plan=pack`,
          cancel_url: `${new URL(request.url).origin}/pricing`,
        },
      }),
    })

    const order = await res.json()

    if (!res.ok) {
      return json({ error: order.message || 'Failed to create order' }, 500)
    }

    return json({ orderID: order.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}
