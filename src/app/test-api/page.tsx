'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Full page blocks with proper content
const fullBlocks = [
  {
    id: 'header',
    type: 'header',
    label: 'Header',
    labelRu: 'Шапка',
    visible: true,
    contentEn: '',
    contentRu: '',
    style: {}
  },
  {
    id: 'hero',
    type: 'hero',
    label: 'Hero Banner',
    labelRu: 'Главный баннер',
    visible: true,
    contentEn: `<h1 style="font-size:48px;font-weight:800;color:white;margin-bottom:8px;">Transform Your Body</h1><h2 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">Transform Your Life</h2><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin-bottom:32px;">17+ years of experience. 1000+ clients. Personalized programs and recovery courses for women of any fitness level.</p>`,
    contentRu: `<h1 style="font-size:48px;font-weight:800;color:white;margin-bottom:8px;">Преобрази своё тело</h1><h2 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">Преобрази свою жизнь</h2><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin-bottom:32px;">17+ лет опыта. 1000+ клиентов. Персональные программы и курсы восстановления для женщин любого уровня подготовки.</p>`,
    style: {}
  },
  {
    id: 'programs',
    type: 'programs',
    label: 'Training Programs',
    labelRu: 'Программы тренировок',
    visible: true,
    contentEn: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">📱 Available in QbodyFit app</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Training Programs</h2><p style="color:#52525b;font-size:16px;">Choose a program for your goal and start training today.</p>`,
    contentRu: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">📱 Доступно в приложении QbodyFit</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Программы тренировок</h2><p style="color:#52525b;font-size:16px;">Выберите программу под вашу цель и начните тренироваться сегодня.</p>`,
    style: {}
  },
  {
    id: 'courses',
    type: 'courses',
    label: 'Video Courses',
    labelRu: 'Видеокурсы',
    visible: true,
    contentEn: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">🎬 Video courses</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Specialized Recovery Courses</h2><p style="color:#52525b;font-size:16px;">Post-surgery recovery programs with medical approach.</p>`,
    contentRu: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">🎬 Видеокурсы</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Специализированные курсы восстановления</h2><p style="color:#52525b;font-size:16px;">Программы восстановления после операций с медицинским подходом.</p>`,
    style: {}
  },
  {
    id: 'about',
    type: 'about',
    label: 'About Trainer',
    labelRu: 'О тренере',
    visible: true,
    contentEn: `<h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:4px;">Aleksandra Khavanskaia</h2><p style="font-size:18px;color:#14b8a6;font-weight:500;margin-bottom:24px;">NASM Certified Personal Trainer • Coach • Athlete • Mom</p><p style="color:#52525b;margin-bottom:16px;">17+ years in fitness industry helping women achieve their body goals safely and effectively.</p>`,
    contentRu: `<h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:4px;">Александра Хаванская</h2><p style="font-size:18px;color:#14b8a6;font-weight:500;margin-bottom:24px;">NASM сертифицированный тренер • Тренер • Спортсменка • Мама</p><p style="color:#52525b;margin-bottom:16px;">17+ лет в фитнес-индустрии, помогаю женщинам достигать целей безопасно и эффективно.</p>`,
    style: {}
  },
  {
    id: 'results',
    type: 'results',
    label: 'Client Results',
    labelRu: 'Результаты клиентов',
    visible: true,
    contentEn: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">⭐ Real transformations</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Client Results</h2><p style="color:#52525b;font-size:16px;">Real stories from real women who transformed their bodies and lives.</p>`,
    contentRu: `<p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">⭐ Реальные трансформации</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Результаты клиентов</h2><p style="color:#52525b;font-size:16px;">Реальные истории реальных женщин, которые преобразили своё тело и жизнь.</p>`,
    style: {}
  },
  {
    id: 'footer',
    type: 'footer',
    label: 'Footer',
    labelRu: 'Подвал',
    visible: true,
    contentEn: `<h2 style="font-size:32px;font-weight:800;color:white;margin-bottom:8px;">Ready to Start Your Transformation?</h2><p style="color:#a1a1aa;font-size:16px;">Contact me today and let's begin your fitness journey together.</p>`,
    contentRu: `<h2 style="font-size:32px;font-weight:800;color:white;margin-bottom:8px;">Готовы начать трансформацию?</h2><p style="color:#a1a1aa;font-size:16px;">Свяжитесь со мной сегодня и начнём ваш фитнес-путь вместе.</p>`,
    style: {}
  }
]

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const restoreFullBlocks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/page-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSlug: 'home', blocks: fullBlocks })
      })
      
      const data = await res.json()
      setResult(`✅ Restored ${fullBlocks.length} blocks!\n\nStatus: ${res.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testLoad = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/page-blocks?page=home')
      const data = await res.json()
      setResult(`Status: ${res.status}\nBlocks count: ${data.blocks?.length || 0}\n\nBlocks:\n${data.blocks?.map((b: any) => `- ${b.id} (${b.type})`).join('\n')}\n\nFull response:\n${JSON.stringify(data, null, 2)}`)
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">API Test Page</h1>
      
      <div className="flex gap-4 flex-wrap">
        <Button onClick={testLoad} disabled={loading}>
          Test Load (GET)
        </Button>
        <Button onClick={restoreFullBlocks} disabled={loading} variant="gradient">
          🔄 Restore Full Blocks (7 sections)
        </Button>
      </div>
      
      <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-sm overflow-auto max-h-[500px] whitespace-pre-wrap">
        {result || 'Click a button to test API'}
      </pre>
    </div>
  )
}
