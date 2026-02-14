'use client'
import React from 'react'
import type { Block } from '@/components/ui/block-editor'

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-4">
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </div>
  )
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      if (!block.content) return null
      return (
        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {block.content}
        </div>
      )

    case 'heading': {
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4'
      const styles = {
        2: 'text-2xl font-bold text-zinc-900 dark:text-zinc-100',
        3: 'text-xl font-semibold text-zinc-900 dark:text-zinc-100',
        4: 'text-lg font-medium text-zinc-900 dark:text-zinc-100',
      }
      return <Tag className={styles[block.level]}>{block.content}</Tag>
    }

    case 'image':
      if (!block.url) return null
      return (
        <figure>
          <img src={block.url} alt={block.alt || ''} className="w-full rounded-xl shadow-sm" loading="lazy" />
          {block.caption && (
            <figcaption className="text-sm text-zinc-500 text-center mt-2">{block.caption}</figcaption>
          )}
        </figure>
      )

    case 'video': {
      if (!block.url) return null
      if (block.provider === 'youtube') {
        const match = block.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        if (match) {
          return (
            <div className="aspect-video rounded-xl overflow-hidden shadow-sm">
              <iframe src={`https://www.youtube.com/embed/${match[1]}`} className="w-full h-full" allowFullScreen frameBorder="0" />
            </div>
          )
        }
      }
      if (block.provider === 'vimeo') {
        const match = block.url.match(/vimeo\.com\/(\d+)/)
        if (match) {
          return (
            <div className="aspect-video rounded-xl overflow-hidden shadow-sm">
              <iframe src={`https://player.vimeo.com/video/${match[1]}`} className="w-full h-full" allowFullScreen frameBorder="0" />
            </div>
          )
        }
      }
      return (
        <video src={block.url} controls className="w-full rounded-xl shadow-sm" />
      )
    }

    case 'list':
      if (!block.items || block.items.length === 0) return null
      if (block.style === 'ordered') {
        return (
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 dark:text-zinc-300">
            {block.items.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        )
      }
      return (
        <ul className="list-disc list-inside space-y-1.5 text-zinc-700 dark:text-zinc-300">
          {block.items.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )

    case 'columns':
      return (
        <div className="grid md:grid-cols-2 gap-6">
          <div><BlockRenderer blocks={block.left} /></div>
          <div><BlockRenderer blocks={block.right} /></div>
        </div>
      )

    case 'quote':
      if (!block.content) return null
      return (
        <blockquote className="border-l-4 border-teal-500 pl-4 py-2 italic text-zinc-600 dark:text-zinc-400">
          <p>{block.content}</p>
          {block.author && <cite className="text-sm not-italic text-zinc-500 mt-1 block">— {block.author}</cite>}
        </blockquote>
      )

    case 'spacer':
      return <div className="h-6" />

    default:
      return null
  }
}
