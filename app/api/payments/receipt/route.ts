import { getDb } from '@/lib/db'
import { formatDate, formatUGX } from '@/lib/format'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference') || ''
  const row = getDb().prepare('SELECT donor_name, amount, frequency, date, status, transaction_id, method, support_target, message FROM donations WHERE transaction_id = ?').get(reference) as {
    donor_name: string
    amount: number
    frequency: string
    date: string
    status: string
    transaction_id: string
    method: string
    support_target: string
    message: string | null
  } | undefined
  if (!row || row.status === 'Failed' || row.status === 'Cancelled') {
    return new Response('A receipt is available once the gift is recorded.', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
  const status = row.status === 'Successful' ? 'Confirmed' : row.status === 'Refunded' ? 'Refunded' : 'Recorded'
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(row.transaction_id)}</title></head><body style="font-family:Georgia,serif;max-width:560px;margin:48px auto;color:#161d24">
<h1 style="font-size:28px">School Pesa</h1>
<p>Gift receipt</p>
<p><strong>${escapeHtml(formatUGX(row.amount))}</strong> · ${escapeHtml(row.frequency)}</p>
<p>Donor: ${escapeHtml(row.donor_name)}</p>
<p>Support: ${escapeHtml(row.support_target)}</p>
<p>Method: ${escapeHtml(row.method)}</p>
<p>Date: ${escapeHtml(formatDate(row.date))}</p>
<p>Reference: ${escapeHtml(row.transaction_id)}</p>
<p>Status: ${status}</p>
${row.message ? `<p>Note: ${escapeHtml(row.message)}</p>` : ''}
</body></html>`
  const filename = `School-Pesa-receipt-${row.transaction_id}.html`
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
