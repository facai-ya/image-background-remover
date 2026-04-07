'use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const PAYPAL_CLIENT_ID = 'AXizxirPxv7sBjzonm3rL-xCOoU8-X-5WymmFG4nxeVViGvF1xZzHsug5tS_Zy6tnhVSfEXgcMfeEx3J'

interface SessionUser {
  id: string
  email: string
  name: string
  avatar: string
}

function getSessionUser(): SessionUser | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/session=([^;]+)/)
  if (!match) return null
  try {
    return JSON.parse(atob(match[1]))
  } catch {
    return null
  }
}

const planInfo = {
  pack: {
    name: 'Credit Pack',
    desc: '10 credits · never expire',
    price: '$4.99',
    highlight: '10 removals, pay once',
  },
  pro: {
    name: 'Monthly Pro',
    desc: '100 removals/month · cancel anytime',
    price: '$19.9/mo',
    highlight: 'Best for power users',
  },
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = (searchParams.get('plan') || 'pack') as 'pack' | 'pro'
  const info = planInfo[plan] || planInfo.pack

  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const paypalRef = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    const u = getSessionUser()
    if (!u) {
      router.push('/')
      return
    }
    setUser(u)
    setLoading(false)
  }, [router])

  // 动态加载 PayPal SDK
  useEffect(() => {
    if (loading || !user) return

    const intent = plan === 'pack' ? 'capture' : 'subscription'
    const vault = plan === 'pro' ? '&vault=true&intent=subscription' : ''
    const scriptSrc = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=${intent}${vault}`

    // 检查是否已加载
    if (document.querySelector(`script[src*="paypal.com/sdk"]`)) {
      setSdkReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.onload = () => setSdkReady(true)
    script.onerror = () => setError('Failed to load PayPal SDK')
    document.head.appendChild(script)

    return () => {
      // 切换 plan 时移除旧 script
      const old = document.querySelector(`script[src*="paypal.com/sdk"]`)
      if (old) old.remove()
    }
  }, [loading, user, plan])

  // 渲染 PayPal 按钮
  useEffect(() => {
    if (!sdkReady || !paypalRef.current || rendered.current) return
    const w = window as any
    if (!w.paypal) return

    rendered.current = true

    if (plan === 'pack') {
      // 一次性付款
      w.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        createOrder: async () => {
          setProcessing(true)
          setError(null)
          const res = await fetch('/api/paypal/create-order', { method: 'POST' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to create order')
          return data.orderID
        },
        onApprove: async (_data: any, actions: any) => {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: _data.orderID }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || 'Capture failed')
          router.push('/payment/success?plan=pack&credits=' + result.credits)
        },
        onError: (err: any) => {
          setError('Payment failed: ' + String(err))
          setProcessing(false)
        },
        onCancel: () => {
          setProcessing(false)
        },
      }).render(paypalRef.current)
    } else {
      // 订阅
      w.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe' },
        createSubscription: async (_data: any, actions: any) => {
          setProcessing(true)
          setError(null)
          const res = await fetch('/api/paypal/create-subscription', { method: 'POST' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to create subscription')
          // 如果有 approveUrl，也可以直接用；这里用 subscriptionID 让 SDK 处理
          return data.subscriptionID
        },
        onApprove: (_data: any) => {
          router.push('/payment/success?plan=pro&subID=' + _data.subscriptionID)
        },
        onError: (err: any) => {
          setError('Subscription failed: ' + String(err))
          setProcessing(false)
        },
        onCancel: () => {
          setProcessing(false)
        },
      }).render(paypalRef.current)
    }
  }, [sdkReady, plan, router])

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    card: {
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      padding: '40px',
      maxWidth: '440px',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    back: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      color: 'rgba(255,255,255,0.7)',
      textDecoration: 'none',
      fontSize: '14px',
      marginBottom: '24px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '999px',
      background: 'rgba(251,191,36,0.2)',
      color: '#fde68a',
      fontSize: '12px',
      fontWeight: 700,
      marginBottom: '12px',
      border: '1px solid rgba(251,191,36,0.3)',
    },
    title: { fontSize: '28px', fontWeight: 800, margin: '0 0 6px' },
    desc: { opacity: 0.75, fontSize: '15px', margin: '0 0 6px' },
    price: { fontSize: '40px', fontWeight: 900, margin: '16px 0 4px', color: '#fbbf24' },
    highlight: { fontSize: '13px', opacity: 0.7, marginBottom: '28px' },
    divider: { height: '1px', background: 'rgba(255,255,255,0.15)', margin: '24px 0' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' },
    userName: { fontWeight: 700, fontSize: '14px' },
    userEmail: { fontSize: '12px', opacity: 0.65 },
    error: {
      background: 'rgba(239,68,68,0.15)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#fca5a5',
      marginBottom: '16px',
    },
    processing: {
      textAlign: 'center',
      padding: '20px',
      opacity: 0.75,
      fontSize: '14px',
    },
    footer: {
      marginTop: '20px',
      fontSize: '12px',
      opacity: 0.5,
      textAlign: 'center',
    },
  }

  if (loading) {
    return (
      <div style={s.page}>
        <div style={{ opacity: 0.7 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link href="/pricing" style={s.back}>← Back to Pricing</Link>

        <div style={s.badge}>{plan === 'pro' ? 'Subscription' : 'One-time purchase'}</div>
        <h1 style={s.title}>{info.name}</h1>
        <p style={s.desc}>{info.desc}</p>
        <div style={s.price}>{info.price}</div>
        <p style={s.highlight}>{info.highlight}</p>

        <div style={s.divider} />

        {user && (
          <div style={s.userRow}>
            <img src={user.avatar} alt={user.name} style={s.avatar} referrerPolicy="no-referrer" />
            <div>
              <div style={s.userName}>{user.name}</div>
              <div style={s.userEmail}>{user.email}</div>
            </div>
          </div>
        )}

        {error && <div style={s.error}>{error}</div>}

        {processing && !error && (
          <div style={s.processing}>Processing payment...</div>
        )}

        <div ref={paypalRef} />

        {!sdkReady && !error && (
          <div style={s.processing}>Loading PayPal...</div>
        )}

        <div style={s.footer}>
          🔒 Secured by PayPal · No card data stored on our servers
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
