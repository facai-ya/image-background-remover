'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    id: 'free',
    name: 'Starter',
    tag: 'Free',
    price: '$0',
    sub: 'One-time signup gift',
    highlight: false,
    badge: null,
    features: [
      '3 credits upon registration',
      'Google sign-in required',
      'PNG export',
      'Up to 10MB per image',
      'Good for trying it out',
    ],
    cta: 'Get Started Free',
    ctaHref: '/',
    ctaStyle: 'outline',
  },
  {
    id: 'pack',
    name: 'Credit Pack',
    tag: '$1.99',
    price: '$1.99',
    sub: '20 credits · never expire',
    highlight: false,
    badge: 'Coming Soon',
    features: [
      '20 credits per pack',
      'Credits never expire',
      'Stack multiple packs',
      'PNG export',
      'Up to 10MB per image',
    ],
    cta: 'Notify Me',
    ctaHref: '/',
    ctaStyle: 'outline',
  },
  {
    id: 'pro',
    name: 'Monthly Pro',
    tag: '$9.9/mo',
    price: '$9.9',
    sub: 'per month · cancel anytime',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited removals per month',
      'Priority processing',
      'PNG export',
      'Up to 10MB per image',
      'Cancel anytime',
      'PayPal · coming soon',
    ],
    cta: 'Join Waitlist',
    ctaHref: '/',
    ctaStyle: 'primary',
  },
]

const faqs = [
  {
    q: 'How do free credits work?',
    a: 'Every new account gets 3 one-time credits after sign-up. Each background removal uses 1 credit.',
  },
  {
    q: 'Do credits expire?',
    a: 'No. Your signup credits and any purchased credit packs never expire.',
  },
  {
    q: 'When will Credit Pack and Pro be available?',
    a: 'We are integrating PayPal now. Leave your email and we will notify you the moment it launches.',
  },
  {
    q: 'Can I use the tool without signing in?',
    a: 'No. Sign-in is required to track your credits and prevent abuse.',
  },
  {
    q: 'What image formats are supported?',
    a: 'PNG, JPG, JPEG, and WEBP. Maximum file size is 10MB.',
  },
  {
    q: 'Is my image stored?',
    a: 'No. Images are sent directly to the Remove.bg API and are not stored on our servers.',
  },
]

export default function PricingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    background: active ? 'white' : 'transparent',
    color: active ? '#4f46e5' : 'rgba(255,255,255,0.7)',
    transition: 'all 0.2s',
  })

  const cardStyle = (highlight: boolean): React.CSSProperties => ({
    background: highlight
      ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(255,255,255,0.1))'
      : 'rgba(255,255,255,0.08)',
    border: highlight ? '2px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.12)',
    borderRadius: '24px',
    padding: '32px',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    transform: highlight ? 'scale(1.03)' : 'none',
    boxShadow: highlight ? '0 20px 60px rgba(251,191,36,0.2)' : 'none',
  })

  const badgeStyle = (highlight: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '5px 16px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    background: highlight ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.2)',
    color: highlight ? '#111' : 'white',
    whiteSpace: 'nowrap',
  })

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1e40af 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 40px',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      textDecoration: 'none',
      color: 'white',
    },
    logoIcon: {
      width: '36px',
      height: '36px',
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      borderRadius: '9px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    logoText: { fontWeight: 800, fontSize: '18px' },
    navLinks: { display: 'flex', gap: '12px', alignItems: 'center' },
    navLink: {
      padding: '9px 18px',
      borderRadius: '9px',
      background: 'rgba(255,255,255,0.1)',
      color: 'white',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.15)',
    },
    hero: {
      textAlign: 'center',
      padding: '80px 20px 48px',
    },
    heroLabel: {
      display: 'inline-block',
      padding: '6px 18px',
      borderRadius: '999px',
      background: 'rgba(251,191,36,0.18)',
      color: '#fde68a',
      fontSize: '13px',
      fontWeight: 700,
      marginBottom: '20px',
      border: '1px solid rgba(251,191,36,0.3)',
    },
    heroTitle: {
      fontSize: '52px',
      fontWeight: 900,
      margin: '0 0 16px',
      lineHeight: 1.1,
    },
    heroSub: {
      fontSize: '18px',
      opacity: 0.8,
      maxWidth: '520px',
      margin: '0 auto 36px',
      lineHeight: 1.6,
    },
    toggle: {
      display: 'inline-flex',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '4px',
      gap: '4px',
      border: '1px solid rgba(255,255,255,0.15)',
    },
    saveBadge: {
      display: 'inline-block',
      marginLeft: '8px',
      padding: '2px 8px',
      background: '#10b981',
      color: 'white',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '0 20px 80px',
    },
    planTag: { fontSize: '13px', opacity: 0.7, fontWeight: 600, marginBottom: '6px' },
    planName: { fontSize: '26px', fontWeight: 800, margin: '0 0 4px' },
    planPrice: { fontSize: '44px', fontWeight: 900, margin: '12px 0 4px', lineHeight: 1 },
    planSub: { fontSize: '13px', opacity: 0.65, marginBottom: '24px' },
    divider: {
      height: '1px',
      background: 'rgba(255,255,255,0.12)',
      margin: '20px 0',
    },
    featureList: { listStyle: 'none', padding: 0, margin: '0 0 28px', lineHeight: 2 },
    featureItem: { fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    check: { color: '#34d399', fontWeight: 900, flexShrink: 0 },
    ctaPrimary: {
      display: 'block',
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      color: '#111827',
      fontWeight: 800,
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      textAlign: 'center',
      textDecoration: 'none',
      boxSizing: 'border-box',
    },
    ctaOutline: {
      display: 'block',
      width: '100%',
      padding: '15px',
      background: 'rgba(255,255,255,0.1)',
      color: 'white',
      fontWeight: 700,
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.25)',
      cursor: 'pointer',
      fontSize: '15px',
      textAlign: 'center',
      textDecoration: 'none',
      boxSizing: 'border-box',
    },
    faqSection: {
      maxWidth: '720px',
      margin: '0 auto',
      padding: '0 20px 80px',
    },
    faqTitle: {
      textAlign: 'center',
      fontSize: '34px',
      fontWeight: 800,
      marginBottom: '36px',
    },
    faqItem: {
      background: 'rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '20px 24px',
      marginBottom: '12px',
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    faqRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
    },
    faqQ: { fontWeight: 700, fontSize: '15px' },
    faqIcon: { fontSize: '20px', opacity: 0.7, flexShrink: 0 },
    faqA: { marginTop: '12px', opacity: 0.78, fontSize: '14px', lineHeight: 1.7 },
    footer: {
      textAlign: 'center',
      padding: '32px 20px',
      opacity: 0.5,
      fontSize: '13px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    },
    guarantee: {
      textAlign: 'center',
      padding: '0 20px 60px',
    },
    guaranteePills: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '12px',
    },
    pill: {
      padding: '10px 20px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      fontSize: '14px',
    },
  }

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>
          <div style={s.logoIcon}>✨</div>
          <span style={s.logoText}>Background Remover</span>
        </Link>
        <div style={s.navLinks}>
          <Link href="/" style={s.navLink}>← Back to App</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroLabel}>Simple, transparent pricing</div>
        <h1 style={s.heroTitle}>Start free.<br />Scale when ready.</h1>
        <p style={s.heroSub}>
          Remove backgrounds instantly. New users get 3 free credits — no card required.
        </p>
        {/* Billing toggle */}
        <div style={s.toggle}>
          <button style={toggleBtn(billing === 'monthly')} onClick={() => setBilling('monthly')}>
            Monthly
          </button>
          <button style={toggleBtn(billing === 'yearly')} onClick={() => setBilling('yearly')}>
            Yearly <span style={s.saveBadge}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={s.grid}>
        {plans.map((plan) => (
          <div key={plan.id} style={cardStyle(plan.highlight)}>
            {plan.badge && <div style={badgeStyle(plan.highlight)}>{plan.badge}</div>}
            <div style={s.planTag}>{plan.name}</div>
            <div style={s.planName}>{plan.tag}</div>
            <div style={s.planPrice}>
              {plan.id === 'pro' && billing === 'yearly'
                ? '$7.9'
                : plan.price}
            </div>
            <div style={s.planSub}>
              {plan.id === 'pro' && billing === 'yearly'
                ? 'per month · billed $94.8/yr'
                : plan.sub}
            </div>
            <div style={s.divider} />
            <ul style={s.featureList}>
              {plan.features.map((f, i) => (
                <li key={i} style={s.featureItem}>
                  <span style={s.check}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.ctaHref} style={plan.ctaStyle === 'primary' ? s.ctaPrimary : s.ctaOutline}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Trust pills */}
      <div style={s.guarantee}>
        <div style={s.guaranteePills}>
          <span style={s.pill}>🔒 Google login · no passwords</span>
          <span style={s.pill}>🖼️ Images not stored</span>
          <span style={s.pill}>⚡ Powered by Remove.bg API</span>
          <span style={s.pill}>💳 PayPal coming soon</span>
          <span style={s.pill}>🎁 3 free credits to start</span>
        </div>
      </div>

      {/* FAQ */}
      <div style={s.faqSection}>
        <h2 style={s.faqTitle}>Frequently Asked Questions</h2>
        {faqs.map((item, i) => (
          <div key={i} style={s.faqItem} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
            <div style={s.faqRow}>
              <span style={s.faqQ}>{item.q}</span>
              <span style={s.faqIcon}>{activeFaq === i ? '−' : '+'}</span>
            </div>
            {activeFaq === i && <p style={s.faqA}>{item.a}</p>}
          </div>
        ))}
      </div>

      <footer style={s.footer}>
        Background Remover · Powered by Remove.bg · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
