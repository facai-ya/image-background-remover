export async function onRequestPost(context) {
  const { request, env } = context
  const apiKey = env.REMOVE_BG_API_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image_file')

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const outForm = new FormData()
    outForm.append('image_file', imageFile)
    outForm.append('size', 'auto')
    outForm.append('format', 'png') // ensure PNG with alpha channel

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: outForm,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({ error: `Remove.bg error: ${response.status} - ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const imageBuffer = await response.arrayBuffer()
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
