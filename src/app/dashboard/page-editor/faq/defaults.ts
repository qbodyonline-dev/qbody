import type { FaqSectionData, FaqItem } from './types'

export const defaultFaqItems: FaqItem[] = [
  { id: 'f1', question: 'How do I get started?', questionRu: 'Как начать?', answer: 'Register on our platform, choose your recovery program, and start training from day one. Each program includes detailed video instructions.', answerRu: 'Зарегистрируйтесь на платформе, выберите программу восстановления и начните тренировки с первого дня. Каждая программа включает подробные видео-инструкции.', icon: '🚀' },
  { id: 'f2', question: 'Do I need any equipment?', questionRu: 'Нужен ли инвентарь?', answer: 'Most of our recovery programs require no equipment at all. Some advanced exercises may use resistance bands or light dumbbells, but alternatives are always provided.', answerRu: 'Большинство программ восстановления не требуют оборудования. Некоторые упражнения могут использовать резинки или лёгкие гантели, но всегда есть альтернативы.', icon: '🏋️' },
  { id: 'f3', question: 'Is there a money-back guarantee?', questionRu: 'Есть ли гарантия возврата?', answer: 'Yes! We offer a 14-day money-back guarantee. If the program doesn\'t meet your expectations, contact us for a full refund.', answerRu: 'Да! Мы предлагаем 14-дневную гарантию возврата. Если программа не оправдала ожиданий, свяжитесь с нами для полного возврата.', icon: '💰' },
  { id: 'f4', question: 'How long are the programs?', questionRu: 'Какова длительность программ?', answer: 'Programs range from 6 to 12 weeks depending on the recovery type. You get lifetime access so you can repeat at your own pace.', answerRu: 'Программы длятся от 6 до 12 недель в зависимости от типа восстановления. Доступ бессрочный, можно повторять в своём темпе.', icon: '⏱️' },
  { id: 'f5', question: 'Can I contact the trainer directly?', questionRu: 'Могу ли я связаться с тренером?', answer: 'Absolutely! Premium plans include direct messaging with your trainer. All plans include community support and weekly Q&A sessions.', answerRu: 'Конечно! Премиум-планы включают прямую связь с тренером. Все планы включают поддержку сообщества и еженедельные Q&A.', icon: '💬' },
]

export const defaultFaqSectionData: FaqSectionData = {
  layout: 'accordion',
  animation: 'fade-up',
  titleVariant: 'badge',
  title: 'Frequently Asked Questions',
  titleRu: 'Часто задаваемые вопросы',
  subtitle: 'Everything you need to know about our programs',
  subtitleRu: 'Всё, что нужно знать о наших программах',
  badge: '❓ FAQ',
  badgeRu: '❓ Вопросы',
  bgType: 'solid',
  bgColor: '#0a0a0a',
  bgGradient: 'linear-gradient(135deg,#0a0a0a,#18181b)',
  textColor: '#fafafa',
  accentColor: '#2dd4bf',
  cardBg: '#171717',
  items: defaultFaqItems,
  showNumbers: true,
  showIcons: false,
  defaultOpen: 0,
  columns: 2,
  innerMaxWidth: 900,
}
