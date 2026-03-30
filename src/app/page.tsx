'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large (max 10MB)')
        return
      }
      setOriginalFile(file)
      setResult(null)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large (max 10MB)')
        return
      }
      setOriginalFile(file)
      setResult(null)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveBg = async () => {
    if (!originalFile) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', originalFile)

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResult(url)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🎨 Image Background Remover</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Upload Area */}
        {!image && (
          <div
            className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center bg-white hover:border-indigo-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📤</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Drop your image here or click to upload
            </h2>
            <p className="text-gray-500 text-sm">
              Supports PNG, JPG, WEBP (max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Preview & Result */}
        {image && (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Image Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Original</h3>
                <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIEwgMCAxMCBMIDEwIDEwIEwgMjAgMTAgTCAyMCAwIEwgMTAgMCBMIDEwIDEwIEwgMTAgMjAgTCAwIDIwIEwgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWRlZWRlIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat rounded-xl overflow-hidden">
                  <img
                    src={image}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Result</h3>
                <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIEwgMCAxMCBMIDEwIDEwIEwgMjAgMTAgTCAyMCAwIEwgMTAgMCBMIDEwIDEwIEwgMTAgMjAgTCAwIDIwIEwgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWRlZWRlIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat rounded-xl overflow-hidden flex items-center justify-center">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin text-4xl mb-2">⏳</div>
                      <p className="text-gray-500 text-sm">Processing...</p>
                    </div>
                  ) : result ? (
                    <img
                      src={result}
                      alt="Result"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="text-4xl mb-2">✨</div>
                      <p className="text-sm">Click &quot;Remove Background&quot; to start</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {!result && !loading && (
                <button
                  onClick={handleRemoveBg}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  ✨ Remove Background
                </button>
              )}
              {result && (
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  ⬇️ Download
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                🔄 New Image
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        Powered by Remove.bg API • Built with Next.js
      </footer>
    </div>
  )
}