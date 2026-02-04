'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Dumbbell, Target, Zap, Star,
  Heart, Users, Calendar, ChevronDown, ChevronUp, Play, Shield, Award,
  Flame, Home, Smartphone, Download, User, Menu, X
} from 'lucide-react'

// Program data
const programsData: Record<string, any> = {
  'weight-loss': {
    id: 'weightLoss',
    icon: Target,
    color: 'from-pink-500 to-rose-600',
    colorLight: 'bg-pink-500/10 text-pink-600',
    price: 49,
    weeks: 8,
    workoutsPerWeek: 3,
    totalWorkouts: 24,
    minutesPerWorkout: '40-50',
    level: 'any',
    en: {
      title: '8 Weeks: Lose Weight',
      subtitle: 'Comprehensive weight loss program with effective workouts and nutrition guidance',
      description: 'This program is designed for women who want to lose weight safely and sustainably. Over 8 weeks, you\'ll follow a progressive training plan that combines strength training, cardio, and flexibility work. Each week builds on the previous one, gradually increasing intensity to maximize fat burning while preserving lean muscle mass.',
      forWhom: [
        'Women looking to lose 5-15 kg',
        'Those who want a structured approach to weight loss',
        'Beginners and intermediate fitness levels',
        'Anyone tired of yo-yo dieting',
      ],
      includes: [
        '24 complete workout videos',
        'Detailed meal plan with recipes',
        'Weekly progress tracking templates',
        'In-app support from your coach',
        'Exercise technique breakdowns',
        'Warm-up and cool-down routines',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Foundation', desc: 'Building proper form and exercise habits. 3 full-body workouts per week with moderate intensity.' },
        { week: '3-4', title: 'Acceleration', desc: 'Increasing workout intensity. Introduction of interval training and compound movements.' },
        { week: '5-6', title: 'Peak Performance', desc: 'High-intensity sessions. Combining strength circuits with HIIT cardio for maximum calorie burn.' },
        { week: '7-8', title: 'Transformation', desc: 'Final push with advanced techniques. Metabolic conditioning and body sculpting focus.' },
      ],
      faq: [
        { q: 'Do I need gym equipment?', a: 'Basic equipment is recommended: dumbbells (2-5 kg), resistance bands, and a yoga mat. However, many exercises have bodyweight alternatives.' },
        { q: 'How much weight can I expect to lose?', a: 'Results vary, but most clients lose 4-8 kg over the 8 weeks when following the program and nutrition plan consistently.' },
        { q: 'Is this program suitable for beginners?', a: 'Absolutely! The program starts with foundational movements and progressively increases difficulty. Each exercise includes modification options.' },
        { q: 'What if I miss a workout?', a: 'Don\'t worry! The program is flexible. You can shift workouts within the week. Consistency over perfection is key.' },
        { q: 'Is a meal plan included?', a: 'Yes! You\'ll receive a comprehensive meal plan with easy-to-follow recipes, shopping lists, and macro guidelines.' },
      ],
      results: [
        { name: 'Elena', lost: '7.2 kg', duration: '8 weeks' },
        { name: 'Maria', lost: '5.8 kg', duration: '8 weeks' },
        { name: 'Olga', lost: '9.1 kg', duration: '8 weeks' },
      ],
    },
    ru: {
      title: '8 недель: Похудей',
      subtitle: 'Комплексная программа похудения с эффективными тренировками и планом питания',
      description: 'Эта программа создана для женщин, которые хотят похудеть безопасно и устойчиво. За 8 недель вы пройдёте прогрессивный тренировочный план, сочетающий силовые тренировки, кардио и работу на гибкость. Каждая неделя строится на предыдущей, постепенно увеличивая интенсивность для максимального сжигания жира с сохранением мышечной массы.',
      forWhom: [
        'Женщины, желающие похудеть на 5-15 кг',
        'Те, кому нужен структурированный подход',
        'Начинающие и средний уровень подготовки',
        'Все, кто устал от диет «йо-йо»',
      ],
      includes: [
        '24 видео тренировки',
        'Подробный план питания с рецептами',
        'Шаблоны отслеживания прогресса',
        'Поддержка тренера в приложении',
        'Разбор техники упражнений',
        'Разминка и заминка',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Фундамент', desc: 'Постановка правильной техники и привычек. 3 тренировки на всё тело с умеренной интенсивностью.' },
        { week: '3-4', title: 'Ускорение', desc: 'Увеличение интенсивности. Введение интервальных тренировок и составных движений.' },
        { week: '5-6', title: 'Пик формы', desc: 'Высокоинтенсивные сессии. Сочетание силовых кругов с ВИИТ кардио для максимального сжигания калорий.' },
        { week: '7-8', title: 'Трансформация', desc: 'Финальный рывок. Метаболический кондиционинг и работа над рельефом.' },
      ],
      faq: [
        { q: 'Нужно ли оборудование?', a: 'Рекомендуется базовое: гантели (2-5 кг), резинки, коврик. Но многие упражнения можно делать без инвентаря.' },
        { q: 'Сколько килограмм можно сбросить?', a: 'Результаты различаются, но большинство клиенток теряют 4-8 кг за 8 недель при регулярном следовании программе.' },
        { q: 'Подходит ли для начинающих?', a: 'Абсолютно! Программа начинается с базовых движений и постепенно усложняется. Каждое упражнение имеет модификации.' },
        { q: 'Что если я пропущу тренировку?', a: 'Не переживайте! Программа гибкая. Можно перенести тренировку внутри недели. Главное — постоянство.' },
        { q: 'Включён ли план питания?', a: 'Да! Вы получите комплексный план питания с рецептами, списками покупок и рекомендациями по макронутриентам.' },
      ],
      results: [
        { name: 'Елена', lost: '7.2 кг', duration: '8 недель' },
        { name: 'Мария', lost: '5.8 кг', duration: '8 недель' },
        { name: 'Ольга', lost: '9.1 кг', duration: '8 недель' },
      ],
    },
  },
  'muscle-gain': {
    id: 'muscleGain',
    icon: Dumbbell,
    color: 'from-blue-500 to-indigo-600',
    colorLight: 'bg-blue-500/10 text-blue-600',
    price: 49,
    weeks: 8,
    workoutsPerWeek: 4,
    totalWorkouts: 32,
    minutesPerWorkout: '50-60',
    level: 'intermediate',
    en: {
      title: '8 Weeks: Build Muscle',
      subtitle: 'Progressive muscle building program with structured strength training',
      description: 'Designed for women who want to build lean, toned muscle. This program uses progressive overload principles to systematically increase strength and muscle definition. You\'ll train with a split routine targeting different muscle groups each session for optimal recovery and growth.',
      forWhom: [
        'Women who want to build lean muscle',
        'Those looking to increase strength',
        'Intermediate fitness level recommended',
        'Anyone wanting a toned, sculpted physique',
      ],
      includes: [
        '32 progressive workout videos',
        'Muscle-building nutrition plan',
        'Weight progression tracking',
        'Form check video library',
        'Recovery and stretching protocols',
        'Supplement guidance',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Base Building', desc: 'Establishing baseline strength. Full-body workouts with focus on compound lifts and proper form.' },
        { week: '3-4', title: 'Split Training', desc: 'Upper/lower body split. Increased volume and introduction of isolation exercises.' },
        { week: '5-6', title: 'Progressive Overload', desc: 'Systematic weight increases. Advanced techniques like supersets and drop sets.' },
        { week: '7-8', title: 'Peak & Sculpt', desc: 'Maximum intensity training. High-volume sessions with targeted muscle group focus.' },
      ],
      faq: [
        { q: 'Will I get bulky?', a: 'No! Women don\'t produce enough testosterone to get "bulky." You\'ll develop lean, toned muscles that give your body a sculpted appearance.' },
        { q: 'What equipment do I need?', a: 'You\'ll need access to dumbbells (multiple weights), a bench, and ideally a gym. Some exercises use cables or machines.' },
        { q: 'How much protein should I eat?', a: 'The nutrition plan recommends 1.6-2g protein per kg of bodyweight. Detailed meal plans are included.' },
        { q: 'Can beginners do this program?', a: 'Some exercise experience is recommended. If you\'re new to fitness, consider starting with our Beginner program first.' },
        { q: 'How soon will I see results?', a: 'Most clients notice strength gains within 2-3 weeks. Visible muscle definition typically appears by weeks 5-6.' },
      ],
      results: [
        { name: 'Anna', lost: '+3 kg muscle', duration: '8 weeks' },
        { name: 'Kate', lost: 'Deadlift +20 kg', duration: '8 weeks' },
        { name: 'Sofia', lost: 'Visible definition', duration: '8 weeks' },
      ],
    },
    ru: {
      title: '8 недель: Набирай',
      subtitle: 'Прогрессивная программа набора мышечной массы со структурированным силовым тренингом',
      description: 'Создана для женщин, которые хотят построить подтянутое мускулистое тело. Программа использует принципы прогрессивной нагрузки для систематического увеличения силы и мышечного рельефа. Сплит-тренировки нацелены на разные группы мышц для оптимального восстановления.',
      forWhom: [
        'Женщины, желающие нарастить мышцы',
        'Желающие увеличить силу',
        'Рекомендован средний уровень подготовки',
        'Для тех, кто хочет рельефное тело',
      ],
      includes: [
        '32 прогрессивных видео тренировки',
        'План питания для набора массы',
        'Отслеживание прогресса в весах',
        'Видеобиблиотека техники',
        'Протоколы восстановления',
        'Рекомендации по добавкам',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Строим базу', desc: 'Определение базовой силы. Тренировки на всё тело с акцентом на базовые упражнения.' },
        { week: '3-4', title: 'Сплит-тренинг', desc: 'Разделение верх/низ тела. Увеличение объёма и изолирующие упражнения.' },
        { week: '5-6', title: 'Прогрессивная нагрузка', desc: 'Систематическое увеличение весов. Суперсеты и дроп-сеты.' },
        { week: '7-8', title: 'Пик и рельеф', desc: 'Максимальная интенсивность. Высокообъёмные сессии с акцентом на отстающие группы.' },
      ],
      faq: [
        { q: 'Я не стану слишком мускулистой?', a: 'Нет! У женщин недостаточно тестостерона для массивной мускулатуры. Вы получите подтянутое рельефное тело.' },
        { q: 'Какое оборудование нужно?', a: 'Потребуются гантели разного веса, скамья. Идеально — доступ в зал. Некоторые упражнения используют тренажёры.' },
        { q: 'Сколько белка нужно есть?', a: 'План питания рекомендует 1.6-2г белка на кг массы тела. Подробные планы включены.' },
        { q: 'Можно ли начинающим?', a: 'Рекомендуется некоторый опыт тренировок. Если вы новичок — начните с программы «Для начинающих».' },
        { q: 'Когда будут видны результаты?', a: 'Рост силы ощущается через 2-3 недели. Видимый рельеф обычно появляется к 5-6 неделе.' },
      ],
      results: [
        { name: 'Анна', lost: '+3 кг мышц', duration: '8 недель' },
        { name: 'Катя', lost: 'Тяга +20 кг', duration: '8 недель' },
        { name: 'Софья', lost: 'Видимый рельеф', duration: '8 недель' },
      ],
    },
  },
  'beginner': {
    id: 'beginner',
    icon: Star,
    color: 'from-green-500 to-emerald-600',
    colorLight: 'bg-green-500/10 text-green-600',
    price: 39,
    weeks: 8,
    workoutsPerWeek: 3,
    totalWorkouts: 24,
    minutesPerWorkout: '30-40',
    level: 'beginner',
    en: {
      title: '8 Weeks: Beginner',
      subtitle: 'The perfect start for your fitness journey — build confidence and habits',
      description: 'This program is your gentle introduction to fitness. Designed specifically for women with little to no exercise experience, it focuses on building proper movement patterns, developing consistency, and creating a sustainable exercise habit. Every exercise is explained in detail with modifications available.',
      forWhom: [
        'Complete beginners to fitness',
        'Women returning to exercise after a long break',
        'Those intimidated by traditional gym programs',
        'Anyone wanting to build healthy habits',
      ],
      includes: [
        '24 beginner-friendly workout videos',
        'Detailed exercise tutorials',
        'Simple nutrition guidelines',
        'Habit-building worksheets',
        'Modification options for every exercise',
        'Motivational check-ins',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'First Steps', desc: 'Learning basic movements. Short 25-minute sessions focusing on proper form and breathing.' },
        { week: '3-4', title: 'Building Confidence', desc: 'Slightly longer sessions with increased variety. Introduction of light resistance exercises.' },
        { week: '5-6', title: 'Growing Stronger', desc: 'Building endurance and adding new challenges. Your body is adapting — time to push a little more.' },
        { week: '7-8', title: 'New You', desc: 'Full workout sessions with confidence. You\'re now ready for more advanced programs!' },
      ],
      faq: [
        { q: 'I\'ve never exercised before — is this for me?', a: 'Yes! This program is specifically designed for complete beginners. Every movement is taught from scratch.' },
        { q: 'Do I need any equipment?', a: 'Just a yoga mat and comfortable clothes! Optional: light dumbbells (1-2 kg) for weeks 3-8.' },
        { q: 'How long are the workouts?', a: 'Workouts start at 25 minutes and gradually increase to 40 minutes by the end of the program.' },
        { q: 'What if an exercise is too hard?', a: 'Every exercise has easier modifications shown alongside the main version. Go at your own pace!' },
        { q: 'What should I do after this program?', a: 'You\'ll be ready for any of our other programs! Most graduates move to Weight Loss or Home Fitness.' },
      ],
      results: [
        { name: 'Natalia', lost: 'First pull-up!', duration: '8 weeks' },
        { name: 'Irina', lost: 'Consistent habit', duration: '8 weeks' },
        { name: 'Daria', lost: '-3.5 kg', duration: '8 weeks' },
      ],
    },
    ru: {
      title: '8 недель: Для начинающих',
      subtitle: 'Идеальный старт фитнес-пути — уверенность и привычки',
      description: 'Эта программа — ваше мягкое введение в фитнес. Специально для женщин с минимальным или нулевым опытом тренировок. Фокус на правильных паттернах движения, развитии постоянства и создании устойчивой привычки. Каждое упражнение подробно объяснено с вариантами модификации.',
      forWhom: [
        'Абсолютные новички в фитнесе',
        'Вернувшиеся к спорту после долгого перерыва',
        'Те, кого пугают обычные программы',
        'Желающие выстроить здоровые привычки',
      ],
      includes: [
        '24 видео для начинающих',
        'Подробные обучающие ролики',
        'Простые рекомендации по питанию',
        'Чек-листы формирования привычек',
        'Модификации для каждого упражнения',
        'Мотивационные чек-ины',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Первые шаги', desc: 'Изучение базовых движений. Короткие 25-минутные сессии с фокусом на технику и дыхание.' },
        { week: '3-4', title: 'Уверенность', desc: 'Чуть более длинные сессии. Введение лёгких силовых упражнений.' },
        { week: '5-6', title: 'Растём сильнее', desc: 'Развитие выносливости. Тело адаптировалось — время немного добавить!' },
        { week: '7-8', title: 'Новая ты', desc: 'Полноценные тренировки. Вы готовы к более продвинутым программам!' },
      ],
      faq: [
        { q: 'Я никогда не тренировалась — это для меня?', a: 'Да! Программа специально для абсолютных новичков. Каждое движение объясняется с нуля.' },
        { q: 'Нужен ли инвентарь?', a: 'Только коврик и удобная одежда! Опционально: лёгкие гантели (1-2 кг) с 3-й недели.' },
        { q: 'Сколько длятся тренировки?', a: 'Начинаем с 25 минут, к концу программы увеличиваем до 40 минут.' },
        { q: 'Что если упражнение слишком сложное?', a: 'У каждого упражнения есть облегчённая версия. Двигайтесь в своём темпе!' },
        { q: 'Что делать после этой программы?', a: 'Вы будете готовы к любой программе! Большинство переходят на «Похудей» или «Фитнес дома».' },
      ],
      results: [
        { name: 'Наталья', lost: 'Первое подтягивание!', duration: '8 недель' },
        { name: 'Ирина', lost: 'Постоянная привычка', duration: '8 недель' },
        { name: 'Дарья', lost: '-3.5 кг', duration: '8 недель' },
      ],
    },
  },
  'endurance': {
    id: 'endurance',
    icon: Zap,
    color: 'from-orange-500 to-amber-600',
    colorLight: 'bg-orange-500/10 text-orange-600',
    price: 49,
    weeks: 8,
    workoutsPerWeek: 4,
    totalWorkouts: 32,
    minutesPerWorkout: '35-50',
    level: 'intermediate',
    en: {
      title: '8 Weeks: Endurance',
      subtitle: 'Develop stamina and strengthen your cardiovascular system',
      description: 'This program combines cardio training with functional strength work to dramatically improve your endurance, energy levels, and cardiovascular health. You\'ll progress from moderate-intensity steady-state cardio to high-intensity interval training, building an athletic, capable body.',
      forWhom: [
        'Women wanting to improve stamina',
        'Those feeling low on daily energy',
        'Runners looking for cross-training',
        'Anyone wanting to feel more athletic',
      ],
      includes: [
        '32 cardio and strength sessions',
        'Heart rate zone training guide',
        'Energy-boosting nutrition plan',
        'Recovery and mobility routines',
        'Progress benchmarks and tests',
        'Breathing technique tutorials',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Aerobic Base', desc: 'Building cardiovascular foundation. Zone 2 cardio with bodyweight strength circuits.' },
        { week: '3-4', title: 'Interval Training', desc: 'Introduction of HIIT sessions. Alternating cardio and strength days.' },
        { week: '5-6', title: 'Power Endurance', desc: 'Longer, more intense sessions. Combining strength and cardio in circuit format.' },
        { week: '7-8', title: 'Athletic Peak', desc: 'Maximum endurance challenges. Complex training combinations for peak fitness.' },
      ],
      faq: [
        { q: 'How is this different from the weight loss program?', a: 'This program focuses specifically on cardiovascular fitness and stamina, while weight loss targets fat reduction. Some overlap exists, but the training methods differ.' },
        { q: 'Do I need a heart rate monitor?', a: 'Recommended but not required. A basic heart rate monitor helps you train in the right zones for maximum benefit.' },
        { q: 'Is this program high-impact?', a: 'Some exercises are high-impact, but every session includes low-impact alternatives for joints.' },
        { q: 'Can I do this alongside running?', a: 'Yes! This program is excellent cross-training for runners. It builds the supporting muscles that improve running performance.' },
        { q: 'Will I also lose weight?', a: 'Many clients lose weight as a side effect, especially when following the nutrition plan. The primary focus is endurance, but body composition often improves.' },
      ],
      results: [
        { name: 'Vera', lost: '5K time -4 min', duration: '8 weeks' },
        { name: 'Lisa', lost: 'All-day energy', duration: '8 weeks' },
        { name: 'Nina', lost: '-5 kg + stamina', duration: '8 weeks' },
      ],
    },
    ru: {
      title: '8 недель: Выносливость',
      subtitle: 'Развитие выносливости и укрепление сердечно-сосудистой системы',
      description: 'Программа сочетает кардио с функциональной силовой работой для значительного улучшения выносливости, уровня энергии и здоровья сердца. Вы пройдёте путь от умеренного кардио до высокоинтенсивных интервальных тренировок, строя атлетичное тело.',
      forWhom: [
        'Женщины, желающие улучшить выносливость',
        'Те, кому не хватает энергии в течение дня',
        'Бегуньи для кросс-тренинга',
        'Все, кто хочет чувствовать себя атлетичнее',
      ],
      includes: [
        '32 кардио и силовых сессии',
        'Гид по тренировкам в пульсовых зонах',
        'План питания для энергии',
        'Восстановление и мобильность',
        'Тесты и контрольные точки',
        'Уроки техники дыхания',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Аэробная база', desc: 'Строим кардио-фундамент. Кардио в зоне 2 с силовыми кругами.' },
        { week: '3-4', title: 'Интервальный тренинг', desc: 'Введение ВИИТ сессий. Чередование кардио и силовых дней.' },
        { week: '5-6', title: 'Силовая выносливость', desc: 'Более длинные интенсивные сессии. Комбинирование силы и кардио в формате круговых.' },
        { week: '7-8', title: 'Атлетический пик', desc: 'Максимальные нагрузки на выносливость. Комплексные тренировочные комбинации.' },
      ],
      faq: [
        { q: 'Чем отличается от программы похудения?', a: 'Фокус на кардио-фитнесе и выносливости, а не на снижении жира. Методы тренировок различаются.' },
        { q: 'Нужен ли пульсометр?', a: 'Рекомендуется, но не обязателен. Помогает тренироваться в правильных пульсовых зонах.' },
        { q: 'Это высокоударная программа?', a: 'Некоторые упражнения ударные, но всегда есть безударные альтернативы для защиты суставов.' },
        { q: 'Можно ли совмещать с бегом?', a: 'Да! Отличный кросс-тренинг для бегуний. Укрепляет мышцы, поддерживающие беговую технику.' },
        { q: 'Я также похудею?', a: 'Многие клиентки теряют вес как побочный эффект. Основной фокус — выносливость, но композиция тела часто улучшается.' },
      ],
      results: [
        { name: 'Вера', lost: '5К время -4 мин', duration: '8 недель' },
        { name: 'Лиза', lost: 'Энергия весь день', duration: '8 недель' },
        { name: 'Нина', lost: '-5 кг + выносливость', duration: '8 недель' },
      ],
    },
  },
  'home-fitness': {
    id: 'homeFitness',
    icon: Home,
    color: 'from-teal-500 to-teal-600',
    colorLight: 'bg-teal-500/10 text-teal-600',
    price: 39,
    weeks: 8,
    workoutsPerWeek: 4,
    totalWorkouts: 32,
    minutesPerWorkout: '30-40',
    level: 'any',
    en: {
      title: '8 Weeks: Home Fitness',
      subtitle: 'Effective workouts at home — no gym, no excuses',
      description: 'Designed for busy women who want effective workouts without leaving home. This program requires zero equipment and can be done in a small space. Perfect for moms, travelers, or anyone who prefers working out in the comfort of their own home. Short but intense sessions that deliver real results.',
      forWhom: [
        'Busy women with limited time',
        'Moms who can\'t get to the gym',
        'Travelers who need portable workouts',
        'Anyone preferring home exercise',
      ],
      includes: [
        '32 no-equipment workout videos',
        'Quick 30-minute session options',
        'Small-space exercise alternatives',
        'Family-friendly scheduling tips',
        'Simple healthy recipes',
        'Morning and evening routine options',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Home Foundation', desc: 'Bodyweight basics in minimal space. Building the habit of consistent home training.' },
        { week: '3-4', title: 'Intensity Up', desc: 'Adding plyometric elements and tempo variations. Increased calorie burn in same timeframe.' },
        { week: '5-6', title: 'Full Body Focus', desc: 'Comprehensive bodyweight circuits. Every session targets the entire body for maximum efficiency.' },
        { week: '7-8', title: 'Home Athlete', desc: 'Advanced bodyweight movements. You\'ll be amazed what you can achieve with zero equipment!' },
      ],
      faq: [
        { q: 'I really don\'t need any equipment?', a: 'Not a single thing! Every exercise uses just your bodyweight. A yoga mat is nice to have but even that is optional.' },
        { q: 'How much space do I need?', a: 'About 2x2 meters — roughly the space of a yoga mat. All exercises are designed for small spaces.' },
        { q: 'Are these workouts effective without weights?', a: 'Absolutely! Bodyweight training can be extremely challenging and effective. The program uses tempo, angles, and plyometrics to maximize difficulty.' },
        { q: 'Can I do these with a baby around?', a: 'Yes! The workouts are quiet (no jumping required in modified versions), and many moms do these during nap time.' },
        { q: 'What time of day is best?', a: 'Any time works! The program includes both morning energizer and evening wind-down workout options.' },
      ],
      results: [
        { name: 'Alina', lost: '-4 kg at home', duration: '8 weeks' },
        { name: 'Yana', lost: 'Toned arms & core', duration: '8 weeks' },
        { name: 'Polina', lost: 'Morning routine set', duration: '8 weeks' },
      ],
    },
    ru: {
      title: '8 недель: Фитнес дома',
      subtitle: 'Эффективные тренировки дома — без зала, без отговорок',
      description: 'Создана для занятых женщин, которые хотят эффективные тренировки без выхода из дома. Ноль оборудования, минимум пространства. Идеально для мам, путешественниц и всех, кто предпочитает заниматься дома. Короткие, но интенсивные сессии с реальными результатами.',
      forWhom: [
        'Занятые женщины с ограниченным временем',
        'Мамы, которые не могут ходить в зал',
        'Путешественницы',
        'Все, кто предпочитает дом',
      ],
      includes: [
        '32 тренировки без оборудования',
        '30-минутные экспресс-варианты',
        'Упражнения для маленьких помещений',
        'Советы по планированию для семей',
        'Простые рецепты здорового питания',
        'Утренние и вечерние варианты',
      ],
      weeklyPlan: [
        { week: '1-2', title: 'Домашний фундамент', desc: 'Базовые упражнения с собственным весом. Формирование привычки регулярных домашних тренировок.' },
        { week: '3-4', title: 'Больше интенсивности', desc: 'Плиометрические элементы и вариации темпа. Больше калорий за то же время.' },
        { week: '5-6', title: 'Всё тело', desc: 'Комплексные круговые тренировки. Каждая сессия задействует всё тело.' },
        { week: '7-8', title: 'Домашний атлет', desc: 'Продвинутые упражнения с собственным весом. Вы удивитесь, чего можно достичь без инвентаря!' },
      ],
      faq: [
        { q: 'Правда не нужен инвентарь?', a: 'Ни единой вещи! Только ваш собственный вес. Коврик желателен, но тоже не обязателен.' },
        { q: 'Сколько нужно места?', a: 'Примерно 2x2 метра — размер коврика для йоги. Все упражнения адаптированы для маленьких помещений.' },
        { q: 'Эффективны ли тренировки без весов?', a: 'Абсолютно! Тренировки с собственным весом могут быть очень сложными. Программа использует темп, углы и плиометрику.' },
        { q: 'Можно ли заниматься с малышом рядом?', a: 'Да! Тренировки тихие (есть варианты без прыжков). Многие мамы занимаются во время дневного сна.' },
        { q: 'В какое время лучше заниматься?', a: 'В любое! Есть варианты утренних энергичных и вечерних расслабляющих тренировок.' },
      ],
      results: [
        { name: 'Алина', lost: '-4 кг дома', duration: '8 недель' },
        { name: 'Яна', lost: 'Рельеф рук и пресса', duration: '8 недель' },
        { name: 'Полина', lost: 'Утренняя привычка', duration: '8 недель' },
      ],
    },
  },
}

// Header Component (simplified for program pages)
function ProgramHeader() {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm' : 'bg-transparent'
    }`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div className="hidden sm:block">
              <span className={`font-semibold text-lg ${isScrolled ? 'text-zinc-900' : 'text-white'}`}>Qbody</span>
              <span className="text-teal-500 text-sm block -mt-1">by Khavanskaia</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="dropdown" />
            <Link href="/">
              <Button variant={isScrolled ? 'outline' : 'ghost'} className={isScrolled ? '' : 'text-white border-white/30 hover:bg-white/10'}>
                <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

// FAQ Item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-colors">
        <span className="font-medium text-zinc-900 pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-zinc-600 animate-in slide-in-from-top-2">{answer}</div>
      )}
    </div>
  )
}

// Main Page Component
export default function ProgramPage() {
  const params = useParams()
  const slug = params.slug as string
  const { t, locale } = useTranslation()

  const program = programsData[slug]

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Program not found</h1>
          <Link href="/"><Button variant="gradient">Back to Home</Button></Link>
        </div>
      </div>
    )
  }

  const Icon = program.icon
  const data = program[locale] || program.en
  const levelLabels: Record<string, Record<string, string>> = {
    en: { any: 'Any Level', beginner: 'Beginner', intermediate: 'Intermediate' },
    ru: { any: 'Любой уровень', beginner: 'Начинающий', intermediate: 'Средний' },
  }

  return (
    <main className="min-h-screen">
      <ProgramHeader />

      {/* Hero */}
      <section className={`relative pt-32 pb-20 bg-gradient-to-br ${program.color} overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30">{levelLabels[locale]?.[program.level] || program.level}</Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">{data.title}</h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">{data.subtitle}</p>
            <div className="flex flex-wrap gap-6 mb-10">
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-5 h-5" />
                <span>{program.weeks} {locale === 'ru' ? 'недель' : 'weeks'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Dumbbell className="w-5 h-5" />
                <span>{program.totalWorkouts} {locale === 'ru' ? 'тренировок' : 'workouts'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="w-5 h-5" />
                <span>{program.minutesPerWorkout} {locale === 'ru' ? 'мин' : 'min'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Flame className="w-5 h-5" />
                <span>{program.workoutsPerWeek}x / {locale === 'ru' ? 'нед' : 'week'}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">${program.price}</span>
                <span className="text-white/70 text-lg">{locale === 'ru' ? 'разовый платёж' : 'one-time'}</span>
              </div>
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-white/90 font-semibold shadow-lg">
                  <Smartphone className="w-5 h-5 mr-2" />
                  {locale === 'ru' ? 'Начать программу' : 'Start Program'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-zinc-700 leading-relaxed">{data.description}</p>
          </div>
        </div>
      </section>

      {/* For Whom + Includes */}
      <section className="py-16 bg-zinc-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl ${program.colorLight} flex items-center justify-center`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{locale === 'ru' ? 'Для кого' : 'Who This Is For'}</h2>
                </div>
                <ul className="space-y-4">
                  {data.forWhom.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl ${program.colorLight} flex items-center justify-center`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{locale === 'ru' ? 'Что включено' : 'What\'s Included'}</h2>
                </div>
                <ul className="space-y-4">
                  {data.includes.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Weekly Plan */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              {locale === 'ru' ? 'План программы' : 'Program Plan'}
            </h2>
            <p className="text-lg text-zinc-600">
              {locale === 'ru' ? 'Пошаговая прогрессия на 8 недель' : 'Step-by-step progression over 8 weeks'}
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {data.weeklyPlan.map((phase: any, i: number) => (
              <Card key={i} className="overflow-hidden card-hover">
                <CardContent className="p-6 flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-lg">{phase.week}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{phase.title}</h3>
                    <p className="text-zinc-600">{phase.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 bg-zinc-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              {locale === 'ru' ? 'Результаты клиенток' : 'Client Results'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {data.results.map((result: any, i: number) => (
              <Card key={i} className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{result.name[0]}</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{result.name}</h3>
                  <p className={`text-lg font-bold bg-gradient-to-r ${program.color} bg-clip-text text-transparent mb-1`}>{result.lost}</p>
                  <p className="text-sm text-zinc-500">{result.duration}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
                {locale === 'ru' ? 'Частые вопросы' : 'Frequently Asked Questions'}
              </h2>
            </div>
            <div className="space-y-3">
              {data.faq.map((item: any, i: number) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 bg-gradient-to-br ${program.color}`}>
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {locale === 'ru' ? 'Готовы начать?' : 'Ready to Start?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
            {locale === 'ru'
              ? 'Присоединяйтесь к тысячам женщин, которые уже изменили своё тело'
              : 'Join thousands of women who have already transformed their bodies'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-zinc-900 hover:bg-white/90 font-semibold shadow-lg">
                {locale === 'ru' ? 'Начать за' : 'Start for'} ${program.price}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/#programs">
              <Button size="lg" variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                {locale === 'ru' ? 'Все программы' : 'All Programs'}
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-white/80 text-sm">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" />{locale === 'ru' ? 'Безопасная оплата' : 'Secure Payment'}</div>
            <div className="flex items-center gap-2"><Download className="w-4 h-4" />{locale === 'ru' ? 'Мгновенный доступ' : 'Instant Access'}</div>
            <div className="flex items-center gap-2"><Heart className="w-4 h-4" />{locale === 'ru' ? 'Поддержка тренера' : 'Coach Support'}</div>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="bg-zinc-900 py-8">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <span className="text-white font-semibold">Qbody</span>
          </Link>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/privacy" className="hover:text-white transition-colors">{locale === 'ru' ? 'Политика' : 'Privacy'}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{locale === 'ru' ? 'Условия' : 'Terms'}</Link>
            <Link href="/" className="hover:text-white transition-colors">{locale === 'ru' ? 'Главная' : 'Home'}</Link>
          </div>
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} Qbody</p>
        </div>
      </footer>
    </main>
  )
}
