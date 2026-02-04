'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, Save, Upload, Plus } from 'lucide-react'

export default function NewCoursePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('settings.courses.addCourse')}</h1>
          <p className="text-zinc-500 mt-1">{t('settings.courses.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('settings.general.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label={`${t('common.name')} (EN)`} placeholder="e.g. Post-Surgery Recovery" />
          <Input label={`${t('common.name')} (RU)`} placeholder="напр. Восстановление после операции" />
          <div><label className="block text-sm font-medium text-zinc-700 mb-2">Description (EN)</label><textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 h-24" /></div>
          <div><label className="block text-sm font-medium text-zinc-700 mb-2">Description (RU)</label><textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 h-24" /></div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('settings.pricing.title')} type="number" defaultValue="99" />
            <Input label={t('programs.modal.duration')} type="number" defaultValue="8" />
          </div>
          <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 text-center">
            <p className="text-zinc-500 mb-3">{t('settings.branding.dragDrop')}</p>
            <Button variant="outline"><Upload className="w-4 h-4 mr-2" />{t('settings.branding.uploadImage')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/dashboard/courses"><Button variant="outline">{t('common.cancel')}</Button></Link>
        <Button variant="gradient"><Save className="w-4 h-4 mr-2" />{t('common.save')}</Button>
      </div>
    </div>
  )
}
