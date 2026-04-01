import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call Remove.bg API
    const apiKey = process.env.REMOVE_BG_API_KEY || '8U73faZpDg7PghtR3t9bCdhc'
    
    const form = new FormData()
    form.append('image_file', new Blob([buffer]), imageFile.name)
    form.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/remove', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: form,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Remove.bg API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Remove.bg API failed: ${response.status}` },
        { status: 500 }
      )
    }

    // Return the processed image
    const resultBuffer = await response.arrayBuffer()
    return new NextResponse(Buffer.from(resultBuffer), {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  } catch (error) {
    console.error('Error removing background:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}