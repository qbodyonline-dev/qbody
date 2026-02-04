'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const { locale } = useTranslation()

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: February 2024',
      sections: [
        {
          title: '1. Information We Collect',
          content: `We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This information may include:
          
• Name and email address
• Payment information
• Profile information
• Health and fitness data you choose to share
• Communications with us`
        },
        {
          title: '2. How We Use Your Information',
          content: `We use the information we collect to:
          
• Provide, maintain, and improve our services
• Process transactions and send related information
• Send you technical notices and support messages
• Respond to your comments and questions
• Personalize your experience`
        },
        {
          title: '3. Information Sharing',
          content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

• With your consent
• With service providers who assist in our operations
• To comply with legal obligations
• To protect our rights and safety`
        },
        {
          title: '4. Data Security',
          content: `We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`
        },
        {
          title: '5. Your Rights',
          content: `You have the right to:

• Access your personal data
• Correct inaccurate data
• Request deletion of your data
• Opt out of marketing communications
• Export your data`
        },
        {
          title: '6. Contact Us',
          content: `If you have questions about this Privacy Policy, please contact us at privacy@qbody.app`
        }
      ]
    },
    ru: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: Февраль 2024',
      sections: [
        {
          title: '1. Собираемая информация',
          content: `Мы собираем информацию, которую вы предоставляете нам напрямую, например, при создании аккаунта, совершении покупки или обращении в службу поддержки. Эта информация может включать:
          
• Имя и адрес электронной почты
• Платёжная информация
• Данные профиля
• Данные о здоровье и фитнесе, которыми вы решили поделиться
• Переписка с нами`
        },
        {
          title: '2. Использование информации',
          content: `Мы используем собранную информацию для:
          
• Предоставления, поддержки и улучшения наших услуг
• Обработки транзакций и отправки связанной информации
• Отправки технических уведомлений и сообщений поддержки
• Ответов на ваши комментарии и вопросы
• Персонализации вашего опыта`
        },
        {
          title: '3. Передача информации',
          content: `Мы не продаём, не обмениваем и не сдаём в аренду вашу личную информацию третьим лицам. Мы можем передавать вашу информацию только в следующих случаях:

• С вашего согласия
• Поставщикам услуг, которые помогают в наших операциях
• Для соблюдения юридических обязательств
• Для защиты наших прав и безопасности`
        },
        {
          title: '4. Безопасность данных',
          content: `Мы применяем соответствующие меры безопасности для защиты вашей личной информации. Однако ни один метод передачи через Интернет не является на 100% безопасным, и мы не можем гарантировать абсолютную безопасность.`
        },
        {
          title: '5. Ваши права',
          content: `Вы имеете право:

• Получить доступ к своим персональным данным
• Исправить неточные данные
• Запросить удаление ваших данных
• Отказаться от маркетинговых коммуникаций
• Экспортировать свои данные`
        },
        {
          title: '6. Свяжитесь с нами',
          content: `Если у вас есть вопросы об этой Политике конфиденциальности, пожалуйста, свяжитесь с нами по адресу privacy@qbody.app`
        }
      ]
    }
  }

  const pageContent = content[locale as keyof typeof content] || content.en

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      {/* Content */}
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8">
        <div className="container-custom text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Qbody by Khavanskaia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
