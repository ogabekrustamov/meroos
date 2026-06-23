import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sun, Moon, ArrowRight, LogIn, Sparkles, Clock,
    Target, Gamepad2, BookOpen, Trophy, BarChart3, Newspaper,
    GraduationCap, Presentation, ShieldCheck, CheckCircle2,
    Triangle, Diamond, Circle, Square, Flame, Star, Zap, Play,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts';
import './LandingPage.css';

/* ---------- Scroll-reveal wrapper ---------- */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
    children, className = '', delay = 0,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`lp-reveal ${visible ? 'is-visible' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

/* ---------- Count-up number (animates when scrolled into view) ---------- */
const CountUp: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
    end, suffix = '', duration = 1600,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            obs.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                setValue(Math.round(eased * end));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { threshold: 0.4 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [end, duration]);

    return <div ref={ref} className="lp-statbar-value">{value.toLocaleString()}{suffix}</div>;
};

/* ---------- Static data (text pulled from i18n by key at render time) ---------- */
const FEATURES: { icon: LucideIcon; key: string; grad: string }[] = [
    { icon: Target, key: 'quizzes', grad: 'var(--gradient-primary)' },
    { icon: Gamepad2, key: 'kahoot', grad: 'var(--gradient-accent)' },
    { icon: BookOpen, key: 'library', grad: 'var(--gradient-secondary)' },
    { icon: Trophy, key: 'leaderboards', grad: 'var(--gradient-primary)' },
    { icon: BarChart3, key: 'analytics', grad: 'var(--gradient-secondary)' },
    { icon: Newspaper, key: 'news', grad: 'var(--gradient-accent)' },
];

const STEP_KEYS = ['signIn', 'learn', 'track'] as const;

type RoleKey = 'students' | 'teachers' | 'admins';
const ROLE_ICONS: Record<RoleKey, LucideIcon> = {
    students: GraduationCap,
    teachers: Presentation,
    admins: ShieldCheck,
};

/* Interactive demo quiz — labels resolved from i18n by key */
const DEMO_ANSWERS = [
    { key: 'paris', shape: <Triangle size={16} strokeWidth={2.6} /> },
    { key: 'rome', shape: <Diamond size={16} strokeWidth={2.6} /> },
    { key: 'berlin', shape: <Circle size={16} strokeWidth={2.6} /> },
    { key: 'madrid', shape: <Square size={16} strokeWidth={2.6} /> },
];
const DEMO_CORRECT = 0;

const LandingPage: React.FC = () => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeRole, setActiveRole] = useState<RoleKey>('students');
    const [picked, setPicked] = useState<number | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const RoleIcon = ROLE_ICONS[activeRole];
    const rolePoints = t(`landing.roles.${activeRole}.points`, { returnObjects: true }) as string[];

    return (
        <div className="lp">
            {/* ===== Navigation ===== */}
            <nav className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
                <div className="lp-container lp-nav-inner">
                    <a href="#top" className="lp-brand">
                        <span className="lp-brand-mark">M</span>
                        Meroos
                    </a>
                    <div className="lp-nav-links">
                        <a className="lp-nav-link" href="#features">{t('landing.nav.features')}</a>
                        <a className="lp-nav-link" href="#how">{t('landing.nav.how')}</a>
                        <a className="lp-nav-link" href="#roles">{t('landing.nav.roles')}</a>
                        <a className="lp-nav-link" href="#demo">{t('landing.nav.demo')}</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button
                            className="lp-icon-btn"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? t('theme.switchToLight') : t('theme.switchToDark')}
                            title={isDarkMode ? t('theme.lightMode') : t('theme.darkMode')}
                        >
                            {isDarkMode ? <Sun size={18} strokeWidth={1.85} /> : <Moon size={18} strokeWidth={1.85} />}
                        </button>
                        <Link to="/login" className="btn btn-primary">
                            <LogIn size={16} strokeWidth={2} /> {t('landing.nav.signIn')}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ===== Hero ===== */}
            <header className="lp-hero" id="top">
                <div className="lp-hero-bg">
                    <span className="lp-blob lp-blob-1" />
                    <span className="lp-blob lp-blob-2" />
                    <span className="lp-blob lp-blob-3" />
                </div>
                <div className="lp-container lp-hero-inner">
                    <div className="lp-hero-copy">
                        <span className="lp-eyebrow"><span className="lp-dot" /> {t('landing.hero.eyebrow')}</span>
                        <h1 className="lp-hero-title">
                            {t('landing.hero.titlePre')} <span className="lp-grad">{t('landing.hero.titleHighlight')}</span>.
                        </h1>
                        <p className="lp-hero-sub">
                            {t('landing.hero.sub')}
                        </p>
                        <div className="lp-hero-cta">
                            <Link to="/login" className="btn btn-primary btn-lg">
                                {t('landing.hero.getStarted')} <ArrowRight size={18} strokeWidth={2} />
                            </Link>
                            <a href="#demo" className="btn btn-secondary btn-lg">
                                <Play size={16} strokeWidth={2} /> {t('landing.hero.trySample')}
                            </a>
                        </div>
                        <div className="lp-hero-trust">
                            <div className="lp-avatars">
                                <span style={{ background: 'var(--shape-red)' }}>A</span>
                                <span style={{ background: 'var(--shape-blue)' }}>K</span>
                                <span style={{ background: 'var(--shape-green)' }}>M</span>
                                <span style={{ background: 'var(--shape-gold)' }}>+</span>
                            </div>
                            {t('landing.hero.joinedBy', { count: 1000 })}
                        </div>
                    </div>

                    {/* Animated mock live-quiz card */}
                    <div className="lp-hero-visual">
                        <div className="lp-chip lp-chip-xp"><Zap size={16} strokeWidth={2.4} /> +10 XP</div>
                        <div className="lp-chip lp-chip-streak"><Flame size={16} strokeWidth={2.2} /> 7-day streak</div>
                        <div className="lp-chip lp-chip-rank"><Trophy size={16} strokeWidth={2.2} /> Rank #1</div>

                        <div className="lp-quizmock">
                            <div className="lp-quizmock-top">
                                <span className="lp-quizmock-pill">{t('landing.quizmock.progress', { current: 3, total: 10 })}</span>
                                <span className="lp-quizmock-timer">12</span>
                            </div>
                            <div className="lp-quizmock-q">{t('landing.quizmock.question')}</div>
                            <div className="lp-shapes">
                                <span className="lp-shape lp-shape-red"><Triangle size={18} strokeWidth={2.6} /> {t('landing.quizmock.venus')}</span>
                                <span className="lp-shape lp-shape-blue"><Diamond size={18} strokeWidth={2.6} /> {t('landing.quizmock.jupiter')}</span>
                                <span className="lp-shape lp-shape-gold"><Circle size={18} strokeWidth={2.6} /> {t('landing.quizmock.saturn')}</span>
                                <span className="lp-shape lp-shape-green"><Square size={18} strokeWidth={2.6} /> {t('landing.quizmock.mars')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-statbar">
                            <div className="lp-statbar-item">
                                <CountUp end={1000} suffix="+" />
                                <div className="lp-statbar-label">{t('landing.stats.learners')}</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={200} suffix="+" />
                                <div className="lp-statbar-label">{t('landing.stats.quizzes')}</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={500} suffix="+" />
                                <div className="lp-statbar-label">{t('landing.stats.resources')}</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={50} suffix="+" />
                                <div className="lp-statbar-label">{t('landing.stats.teachers')}</div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </header>

            {/* ===== Features ===== */}
            <section className="lp-section" id="features">
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-section-head">
                            <div className="lp-kicker">{t('landing.features.kicker')}</div>
                            <h2 className="lp-h2">{t('landing.features.title')}</h2>
                            <p className="lp-lead">
                                {t('landing.features.lead')}
                            </p>
                        </div>
                    </Reveal>
                    <div className="lp-features">
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <Reveal key={f.key} delay={(i % 3) * 90}>
                                    <article className="lp-feature" style={{ ['--feat-grad' as string]: f.grad }}>
                                        <div className="lp-feature-icon" style={{ background: f.grad }}>
                                            <Icon size={26} strokeWidth={1.9} />
                                        </div>
                                        <h3 className="lp-feature-title">{t(`landing.features.items.${f.key}.title`)}</h3>
                                        <p className="lp-feature-text">{t(`landing.features.items.${f.key}.text`)}</p>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== How it works ===== */}
            <section className="lp-section" id="how" style={{ paddingTop: 0 }}>
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-section-head">
                            <div className="lp-kicker">{t('landing.how.kicker')}</div>
                            <h2 className="lp-h2">{t('landing.how.title')}</h2>
                        </div>
                    </Reveal>
                    <div className="lp-steps">
                        {STEP_KEYS.map((key, i) => (
                            <Reveal key={key} delay={i * 120}>
                                <div className="lp-step">
                                    <div className="lp-step-num">{i + 1}</div>
                                    <h3>{t(`landing.how.steps.${key}.title`)}</h3>
                                    <p>{t(`landing.how.steps.${key}.text`)}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Roles ===== */}
            <section className="lp-section" id="roles" style={{ paddingTop: 0 }}>
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-section-head">
                            <div className="lp-kicker">{t('landing.roles.kicker')}</div>
                            <h2 className="lp-h2">{t('landing.roles.title')}</h2>
                            <p className="lp-lead">{t('landing.roles.lead')}</p>
                        </div>
                    </Reveal>
                    <Reveal>
                        <div className="lp-roles">
                            <div className="lp-role-tabs">
                                {(Object.keys(ROLE_ICONS) as RoleKey[]).map((key) => {
                                    const TabIcon = ROLE_ICONS[key];
                                    return (
                                        <button
                                            key={key}
                                            className={`lp-role-tab ${activeRole === key ? 'is-active' : ''}`}
                                            onClick={() => setActiveRole(key)}
                                        >
                                            <span className="lp-role-tab-icon"><TabIcon size={22} strokeWidth={1.9} /></span>
                                            <span>
                                                <span className="lp-role-tab-title" style={{ display: 'block' }}>{t(`landing.roles.${key}.title`)}</span>
                                                <span className="lp-role-tab-sub">{t(`landing.roles.${key}.sub`)}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="lp-role-panel" key={activeRole}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <span className="lp-feature-icon" style={{ width: 48, height: 48, marginBottom: 0 }}>
                                        <RoleIcon size={24} strokeWidth={1.9} />
                                    </span>
                                    <h3 style={{ marginBottom: 0 }}>{t(`landing.roles.${activeRole}.title`)}</h3>
                                </div>
                                <p className="lp-role-desc">{t(`landing.roles.${activeRole}.desc`)}</p>
                                <ul className="lp-role-list">
                                    {rolePoints.map((p) => (
                                        <li key={p}><CheckCircle2 size={18} strokeWidth={2} /> {p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Interactive demo quiz ===== */}
            <section className="lp-section" id="demo" style={{ paddingTop: 0 }}>
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-demo">
                            <div className="lp-demo-copy">
                                <div className="lp-kicker">{t('landing.demo.kicker')}</div>
                                <h2 className="lp-h2">{t('landing.demo.title')}</h2>
                                <p>
                                    {t('landing.demo.text')}
                                </p>
                                <div className="lp-demo-score">
                                    <Sparkles size={18} strokeWidth={2} />
                                    {picked === null
                                        ? t('landing.demo.pickAnswer')
                                        : picked === DEMO_CORRECT ? t('landing.demo.score') : t('landing.demo.tryAgainShort')}
                                </div>
                            </div>

                            <div className="lp-demo-card">
                                <div className="lp-quizmock-top" style={{ marginBottom: 'var(--space-4)' }}>
                                    <span className="lp-quizmock-pill">{t('landing.demo.category')}</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--peak-dim)', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                                        <Clock size={15} strokeWidth={2} /> 0:12
                                    </span>
                                </div>
                                <div className="lp-demo-q">{t('landing.demo.question')}</div>
                                <div className="lp-demo-answers">
                                    {DEMO_ANSWERS.map((a, i) => {
                                        const answered = picked !== null;
                                        let state = '';
                                        if (answered) {
                                            if (i === DEMO_CORRECT) state = 'is-correct';
                                            else if (i === picked) state = 'is-wrong';
                                            else state = 'is-dim';
                                        }
                                        return (
                                            <button
                                                key={a.key}
                                                className={`lp-answer lp-answer-${i} ${state}`}
                                                disabled={answered}
                                                onClick={() => setPicked(i)}
                                            >
                                                <span className="lp-answer-shape">{a.shape}</span>
                                                {t(`landing.demo.answers.${a.key}`)}
                                            </button>
                                        );
                                    })}
                                </div>

                                {picked !== null && (
                                    <>
                                        <div className={`lp-demo-feedback ${picked === DEMO_CORRECT ? 'ok' : 'no'}`}>
                                            {picked === DEMO_CORRECT
                                                ? t('landing.demo.correct')
                                                : t('landing.demo.wrong')}
                                        </div>
                                        <button className="btn lp-demo-reset" onClick={() => setPicked(null)}>
                                            {t('landing.demo.tryAgain')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Final CTA ===== */}
            <section className="lp-section" style={{ paddingTop: 0 }}>
                <div className="lp-container">
                    <Reveal>
                        <div className="lp-cta">
                            <Star className="lp-cta-shape lp-cta-shape-1" size={120} strokeWidth={1} />
                            <Trophy className="lp-cta-shape lp-cta-shape-2" size={140} strokeWidth={1} />
                            <h2>{t('landing.cta.title')}</h2>
                            <p>{t('landing.cta.text')}</p>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to="/login" className="btn btn-lg lp-btn-light">
                                    {t('landing.cta.signIn')} <ArrowRight size={18} strokeWidth={2} />
                                </Link>
                                <button className="btn btn-lg btn-ghost" style={{ color: '#fff' }} onClick={() => navigate('/guest')}>
                                    {t('landing.cta.guest')}
                                </button>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="lp-footer">
                <div className="lp-container">
                    <div className="lp-footer-top">
                        <div className="lp-footer-brand">
                            <a href="#top" className="lp-brand">
                                <span className="lp-brand-mark">M</span> Meroos
                            </a>
                            <p>{t('landing.footer.tagline')}</p>
                        </div>
                        <div className="lp-footer-cols">
                            <div className="lp-footer-col">
                                <h4>{t('landing.footer.platform')}</h4>
                                <a href="#features">{t('landing.nav.features')}</a>
                                <a href="#how">{t('landing.nav.how')}</a>
                                <a href="#roles">{t('landing.nav.roles')}</a>
                                <a href="#demo">{t('landing.nav.demo')}</a>
                            </div>
                            <div className="lp-footer-col">
                                <h4>{t('landing.footer.getStarted')}</h4>
                                <Link to="/login">{t('landing.footer.signIn')}</Link>
                                <Link to="/guest">{t('landing.footer.guest')}</Link>
                            </div>
                            <div className="lp-footer-col">
                                <h4>{t('landing.footer.contact')}</h4>
                                <a href="mailto:support@meroos.edu">support@meroos.edu</a>
                                <a href="tel:+15551234567">+1 (555) 123-4567</a>
                            </div>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <span>{t('landing.footer.rights', { year: new Date().getFullYear() })}</span>
                        <span>{t('landing.footer.madeFor')}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
