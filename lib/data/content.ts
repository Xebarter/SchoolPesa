import type { EventItem, Faq, GalleryItem, NewsArticle, Story } from '@/lib/types'

const image = '/school-pesa-hero.png'

export const stories: Story[] = [
  {
    id: 'st-1',
    slug: 'from-a-school-uniform-to-a-university-dream',
    title: 'From a School Uniform to a University Dream',
    excerpt: 'Amina had almost given up. Then her community showed up with the fees, books and a uniform that got her back to class.',
    body: 'Amina had almost given up on the next term. The uniform was too small, the fees were late, and the walk to school had started to feel pointless. Neighbours and donors covered the fees, a new uniform and a set of books. She is back in class, reading aloud, and talking about university the way other children talk about the weekend.\n\nSchool Pesa keeps stories like this specific. The gift was for fees, books and a uniform. The update is that she is enrolled. The next need is already visible, and donors can follow it.',
    category: 'Success Stories',
    author: 'School Pesa',
    date: '2026-09-20',
    image,
    gallery: [image],
    campaignId: 'camp-1',
    beneficiaryId: 'ben-1',
    status: 'published',
    views: 1280,
  },
  {
    id: 'st-2',
    slug: 'a-new-beginning',
    title: 'A New Beginning',
    excerpt: 'When a classroom opens its doors, a whole community steps forward.',
    body: 'The first day of term is loud. Bags are new, names are called, and a child who missed last term finds a desk. This story follows one classroom as fees and supplies arrived before the bell.',
    category: 'Community',
    author: 'School Pesa',
    date: '2026-09-04',
    image,
    gallery: [image],
    campaignId: 'camp-1',
    status: 'published',
    views: 860,
  },
  {
    id: 'st-3',
    slug: 'what-a-school-bag-can-change',
    title: 'What a School Bag Can Change',
    excerpt: 'The right tools can turn a difficult morning into a day of possibility.',
    body: 'A school bag is ordinary until you do not have one. Books stay dry. Homework comes home. A child walks in looking like they belong. This is a story about bags, books and the small dignity of being prepared.',
    category: 'School Requirements',
    author: 'School Pesa',
    date: '2026-08-16',
    image,
    gallery: [image],
    campaignId: 'camp-3',
    status: 'published',
    views: 640,
  },
  {
    id: 'st-4',
    slug: 'from-classroom-to-campus',
    title: 'From Classroom to Campus',
    excerpt: 'Grace carried a primary-school dream all the way to a university registration desk.',
    body: 'Grace’s path from a crowded classroom to a university campus was not a straight line. A scholarship covered the semester that would have ended it. She is in class, and the next fee date is already on the calendar.',
    category: 'Scholarships',
    author: 'School Pesa',
    date: '2026-08-02',
    image,
    gallery: [image],
    campaignId: 'camp-2',
    beneficiaryId: 'ben-3',
    status: 'published',
    views: 990,
  },
  {
    id: 'st-5',
    slug: 'a-scholarship-that-changed-everything',
    title: 'A Scholarship That Changed Everything',
    excerpt: 'One year of tuition kept a student in school and changed what the family believed was possible.',
    body: 'Scholarships at School Pesa are practical. They name the fee, the term and the student. This one covered a full year and gave a family room to plan the next.',
    category: 'Students',
    author: 'School Pesa',
    date: '2026-07-11',
    image,
    gallery: [image],
    status: 'published',
    views: 540,
  },
]

export const gallery: GalleryItem[] = [
  { id: 'g1', src: image, alt: 'Children learning together in a classroom', caption: 'A morning lesson in a primary classroom.', category: 'Learning', campaignId: 'camp-1', storyId: 'st-1' },
  { id: 'g2', src: image, alt: 'Learners seated at wooden desks', caption: 'Desks filled for the new term.', category: 'Children', campaignId: 'camp-1' },
  { id: 'g3', src: image, alt: 'A teacher with a class', caption: 'A teacher moving between rows.', category: 'Schools' },
  { id: 'g4', src: image, alt: 'Open storybooks on a desk', caption: 'New readers on the front desk.', category: 'School Supplies', campaignId: 'camp-3' },
  { id: 'g5', src: image, alt: 'Students in class', caption: 'Scholarship students back on campus.', category: 'Scholarships', campaignId: 'camp-2' },
  { id: 'g6', src: image, alt: 'A community classroom', caption: 'Families gathered for a school day.', category: 'Communities' },
  { id: 'g7', src: image, alt: 'Classroom during an event', caption: 'A reading afternoon with visitors.', category: 'Events' },
]

export const news: NewsArticle[] = [
  { id: 'n1', slug: 'back-to-school-2027-is-open', title: 'Back to School 2027 is open', excerpt: 'Fees, uniforms and books are now in one campaign for the coming school year.', body: 'Back to School 2027 is open for contributions. The campaign lists fees, uniforms and learning materials as separate needs so donors can see what a gift covers. Updates will be posted as supplies are delivered.', category: 'Campaigns', date: '2026-09-22', image },
  { id: 'n2', slug: 'how-we-report-impact', title: 'How we report impact', excerpt: 'Every allocation is tied to a campaign, a need and a short update.', body: 'School Pesa reports impact as a path: funds raised, education support, school requirements, a child in school. Stories and numbers sit next to each other so a donor can see both the person and the ledger.', category: 'Impact', date: '2026-08-28', image },
  { id: 'n3', slug: 'reading-afternoon-in-kampala', title: 'Reading afternoon in Kampala', excerpt: 'Volunteers spent a Saturday with primary learners and a new set of readers.', body: 'A Saturday reading afternoon brought volunteers into a Kampala classroom. Children read in pairs. The books stayed at the school.', category: 'Events', date: '2026-07-19', image },
]

export const events: EventItem[] = [
  { id: 'e1', name: 'Saturday reading club', date: '2026-10-18', time: '10:00 – 12:00', location: 'Kampala', description: 'Read with primary learners and help them take a book home for the week.', image },
  { id: 'e2', name: 'Back to school briefing', date: '2026-11-02', time: '14:00 – 15:30', location: 'Online', description: 'A short briefing on the 2027 campaign, what has been raised, and what is still needed.', image },
  { id: 'e3', name: 'Partner classroom visit', date: '2026-11-20', time: '09:00 – 13:00', location: 'Wakiso', description: 'Partners visit a supported classroom and hear from teachers about the term.', image },
]

export const faqs: Faq[] = [
  { id: 'f1', topic: 'Donations', question: 'How do donations work?', answer: 'You choose an amount, who you want to support, and your contact details. School Pesa then prepares the gift for a payment provider. You review the details before any payment is requested.' },
  { id: 'f2', topic: 'Funds', question: 'How are funds used?', answer: 'Gifts are allocated to a campaign or a learner’s stated education need: fees, books, uniforms, meals, technology or accommodation. Expenses are recorded against that allocation.' },
  { id: 'f3', topic: 'Sponsorship', question: 'What does sponsorship mean?', answer: 'Sponsoring a child means supporting a privacy-safe learner profile. You see a display name, education level, general location and the need. You do not see sensitive personal records.' },
  { id: 'f4', topic: 'Campaigns', question: 'How are campaigns chosen?', answer: 'Campaigns describe a practical education need with a target, a deadline and updates. Administrators can draft, publish, pause, complete or archive them.' },
  { id: 'f5', topic: 'Payments', question: 'Which payment methods will be available?', answer: 'The donation screen is ready for a payment provider. Methods such as mobile money and card payments can be connected later without changing the donor flow.' },
  { id: 'f6', topic: 'Receipts', question: 'Will I get a receipt?', answer: 'Successful gifts are listed in your donor dashboard with a receipt action. Receipt files will be generated when the payment provider is connected.' },
  { id: 'f7', topic: 'Recurring', question: 'Can I give monthly?', answer: 'Yes. The donation flow lets you choose a one-time gift or a monthly gift. Monthly collection starts when a payment provider is connected.' },
  { id: 'f8', topic: 'Privacy', question: 'How is learner privacy protected?', answer: 'Public profiles use a display name and a general location. Photos and stories are published only when an administrator marks them as public.' },
  { id: 'f9', topic: 'Volunteering', question: 'How do I volunteer?', answer: 'Use the volunteer form to share your skills, availability and area of interest. The team reviews applications and replies by email.' },
]
