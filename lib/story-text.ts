export type StoryInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'link'; text: string; href: string }

export type StoryBlock =
  | { type: 'paragraph' | 'heading' | 'quote'; inlines: StoryInline[] }
  | { type: 'list'; items: StoryInline[][] }

const inlinePattern = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g

function inlines(source: string): StoryInline[] {
  const parts: StoryInline[] = []
  inlinePattern.lastIndex = 0
  let last = 0
  let match: RegExpExecArray | null
  while ((match = inlinePattern.exec(source))) {
    if (match.index > last) parts.push({ type: 'text', text: source.slice(last, match.index) })
    if (match[1]) parts.push({ type: 'bold', text: match[1] })
    else if (match[2]) parts.push({ type: 'italic', text: match[2] })
    else if (match[3] && match[4]) parts.push({ type: 'link', text: match[3], href: match[4] })
    last = match.index + match[0].length
  }
  if (last < source.length) parts.push({ type: 'text', text: source.slice(last) })
  return parts.length ? parts : [{ type: 'text', text: source }]
}

export function parseStory(body: string): StoryBlock[] {
  const blocks: StoryBlock[] = []
  for (const chunk of body.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim().length > 0)
    if (!lines.length) continue
    if (lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'list', items: lines.map((line) => inlines(line.slice(2))) })
      continue
    }
    if (lines.length === 1 && lines[0].startsWith('## ')) {
      blocks.push({ type: 'heading', inlines: inlines(lines[0].slice(3)) })
      continue
    }
    if (lines.every((line) => line.startsWith('> '))) {
      blocks.push({ type: 'quote', inlines: inlines(lines.map((line) => line.slice(2)).join(' ')) })
      continue
    }
    blocks.push({ type: 'paragraph', inlines: inlines(lines.join(' ')) })
  }
  return blocks
}

export function plainStory(body: string) {
  return body
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, '$1')
    .replace(/^##\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^- /gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function wordCount(body: string) {
  const plain = plainStory(body)
  return plain ? plain.split(/\s+/).length : 0
}
