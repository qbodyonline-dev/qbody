import {
  Square, Zap, LayoutGrid, Columns2, Play, MessageSquare,
  Heart, Hash, Mail, Camera, Code2, SlidersHorizontal, Sparkles, PanelTop, GraduationCap, UserCircle
} from 'lucide-react'
import type { PageBlock, SectionStyle, CourseItem, ProgramItem, ResultItem, HeaderData, HeroData, AboutData } from './types'
import { renderCoursesHTML, renderProgramsHTML, renderResultsHTML, renderHeaderHTML, renderHeroHTML, renderAboutHTML } from './renderers'
import { renderHtmlBlockHTML, renderSliderHTML, renderHeroTemplateHTML, defaultHtmlBlockData, defaultSliderData, defaultHeroTemplateData } from './new-block-renderers'

/* ═══════════ BLOCK CONTENT DATA ═══════════ */

export function getDefaultContent(): { en: Record<string, string>; ru: Record<string, string> } {
  const en: Record<string, string> = {
    header: `<div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e4e4e7;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">Q</div><span style="font-weight:600;font-size:16px;color:#18181b;">Qbody</span></div><div style="display:flex;gap:24px;font-size:14px;"><a href="#programs" style="color:#52525b;text-decoration:none;">Programs</a><a href="#courses" style="color:#52525b;text-decoration:none;">Courses</a><a href="#about" style="color:#52525b;text-decoration:none;">About</a><a href="#results" style="color:#52525b;text-decoration:none;">Results</a></div><div style="display:flex;gap:8px;"><a href="/auth/login" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;font-size:14px;color:#18181b;text-decoration:none;">Log in</a><a href="/auth/register" style="padding:8px 16px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;">Get started</a></div></div>`,
    hero: `<div style="text-align:center;padding:60px 20px;background:linear-gradient(135deg,#0f766e 0%,#115e59 25%,#134e4a 50%,#18181b 100%);color:white;"><p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:16px;">⭐ NASM CERTIFIED PERSONAL TRAINER</p><h1 style="font-size:48px;font-weight:800;margin-bottom:8px;">Transform Your Body</h1><h1 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">Transform Your Life</h1><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin:0 auto 32px;">17+ years of experience. 1000+ clients. Personalized programs and recovery courses for women of any fitness level.</p><div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;"><a href="/auth/register" style="padding:12px 32px;border-radius:16px;background:#14b8a6;color:white;font-weight:600;font-size:16px;text-decoration:none;">Start training</a><a href="#programs" style="padding:12px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);color:white;font-size:16px;text-decoration:none;">View programs →</a></div><p style="font-size:14px;color:#a1a1aa;">✓ Personal approach&nbsp;✓ Online &amp; in-person&nbsp;✓ Proven results</p></div>`,
    programs: `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">📱 Available in QbodyFit app</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Ready-made training programs</h2><p style="color:#52525b;font-size:16px;">Choose a program for your goal and start training today.</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto;"><div style="background:white;border:2px solid #14b8a6;border-radius:16px;padding:24px;position:relative;"><div style="position:absolute;top:12px;right:12px;background:#14b8a6;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Popular</div><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Lose Weight</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Comprehensive weight loss program with workouts and nutrition</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Any level</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 24 workouts</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Meal plan</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ In-app support</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/weight-loss" style="padding:8px 16px;border-radius:12px;background:#14b8a6;color:white;font-size:13px;text-decoration:none;font-weight:600;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Build Muscle</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Muscle building with progressive overload</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Intermediate</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 32 workouts</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Strength gains</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Weight progression</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/muscle-gain" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#22c55e,#10b981);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">⭐</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Beginner</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Perfect start for fitness beginners</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Beginner</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Basic exercises</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Technique focus</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Gradual progression</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$39</span><a href="/programs/beginner" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:730px;margin:20px auto 0;"><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f97316,#eab308);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">⚡</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Endurance</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Develop endurance &amp; cardiovascular health</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Intermediate</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Cardio + strength</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Interval training</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ All-day energy</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/endurance" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">🏠</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Home Fitness</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Effective home workouts, no equipment</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Any level</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ No equipment</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 30-40 min</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Home or travel</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$39</span><a href="/programs/home" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div></div></div>`,
    courses: `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">🎬 Video courses</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Specialized courses</h2><p style="color:#52525b;font-size:16px;">Recovery programs for women.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;"><div style="border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#ec4899,#f43f5e);padding:40px;text-align:center;color:white;position:relative;"><div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;"><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">⏱ 6 weeks</span><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">📖 18 lessons</span></div><div style="font-size:40px;margin-bottom:12px;">💗</div><h3 style="font-size:22px;font-weight:700;margin-bottom:8px;">Post-Mammoplasty Recovery</h3><p style="font-size:14px;opacity:0.9;">Safe recovery and active lifestyle</p><div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"><div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div></div></div><div style="padding:24px;"><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Safe scar exercises</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Posture correction</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Return to training</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Expert guidance</li></ul><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e4e4e7;padding-top:16px;"><div><span style="font-size:24px;font-weight:700;color:#18181b;">$99</span> <span style="font-size:14px;color:#a1a1aa;text-decoration:line-through;">$149</span></div><a href="/courses/mammoplasty" style="padding:10px 20px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;font-weight:600;">Buy →</a></div></div></div><div style="border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:40px;text-align:center;color:white;position:relative;"><div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;"><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">⏱ 8 weeks</span><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">📖 24 lessons</span></div><div style="font-size:40px;margin-bottom:12px;">👶</div><h3 style="font-size:22px;font-weight:700;margin-bottom:8px;">Post C-Section Recovery</h3><p style="font-size:14px;opacity:0.9;">For new moms after surgery</p><div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"><div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div></div></div><div style="padding:24px;"><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Core rehab</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Diastasis recovery</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Pelvic floor</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Safe return</li></ul><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e4e4e7;padding-top:16px;"><div><span style="font-size:24px;font-weight:700;color:#18181b;">$99</span> <span style="font-size:14px;color:#a1a1aa;text-decoration:line-through;">$149</span></div><a href="/courses/csection" style="padding:10px 20px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;font-weight:600;">Buy →</a></div></div></div></div></div>`,
    about: `<div style="padding:60px 20px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1000px;margin:0 auto;"><div><img src="/images/hero-alexandra.jpg" alt="Coach" style="width:100%;border-radius:24px;aspect-ratio:4/5;object-fit:cover;" /></div><div><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">ABOUT THE TRAINER</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:4px;">Aleksandra Khavanskaia</h2><p style="font-size:18px;color:#14b8a6;font-weight:500;margin-bottom:24px;">Coach. Athlete. Mom.</p><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:12px;">🏆 Certifications</h3><ul style="list-style:none;padding:0;margin:0 0 24px;"><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Master's Physical Culture</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ NASM CPT</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ CES, PBC, CNSC</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Pre/Post-Natal Fitness</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Rehabilitation</li></ul><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:12px;">🏅 Career</h3><ul style="list-style:none;padding:0;margin:0 0 24px;"><li style="padding:4px 0;color:#52525b;font-size:14px;">🥈 Olympia &amp; Arnold Amateur</li><li style="padding:4px 0;color:#52525b;font-size:14px;">🏆 5× NPC Champion</li><li style="padding:4px 0;color:#52525b;font-size:14px;">🥇 NPC National Gold</li></ul><p style="font-size:14px;color:#52525b;">📍 Las Vegas · 👶 Mom of 2 · 💪 17+ years</p></div></div></div>`,
    results: `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">⭐ Real transformations</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Client Results</h2></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1000px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">📉</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Elena, 34</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-16 kg in 4 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Changed my body &amp; outlook!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">👶</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Maria, 29</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-14 kg in 6 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Back in shape after C-section!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">💪</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Anna, 41</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-18 kg in 5 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Best shape at 40!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div></div><div style="text-align:center;margin-top:40px;"><a href="/auth/register" style="padding:14px 36px;border-radius:16px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;font-weight:600;font-size:16px;text-decoration:none;">Start →</a></div></div>`,
    footer: `<div style="padding:40px 20px;background:#18181b;color:#a1a1aa;text-align:center;"><div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">Q</div><span style="font-weight:600;font-size:16px;color:white;">Qbody</span></div><p style="font-size:14px;margin-bottom:12px;">Personal Fitness Training &amp; Recovery</p><p style="font-size:14px;">📍 Las Vegas, NV · 📧 info@qbody.app</p><div style="margin-top:16px;padding-top:16px;border-top:1px solid #27272a;font-size:13px;">© 2025 Qbody. All rights reserved.</div></div>`,
  }

  // Russian versions via replacements
  const ru: Record<string, string> = {}
  ru.header = en.header.replace('Programs', 'Программы').replace('Courses', 'Курсы').replace('About', 'О тренере').replace('Results', 'Результаты').replace('Log in', 'Вход').replace('Get started', 'Начать')
  ru.hero = en.hero.replace('NASM CERTIFIED PERSONAL TRAINER', 'СЕРТИФИЦИРОВАННЫЙ NASM ТРЕНЕР').replace('Transform Your Body', 'Преобрази тело').replace('Transform Your Life', 'Преобрази жизнь').replace(/17\+.*fitness level\./, '17+ лет опыта. 1000+ клиентов. Персональные программы для женщин.').replace('Start training', 'Начать').replace('View programs →', 'Программы →').replace('Personal approach', 'Инд. подход').replace('Online &amp; in-person', 'Онлайн и офлайн').replace('Proven results', 'Результаты')
  ru.programs = en.programs.replace('Available in QbodyFit app', 'В приложении QbodyFit').replace('Ready-made training programs', 'Программы тренировок').replace('Choose a program for your goal and start training today.', 'Выберите программу.').replace('8 weeks: Lose Weight', '8 нед: Похудение').replace('Comprehensive weight loss program with workouts and nutrition', 'Комплексная программа похудения').replace(/Any level/g, 'Любой').replace('24 workouts', '24 тренировки').replace('Meal plan', 'Питание').replace('In-app support', 'Поддержка').replace('8 weeks: Build Muscle', '8 нед: Масса').replace('Muscle building with progressive overload', 'Набор мышечной массы').replace(/Intermediate/g, 'Средний').replace('32 workouts', '32 тренировки').replace('Strength gains', 'Рост силы').replace('Weight progression', 'Прогрессия').replace('8 weeks: Beginner', '8 нед: Новичок').replace('Perfect start for fitness beginners', 'Для начинающих').replace(/Beginner/g, 'Новичок').replace('Basic exercises', 'Базовые').replace('Technique focus', 'Техника').replace('Gradual progression', 'Постепенно').replace('8 weeks: Endurance', '8 нед: Выносливость').replace('Develop endurance &amp; cardiovascular health', 'Кардио и выносливость').replace('Cardio + strength', 'Кардио+сила').replace('Interval training', 'Интервалы').replace('All-day energy', 'Энергия').replace('8 weeks: Home Fitness', '8 нед: Дома').replace('Effective home workouts, no equipment', 'Тренировки дома').replace('No equipment', 'Без инвентаря').replace('30-40 min', '30-40 мин').replace('Home or travel', 'Дома/в поездке').replace(/Details/g, 'Подробнее').replace('Popular', 'Хит')
  ru.courses = en.courses.replace('Video courses', 'Видеокурсы').replace('Specialized courses', 'Специализированные курсы').replace('Recovery programs for women.', 'Программы восстановления.').replace('Post-Mammoplasty Recovery', 'Восстановление после маммопластики').replace('Safe recovery and active lifestyle', 'Безопасное восстановление').replace('Safe scar exercises', 'Работа с рубцом').replace('Posture correction', 'Осанка').replace('Return to training', 'Возврат к тренировкам').replace('Expert guidance', 'Эксперт').replace('Post C-Section Recovery', 'После кесарева').replace('For new moms after surgery', 'Для мам после операции').replace('Core rehab', 'Реабилитация кора').replace('Diastasis recovery', 'Диастаз').replace('Pelvic floor', 'Тазовое дно').replace('Safe return', 'Безопасный возврат').replace(/Buy →/g, 'Купить →')
  ru.about = en.about.replace('ABOUT THE TRAINER', 'О ТРЕНЕРЕ').replace('Coach. Athlete. Mom.', 'Тренер. Спортсменка. Мама.').replace('Certifications', 'Сертификаты').replace("Master's Physical Culture", 'Магистр физкультуры').replace('Pre/Post-Natal Fitness', 'Пре/постнатальный').replace('Rehabilitation', 'Реабилитация').replace('Career', 'Карьера').replace('Olympia &amp; Arnold Amateur', 'Олимпия и Арнольд').replace('5× NPC Champion', '5× чемпион NPC').replace('NPC National Gold', 'Золото NPC').replace('Las Vegas', 'Лас-Вегас').replace('Mom of 2', 'Мама 2 детей').replace('17+ years', '17+ лет')
  ru.results = en.results.replace('Real transformations', 'Реальные результаты').replace('Client Results', 'Результаты клиентов').replace(/in (\d+) months/g, 'за $1 мес').replace('Changed my body &amp; outlook!', 'Изменила тело и взгляд на жизнь!').replace('Back in shape after C-section!', 'Вернулась в форму после кесарева!').replace('Best shape at 40!', 'Лучшая форма в 40!').replace('Start →', 'Начать →')
  ru.footer = en.footer.replace('Personal Fitness Training &amp; Recovery', 'Тренировки и восстановление').replace('All rights reserved', 'Все права защищены')

  return { en, ru }
}

/* ═══════════ TEMPLATES for Add Block modal ═══════════ */
export interface BlockTemplate {
  id: string
  l: string
  lr: string
  icon: any
  en: string
  ru: string
}

export const TEMPLATES: BlockTemplate[] = [
  { id: 'blank', l: 'Empty Section', lr: 'Пустой раздел', icon: Square, en: `<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:36px;font-weight:800;color:#18181b;">New Section</h2><p style="color:#52525b;">Your content here.</p></div>`, ru: `<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:36px;font-weight:800;color:#18181b;">Новый раздел</h2><p style="color:#52525b;">Контент.</p></div>` },

  { id: 'features', l: 'Features Grid', lr: 'Преимущества', icon: LayoutGrid, en: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Why choose us</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;"><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Personal approach</h3><p style="font-size:14px;color:#52525b;">Tailored to your goals</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">📱</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Mobile app</h3><p style="font-size:14px;color:#52525b;">Train anywhere</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Proven results</h3><p style="font-size:14px;color:#52525b;">1000+ transformations</p></div></div></div>`, ru: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Почему мы</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;"><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Индивидуально</h3><p style="font-size:14px;color:#52525b;">Под ваши цели</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">📱</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Приложение</h3><p style="font-size:14px;color:#52525b;">Тренируйтесь везде</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Результаты</h3><p style="font-size:14px;color:#52525b;">1000+ клиентов</p></div></div></div>` },
  { id: 'cols2', l: 'Two Columns', lr: 'Две колонки', icon: Columns2, en: `<div style="display:flex;gap:24px;padding:40px 20px;"><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Left</h2><p style="color:#52525b;">Content</p></div><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Right</h2><p style="color:#52525b;">Content</p></div></div>`, ru: `<div style="display:flex;gap:24px;padding:40px 20px;"><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Лево</h2><p style="color:#52525b;">Контент</p></div><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Право</h2><p style="color:#52525b;">Контент</p></div></div>` },
  { id: 'video', l: 'Video Section', lr: 'Видео', icon: Play, en: `<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:24px;">Watch training</h2><div style="max-width:700px;margin:0 auto;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:80px 40px;cursor:pointer;position:relative;"><div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:32px;color:#18181b;margin-left:6px;">▶</span></div><p style="color:white;margin-top:16px;">Click to play</p></div></div>`, ru: `<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:24px;">Посмотрите тренировку</h2><div style="max-width:700px;margin:0 auto;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:80px 40px;cursor:pointer;"><div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto;"><span style="font-size:32px;color:#18181b;margin-left:6px;">▶</span></div><p style="color:white;margin-top:16px;">Нажмите ▶</p></div></div>` },

  { id: 'testimonials', l: 'Testimonials', lr: 'Отзывы', icon: Heart, en: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">What clients say</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:800px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Best trainer! Incredible results in 3 months."</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#14b8a6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">O</div><div><p style="font-weight:600;font-size:13px;">Olga, 38</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Finally found a coach who understands women's needs!"</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#8b5cf6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">S</div><div><p style="font-weight:600;font-size:13px;">Svetlana, 32</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div></div></div>`, ru: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Отзывы</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:800px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Лучший тренер! Результат за 3 месяца."</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#14b8a6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">О</div><div><p style="font-weight:600;font-size:13px;">Ольга, 38</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Нашла тренера, который понимает женщин!"</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#8b5cf6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">С</div><div><p style="font-weight:600;font-size:13px;">Светлана, 32</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div></div></div>` },
  { id: 'stats', l: 'Stats Counter', lr: 'Счётчики', icon: Hash, en: `<div style="padding:60px 20px;background:linear-gradient(135deg,#18181b,#27272a);"><div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap;"><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">1000+</p><p style="font-size:14px;color:#a1a1aa;">Clients</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">17+</p><p style="font-size:14px;color:#a1a1aa;">Years</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">5×</p><p style="font-size:14px;color:#a1a1aa;">Champion</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">100%</p><p style="font-size:14px;color:#a1a1aa;">Dedication</p></div></div></div>`, ru: `<div style="padding:60px 20px;background:linear-gradient(135deg,#18181b,#27272a);"><div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap;"><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">1000+</p><p style="font-size:14px;color:#a1a1aa;">Клиентов</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">17+</p><p style="font-size:14px;color:#a1a1aa;">Лет</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">5×</p><p style="font-size:14px;color:#a1a1aa;">Чемпион</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">100%</p><p style="font-size:14px;color:#a1a1aa;">Отдача</p></div></div></div>` },

  { id: 'headerblock', l: 'Header', lr: 'Шапка', icon: PanelTop, en: '__STRUCTURED__header', ru: '__STRUCTURED__header' },
  { id: 'courses2block', l: 'Courses Pro', lr: 'Курсы Pro', icon: GraduationCap, en: '__STRUCTURED__courses2', ru: '__STRUCTURED__courses2' },
  { id: 'about2block', l: 'About Pro', lr: 'About Pro', icon: UserCircle, en: '__STRUCTURED__about2', ru: '__STRUCTURED__about2' },
  { id: 'cta2block', l: 'CTA Pro', lr: 'CTA Pro', icon: Zap, en: '__STRUCTURED__cta2', ru: '__STRUCTURED__cta2' },
  { id: 'faq2block', l: 'FAQ Pro', lr: 'FAQ Pro', icon: MessageSquare, en: '__STRUCTURED__faq2', ru: '__STRUCTURED__faq2' },
  { id: 'contact2block', l: 'Contact Pro', lr: 'Контакты Pro', icon: Mail, en: '__STRUCTURED__contact2', ru: '__STRUCTURED__contact2' },
  { id: 'htmlblock', l: 'HTML Block', lr: 'HTML Блок', icon: Code2, en: '__STRUCTURED__htmlblock', ru: '__STRUCTURED__htmlblock' },
  { id: 'slider', l: 'Slider', lr: 'Слайдер', icon: SlidersHorizontal, en: '__STRUCTURED__slider', ru: '__STRUCTURED__slider' },
  { id: 'heroblock', l: 'Hero Block', lr: 'Hero Блок', icon: Sparkles, en: '__STRUCTURED__herotemplate', ru: '__STRUCTURED__herotemplate' },
  { id: 'gallery', l: 'Photo Gallery', lr: 'Фотогалерея', icon: Camera, en: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:32px;">Gallery</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:900px;margin:0 auto;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div></div></div>`, ru: `<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:32px;">Галерея</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:900px;margin:0 auto;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div></div></div>` },
]

/* ═══════════ DEFAULT STRUCTURED ITEMS ═══════════ */

export const defaultCourseItems: CourseItem[] = [
  {
    id: 'mammoplasty',
    title: 'Post-Mammoplasty Recovery',
    titleRu: 'Восстановление после маммопластики',
    description: 'Safe recovery and active lifestyle',
    descriptionRu: 'Безопасное восстановление',
    price: 99,
    oldPrice: 149,
    duration: '6 weeks',
    lessons: 18,
    icon: '💗',
    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
    features: ['Safe scar exercises', 'Posture correction', 'Return to training', 'Expert guidance'],
    featuresRu: ['Работа с рубцом', 'Осанка', 'Возврат к тренировкам', 'Эксперт'],
    link: '/courses/mammoplasty'
  },
  {
    id: 'csection',
    title: 'Post C-Section Recovery',
    titleRu: 'После кесарева',
    description: 'For new moms after surgery',
    descriptionRu: 'Для мам после операции',
    price: 99,
    oldPrice: 149,
    duration: '8 weeks',
    lessons: 24,
    icon: '👶',
    gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    features: ['Core rehab', 'Diastasis recovery', 'Pelvic floor', 'Safe return'],
    featuresRu: ['Реабилитация кора', 'Диастаз', 'Тазовое дно', 'Безопасный возврат'],
    link: '/courses/csection'
  }
]

export const defaultProgramItems: ProgramItem[] = [
  {
    id: 'weight-loss',
    title: '8 weeks: Lose Weight',
    titleRu: '8 нед: Похудение',
    description: 'Comprehensive weight loss program with workouts and nutrition',
    descriptionRu: 'Комплексная программа похудения',
    price: 49,
    duration: '8 weeks',
    level: 'any',
    icon: '🎯',
    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
    features: ['24 workouts', 'Meal plan', 'In-app support'],
    featuresRu: ['24 тренировки', 'Питание', 'Поддержка'],
    link: '/programs/weight-loss',
    popular: true
  },
  {
    id: 'muscle-gain',
    title: '8 weeks: Build Muscle',
    titleRu: '8 нед: Масса',
    description: 'Muscle building with progressive overload',
    descriptionRu: 'Набор мышечной массы',
    price: 49,
    duration: '8 weeks',
    level: 'intermediate',
    icon: '💪',
    gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    features: ['32 workouts', 'Strength gains', 'Weight progression'],
    featuresRu: ['32 тренировки', 'Рост силы', 'Прогрессия'],
    link: '/programs/muscle-gain',
    popular: false
  },
  {
    id: 'beginner',
    title: '8 weeks: Beginner',
    titleRu: '8 нед: Новичок',
    description: 'Perfect start for fitness beginners',
    descriptionRu: 'Для начинающих',
    price: 39,
    duration: '8 weeks',
    level: 'beginner',
    icon: '⭐',
    gradient: 'linear-gradient(135deg,#22c55e,#10b981)',
    features: ['Basic exercises', 'Technique focus', 'Gradual progression'],
    featuresRu: ['Базовые', 'Техника', 'Постепенно'],
    link: '/programs/beginner',
    popular: false
  },
  {
    id: 'endurance',
    title: '8 weeks: Endurance',
    titleRu: '8 нед: Выносливость',
    description: 'Develop endurance & cardiovascular health',
    descriptionRu: 'Кардио и выносливость',
    price: 49,
    duration: '8 weeks',
    level: 'intermediate',
    icon: '⚡',
    gradient: 'linear-gradient(135deg,#f97316,#eab308)',
    features: ['Cardio + strength', 'Interval training', 'All-day energy'],
    featuresRu: ['Кардио+сила', 'Интервалы', 'Энергия'],
    link: '/programs/endurance',
    popular: false
  },
  {
    id: 'home',
    title: '8 weeks: Home Fitness',
    titleRu: '8 нед: Дома',
    description: 'Effective home workouts, no equipment',
    descriptionRu: 'Тренировки дома',
    price: 39,
    duration: '8 weeks',
    level: 'any',
    icon: '🏠',
    gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)',
    features: ['No equipment', '30-40 min', 'Home or travel'],
    featuresRu: ['Без инвентаря', '30-40 мин', 'Дома/в поездке'],
    link: '/programs/home',
    popular: false
  }
]

export const defaultResultItems: ResultItem[] = [
  {
    id: 'elena',
    name: 'Elena',
    nameRu: 'Елена',
    age: 34,
    result: '-16 kg in 4 months',
    resultRu: '-16 кг за 4 мес',
    quote: 'Changed my body & outlook!',
    quoteRu: 'Изменила тело и взгляд на жизнь!',
    icon: '📉'
  },
  {
    id: 'maria',
    name: 'Maria',
    nameRu: 'Мария',
    age: 29,
    result: '-14 kg in 6 months',
    resultRu: '-14 кг за 6 мес',
    quote: 'Back in shape after C-section!',
    quoteRu: 'Вернулась в форму после кесарева!',
    icon: '👶'
  },
  {
    id: 'anna',
    name: 'Anna',
    nameRu: 'Анна',
    age: 41,
    result: '-18 kg in 5 months',
    resultRu: '-18 кг за 5 мес',
    quote: 'Best shape at 40!',
    quoteRu: 'Лучшая форма в 40!',
    icon: '💪'
  }
]

/* ═══════════ DEFAULT SECTION DATA (Header, Hero, About) ═══════════ */

export const defaultHeaderData: HeaderData = {
  variant: 'classic',
  logoText: 'Qbody',
  logoSubtext: 'by Khavanskaia',
  logoSubtextRu: 'by Khavanskaia',
  logoIcon: 'Q',
  logoGradient: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
  logoPosition: 'left',
  navLinks: [
    { id: 'nav_programs', label: 'Programs', labelRu: 'Программы', href: '#programs' },
    { id: 'nav_courses', label: 'Courses', labelRu: 'Курсы', href: '#courses' },
    { id: 'nav_about', label: 'About', labelRu: 'О тренере', href: '#about' },
    { id: 'nav_results', label: 'Results', labelRu: 'Результаты', href: '#results' },
    { id: 'nav_contacts', label: 'Contacts', labelRu: 'Контакты', href: '#contacts' }
  ],
  navPosition: 'center',
  loginText: 'Log in',
  loginTextRu: 'Вход',
  loginLink: '/auth/login',
  ctaText: 'Get started',
  ctaTextRu: 'Начать',
  ctaLink: '/auth/register',
  bgColor: '#000000',
  bgOpacity: 1,
  textColor: '#ffffff',
  accentColor: '#14b8a6',
  sticky: true,
  topBar: {
    enabled: false,
    text: '🔥 Limited offer — 20% off all programs!',
    textRu: '🔥 Акция — скидка 20% на все программы!',
    link: '#programs',
    bgColor: '#14b8a6',
    textColor: '#ffffff'
  }
}

export const defaultHeroData: HeroData = {
  badge: '⭐ NASM CERTIFIED PERSONAL TRAINER',
  badgeRu: '⭐ СЕРТИФИЦИРОВАННЫЙ NASM ТРЕНЕР',
  title: 'Transform Your Body',
  titleRu: 'Преобрази тело',
  subtitle: 'Transform Your Life',
  subtitleRu: 'Преобрази жизнь',
  description: '17+ years of experience. 1000+ clients. Personalized programs and recovery courses for women of any fitness level.',
  descriptionRu: '17+ лет опыта. 1000+ клиентов. Персональные программы для женщин.',
  primaryBtnText: 'Start training',
  primaryBtnTextRu: 'Начать',
  primaryBtnLink: '/auth/register',
  secondaryBtnText: 'View programs →',
  secondaryBtnTextRu: 'Программы →',
  secondaryBtnLink: '#programs',
  features: ['Personal approach', 'Online & in-person', 'Proven results'],
  featuresRu: ['Инд. подход', 'Онлайн и офлайн', 'Результаты'],
  gradient: 'linear-gradient(135deg,#0f766e 0%,#115e59 25%,#134e4a 50%,#18181b 100%)',
  heroImage: '/images/hero-alexandra.jpg',
  imageMaxWidth: '480px',
  imageMaxHeight: '600px',
  imagePaddingTop: '0',
  imagePaddingBottom: '0',
  imagePaddingLeft: '0',
  imagePaddingRight: '0',
  imageBorderRadius: '24px',
  imageObjectFit: 'cover'
}

export const defaultAboutData: AboutData = {
  image: '/images/hero-alexandra.jpg',
  sectionLabel: 'ABOUT THE TRAINER',
  sectionLabelRu: 'О ТРЕНЕРЕ',
  name: 'Aleksandra Khavanskaia',
  tagline: 'Coach. Athlete. Mom.',
  taglineRu: 'Тренер. Спортсменка. Мама.',
  certificationsTitle: '🏆 Certifications',
  certificationsTitleRu: '🏆 Сертификаты',
  certifications: [
    "Master's Physical Culture",
    'NASM CPT',
    'CES, PBC, CNSC',
    'Pre/Post-Natal Fitness',
    'Rehabilitation'
  ],
  certificationsRu: [
    'Магистр физкультуры',
    'NASM CPT',
    'CES, PBC, CNSC',
    'Пре/постнатальный',
    'Реабилитация'
  ],
  careerTitle: '🏅 Career',
  careerTitleRu: '🏅 Карьера',
  career: [
    '🥈 Olympia & Arnold Amateur',
    '🏆 5× NPC Champion',
    '🥇 NPC National Gold'
  ],
  careerRu: [
    '🥈 Олимпия и Арнольд',
    '🏆 5× чемпион NPC',
    '🥇 Золото NPC'
  ],
  footer: 'Successfully self-rehabilitated through 5 major surgeries.',
  footerRu: 'Успешно восстановилась после 5 крупных операций.',
  tags: ['COACH', 'ATHLETE', 'MOM'],
  tagsRu: ['ТРЕНЕР', 'АТЛЕТ', 'МАМА'],
  personalJourneyTitle: 'Personal Journey',
  personalJourneyTitleRu: 'Личный путь',
  stats: [
    { value: '17+', label: 'Years Experience', labelRu: 'Лет опыта' },
    { value: '02', label: 'Children raised', labelRu: 'Детей' }
  ]
}

/* ═══════════ INIT BLOCKS ═══════════ */
const D = getDefaultContent()
const S0: SectionStyle = {}

export const initBlocks: PageBlock[] = [
  { id: 'header', type: 'header', label: 'Header', labelRu: 'Шапка', visible: true, contentEn: renderHeaderHTML(defaultHeaderData, 'en'), contentRu: renderHeaderHTML(defaultHeaderData, 'ru'), style: S0, data: defaultHeaderData },
  { id: 'hero', type: 'hero', label: 'Hero', labelRu: 'Баннер', visible: true, contentEn: renderHeroHTML(defaultHeroData, 'en'), contentRu: renderHeroHTML(defaultHeroData, 'ru'), style: S0, data: defaultHeroData },
  { id: 'programs', type: 'programs', label: 'Programs (5)', labelRu: 'Программы (5)', visible: true, contentEn: renderProgramsHTML(defaultProgramItems, 'en'), contentRu: renderProgramsHTML(defaultProgramItems, 'ru'), style: { bgColor: '#fafafa' }, items: defaultProgramItems },
  { id: 'courses', type: 'courses', label: 'Video Courses', labelRu: 'Видеокурсы', visible: true, contentEn: renderCoursesHTML(defaultCourseItems, 'en'), contentRu: renderCoursesHTML(defaultCourseItems, 'ru'), style: S0, items: defaultCourseItems },
  { id: 'about', type: 'about', label: 'About', labelRu: 'О тренере', visible: true, contentEn: renderAboutHTML(defaultAboutData, 'en'), contentRu: renderAboutHTML(defaultAboutData, 'ru'), style: { bgColor: '#fafafa' }, data: defaultAboutData },
  { id: 'results', type: 'results', label: 'Results', labelRu: 'Результаты', visible: true, contentEn: renderResultsHTML(defaultResultItems, 'en'), contentRu: renderResultsHTML(defaultResultItems, 'ru'), style: S0, items: defaultResultItems },
  { id: 'footer', type: 'footer', label: 'Footer', labelRu: 'Подвал', visible: true, contentEn: D.en.footer, contentRu: D.ru.footer, style: S0 },
]
