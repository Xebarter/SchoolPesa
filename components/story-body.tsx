import { parseStory, type StoryInline } from '@/lib/story-text'

function Inline({ parts }: { parts: StoryInline[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'bold') return <strong key={index} className="font-semibold text-ink">{part.text}</strong>
        if (part.type === 'italic') return <em key={index}>{part.text}</em>
        if (part.type === 'link') return <a key={index} href={part.href} className="font-semibold text-forest underline decoration-line underline-offset-4">{part.text}</a>
        return <span key={index}>{part.text}</span>
      })}
    </>
  )
}

export function StoryBody({ body, className }: { body: string; className?: string }) {
  const blocks = parseStory(body)
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') return <h2 key={index} className="mt-8 text-2xl font-semibold tracking-[-.03em] text-ink"><Inline parts={block.inlines} /></h2>
        if (block.type === 'quote') return <blockquote key={index} className="mt-6 border-l-2 border-brand pl-4 text-lg leading-8 text-ink"><Inline parts={block.inlines} /></blockquote>
        if (block.type === 'list') {
          return (
            <ul key={index} className="mt-6 list-disc space-y-2 pl-5 text-lg leading-8 text-sage">
              {block.items.map((item, itemIndex) => <li key={itemIndex}><Inline parts={item} /></li>)}
            </ul>
          )
        }
        return <p key={index} className="mt-6 text-lg leading-8 text-sage"><Inline parts={block.inlines} /></p>
      })}
    </div>
  )
}
