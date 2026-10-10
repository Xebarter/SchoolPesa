import { ContentBoard } from '@/components/admin/content-board'
import { getEvents, getFaqs, getNews } from '@/lib/data'

export const metadata = { title: 'Admin content' }

export default function Page() {
  return <ContentBoard news={getNews()} events={getEvents()} faqs={getFaqs()} />
}
