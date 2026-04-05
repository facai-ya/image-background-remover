export async function onRequestGet(context) {
  return new Response('Functions are working! ' + new Date().toISOString(), {
    headers: { 'Content-Type': 'text/plain' }
  })
}
