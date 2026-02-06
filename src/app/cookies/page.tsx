'use client'
import React from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ArrowLeft } from 'lucide-react'

export default function CookiePolicyPage() {
  const { locale } = useTranslation()

  const content = {
    en: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated: February 2025',
      sections: [
        {
          title: '1. What Are Cookies',
          content: `Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They help the website recognize your device and remember information about your visit, such as your preferences and settings.`
        },
        {
          title: '2. How We Use Cookies',
          content: `We use cookies to:

• Keep you signed in to your account
• Remember your language preferences
• Understand how you use our website to improve it
• Ensure the security of your account
• Process payments securely through our payment provider (Stripe)`
        },
        {
          title: '3. Types of Cookies We Use',
          content: `Essential Cookies: These cookies are necessary for the website to function properly. They enable core functionality such as authentication, security, and session management. You cannot opt out of these cookies.

Functional Cookies: These cookies remember your preferences (such as language) to provide a more personalized experience.

Analytics Cookies: These cookies help us understand how visitors interact with our website by collecting anonymous usage data.`
        },
        {
          title: '4. Third-Party Cookies',
          content: `Some cookies are placed by third-party services that appear on our pages:

• Supabase — authentication and session management
• Stripe — secure payment processing
• Vercel — website hosting and performance analytics`
        },
        {
          title: '5. Managing Cookies',
          content: `You can control and manage cookies in your browser settings. Most browsers allow you to:

• View what cookies are stored and delete them individually
• Block third-party cookies
• Block cookies from specific sites
• Block all cookies
• Delete all cookies when you close your browser

Please note that blocking essential cookies may affect the functionality of our website, and you may not be able to access certain features such as logging in or making purchases.`
        },
        {
          title: '6. Cookie Consent',
          content: `When you first visit our website, we will ask for your consent to use non-essential cookies. You can change your cookie preferences at any time by clearing your browser cookies and revisiting our site.`
        },
        {
          title: '7. Changes to This Policy',
          content: `We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. We encourage you to review this page periodically.`
        },
        {
          title: '8. Contact Us',
          content: `If you have any questions about our use of cookies, please contact us at info@qbodyfit.com.`
        },
      ],
    },
    ru: {
      title: 'Политика использования файлов Cookie',
      lastUpdated: 'Последнее обновление: февраль 2025',
      sections: [
        {
          title: '1. Что такое Cookie',
          content: `Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, планшете или мобильном телефоне) при посещении веб-сайта. Они помогают сайту распознавать ваше устройство и запоминать информацию о вашем посещении, например ваши настройки и предпочтения.`
        },
        {
          title: '2. Как мы используем Cookie',
          content: `Мы используем файлы cookie для:

• Сохранения вашей авторизации в аккаунте
• Запоминания языковых предпочтений
• Понимания того, как вы используете наш сайт, для его улучшения
• Обеспечения безопасности вашего аккаунта
• Безопасной обработки платежей через нашего платёжного провайдера (Stripe)`
        },
        {
          title: '3. Типы используемых Cookie',
          content: `Необходимые Cookie: Эти файлы cookie необходимы для правильной работы сайта. Они обеспечивают базовые функции, такие как аутентификация, безопасность и управление сеансами. Вы не можете отказаться от этих файлов cookie.

Функциональные Cookie: Эти файлы cookie запоминают ваши предпочтения (например, язык) для более персонализированного опыта.

Аналитические Cookie: Эти файлы cookie помогают нам понять, как посетители взаимодействуют с сайтом, собирая анонимные данные об использовании.`
        },
        {
          title: '4. Cookie третьих сторон',
          content: `Некоторые файлы cookie размещаются сторонними сервисами:

• Supabase — аутентификация и управление сеансами
• Stripe — безопасная обработка платежей
• Vercel — хостинг и аналитика производительности`
        },
        {
          title: '5. Управление Cookie',
          content: `Вы можете управлять файлами cookie в настройках вашего браузера. Большинство браузеров позволяют:

• Просматривать сохранённые файлы cookie и удалять их по отдельности
• Блокировать cookie третьих сторон
• Блокировать cookie с определённых сайтов
• Блокировать все cookie
• Удалять все cookie при закрытии браузера

Обратите внимание, что блокировка необходимых cookie может повлиять на функциональность сайта — вы не сможете использовать некоторые функции, такие как вход в аккаунт или совершение покупок.`
        },
        {
          title: '6. Согласие на использование Cookie',
          content: `При первом посещении нашего сайта мы запросим ваше согласие на использование необязательных файлов cookie. Вы можете изменить свои предпочтения в любое время, очистив cookie в браузере и повторно посетив наш сайт.`
        },
        {
          title: '7. Изменения в этой политике',
          content: `Мы можем время от времени обновлять эту Политику использования Cookie. Рекомендуем периодически просматривать эту страницу.`
        },
        {
          title: '8. Свяжитесь с нами',
          content: `Если у вас есть вопросы об использовании файлов cookie, свяжитесь с нами по адресу info@qbodyfit.com.`
        },
      ],
    },
  }

  const pageContent = locale === 'ru' ? content.ru : content.en

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-lg">Q</span></div>
            <span className="font-semibold text-zinc-900">Qbody</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container-custom py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          {locale === 'ru' ? 'На главную' : 'Back to home'}
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
