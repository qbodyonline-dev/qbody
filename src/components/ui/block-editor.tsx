'use client'
import React, { useState, useRef, useCallback } from 'react'
import {
  Type, Heading, Image as ImageIcon, Video, List, ListOrdered,
  Columns2, Quote, Minus, Plus, Trash2, GripVertical,
  ChevronUp, ChevronDown, Upload, Link, Bold, Italic, PanelLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
export type Block =
  | { type: 'text'; content: string }
  | { type: 'heading'; content: string; level: 2 | 3 | 4 }
  | { type: 'image'; url: string; alt: string; caption?: string }
  | { type: 'video'; url: string; provider: 'youtube' | 'vimeo' | 'upload' }
  | { type: 'list'; style: 'ordered' | 'unordered'; items: string[] }
  | { type: 'columns'; left: Block[]; right: Block[] }
  | { type: 'quote'; content: string; author?: string }
  | { type: 'image_text'; url: string; alt: string; content: string; layout: 'image-left' | 'image-right' }
  | { type: 'spacer' }

type BlockEditorProps = {
  value: Block[]
  onChange: (blocks: Block[]) => void
  locale?: string
  uploadImage?: (file: File) => Promise<string>
}

const BLOCK_TYPES = [
  { type: 'text', icon: Type, label: 'Текст', labelEn: 'Text' },
  { type: 'heading', icon: Heading, label: 'Заголовок', labelEn: 'Heading' },
  { type: 'image', icon: ImageIcon, label: 'Изображение', labelEn: 'Image' },
  { type: 'image_text', icon: PanelLeft, label: 'Фото + текст', labelEn: 'Image + Text' },
  { type: 'video', icon: Video, label: 'Видео', labelEn: 'Video' },
  { type: 'list', icon: List, label: 'Список', labelEn: 'List' },
  { type: 'columns', icon: Columns2, label: '2 колонки', labelEn: '2 Columns' },
  { type: 'quote', icon: Quote, label: 'Цитата', labelEn: 'Quote' },
  { type: 'spacer', icon: Minus, label: 'Разделитель', labelEn: 'Spacer' },
] as const

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function BlockEditor({ value, onChange, locale = 'ru', uploadImage }: BlockEditorProps) {
  const ru = locale === 'ru'
  const [showAdder, setShowAdder] = useState<number | null>(null)

  const addBlock = (type: string, index: number) => {
    let newBlock: Block
    switch (type) {
      case 'text': newBlock = { type: 'text', content: '' }; break
      case 'heading': newBlock = { type: 'heading', content: '', level: 2 }; break
      case 'image': newBlock = { type: 'image', url: '', alt: '' }; break
      case 'video': newBlock = { type: 'video', url: '', provider: 'youtube' }; break
      case 'list': newBlock = { type: 'list', style: 'unordered', items: [''] }; break
      case 'columns': newBlock = { type: 'columns', left: [{ type: 'text', content: '' }], right: [{ type: 'text', content: '' }] }; break
      case 'image_text': newBlock = { type: 'image_text', url: '', alt: '', content: '', layout: 'image-left' }; break
      case 'quote': newBlock = { type: 'quote', content: '' }; break
      case 'spacer': newBlock = { type: 'spacer' }; break
      default: return
    }
    const updated = [...value]
    updated.splice(index, 0, newBlock)
    onChange(updated)
    setShowAdder(null)
  }

  const updateBlock = (index: number, block: Block) => {
    const updated = [...value]
    updated[index] = block
    onChange(updated)
  }

  const removeBlock = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= value.length) return
    const updated = [...value]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    onChange(updated)
  }

  return (
    <div className="space-y-1">
      {/* Add block at top */}
      <AddBlockButton index={0} ru={ru} onAdd={addBlock} showAdder={showAdder} setShowAdder={setShowAdder} />

      {value.map((block, i) => (
        <React.Fragment key={i}>
          <div className="group relative border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 transition-all hover:border-zinc-300 dark:hover:border-zinc-600">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-500 uppercase">
                  {BLOCK_TYPES.find(b => b.type === block.type)?.[ru ? 'label' : 'labelEn'] || block.type}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === value.length - 1}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => removeBlock(i)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Block content */}
            <div className="p-3">
              <BlockContent block={block} onChange={b => updateBlock(i, b)} ru={ru} uploadImage={uploadImage} />
            </div>
          </div>

          {/* Add block after */}
          <AddBlockButton index={i + 1} ru={ru} onAdd={addBlock} showAdder={showAdder} setShowAdder={setShowAdder} />
        </React.Fragment>
      ))}

      {value.length === 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
          {ru ? 'Нажмите + чтобы добавить блок' : 'Click + to add a block'}
        </div>
      )}
    </div>
  )
}

/* ═══════════ ADD BLOCK BUTTON ═══════════ */
function AddBlockButton({ index, ru, onAdd, showAdder, setShowAdder }: {
  index: number; ru: boolean
  onAdd: (type: string, index: number) => void
  showAdder: number | null; setShowAdder: (v: number | null) => void
}) {
  const isOpen = showAdder === index

  return (
    <div className="relative flex items-center justify-center py-1">
      <button type="button" onClick={() => setShowAdder(isOpen ? null : index)}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isOpen ? 'border-teal-500 bg-teal-500 text-white rotate-45' : 'border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-teal-400 hover:text-teal-500'
        }`}>
        <Plus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-20 mt-1 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 grid grid-cols-3 gap-1 w-[260px]">
          {BLOCK_TYPES.map(bt => {
            const Icon = bt.icon
            return (
              <button key={bt.type} type="button" onClick={() => onAdd(bt.type, index)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                <span className="text-[10px] text-zinc-500">{ru ? bt.label : bt.labelEn}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════ BLOCK CONTENT ═══════════ */
function BlockContent({ block, onChange, ru, uploadImage }: {
  block: Block; onChange: (b: Block) => void; ru: boolean
  uploadImage?: (file: File) => Promise<string>
}) {
  switch (block.type) {
    case 'text':
      return (
        <textarea
          value={block.content}
          onChange={e => onChange({ ...block, content: e.target.value })}
          placeholder={ru ? 'Введите текст...' : 'Enter text...'}
          className="w-full min-h-[60px] text-sm resize-y bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          rows={3}
        />
      )

    case 'heading':
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {([2, 3, 4] as const).map(level => (
              <button key={level} type="button"
                onClick={() => onChange({ ...block, level })}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  block.level === level ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}>
                H{level}
              </button>
            ))}
          </div>
          <input
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            placeholder={ru ? 'Заголовок...' : 'Heading...'}
            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 ${
              block.level === 2 ? 'text-2xl font-bold' : block.level === 3 ? 'text-xl font-semibold' : 'text-lg font-medium'
            }`}
          />
        </div>
      )

    case 'image':
      return <ImageBlock block={block} onChange={onChange} ru={ru} uploadImage={uploadImage} />

    case 'video':
      return <VideoBlock block={block} onChange={onChange} ru={ru} />

    case 'list':
      return <ListBlock block={block} onChange={onChange} ru={ru} />

    case 'columns':
      return <ColumnsBlock block={block} onChange={onChange} ru={ru} uploadImage={uploadImage} />

    case 'image_text':
      return <ImageTextBlock block={block} onChange={onChange} ru={ru} uploadImage={uploadImage} />

    case 'quote':
      return (
        <div className="border-l-4 border-teal-500 pl-4 space-y-2">
          <textarea
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            placeholder={ru ? 'Цитата...' : 'Quote...'}
            className="w-full min-h-[40px] text-sm italic resize-y bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
            rows={2}
          />
          <input
            value={block.author || ''}
            onChange={e => onChange({ ...block, author: e.target.value })}
            placeholder={ru ? 'Автор (необязательно)' : 'Author (optional)'}
            className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-500 placeholder-zinc-400"
          />
        </div>
      )

    case 'spacer':
      return <div className="h-4 border-b border-dashed border-zinc-200 dark:border-zinc-700" />

    default:
      return <div className="text-zinc-400 text-sm">Unknown block</div>
  }
}

/* ═══════════ IMAGE BLOCK ═══════════ */
function ImageBlock({ block, onChange, ru, uploadImage }: {
  block: Extract<Block, { type: 'image' }>; onChange: (b: Block) => void; ru: boolean
  uploadImage?: (file: File) => Promise<string>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadImage) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange({ ...block, url })
      toast.success(ru ? 'Изображение загружено' : 'Image uploaded')
    } catch (e: any) { toast.error(e?.message || (ru ? 'Ошибка загрузки' : 'Upload failed')) }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-2">
      {block.url ? (
        <div className="relative">
          <img src={block.url} alt={block.alt} className="w-full max-h-64 object-cover rounded-lg" />
          <button type="button" onClick={() => onChange({ ...block, url: '' })}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-6 text-center">
          <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <div className="flex gap-2 justify-center">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-sm text-teal-500 hover:text-teal-600 font-medium">
              {uploading ? '...' : (ru ? 'Загрузить' : 'Upload')}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      )}
      <input value={block.alt} onChange={e => onChange({ ...block, alt: e.target.value })}
        placeholder={ru ? 'Описание изображения...' : 'Alt text...'}
        className="w-full text-xs bg-transparent border-0 focus:outline-none text-zinc-500 placeholder-zinc-400" />
      <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder={ru ? 'Подпись (необязательно)' : 'Caption (optional)'}
        className="w-full text-xs bg-transparent border-0 focus:outline-none text-zinc-500 placeholder-zinc-400" />
    </div>
  )
}

/* ═══════════ VIDEO BLOCK ═══════════ */
function VideoBlock({ block, onChange, ru }: {
  block: Extract<Block, { type: 'video' }>; onChange: (b: Block) => void; ru: boolean
}) {
  const detectProvider = (url: string): 'youtube' | 'vimeo' | 'upload' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    return 'upload'
  }

  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      return match ? `https://www.youtube.com/embed/${match[1]}` : url
    }
    if (provider === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/)
      return match ? `https://player.vimeo.com/video/${match[1]}` : url
    }
    return url
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 mb-2">
        {(['youtube', 'vimeo', 'upload'] as const).map(p => (
          <button key={p} type="button"
            onClick={() => onChange({ ...block, provider: p })}
            className={`px-2 py-0.5 text-xs rounded font-medium capitalize transition-colors ${
              block.provider === p ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100'
            }`}>{p}</button>
        ))}
      </div>
      <input value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value, provider: detectProvider(e.target.value) })}
        placeholder={ru ? 'Вставьте ссылку на видео...' : 'Paste video URL...'}
        className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-teal-500" />
      {block.url && (block.provider === 'youtube' || block.provider === 'vimeo') && (
        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100">
          <iframe src={getEmbedUrl(block.url, block.provider)} className="w-full h-full" allowFullScreen frameBorder="0" />
        </div>
      )}
    </div>
  )
}

/* ═══════════ LIST BLOCK ═══════════ */
function ListBlock({ block, onChange, ru }: {
  block: Extract<Block, { type: 'list' }>; onChange: (b: Block) => void; ru: boolean
}) {
  const updateItem = (i: number, value: string) => {
    const items = [...block.items]
    items[i] = value
    onChange({ ...block, items })
  }
  const addItem = () => onChange({ ...block, items: [...block.items, ''] })
  const removeItem = (i: number) => {
    if (block.items.length <= 1) return
    onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange({ ...block, style: 'unordered' })}
          className={`p-1.5 rounded transition-colors ${block.style === 'unordered' ? 'bg-teal-100 text-teal-700' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => onChange({ ...block, style: 'ordered' })}
          className={`p-1.5 rounded transition-colors ${block.style === 'ordered' ? 'bg-teal-100 text-teal-700' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 w-5 text-right">
            {block.style === 'ordered' ? `${i + 1}.` : '•'}
          </span>
          <input value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={ru ? 'Пункт списка...' : 'List item...'}
            className="flex-1 text-sm bg-transparent border-0 border-b border-zinc-100 dark:border-zinc-800 focus:outline-none focus:border-teal-400 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 py-1"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
          />
          <button type="button" onClick={() => removeItem(i)}
            className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem}
        className="text-xs text-teal-500 hover:text-teal-600 flex items-center gap-1">
        <Plus className="w-3 h-3" />{ru ? 'Добавить пункт' : 'Add item'}
      </button>
    </div>
  )
}

/* ═══════════ IMAGE + TEXT BLOCK ═══════════ */
function ImageTextBlock({ block, onChange, ru, uploadImage }: {
  block: Extract<Block, { type: 'image_text' }>; onChange: (b: Block) => void; ru: boolean
  uploadImage?: (file: File) => Promise<string>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadImage) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange({ ...block, url })
      toast.success(ru ? 'Изображение загружено' : 'Image uploaded')
    } catch (e: any) { toast.error(e?.message || (ru ? 'Ошибка загрузки' : 'Upload failed')) }
    finally { setUploading(false) }
  }

  const imageSection = (
    <div className="flex-1 min-w-0">
      {block.url ? (
        <div className="relative">
          <img src={block.url} alt={block.alt} className="w-full h-40 object-cover rounded-lg" />
          <button type="button" onClick={() => onChange({ ...block, url: '' })}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors"
          onClick={() => fileRef.current?.click()}>
          <ImageIcon className="w-6 h-6 text-zinc-400 mb-1" />
          <span className="text-xs text-zinc-500">{uploading ? '...' : (ru ? 'Загрузить' : 'Upload')}</span>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input value={block.alt} onChange={e => onChange({ ...block, alt: e.target.value })}
        placeholder={ru ? 'Alt текст...' : 'Alt text...'}
        className="w-full text-xs bg-transparent border-0 focus:outline-none text-zinc-500 placeholder-zinc-400 mt-1" />
    </div>
  )

  const textSection = (
    <div className="flex-1 min-w-0">
      <textarea value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder={ru ? 'Введите текст...' : 'Enter text...'}
        className="w-full h-40 text-sm resize-none bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => onChange({ ...block, layout: 'image-left' })}
          className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${block.layout === 'image-left' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          {ru ? 'Фото слева' : 'Image left'}
        </button>
        <button type="button" onClick={() => onChange({ ...block, layout: 'image-right' })}
          className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${block.layout === 'image-right' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          {ru ? 'Фото справа' : 'Image right'}
        </button>
      </div>
      <div className="flex gap-3">
        {block.layout === 'image-left' ? <>{imageSection}{textSection}</> : <>{textSection}{imageSection}</>}
      </div>
    </div>
  )
}

/* ═══════════ COLUMNS BLOCK ═══════════ */
function ColumnsBlock({ block, onChange, ru, uploadImage }: {
  block: Extract<Block, { type: 'columns' }>; onChange: (b: Block) => void; ru: boolean
  uploadImage?: (file: File) => Promise<string>
}) {
  const updateColumn = (side: 'left' | 'right', blocks: Block[]) => {
    onChange({ ...block, [side]: blocks })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-800/30">
        <p className="text-[10px] uppercase text-zinc-400 mb-1">{ru ? 'Левая' : 'Left'}</p>
        <BlockEditor value={block.left} onChange={b => updateColumn('left', b)} locale={ru ? 'ru' : 'en'} uploadImage={uploadImage} />
      </div>
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-800/30">
        <p className="text-[10px] uppercase text-zinc-400 mb-1">{ru ? 'Правая' : 'Right'}</p>
        <BlockEditor value={block.right} onChange={b => updateColumn('right', b)} locale={ru ? 'ru' : 'en'} uploadImage={uploadImage} />
      </div>
    </div>
  )
}
