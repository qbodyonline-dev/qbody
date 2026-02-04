'use client'
import React from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  const { locale } = useTranslation()

  const content = {
    en: {
      title: 'Terms of Use',
      lastUpdated: 'Last updated: February 2024',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: `By accessing and using QBody services, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.`
        },
        {
          title: '2. Description of Services',
          content: `QBody provides:
          
• Online fitness training programs
• Video courses for recovery and fitness
• Personal coaching services
• Mobile applications for workout tracking

Our services are intended for informational and educational purposes only.`
        },
        {
          title: '3. User Accounts',
          content: `To access certain features, you must create an account. You are responsible for:

• Maintaining the confidentiality of your account
• All activities that occur under your account
• Providing accurate and current information
• Notifying us of any unauthorized use`
        },
        {
          title: '4. Payments and Refunds',
          content: `• All purchases are final unless otherwise stated
• Subscriptions auto-renew unless cancelled
• You may cancel your subscription at any time
• Refunds may be available within 30 days of purchase for courses
• Contact support for refund requests`
        },
        {
          title: '5. Content and Intellectual Property',
          content: `All content provided through our services, including videos, text, graphics, and software, is owned by QBody or its licensors and is protected by copyright laws.

You may not:
• Copy, modify, or distribute our content
• Use our content for commercial purposes
• Remove any copyright notices`
        },
        {
          title: '6. Health Disclaimer',
          content: `Our fitness programs and advice are for general informational purposes only. Before starting any fitness program:

• Consult with a healthcare professional
• Stop exercising if you feel pain or discomfort
• Follow all safety instructions provided

We are not responsible for any injuries or health issues that may result from using our services.`
        },
        {
          title: '7. Limitation of Liability',
          content: `QBody shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.`
        },
        {
          title: '8. Changes to Terms',
          content: `We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.`
        },
        {
          title: '9. Contact',
          content: `For questions about these Terms, please contact us at legal@qbody.app`
        }
      ]
    },
    ru: {
      title: 'Условия использования',
      lastUpdated: 'Последнее обновление: Февраль 2024',
      sections: [
        {
          title: '1. Принятие условий',
          content: `Используя сервисы QBody, вы соглашаетесь с настоящими Условиями использования. Если вы не согласны с этими условиями, пожалуйста, не используйте наши сервисы.`
        },
        {
          title: '2. Описание услуг',
          content: `QBody предоставляет:
          
• Онлайн программы фитнес-тренировок
• Видеокурсы для восстановления и фитнеса
• Услуги персонального тренера
• Мобильные приложения для отслеживания тренировок

Наши услуги предназначены только для информационных и образовательных целей.`
        },
        {
          title: '3. Учётные записи пользователей',
          content: `Для доступа к некоторым функциям необходимо создать учётную запись. Вы несёте ответственность за:

• Сохранение конфиденциальности вашей учётной записи
• Все действия, совершённые под вашей учётной записью
• Предоставление точной и актуальной информации
• Уведомление нас о любом несанкционированном использовании`
        },
        {
          title: '4. Платежи и возвраты',
          content: `• Все покупки являются окончательными, если не указано иное
• Подписки автоматически продлеваются, если не отменены
• Вы можете отменить подписку в любое время
• Возврат средств возможен в течение 30 дней после покупки курсов
• Для запроса возврата обратитесь в службу поддержки`
        },
        {
          title: '5. Контент и интеллектуальная собственность',
          content: `Весь контент, предоставляемый через наши сервисы, включая видео, тексты, графику и программное обеспечение, принадлежит QBody или его лицензиарам и защищён законами об авторском праве.

Вы не имеете права:
• Копировать, изменять или распространять наш контент
• Использовать наш контент в коммерческих целях
• Удалять уведомления об авторских правах`
        },
        {
          title: '6. Отказ от ответственности в отношении здоровья',
          content: `Наши фитнес-программы и рекомендации предназначены только для общих информационных целей. Перед началом любой фитнес-программы:

• Проконсультируйтесь с врачом
• Прекратите упражнения при появлении боли или дискомфорта
• Следуйте всем предоставленным инструкциям по безопасности

Мы не несём ответственности за травмы или проблемы со здоровьем, которые могут возникнуть в результате использования наших услуг.`
        },
        {
          title: '7. Ограничение ответственности',
          content: `QBody не несёт ответственности за любые косвенные, случайные, особые или последующие убытки, возникшие в результате использования наших услуг.`
        },
        {
          title: '8. Изменения условий',
          content: `Мы оставляем за собой право изменять эти условия в любое время. Продолжение использования наших услуг после внесения изменений означает принятие новых условий.`
        },
        {
          title: '9. Контакты',
          content: `По вопросам, связанным с этими Условиями, обращайтесь к нам по адресу legal@qbody.app`
        }
      ]
    }
  }

  const pageContent = content[locale as keyof typeof content] || content.en

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <span className="font-semibold text-zinc-900">Qbody</span>
          </Link>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </header>

      <main className="container-custom py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-zinc-900 mb-2">{pageContent.title}</h1>
        <p className="text-zinc-500 mb-8">{pageContent.lastUpdated}</p>

        <div className="prose prose-zinc max-w-none">
          {pageContent.sections.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">{section.title}</h2>
              <div className="text-zinc-600 whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-8">
        <div className="container-custom text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Qbody by Khavanskaia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
