import { getDb } from '@/lib/db'
import { formatDate, formatUGX } from '@/lib/format'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference') || ''
  const { data: row, error } = await getDb().from('donations')
    .select('donor_name, amount, frequency, date, status, transaction_id, method, support_target, message')
    .eq('transaction_id', reference)
    .maybeSingle()
  if (error) throw new Error(`Could not load receipt: ${error.message}`)
  const receipt = row as {
    donor_name: string
    amount: number
    frequency: string
    date: string
    status: string
    transaction_id: string
    method: string
    support_target: string
    message: string | null
  } | null
  if (!receipt || receipt.status === 'Failed' || receipt.status === 'Cancelled') {
    return new Response('A receipt is available once the gift is recorded.', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
  const status = receipt.status === 'Successful' ? 'Confirmed' : receipt.status === 'Refunded' ? 'Refunded' : 'Recorded'
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.transaction_id)}</title></head><body style="font-family:Georgia,serif;max-width:560px;margin:48px auto;color:#161d24">
<h1 style="font-size:28px">School Pesa</h1>
<p>Gift receipt</p>
<p><strong>${escapeHtml(formatUGX(receipt.amount))}</strong> · ${escapeHtml(receipt.frequency)}</p>
<p>Donor: ${escapeHtml(receipt.donor_name)}</p>
<p>Support: ${escapeHtml(receipt.support_target)}</p>
<p>Method: ${escapeHtml(receipt.method)}</p>
<p>Date: ${escapeHtml(formatDate(receipt.date))}</p>
<p>Reference: ${escapeHtml(receipt.transaction_id)}</p>
<p>Status: ${status}</p>
${receipt.message ? `<p>Note: ${escapeHtml(receipt.message)}</p>` : ''}
</body></html>`
  const filename = `School-Pesa-receipt-${receipt.transaction_id}.html`
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
