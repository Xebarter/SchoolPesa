import type { Beneficiary, Partner, User, Volunteer } from '@/lib/types'

const image = '/school-pesa-hero.png'

export const beneficiaries: Beneficiary[] = [
  {
    id: 'ben-1',
    displayName: 'Amina',
    level: 'Primary',
    school: 'Community primary school',
    location: 'Kampala',
    story: 'Amina loves reading aloud. Her family can cover food at home, but school fees and books still stand between her and the next term.',
    needs: 'School fees and books',
    target: 1_200_000,
    raised: 640_000,
    image,
    publicProfile: true,
    publicImage: true,
    storyVisible: true,
    status: 'active',
    updates: [{ title: 'Books received', body: 'Amina received a new reader and exercise books.', date: '2026-09-12' }],
  },
  {
    id: 'ben-2',
    displayName: 'Brian',
    level: 'Secondary',
    school: 'District secondary school',
    location: 'Central Uganda',
    story: 'Brian is in senior school and boards during term. Tuition and meals are the gap his family cannot close alone.',
    needs: 'Tuition and meals',
    target: 2_400_000,
    raised: 900_000,
    image,
    publicProfile: true,
    publicImage: true,
    storyVisible: true,
    status: 'active',
    updates: [{ title: 'Term started', body: 'Brian reported for the new term with part of his tuition covered.', date: '2026-08-30' }],
  },
  {
    id: 'ben-3',
    displayName: 'Grace',
    level: 'University',
    school: 'Public university',
    location: 'Eastern Uganda',
    story: 'Grace earned a university place. Tuition support is what keeps her enrolled this semester.',
    needs: 'Tuition support',
    target: 3_500_000,
    raised: 1_800_000,
    image,
    publicProfile: true,
    publicImage: true,
    storyVisible: true,
    status: 'active',
    updates: [{ title: 'Semester confirmed', body: 'Grace’s faculty confirmed she is registered for the semester.', date: '2026-09-05' }],
  },
]

export const partners: Partner[] = [
  { id: 'p1', name: 'Classroom Circle' },
  { id: 'p2', name: 'North Bridge Fund' },
  { id: 'p3', name: 'Lakeview Schools' },
  { id: 'p4', name: 'Open Desk' },
]

export const users: User[] = [
  { id: 'u1', name: 'Sarah Nakato', email: 'sarah@schoolpesa.example', role: 'Super Admin', phone: '+256 700 000 001' },
  { id: 'u2', name: 'John Okello', email: 'john@schoolpesa.example', role: 'Campaign Manager' },
  { id: 'u3', name: 'Achieng Finance', email: 'finance@schoolpesa.example', role: 'Finance Admin' },
  { id: 'u4', name: 'Rita Content', email: 'rita@schoolpesa.example', role: 'Content Manager' },
  { id: 'u5', name: 'Paul Auditor', email: 'paul@schoolpesa.example', role: 'Auditor' },
]

export const volunteers: Volunteer[] = [
  { id: 'v1', name: 'Daniel Kato', email: 'daniel@example.com', phone: '+256 700 111 222', skills: 'Teaching, mentoring', interest: 'Reading support', availability: 'Weekends', message: 'I can help with Saturday reading clubs.', status: 'reviewing' },
  { id: 'v2', name: 'Mary Adong', email: 'mary@example.com', phone: '+256 700 333 444', skills: 'Bookkeeping', interest: 'Finance support', availability: 'Evenings', message: 'Happy to help review expense records.', status: 'new' },
]

export const rolePermissions: Record<User['role'], string[]> = {
  'Super Admin': ['Manage organization', 'Manage users', 'Approve finance', 'Publish campaigns', 'View audit log'],
  'Finance Admin': ['Record expenses', 'Review donations', 'Export reports'],
  'Campaign Manager': ['Create campaigns', 'Update beneficiaries', 'Publish updates'],
  'Content Manager': ['Publish stories', 'Manage gallery', 'Edit news and FAQs'],
  Auditor: ['View donations', 'View expenses', 'View audit log'],
  Viewer: ['View dashboards'],
}
