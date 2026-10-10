import { applyPaymentUpdate, verifyCallback } from '@/lib/checkout'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature')
  if (!verifyCallback(body, signature)) {
    return Response.json({ ok: false }, { status: 401 })
  }
  let payload: { id?: string; reference?: string; status?: string; event_type?: string }
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
  applyPaymentUpdate(payload)
  return Response.json({ ok: true })
}
