'use client'

import { useState, useRef, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  avatar: string
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (match) {
    try { return JSON.parse(atob(match[2])) as any } catch { return null }
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
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sessionData = getCookie('session')
    if (sessionData) setUser(sessionData as any)

    const params = new URLSearchParams(window.location.search)
    const errCode = params.get('error')
    if (errCode) {
      const reason = params.get('reason')
      const msgMap: Record<string, string> = {
        no_code: 'Login cancelled',
        token_failed: `Token exchange failed${reason ? ': ' + reason : ''} — check Cloudflare env vars`,
        network_error: 'Network error contacting Google',
        userinfo_failed: 'Failed to get user info from Google',
        auth_failed: 'Authentication failed',
      }
      setError(msgMap[errCode] || `Login failed: ${errCode}`)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const handleGoogleLogin = () => {
    console.log('Google login clicked')
    const clientId = '506877532810-ipgrhqfr6iklfmpn4frs6ck6acfj4rh9.apps.googleusercontent.com'
    const redirectUri = `${window.location.origin}/api/auth/google`
    const scope = 'openid email profile'
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`
    console.log('Redirect URL:', url)
    window.location.href = url
  }

  const handleLogout = () => {
    deleteCookie('session')
    setUser(null)
  }

  const processFile = (file: File) => {
    if (!user) { setError('Please login first'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File too large (max 10MB)'); return }
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
      const formData = new FormData()
      formData.append('image_file', originalFile)
      const response = await fetch('/api/remove-bg', { method: 'POST', body: formData })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.error || `API Error: ${response.status}`)
      }
      const blob = await response.blob()
      setResult(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background')
    } finally {
      setLoading(false)
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '20px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', marginBottom: '40px' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    main: { textAlign: 'center', maxWidth: '800px', margin: '0 auto' },
    h2: { fontSize: '48px', marginBottom: '16px' },
    p: { fontSize: '18px', opacity: 0.7, marginBottom: '40px' },
    uploadArea: { border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '24px', padding: '60px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' },
    uploadIcon: { width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444)', borderRadius: '20px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' },
    btn: { padding: '12px 32px', background: 'white', color: '#7c3aed', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', marginTop: '16px' },
    formats: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', fontSize: '14px' },
    formatTag: { padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px' },
    error: { background: 'rgba(239,68,68,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#fca5a5' },
    comparison: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
    imageBox: { background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' },
    img: { width: '100%', borderRadius: '12px' },
    actions: { display: 'flex', gap: '12px', justifyContent: 'center' },
    btnPrimary: { padding: '16px 32px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px' },
    btnSuccess: { padding: '16px 32px', background: '#10b981', color: 'white', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px' },
    btnSecondary: { padding: '16px 32px', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '16px' },
    btnGoogle: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: 'white', color: '#333', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' },
    userName: { fontSize: '14px', fontWeight: 'bold' },
    btnLogout: { padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px' },
    loginPrompt: { background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', marginBottom: '30px' },
    footer: { textAlign: 'center', padding: '24px', opacity: 0.4, fontSize: '14px', marginTop: '40px' }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✨</div>
          <div>
            <h1 style={{fontSize: '20px', fontWeight: 'bold'}}>Background Remover</h1>
            <p style={{fontSize: '12px', opacity: 0.6}}>AI-Powered</p>
          </div>
        </div>
        {user ? (
          <div style={styles.userInfo}>
            <img src={user.avatar} alt={user.name} style={styles.avatar} referrerPolicy="no-referrer" />
            <span style={styles.userName}>{user.name}</span>
            <button style={styles.btnLogout} onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button style={styles.btnGoogle} onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
            Sign in with Google
          </button>
        )}
      </header>

      <main style={styles.main}>
        {!image ? (
          <>
            <h2 style={styles.h2}>Remove Image Background</h2>
            <p style={styles.p}>Upload your image and let AI do the magic</p>
            {error && <div style={styles.error}>{error}</div>}
            {!user ? (
              <div style={styles.loginPrompt}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>🔐</div>
                <h3 style={{marginBottom: '12px'}}>Sign in to get started</h3>
                <p style={{opacity: 0.7, marginBottom: '24px'}}>Login with Google to use the background remover</p>
                <button style={styles.btnGoogle} onClick={handleGoogleLogin}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                <div style={styles.uploadIcon}>🎯</div>
                <h3>Drop your image here</h3>
                <p>or click to browse</p>
                <button style={styles.btn}>Select Image File</button>
                <div style={styles.formats}>
                  <span style={styles.formatTag}>PNG</span>
                  <span style={styles.formatTag}>JPG</span>
                  <span style={styles.formatTag}>WEBP</span>
                  <span>Max 10MB</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={styles.h2}>Edit Your Image</h2>
            <p style={styles.p}>Compare original and result</p>
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.comparison}>
              <div style={styles.imageBox}>
                <h4>📷 Original</h4>
                <img src={image} alt="Original" style={styles.img} />
              </div>
              <div style={styles.imageBox}>
                <h4>✨ Result</h4>
                {loading ? (
                  <div style={{padding: '40px'}}>
                    <div style={{width: '40px', height: '40px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite'}}></div>
                    <p style={{marginTop: '10px'}}>Processing...</p>
                  </div>
                ) : result ? (
                  <img src={result} alt="Result" style={styles.img} />
                ) : (
                  <div style={{padding: '40px', opacity: 0.6}}>
                    <span style={{fontSize: '40px'}}>✨</span>
                    <p>Click below to remove</p>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.actions}>
              {!result && !loading && <button style={styles.btnPrimary} onClick={handleRemoveBg}>✨ Remove Background</button>}
              {result && <button style={styles.btnSuccess} onClick={handleDownload}>⬇️ Download</button>}
              <button style={styles.btnSecondary} onClick={handleReset}>🔄 New Image</button>
            </div>
          </>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Powered by Remove.bg API • {new Date().getFullYear()}</p>
      </footer>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} style={{display: 'none'}} />
    </div>
  )
}
