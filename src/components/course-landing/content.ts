/* ═══════════ COURSE LANDING — CONTENT MODEL ═══════════ */
/* The landing template is rendered 1:1 from the client's Figma mockup.
   Every text and photo lives in this structure so it can be edited later
   without touching the layout. Defaults below are the mockup texts (RU);
   empty EN falls back to RU until the client translates. */

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

/* ═══════════ DEFAULTS — texts from the Figma mockup ═══════════ */

export function defaultLandingContent(): LandingContent {
  return {
    hero: {
      titleTop: l('ВОССТАНОВЛЕНИЕ'),
      accent: l('ПОСЛЕ'),
      titleRest: l('МАММОПЛАСТИКИ'),
      subtitle: l('Пошаговая система от подготовки к операции до возвращения к тренировкам'),
      cta: l('НАЧАТЬ ВОССТАНОВЛЕНИЕ'),
      caption: l('5 модулей • 35+ уроков • обратная связь от Саши'),
    },
    video: { heading: l('ГЛАВНОЕ О КУРСЕ') },
    forWho: {
      heading: l('ЭТО ДЛЯ ТЕБЯ, ЕСЛИ ТЫ...'),
      cards: [
        {
          num: '01',
          dark: true,
          title: l('ТОЛЬКО ГОТОВИШЬСЯ К МАММОПЛАСТИКЕ'),
          nowText: l('Боишься операции, не понимаешь, что ждёт после, как подготовить дом и тело'),
          afterText: l('Станешь полностью готовой к операции и поймёшь, что делать на каждом этапе'),
        },
        {
          num: '02',
          dark: false,
          title: l('УЖЕ СДЕЛАЛА МАММОПЛАСТИКУ'),
          nowText: l('Боишься лишних движений, не понимаешь, как жить с ограничениями, и не знаешь, когда возвращаться к активности'),
          afterText: l('Поймёшь этапы восстановления и быстро вернёшься к обычной жизни'),
        },
      ],
    },
    cases: {
      heading: l('ОНИ УЖЕ ПРОШЛИ ЭТОТ ПУТЬ'),
      items: [
        {
          name: l('Анна, 31 год'),
          before: l('Боялась поднимать руки выше плеч. Думала, что любое неловкое движение может сдвинуть имплант'),
          after: l('Получила пак безопасных движений, с помощью которых быстро вернулась в обычный ритм жизни'),
        },
        {
          name: l('Мария, 25 лет'),
          before: l('Была в полном неведении о пост-операционном восстановлении'),
          after: l('Получила пошаговый план действий, с помощью которого перестала бояться сделать лишние действия'),
        },
        {
          name: l('Кристина, 37 лет'),
          before: l('Не понимала, как вернуться в зал после операции, не навредив себе'),
          after: l('Вернулась к тренировкам через безопасную программу для своего тела'),
        },
      ],
    },
    results: {
      heading: l('ПО ИТОГУ КУРСА ТЫ СМОЖЕШЬ:'),
      cells: [
        { kind: 'photo', title: l('СПОКОЙНО СПАТЬ'), text: l('Сможешь высыпаться в удобном для тебя положении') },
        { kind: 'mint', title: l('САМОСТОЯТЕЛЬНО ВСТАВАТЬ'), text: l('Без резких и опасных движений для своего тела') },
        { kind: 'photo', title: l('ВЕРНУТЬСЯ К РАБОТЕ'), text: l('Поймёшь, как без рисков вернуться к обычному ритму') },
        { kind: 'dark', title: l('ВЕРНУТЬСЯ ЗА РУЛЬ'), text: l('Когда это действительно безопасно для тебя') },
        { kind: 'photo', title: l('ВЕРНУТЬ ПОДВИЖНОСТЬ'), text: l('Пошагово вернёшь движение плеч и рук') },
        { kind: 'photo', title: l('ВЕРНУТЬСЯ К ТРЕНИРОВКАМ'), text: l('Получишь максимально простую систему прогрессии для дома и зала') },
      ],
    },
    inside: {
      heading: l('QBODY МАММОПЛАСТИКА — ЭТО:'),
      platformTitle: l('СТИЛЬНАЯ ОНЛАЙН-ПЛАТФОРМА'),
      platformText: l('Обучение проходит на стильной онлайн-платформе. Уроки — доступные видео: с хорошей картинкой и звуком, в качественном монтаже. К урокам идут полезные материалы и ссылки'),
      checklistsTitle: l('МНОЖЕСТВО ЧЕК-ЛИСТОВ И ПАМЯТОК'),
      practiceTitle: l('ТРЕНИРОВКИ В ВИДЕ ВИДЕО-УПРАЖНЕНИЙ'),
      practiceText: l('Показываем технику и безопасную прогрессию движения в удобном для всех формате'),
      plansTitle: l('4 ГОТОВЫЕ ПРОГРАММЫ ТРЕНИРОВОК'),
      plansItems: [l('Дом — новичок'), l('Дом — продвинутый'), l('Зал — новичок'), l('Зал — продвинутый')],
    },
    stats: [
      { value: '12', label: l('НЕДЕЛЬ'), sub: l('пошагового восстановления') },
      { value: '35+', label: l('УРОКОВ'), sub: l('для всех этапов') },
      { value: '5', label: l('МОДУЛЕЙ'), sub: l('со всеми этапами восстановления') },
      { value: '4', label: l('ПРОГРАММЫ'), sub: l('для дома и зала') },
    ],
    program: {
      heading: l('ПРОГРАММА КУРСА'),
      resultLabel: l('РЕЗУЛЬТАТ:'),
      maxModules: 5,
      results: [
        [l('Получишь полное понимание, чего ждать от операции'), l('Уберёшь свои страхи, волнение, панику')],
        [l('Поймёшь, как двигаться, спать, вставать с постели и вести себя в первые дни')],
        [l('Вернёшь уверенность в движениях и поймёшь, какие действия уже можно совершать')],
        [l('Постепенно вернёшь бытовую активность, работу и привычный ритм без резких скачков нагрузок')],
        [l('Получишь понятный план, вернёшься к тренировкам дома и в зале')],
      ],
    },
    expert: {
      kicker: l('КТО БУДЕТ РЯДОМ С ТОБОЙ'),
      title: l('СПИКЕР, КОТОРЫЙ САМ ПРОШЁЛ ЭТОТ ПУТЬ'),
      text: l('Я сама прошла через маммопластику и восстановление — поэтому знаю этот путь не только как тренер, но и как женщина, которая была на этом месте'),
      facts: [
        { title: l('18+ ЛЕТ ПРАКТИКИ'), sub: l('в фитнесе и работе с телом') },
        { title: l('МАГИСТР В ОБЛАСТИ СПОРТА И ФИЗИЧЕСКОГО ВОСПИТАНИЯ'), sub: l('') },
        { title: l('NASM CPT, CES, CSNC, PBC, CAPT'), sub: l('профессиональные сертификации') },
        { title: l('FEMALE TRAINER LEVEL I & II'), sub: l('дополнительная квалификация') },
      ],
      badge: l('АВТОР ПРОГРАММЫ · САША'),
    },
    bonus: {
      label: l('БОНУС:'),
      heading: l('ВЕРНИСЬ К ТРЕНИРОВКАМ БЕЗ СТРАХА'),
      text: l('После основного восстановления ты не останешься без плана действий. Внутри 4 готовых программы — для дома и зала'),
      cards: [
        { title: l('ДОМ / НОВИЧОК'), text: l('Мягкий старт и контролируемая прогрессия') },
        { title: l('ДОМ / ПРОДВИНУТЫЙ'), text: l('Больше объёма после возвращения') },
        { title: l('ЗАЛ / НОВИЧОК'), text: l('Первый этап работы на тренажёрах') },
        { title: l('ЗАЛ / ПРОДВИНУТЫЙ'), text: l('Полноценная прогрессия силовых нагрузок') },
      ],
    },
    pricing: {
      heading: l('ВСЁ ВОССТАНОВЛЕНИЕ В ОДНОМ МЕСТЕ'),
      bullets: [
        l('5 модулей и 35+ уроков'),
        l('Пошаговый план на 12 недель'),
        l('Видео и практические рекомендации'),
        l('Чек-листы и памятки'),
        l('Упражнения по этапам'),
        l('4 программы тренировок'),
        l('Обратная связь от тренера'),
        l('Доступ к материалам'),
      ],
      planLabel: l('ПОЛНЫЙ ДОСТУП', 'FULL ACCESS'),
      note: l('12 недель структуры, материалов и тренировочных протоколов'),
      cta: l('ПОЛУЧИТЬ ДОСТУП'),
      secure: l('Безопасная онлайн-оплата'),
    },
    faq: {
      heading: l('ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ'),
      items: [
        {
          q: l('Подойдёт ли курс, если операция ещё только планируется?'),
          a: l('Да. Первый модуль целиком посвящён подготовке: обследования, подготовка дома и тела, день операции.'),
        },
        {
          q: l('Когда начинается восстановление после операции?'),
          a: l('С первых дней. В курсе разобраны и первые дни, и недели 2–4, и постепенный выход на нагрузку до 12 недель.'),
        },
        {
          q: l('Что делать, если после операции уже прошло несколько недель?'),
          a: l('Начать с модуля своего этапа — программа разбита по неделям, и ты просто подключаешься на своём.'),
        },
        {
          q: l('Что делать, если рекомендации хирурга отличаются от курса?'),
          a: l('Приоритет всегда у твоего хирурга: курс дополняет его рекомендации, а не заменяет их.'),
        },
        {
          q: l('Нужен ли тренажёрный зал?'),
          a: l('Нет. Внутри программы и для дома, и для зала — выбираешь свой вариант.'),
        },
        {
          q: l('Сколько времени занимает прохождение курса?'),
          a: l('Программа рассчитана на 12 недель, но проходить можно в своём темпе.'),
        },
        {
          q: l('Можно ли задавать тренеру вопросы?'),
          a: l('Да, в курс входит обратная связь от тренера.'),
        },
        {
          q: l('Как долго остаётся доступ?'),
          a: l('Доступ к материалам остаётся пожизненно.'),
        },
        {
          q: l('Заменяет ли курс врача или хирурга?'),
          a: l('Нет. Курс — это поддержка и структура восстановления, все медицинские вопросы решает твой врач.'),
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
