'use client'

import { useState, useRef, useEffect } from 'react'

interface SessionUser {
  id: string
  email: string
  name: string
  avatar: string
}

interface AccountInfo {
  google_id: string
  email: string
  name: string
  avatar: string
  credits: number
  plan: 'free' | 'pro'
  plan_expires_at?: string | null
  total_used: number
}

function getSessionCookie(name: string): SessionUser | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (match) {
    try {
      return JSON.parse(atob(match[2]))
    } catch {
      return null
    }
  }
  return null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sessionData = getSessionCookie('session')
    if (sessionData) {
      setUser(sessionData)
      fetchUserInfo()
    }

    const params = new URLSearchParams(window.location.search)
    const errCode = params.get('error')
    if (errCode) {
      const reason = params.get('reason')
      const msgMap: Record<string, string> = {
        no_code: 'Login cancelled',
        token_failed: `Token exchange failed${reason ? ': ' + reason : ''}`,
        network_error: 'Network error contacting Google',
        userinfo_failed: 'Failed to get user info from Google',
        auth_failed: 'Authentication failed',
      }
      setError(msgMap[errCode] || `Login failed: ${errCode}`)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/info')
      if (!response.ok) return
      const data = await response.json()
      setAccount(data.user)
    } catch {}
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=506877532810-ipgrhqfr6iklfmpn4frs6ck6acfj4rh9.apps.googleusercontent.com&redirect_uri=${encodeURIComponent('https://image-backgroundremover.xyz/api/auth/google')}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline`

  const handleLogout = () => {
    deleteCookie('session')
    setUser(null)
    setAccount(null)
  }

  const processFile = (file: File) => {
    if (!user) {
      setError('Please sign in first')
      return
    }
    if (!account) {
      setError('Loading account info, please try again')
      return
    }
    if (account.plan !== 'pro' && account.credits <= 0) {
      setError('You have no credits left. Please purchase a credit pack or subscribe monthly.')
      setShowPricing(true)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return
    }
    setOriginalFile(file)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleRemoveBg = async () => {
    if (!originalFile) return
    setLoading(true)
    setError(null)

    try {
      setProgressText('Checking credits...')
      const creditRes = await fetch('/api/user/use-credit', { method: 'POST' })
      const creditJson = await creditRes.json()
      if (!creditRes.ok) {
        if (creditJson.error === 'no_credits') {
          setShowPricing(true)
          throw new Error('You have no credits left. Please upgrade to continue.')
        }
        throw new Error(creditJson.error || 'Failed to verify usage rights')
      }

      if (creditJson.plan === 'free') {
        setAccount((prev) => prev ? { ...prev, credits: creditJson.credits, total_used: prev.total_used + 1 } : prev)
      } else {
        setAccount((prev) => prev ? { ...prev, total_used: prev.total_used + 1 } : prev)
      }
      await fetchUserInfo()

      setProgressText('Sending image to background removal service...')
      const formData = new FormData()
      formData.append('image_file', originalFile)
      const response = await fetch('/api/remove-bg', { method: 'POST', body: formData })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.error || `API Error: ${response.status}`)
      }

      setProgressText('Preparing result...')
      const blob = await response.blob()
      setResult(URL.createObjectURL(blob))
      setProgressText('Done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background')
    } finally {
      setLoading(false)
      setTimeout(() => setProgressText(''), 1200)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result
    link.download = 'background-removed.png'
    link.click()
  }

  const handleReset = () => {
    setImage(null)
    setOriginalFile(null)
    setResult(null)
    setError(null)
    setProgressText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const faqItems = [
    { q: 'How many free uses do I get?', a: 'Each new account receives 3 one-time credits after registration.' },
    { q: 'Do free credits expire?', a: 'No. Your 3 signup credits do not expire.' },
    { q: 'What happens after I use all credits?', a: 'You can buy a credit pack later or subscribe monthly when payment is connected.' },
    { q: 'Why are you using credits first?', a: 'This helps control API cost before we connect PayPal and monthly subscriptions.' },
  ]

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '20px', color: 'white' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    nav: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
    navBtn: { padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '14px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' },
    badge: { padding: '6px 10px', borderRadius: '999px', background: 'rgba(251,191,36,0.2)', color: '#fde68a', fontSize: '12px', fontWeight: 700 },
    creditBox: { padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', fontSize: '13px' },
    main: { textAlign: 'center', maxWidth: '1120px', margin: '0 auto' },
    heroTitle: { fontSize: '48px', marginBottom: '12px', fontWeight: 800 },
    heroText: { fontSize: '18px', opacity: 0.85, marginBottom: '28px' },
    heroSub: { display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' },
    pill: { padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', fontSize: '14px' },
    error: { background: 'rgba(239,68,68,0.18)', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#fecaca', border: '1px solid rgba(239,68,68,0.35)' },
    panel: { background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)', marginBottom: '24px' },
    uploadArea: { border: '2px dashed rgba(255,255,255,0.28)', borderRadius: '24px', padding: '54px 24px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' },
    uploadIcon: { width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444)', borderRadius: '20px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px' },
    btn: { padding: '12px 24px', background: 'white', color: '#6d28d9', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '15px' },
    btnPrimary: { padding: '15px 28px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#111827', fontWeight: 800, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px' },
    btnGhost: { padding: '15px 28px', background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '16px' },
    btnSuccess: { padding: '15px 28px', background: '#10b981', color: 'white', fontWeight: 800, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px' },
    btnGoogle: { display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'white', color: '#333', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' },
    imageBox: { background: 'rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' },
    img: { width: '100%', borderRadius: '12px', maxHeight: '480px', objectFit: 'contain', background: 'rgba(255,255,255,0.06)' },
    actions: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
    pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '18px' },
    card: { background: 'rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)' },
    highlightCard: { background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(255,255,255,0.08))', borderRadius: '18px', padding: '22px', textAlign: 'left', border: '1px solid rgba(251,191,36,0.4)' },
    faqItem: { textAlign: 'left', background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginTop: '12px', cursor: 'pointer' },
    footer: { textAlign: 'center', padding: '32px 0', opacity: 0.55, fontSize: '14px', marginTop: '30px' },
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✨</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Background Remover</h1>
            <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>Google login · credit system · pricing plan</p>
          </div>
        </div>

        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => setShowPricing((v) => !v)}>Pricing</button>
          <button style={styles.navBtn} onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</button>
        </div>

        {user ? (
          <div style={styles.userInfo}>
            <img src={user.avatar} alt={user.name} style={styles.avatar} referrerPolicy="no-referrer" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.72 }}>{user.email}</div>
            </div>
            <div style={styles.badge}>{account?.plan === 'pro' ? 'PRO' : 'FREE'}</div>
            <div style={styles.creditBox}>Credits: {account ? account.credits : '...'}</div>
            <div style={styles.creditBox}>Used: {account ? account.total_used : '...'}</div>
            <button style={styles.navBtn} onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <a href={googleAuthUrl} style={styles.btnGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
            Sign in with Google
          </a>
        )}
      </header>

      <main style={styles.main}>
        <h2 style={styles.heroTitle}>AI Background Removal with Credits</h2>
        <p style={styles.heroText}>New users get 3 free credits. Monthly subscription and credit packs can be connected later.</p>
        <div style={styles.heroSub}>
          <span style={styles.pill}>🎁 3 signup credits</span>
          <span style={styles.pill}>💳 credit packs later</span>
          <span style={styles.pill}>📅 monthly subscription later</span>
          <span style={styles.pill}>🔒 Google login enabled</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {!image ? (
          <div style={styles.panel}>
            {!user ? (
              <>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔐</div>
                <h3 style={{ marginTop: 0 }}>Sign in to start</h3>
                <p style={{ opacity: 0.82, marginBottom: '22px' }}>Register once and receive 3 credits. Each processed image consumes 1 credit.</p>
                <a href={googleAuthUrl} style={styles.btnGoogle}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
                  Sign in with Google
                </a>
              </>
            ) : (
              <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                <div style={styles.uploadIcon}>🎯</div>
                <h3>Upload your image</h3>
                <p style={{ opacity: 0.82 }}>PNG / JPG / WEBP · Max 10MB · 1 credit per image</p>
                <button style={styles.btn}>Select Image</button>
                <div style={{ marginTop: '18px', opacity: 0.8, fontSize: '14px' }}>
                  Current credits: <strong>{account ? account.credits : '...'}</strong>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={styles.grid2}>
              <div style={styles.imageBox}>
                <h4>📷 Original</h4>
                <img src={image} alt="Original" style={styles.img} />
              </div>
              <div style={styles.imageBox}>
                <h4>✨ Result</h4>
                {loading ? (
                  <div style={{ padding: '48px 16px' }}>
                    <div style={{ width: '46px', height: '46px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '14px', opacity: 0.9 }}>{progressText || 'Processing...'}</p>
                  </div>
                ) : result ? (
                  <img src={result} alt="Result" style={styles.img} />
                ) : (
                  <div style={{ padding: '48px 16px', opacity: 0.7 }}>
                    <div style={{ fontSize: '42px' }}>✨</div>
                    <p>Click the button below to start</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...styles.panel, marginTop: '18px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={styles.creditBox}>Remaining credits: {account ? account.credits : '...'}</div>
                <div style={styles.creditBox}>Total used: {account ? account.total_used : '...'}</div>
                <div style={styles.creditBox}>Current plan: {account?.plan === 'pro' ? 'PRO' : 'FREE'}</div>
              </div>
            </div>

            <div style={styles.actions}>
              {!result && !loading && <button style={styles.btnPrimary} onClick={handleRemoveBg}>Remove Background</button>}
              {result && <button style={styles.btnSuccess} onClick={handleDownload}>Download PNG</button>}
              <button style={styles.btnGhost} onClick={handleReset}>New Image</button>
              <button style={styles.btnGhost} onClick={() => setShowPricing((v) => !v)}>View Pricing</button>
            </div>
          </>
        )}

        {(showPricing || !user) && (
          <section style={styles.panel}>
            <h3 style={{ marginTop: 0 }}>Pricing Strategy</h3>
            <p style={{ opacity: 0.82 }}>Control usage first, integrate PayPal later.</p>
            <div style={styles.pricingGrid}>
              <div style={styles.card}>
                <div style={{ opacity: 0.75, fontSize: '13px' }}>Starter</div>
                <h4 style={{ margin: '8px 0' }}>Free</h4>
                <div style={{ fontSize: '30px', fontWeight: 800 }}>$0</div>
                <p>One-time signup gift: 3 credits</p>
                <ul style={{ paddingLeft: '18px', lineHeight: 1.8 }}>
                  <li>Google sign-in</li>
                  <li>3 total uses after signup</li>
                  <li>Good for product validation</li>
                </ul>
              </div>
              <div style={styles.card}>
                <div style={{ opacity: 0.75, fontSize: '13px' }}>Credit Pack</div>
                <h4 style={{ margin: '8px 0' }}>Coming soon</h4>
                <div style={{ fontSize: '30px', fontWeight: 800 }}>$0.99+</div>
                <p>Low-friction top-up for light users</p>
                <ul style={{ paddingLeft: '18px', lineHeight: 1.8 }}>
                  <li>Credits do not expire</li>
                  <li>Good for occasional usage</li>
                  <li>PayPal can be added later</li>
                </ul>
              </div>
              <div style={styles.highlightCard}>
                <div style={{ opacity: 0.82, fontSize: '13px' }}>Subscription</div>
                <h4 style={{ margin: '8px 0' }}>Monthly Pro</h4>
                <div style={{ fontSize: '30px', fontWeight: 800 }}>$4.9/mo</div>
                <p>Best for frequent users</p>
                <ul style={{ paddingLeft: '18px', lineHeight: 1.8 }}>
                  <li>Monthly subscription model</li>
                  <li>No manual top-up needed</li>
                  <li>PayPal subscription later</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        <section style={styles.panel} id="faq">
          <h3 style={{ marginTop: 0 }}>FAQ</h3>
          {faqItems.map((item, index) => (
            <div key={index} style={styles.faqItem} onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontWeight: 700 }}>
                <span>{item.q}</span>
                <span>{activeFaq === index ? '−' : '+'}</span>
              </div>
              {activeFaq === index && <p style={{ margin: '12px 0 0', opacity: 0.82 }}>{item.a}</p>}
            </div>
          ))}
        </section>
      </main>

      <footer style={styles.footer}>
        Powered by Remove.bg API · Credits first, PayPal later · {new Date().getFullYear()}
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        html { scroll-behavior: smooth; }
        body { margin: 0; font-family: Arial, sans-serif; }
      `}</style>
    </div>
  )
}
