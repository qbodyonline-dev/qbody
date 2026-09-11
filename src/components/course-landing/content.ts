/* ═══════════ COURSE LANDING — CONTENT MODEL ═══════════ */
/* The landing template is rendered 1:1 from the client's Figma mockup.
   Every text and photo lives in this structure so it can be edited later
   without touching the layout. Defaults: RU texts from the mockup + EN
   translations; the client can refine both in the dashboard editor. */

export type L = { en: string; ru: string }

const l = (ru: string, en = ''): L => ({ en, ru })

export interface LandingForWhoCard {
  num: string
  title: L
  nowText: L
  afterText: L
  photo?: string
  dark: boolean
}

export interface LandingCase {
  name: L
  before: L
  after: L
  media?: string
}

export interface LandingResultCell {
  kind: 'photo' | 'mint' | 'dark'
  title: L
  text: L
  photo?: string
}

export interface LandingFact { title: L; sub: L }
export interface LandingBonusCard { title: L; text: L; photo?: string }
export interface LandingFaqItem { q: L; a: L }
export interface LandingStat { value: string; label: L; sub: L }

export interface LandingContent {
  hero: {
    titleTop: L
    accent: L
    titleRest: L
    subtitle: L
    cta: L
    caption: L
    /** Client's photo will replace the decorative circles later */
    bgImage?: string
  }
  video: { heading: L; url?: string }
  forWho: { heading: L; cards: LandingForWhoCard[] }
  cases: { heading: L; items: LandingCase[] }
  results: { heading: L; cells: LandingResultCell[] }
  inside: {
    heading: L
    platformTitle: L
    platformText: L
    checklistsTitle: L
    practiceTitle: L
    practiceText: L
    practicePhoto?: string
    plansTitle: L
    plansItems: L[]
    plansPhoto?: string
  }
  stats: LandingStat[]
  program: {
    heading: L
    resultLabel: L
    /** How many of the course's modules to show (service modules stay out) */
    maxModules: number
    /** «Результат» bullets per module, by module order (fallback when no id match) */
    results: L[][]
    /** «Результат» bullets keyed by course_modules.id — survives reordering.
     *  The stage-2 editor writes this; the positional array stays as fallback. */
    resultsByModule?: Record<string, L[]>
  }
  expert: {
    kicker: L
    title: L
    text: L
    facts: LandingFact[]
    badge: L
    photo?: string
  }
  bonus: { label: L; heading: L; text: L; cards: LandingBonusCard[] }
  pricing: {
    heading: L
    bullets: L[]
    planLabel: L
    note: L
    cta: L
    secure: L
  }
  faq: { heading: L; items: LandingFaqItem[] }
}

/* ═══════════ DEFAULTS — texts from the Figma mockup (RU) + EN ═══════════ */

export function defaultLandingContent(): LandingContent {
  return {
    hero: {
      titleTop: l('ВОССТАНОВЛЕНИЕ', 'RECOVERY'),
      accent: l('ПОСЛЕ', 'AFTER'),
      titleRest: l('МАММОПЛАСТИКИ', 'BREAST AUGMENTATION'),
      subtitle: l(
        'Пошаговая система от подготовки к операции до возвращения к тренировкам',
        'A step-by-step system from pre-surgery preparation to your return to training'
      ),
      cta: l('НАЧАТЬ ВОССТАНОВЛЕНИЕ', 'START RECOVERY'),
      caption: l('5 модулей • 35+ уроков • обратная связь от Саши', '5 modules • 35+ lessons • feedback from Sasha'),
    },
    video: { heading: l('ГЛАВНОЕ О КУРСЕ', 'ABOUT THE COURSE') },
    forWho: {
      heading: l('ЭТО ДЛЯ ТЕБЯ, ЕСЛИ ТЫ...', 'THIS IS FOR YOU IF YOU...'),
      cards: [
        {
          num: '01',
          dark: true,
          title: l('ТОЛЬКО ГОТОВИШЬСЯ К МАММОПЛАСТИКЕ', 'ARE PREPARING FOR BREAST AUGMENTATION'),
          nowText: l(
            'Боишься операции, не понимаешь, что ждёт после, как подготовить дом и тело',
            'You are afraid of the surgery, unsure what comes after and how to prepare your home and body'
          ),
          afterText: l(
            'Станешь полностью готовой к операции и поймёшь, что делать на каждом этапе',
            'You will be fully prepared for the surgery and know exactly what to do at every stage'
          ),
        },
        {
          num: '02',
          dark: false,
          title: l('УЖЕ СДЕЛАЛА МАММОПЛАСТИКУ', 'HAVE ALREADY HAD BREAST AUGMENTATION'),
          nowText: l(
            'Боишься лишних движений, не понимаешь, как жить с ограничениями, и не знаешь, когда возвращаться к активности',
            'You are afraid of wrong movements, struggling with the restrictions and unsure when to return to activity'
          ),
          afterText: l(
            'Поймёшь этапы восстановления и быстро вернёшься к обычной жизни',
            'You will understand every stage of recovery and get back to normal life quickly'
          ),
        },
      ],
    },
    cases: {
      heading: l('ОНИ УЖЕ ПРОШЛИ ЭТОТ ПУТЬ', 'THEY HAVE ALREADY WALKED THIS PATH'),
      items: [
        {
          name: l('Анна, 31 год', 'Anna, 31'),
          before: l(
            'Боялась поднимать руки выше плеч. Думала, что любое неловкое движение может сдвинуть имплант',
            'Was afraid to raise her arms above shoulder level, thinking any careless move could shift the implant'
          ),
          after: l(
            'Получила пак безопасных движений, с помощью которых быстро вернулась в обычный ритм жизни',
            'Got a set of safe movements that brought her back to her normal rhythm fast'
          ),
        },
        {
          name: l('Мария, 25 лет', 'Maria, 25'),
          before: l(
            'Была в полном неведении о пост-операционном восстановлении',
            'Knew nothing about post-surgery recovery'
          ),
          after: l(
            'Получила пошаговый план действий, с помощью которого перестала бояться сделать лишние действия',
            'Got a step-by-step plan and stopped being afraid of doing something wrong'
          ),
        },
        {
          name: l('Кристина, 37 лет', 'Kristina, 37'),
          before: l(
            'Не понимала, как вернуться в зал после операции, не навредив себе',
            'Did not know how to return to the gym after surgery without hurting herself'
          ),
          after: l(
            'Вернулась к тренировкам через безопасную программу для своего тела',
            'Came back to training through a program safe for her body'
          ),
        },
      ],
    },
    results: {
      heading: l('ПО ИТОГУ КУРСА ТЫ СМОЖЕШЬ:', 'BY THE END OF THE COURSE YOU WILL:'),
      cells: [
        {
          kind: 'photo',
          title: l('СПОКОЙНО СПАТЬ', 'SLEEP PEACEFULLY'),
          text: l('Сможешь высыпаться в удобном для тебя положении', 'Get a full night’s sleep in a position that works for you'),
        },
        {
          kind: 'mint',
          title: l('САМОСТОЯТЕЛЬНО ВСТАВАТЬ', 'GET UP ON YOUR OWN'),
          text: l('Без резких и опасных движений для своего тела', 'Without sharp or risky movements for your body'),
        },
        {
          kind: 'photo',
          title: l('ВЕРНУТЬСЯ К РАБОТЕ', 'RETURN TO WORK'),
          text: l('Поймёшь, как без рисков вернуться к обычному ритму', 'Learn how to get back to your routine without risks'),
        },
        {
          kind: 'dark',
          title: l('ВЕРНУТЬСЯ ЗА РУЛЬ', 'GET BACK BEHIND THE WHEEL'),
          text: l('Когда это действительно безопасно для тебя', 'When it is truly safe for you'),
        },
        {
          kind: 'photo',
          title: l('ВЕРНУТЬ ПОДВИЖНОСТЬ', 'REGAIN MOBILITY'),
          text: l('Пошагово вернёшь движение плеч и рук', 'Step by step, restore shoulder and arm movement'),
        },
        {
          kind: 'photo',
          title: l('ВЕРНУТЬСЯ К ТРЕНИРОВКАМ', 'RETURN TO TRAINING'),
          text: l('Получишь максимально простую систему прогрессии для дома и зала', 'Get a simple progression system for home and gym'),
        },
      ],
    },
    inside: {
      heading: l('QBODY МАММОПЛАСТИКА — ЭТО:', 'QBODY BREAST AUGMENTATION IS:'),
      platformTitle: l('СТИЛЬНАЯ ОНЛАЙН-ПЛАТФОРМА', 'A SLEEK ONLINE PLATFORM'),
      platformText: l(
        'Обучение проходит на стильной онлайн-платформе. Уроки — доступные видео: с хорошей картинкой и звуком, в качественном монтаже. К урокам идут полезные материалы и ссылки',
        'Learning happens on a sleek online platform. Lessons are clear videos with great picture, sound and editing, plus useful materials and links'
      ),
      checklistsTitle: l('МНОЖЕСТВО ЧЕК-ЛИСТОВ И ПАМЯТОК', 'PLENTY OF CHECKLISTS AND GUIDES'),
      practiceTitle: l('ТРЕНИРОВКИ В ВИДЕ ВИДЕО-УПРАЖНЕНИЙ', 'WORKOUTS AS VIDEO EXERCISES'),
      practiceText: l(
        'Показываем технику и безопасную прогрессию движения в удобном для всех формате',
        'We show technique and safe movement progression in a format that works for everyone'
      ),
      plansTitle: l('4 ГОТОВЫЕ ПРОГРАММЫ ТРЕНИРОВОК', '4 READY-MADE TRAINING PROGRAMS'),
      plansItems: [
        l('Дом — новичок', 'Home — beginner'),
        l('Дом — продвинутый', 'Home — advanced'),
        l('Зал — новичок', 'Gym — beginner'),
        l('Зал — продвинутый', 'Gym — advanced'),
      ],
    },
    stats: [
      { value: '12', label: l('НЕДЕЛЬ', 'WEEKS'), sub: l('пошагового восстановления', 'of step-by-step recovery') },
      { value: '35+', label: l('УРОКОВ', 'LESSONS'), sub: l('для всех этапов', 'for every stage') },
      { value: '5', label: l('МОДУЛЕЙ', 'MODULES'), sub: l('со всеми этапами восстановления', 'covering every recovery stage') },
      { value: '4', label: l('ПРОГРАММЫ', 'PROGRAMS'), sub: l('для дома и зала', 'for home and gym') },
    ],
    program: {
      heading: l('ПРОГРАММА КУРСА', 'COURSE PROGRAM'),
      resultLabel: l('РЕЗУЛЬТАТ:', 'RESULT:'),
      maxModules: 5,
      results: [
        [
          l('Получишь полное понимание, чего ждать от операции', 'Get a full picture of what to expect from the surgery'),
          l('Уберёшь свои страхи, волнение, панику', 'Let go of fear, anxiety and panic'),
        ],
        [
          l(
            'Поймёшь, как двигаться, спать, вставать с постели и вести себя в первые дни',
            'Know how to move, sleep, get out of bed and act in the first days'
          ),
        ],
        [
          l(
            'Вернёшь уверенность в движениях и поймёшь, какие действия уже можно совершать',
            'Regain confidence in your movements and know what you can already do'
          ),
        ],
        [
          l(
            'Постепенно вернёшь бытовую активность, работу и привычный ритм без резких скачков нагрузок',
            'Gradually return to daily activity, work and your usual rhythm without sudden jumps in load'
          ),
        ],
        [
          l(
            'Получишь понятный план, вернёшься к тренировкам дома и в зале',
            'Get a clear plan and return to training at home and in the gym'
          ),
        ],
      ],
    },
    expert: {
      kicker: l('КТО БУДЕТ РЯДОМ С ТОБОЙ', 'WHO WILL BE BY YOUR SIDE'),
      title: l('СПИКЕР, КОТОРЫЙ САМ ПРОШЁЛ ЭТОТ ПУТЬ', 'AN EXPERT WHO HAS WALKED THIS PATH HERSELF'),
      text: l(
        'Я сама прошла через маммопластику и восстановление — поэтому знаю этот путь не только как тренер, но и как женщина, которая была на этом месте',
        'I went through breast augmentation and recovery myself — so I know this path not only as a trainer, but as a woman who has been exactly where you are'
      ),
      facts: [
        { title: l('18+ ЛЕТ ПРАКТИКИ', '18+ YEARS OF PRACTICE'), sub: l('в фитнесе и работе с телом', 'in fitness and bodywork') },
        {
          title: l('МАГИСТР В ОБЛАСТИ СПОРТА И ФИЗИЧЕСКОГО ВОСПИТАНИЯ', 'MASTER’S DEGREE IN SPORTS AND PHYSICAL EDUCATION'),
          sub: l(''),
        },
        { title: l('NASM CPT, CES, CSNC, PBC, CAPT', 'NASM CPT, CES, CSNC, PBC, CAPT'), sub: l('профессиональные сертификации', 'professional certifications') },
        { title: l('FEMALE TRAINER LEVEL I & II', 'FEMALE TRAINER LEVEL I & II'), sub: l('дополнительная квалификация', 'additional qualification') },
      ],
      badge: l('АВТОР ПРОГРАММЫ · САША', 'PROGRAM AUTHOR · SASHA'),
    },
    bonus: {
      label: l('БОНУС:', 'BONUS:'),
      heading: l('ВЕРНИСЬ К ТРЕНИРОВКАМ БЕЗ СТРАХА', 'RETURN TO TRAINING WITHOUT FEAR'),
      text: l(
        'После основного восстановления ты не останешься без плана действий. Внутри 4 готовых программы — для дома и зала',
        'After the main recovery you will not be left without a plan. Inside are 4 ready-made programs — for home and gym'
      ),
      cards: [
        { title: l('ДОМ / НОВИЧОК', 'HOME / BEGINNER'), text: l('Мягкий старт и контролируемая прогрессия', 'A gentle start with controlled progression') },
        { title: l('ДОМ / ПРОДВИНУТЫЙ', 'HOME / ADVANCED'), text: l('Больше объёма после возвращения', 'More volume once you are back') },
        { title: l('ЗАЛ / НОВИЧОК', 'GYM / BEGINNER'), text: l('Первый этап работы на тренажёрах', 'Your first stage of machine work') },
        { title: l('ЗАЛ / ПРОДВИНУТЫЙ', 'GYM / ADVANCED'), text: l('Полноценная прогрессия силовых нагрузок', 'Full progression of strength loads') },
      ],
    },
    pricing: {
      heading: l('ВСЁ ВОССТАНОВЛЕНИЕ В ОДНОМ МЕСТЕ', 'YOUR ENTIRE RECOVERY IN ONE PLACE'),
      bullets: [
        l('5 модулей и 35+ уроков', '5 modules and 35+ lessons'),
        l('Пошаговый план на 12 недель', 'A step-by-step 12-week plan'),
        l('Видео и практические рекомендации', 'Videos and practical guidance'),
        l('Чек-листы и памятки', 'Checklists and guides'),
        l('Упражнения по этапам', 'Stage-by-stage exercises'),
        l('4 программы тренировок', '4 training programs'),
        l('Обратная связь от тренера', 'Feedback from the trainer'),
        l('Доступ к материалам', 'Access to all materials'),
      ],
      planLabel: l('ПОЛНЫЙ ДОСТУП', 'FULL ACCESS'),
      note: l(
        '12 недель структуры, материалов и тренировочных протоколов',
        '12 weeks of structure, materials and training protocols'
      ),
      cta: l('ПОЛУЧИТЬ ДОСТУП', 'GET ACCESS'),
      secure: l('Безопасная онлайн-оплата', 'Secure online payment'),
    },
    faq: {
      heading: l('ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ', 'FREQUENTLY ASKED QUESTIONS'),
      items: [
        {
          q: l('Подойдёт ли курс, если операция ещё только планируется?', 'Will the course work for me if my surgery is still ahead?'),
          a: l(
            'Да. Первый модуль целиком посвящён подготовке: обследования, подготовка дома и тела, день операции.',
            'Yes. The first module is fully dedicated to preparation: check-ups, getting your home and body ready, and surgery day.'
          ),
        },
        {
          q: l('Когда начинается восстановление после операции?', 'When does recovery start after the surgery?'),
          a: l(
            'С первых дней. В курсе разобраны и первые дни, и недели 2–4, и постепенный выход на нагрузку до 12 недель.',
            'From the very first days. The course covers the first days, weeks 2–4, and a gradual build-up of load through week 12.'
          ),
        },
        {
          q: l('Что делать, если после операции уже прошло несколько недель?', 'What if several weeks have already passed since my surgery?'),
          a: l(
            'Начать с модуля своего этапа — программа разбита по неделям, и ты просто подключаешься на своём.',
            'Start with the module for your stage — the program is broken down by weeks, so you simply join at yours.'
          ),
        },
        {
          q: l('Что делать, если рекомендации хирурга отличаются от курса?', 'What if my surgeon’s recommendations differ from the course?'),
          a: l(
            'Приоритет всегда у твоего хирурга: курс дополняет его рекомендации, а не заменяет их.',
            'Your surgeon always comes first: the course complements their recommendations, never replaces them.'
          ),
        },
        {
          q: l('Нужен ли тренажёрный зал?', 'Do I need a gym?'),
          a: l(
            'Нет. Внутри программы и для дома, и для зала — выбираешь свой вариант.',
            'No. There are programs for both home and gym — you choose your option.'
          ),
        },
        {
          q: l('Сколько времени занимает прохождение курса?', 'How long does the course take?'),
          a: l(
            'Программа рассчитана на 12 недель, но проходить можно в своём темпе.',
            'The program is designed for 12 weeks, but you can go at your own pace.'
          ),
        },
        {
          q: l('Можно ли задавать тренеру вопросы?', 'Can I ask the trainer questions?'),
          a: l('Да, в курс входит обратная связь от тренера.', 'Yes, trainer feedback is included in the course.'),
        },
        {
          q: l('Как долго остаётся доступ?', 'How long do I keep access?'),
          a: l('Доступ к материалам остаётся пожизненно.', 'You keep lifetime access to the materials.'),
        },
        {
          q: l('Заменяет ли курс врача или хирурга?', 'Does the course replace my doctor or surgeon?'),
          a: l(
            'Нет. Курс — это поддержка и структура восстановления, все медицинские вопросы решает твой врач.',
            'No. The course provides support and structure for recovery; all medical decisions belong to your doctor.'
          ),
        },
      ],
    },
  }
}

/* ═══════════ MERGE ═══════════ */
/* Stored overrides are merged over the defaults so a field added later can
   never break an existing landing (same rule as the page-editor blocks). */

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function mergeLandingContent(defaults: any, override: any): any {
  if (override === undefined || override === null) return defaults
  if (Array.isArray(defaults)) {
    // Arrays replace wholesale — partial array patches are ambiguous.
    // A non-array override (a string, an object) is malformed data: keep defaults
    // rather than handing the renderer a shape it cannot walk. Null/hole elements
    // (sparse arrays JSON-serialize holes to null) would crash renderer predicates,
    // so they are dropped here — the single choke point both consumers pass through.
    return Array.isArray(override) ? override.filter((v: any) => v != null) : defaults
  }
  if (isPlainObject(defaults)) {
    if (!isPlainObject(override)) return defaults
    const out: Record<string, any> = { ...defaults }
    for (const key of Object.keys(override)) {
      out[key] = key in defaults ? mergeLandingContent(defaults[key], override[key]) : override[key]
    }
    return out
  }
  return override
}
