'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-lg">
              ✨
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Background Remover</h1>
              <p className="text-xs text-white/60">AI-Powered • Free to use</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">API Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {!image ? (
          /* Upload Section */
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Remove Image Background</h2>
            <p className="text-white/70 text-lg">Upload your image and let AI do the magic ✨</p>
          </div>
        ) : null}

        {/* Upload Area */}
        {!image && (
          <div
            className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? 'border-white bg-white/20 scale-105'
                : 'border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="p-16 text-center" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl transform rotate-3 cursor-pointer">
                <span className="text-5xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 cursor-pointer">Drop your image here</h3>
              <p className="text-white/60 mb-6 cursor-pointer">or click to browse files 👆</p>
              <button
                type="button"
                className="mt-4 px-8 py-3 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              >
                📁 Select Image File
              </button>
              <div className="flex items-center justify-center gap-3 text-sm text-white/50">
                <span className="px-3 py-1 bg-white/10 rounded-full">PNG</span>
                <span className="px-3 py-1 bg-white/10 rounded-full">JPG</span>
                <span className="px-3 py-1 bg-white/10 rounded-full">WEBP</span>
                <span className="mx-2">•</span>
                <span>Max 10MB</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Editor Section */}
        {image && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Edit Your Image</h2>
              <p className="text-white/60">Compare original and result side by side</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                {error}
              </div>
            )}

            {/* Image Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📷</span>
                  <span className="text-white font-medium">Original Image</span>
                </div>
                <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIEwgMCAxMCBMIDEwIDEwIEwgMjAgMTAgTCAyMCAwIEwgMTAgMCBMIDEwIDEwIEwgMTAgMjAgTCAwIDIwIEwgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat rounded-2xl overflow-hidden">
                  <img src={image} alt="Original" className="w-full h-full object-contain p-4" />
                </div>
              </div>

              {/* Result */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <span className="text-white font-medium">Background Removed</span>
                </div>
                <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIEwgMCAxMCBMIDEwIDEwIEwgMjAgMTAgTCAyMCAwIEwgMTAgMCBMIDEwIDEwIEwgMTAgMjAgTCAwIDIwIEwgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat rounded-2xl overflow-hidden flex items-center justify-center">
                    {loading ? (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 animate-spin" />
                        <p className="text-white/80 font-medium">Processing...</p>
                        <p className="text-white/50 text-sm mt-1">AI is removing background</p>
                      </div>
                    ) : result ? (
                      <img src={result} alt="Result" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl">
                          ✨
                        </div>
                        <p className="text-white/60 text-sm">Click below to remove</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!result && !loading && (
                <button
                  onClick={handleRemoveBg}
                  className="group px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 font-bold rounded-2xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-2xl group-hover:animate-bounce">✨</span>
                    Remove Background
                  </span>
                </button>
              )}
              {result && (
                <button
                  onClick={handleDownload}
                  className="group px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">⬇️</span>
                    Download Result
                  </span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-8 py-4 bg-white/10 text-white font-medium rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <span>🔄</span>
                  Upload New Image
                </span>
              </button>
            </div>

            {/* Tips */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-white/40 text-sm">
                <span>💡</span>
                For best results, use images with clear contrast between subject and background
              </div>
            </div>
          </div>
        )}

        {/* Features Section (when no image) */}
        {!image && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl mb-4">🚀</div>
              <h3 className="text-lg font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-white/60 text-sm">Process images in seconds with our AI-powered engine</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-2xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">Precise Cutout</h3>
              <p className="text-white/60 text-sm">Accurate edge detection for clean, professional results</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-2xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-white mb-2">Privacy Safe</h3>
              <p className="text-white/60 text-sm">Your images are processed in memory and never stored</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/40 text-sm">
        <p>Powered by Remove.bg API • Built with Next.js • {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}