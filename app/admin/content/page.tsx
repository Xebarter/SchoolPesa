import { ContentBoard } from '@/components/admin/content-board'
import { getEvents, getFaqs, getNews } from '@/lib/data'

export const metadata = { title: 'Admin content' }

export default async function Page() {
  const [news, events, faqs] = await Promise.all([getNews(), getEvents(), getFaqs()])
  return <ContentBoard news={news} events={events} faqs={faqs} />
}
