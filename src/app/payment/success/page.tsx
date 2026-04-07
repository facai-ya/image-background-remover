'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const credits = searchParams.get('credits')
  const subID = searchParams.get('subID')

  const isPro = plan === 'pro'

  const [activating, setActivating] = useState(isPro)
  const [activated, setActivated] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [proCredits, setProCredits] = useState<number | null>(null)

  // Pro 订阅：自动调后端激活接口
  useEffect(() => {
    if (!isPro || !subID) {
      setActivating(false)
      return
    }

    fetch('/api/paypal/activate-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionID: subID }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProCredits(data.credits)
          setActivated(true)
        } else {
          setActivateError(data.error || 'Activation failed')
        }
      })
      .catch(err => setActivateError(String(err)))
      .finally(() => setActivating(false))
  }, [isPro, subID])

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    card: {
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      padding: '48px 40px',
      maxWidth: '440px',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.2)',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    icon: { fontSize: '64px', marginBottom: '20px' },
    title: { fontSize: '32px', fontWeight: 900, margin: '0 0 12px' },
    desc: { opacity: 0.8, fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' },
    highlight: {
      background: 'rgba(251,191,36,0.15)',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: '14px',
      padding: '16px 20px',
      marginBottom: '32px',
      fontSize: '15px',
      color: '#fde68a',
      fontWeight: 700,
    },
    error: {
      background: 'rgba(239,68,68,0.15)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#fca5a5',
      marginBottom: '24px',
    },
    btn: {
      display: 'inline-block',
      padding: '14px 32px',
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      color: '#111827',
      fontWeight: 800,
      borderRadius: '12px',
      textDecoration: 'none',
      fontSize: '16px',
      marginBottom: '12px',
    },
    link: {
      display: 'block',
      marginTop: '12px',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '13px',
      textDecoration: 'none',
    },
    loading: {
      opacity: 0.7,
      fontSize: '15px',
      marginBottom: '24px',
    },
  }

  // Pro 订阅激活中
  if (isPro && activating) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.icon}>⏳</div>
          <h1 style={s.title}>Activating your Pro plan...</h1>
          <p style={s.loading}>Please wait a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>{isPro ? '🎉' : '✅'}</div>
        <h1 style={s.title}>Payment Successful!</h1>
        <p style={s.desc}>
          {isPro
            ? 'Your Monthly Pro subscription is now active. Enjoy 100 background removals per month!'
            : `Your Credit Pack purchase is complete. 10 credits have been added to your account.`}
        </p>

        <div style={s.highlight}>
          {isPro
            ? `🚀 Monthly Pro · Active${proCredits !== null ? ` · ${proCredits} credits` : ''}`
            : `💳 +10 credits added · Total: ${credits || '...'} credits`}
        </div>

        {activateError && (
          <div style={s.error}>
            ⚠️ Could not activate Pro automatically: {activateError}
            <br />
            <small>Your payment was received. Please contact support if your plan doesn't update.</small>
          </div>
        )}

        {subID && (
          <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '20px' }}>
            Subscription ID: {subID}
          </p>
        )}

        <Link href="/" style={s.btn}>Start Removing Backgrounds →</Link>
        <Link href="/pricing" style={s.link}>View pricing plans</Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
