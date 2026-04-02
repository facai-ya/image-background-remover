import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image_file')
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const bgFormData = new FormData()
    bgFormData.append('image_file', imageFile)
    bgFormData.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/remove', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: bgFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Remove.bg error: ${response.status} ${errorText}` }, { status: response.status })
    }

    const imageBuffer = await response.arrayBuffer()
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
