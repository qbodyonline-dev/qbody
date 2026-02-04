'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, Save, Plus } from 'lucide-react'

export default function NewProgramPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/programs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('programs.modal.addTitle')}</h1>
          <p className="text-zinc-500 mt-1">{t('programs.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('settings.general.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label={`${t('programs.modal.name')} (EN)`} placeholder="e.g. 8 weeks: Lose Weight" />
          <Input label={`${t('programs.modal.name')} (RU)`} placeholder="напр. 8 недель: Похудей" />
          <div><label className="block text-sm font-medium text-zinc-700 mb-2">{t('programs.modal.description')} (EN)</label><textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 h-24" /></div>
          <div><label className="block text-sm font-medium text-zinc-700 mb-2">{t('programs.modal.description')} (RU)</label><textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 h-24" /></div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('programs.modal.duration')} type="number" defaultValue="8" />
            <Input label={t('settings.pricing.title')} type="number" defaultValue="49" />
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">{t('workouts.modal.difficulty')}</label>
              <select className="w-full h-12 px-4 rounded-xl border border-zinc-200">
                <option value="easy">{t('workouts.difficulty.easy')}</option>
                <option value="medium">{t('workouts.difficulty.medium')}</option>
                <option value="hard">{t('workouts.difficulty.hard')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('programs.modal.schedule')}</CardTitle>
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />{t('programs.modal.addWeek')}</Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500">{t('programs.modal.addWeek')}</div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/dashboard/programs"><Button variant="outline">{t('common.cancel')}</Button></Link>
        <Button variant="gradient"><Save className="w-4 h-4 mr-2" />{t('common.save')}</Button>
      </div>
    </div>
  )
}
