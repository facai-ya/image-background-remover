'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
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
      const formData = new FormData()
      formData.append('image', originalFile)
      const response = await fetch('/api/remove-bg', { method: 'POST', body: formData })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process image')
      }
      const blob = await response.blob()
      setResult(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
        <span style={styles.formatTag}>API Ready</span>
      </header>

      <main style={styles.main}>
        {!image ? (
          <>
            <h2 style={styles.h2}>Remove Image Background</h2>
            <p style={styles.p}>Upload your image and let AI do the magic</p>
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
