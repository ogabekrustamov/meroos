import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sun, Moon, ArrowRight, LogIn, Sparkles, Clock,
    Target, Gamepad2, BookOpen, Trophy, BarChart3, Newspaper,
    GraduationCap, Presentation, ShieldCheck, CheckCircle2,
    Triangle, Diamond, Circle, Square, Flame, Star, Zap, Play,
    type LucideIcon,
} from 'lucide-react';
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

/* ---------- Static data ---------- */
const FEATURES: { icon: LucideIcon; title: string; text: string; grad: string }[] = [
    {
        icon: Target,
        title: 'Interactive Quizzes',
        text: 'Gamified quizzes across every subject and difficulty. Earn points, get instant feedback, and review every question afterwards.',
        grad: 'var(--gradient-primary)',
    },
    {
        icon: Gamepad2,
        title: 'Live Kahoot Games',
        text: 'Host or join real-time quiz battles with a room code. Compete live with classmates and watch the leaderboard update instantly.',
        grad: 'var(--gradient-accent)',
    },
    {
        icon: BookOpen,
        title: 'Resource Library',
        text: 'A curated hub of videos, PDFs, links, and study materials. Bookmark favourites and rate what helps you most.',
        grad: 'var(--gradient-secondary)',
    },
    {
        icon: Trophy,
        title: 'Leaderboards & Streaks',
        text: 'Climb the class and global rankings, build daily learning streaks, and earn achievements as you progress.',
        grad: 'var(--gradient-primary)',
    },
    {
        icon: BarChart3,
        title: 'Progress Analytics',
        text: 'Track quizzes completed, points earned, average scores and class rank with clear, personalised insights.',
        grad: 'var(--gradient-secondary)',
    },
    {
        icon: Newspaper,
        title: 'News & Announcements',
        text: 'Stay in the loop with the latest posts, updates, and announcements from your teachers and school.',
        grad: 'var(--gradient-accent)',
    },
];

const STEPS = [
    { title: 'Sign in', text: 'Log in with your account or continue as a guest to explore quizzes and resources instantly.' },
    { title: 'Learn & play', text: 'Take interactive quizzes, join live Kahoot games, and dive into the resource library.' },
    { title: 'Track & climb', text: 'Build streaks, watch your stats grow, and rise up the leaderboard with every win.' },
];

type RoleKey = 'students' | 'teachers' | 'admins';
const ROLES: Record<RoleKey, {
    icon: LucideIcon; title: string; sub: string; desc: string; points: string[];
}> = {
    students: {
        icon: GraduationCap,
        title: 'For Students',
        sub: 'Learn & compete',
        desc: 'Everything you need to learn actively, stay motivated, and measure your growth.',
        points: [
            'Take gamified quizzes and earn points',
            'Join live Kahoot games with a code',
            'Build daily learning streaks',
            'Review your full quiz history',
            'Browse the resource library',
            'Climb class & global leaderboards',
        ],
    },
    teachers: {
        icon: Presentation,
        title: 'For Teachers',
        sub: 'Create & guide',
        desc: 'Powerful authoring and live tools to engage your classes and track every learner.',
        points: [
            'Build quizzes with rich question types',
            'Host live Kahoot sessions',
            'Upload and organise resources',
            'Manage classes and students',
            'View detailed class statistics',
            'Post news and announcements',
        ],
    },
    admins: {
        icon: ShieldCheck,
        title: 'For Admins',
        sub: 'Oversee & control',
        desc: 'Full oversight of the platform — people, organisations, and performance in one place.',
        points: [
            'Manage all users and roles',
            'Organise schools and classes',
            'Monitor platform-wide analytics',
            'Oversee all content',
            'Configure permissions',
            'Keep everything running smoothly',
        ],
    },
};

/* Interactive demo quiz */
const DEMO_ANSWERS = [
    { label: 'Paris', shape: <Triangle size={16} strokeWidth={2.6} /> },
    { label: 'Rome', shape: <Diamond size={16} strokeWidth={2.6} /> },
    { label: 'Berlin', shape: <Circle size={16} strokeWidth={2.6} /> },
    { label: 'Madrid', shape: <Square size={16} strokeWidth={2.6} /> },
];
const DEMO_CORRECT = 0;

const LandingPage: React.FC = () => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeRole, setActiveRole] = useState<RoleKey>('students');
    const [picked, setPicked] = useState<number | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const role = ROLES[activeRole];
    const RoleIcon = role.icon;

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
                        <a className="lp-nav-link" href="#features">Features</a>
                        <a className="lp-nav-link" href="#how">How it works</a>
                        <a className="lp-nav-link" href="#roles">For everyone</a>
                        <a className="lp-nav-link" href="#demo">Try a quiz</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button
                            className="lp-icon-btn"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={isDarkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {isDarkMode ? <Sun size={18} strokeWidth={1.85} /> : <Moon size={18} strokeWidth={1.85} />}
                        </button>
                        <Link to="/login" className="btn btn-primary">
                            <LogIn size={16} strokeWidth={2} /> Sign In
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
                        <span className="lp-eyebrow"><span className="lp-dot" /> Learning, made playful</span>
                        <h1 className="lp-hero-title">
                            Turn studying into a <span className="lp-grad">game you win</span>.
                        </h1>
                        <p className="lp-hero-sub">
                            Meroos is an interactive learning platform where students take gamified quizzes,
                            join live Kahoot-style games, explore a rich resource library, and climb the
                            leaderboard — while teachers create and track it all.
                        </p>
                        <div className="lp-hero-cta">
                            <Link to="/login" className="btn btn-primary btn-lg">
                                Get started <ArrowRight size={18} strokeWidth={2} />
                            </Link>
                            <a href="#demo" className="btn btn-secondary btn-lg">
                                <Play size={16} strokeWidth={2} /> Try a sample quiz
                            </a>
                        </div>
                        <div className="lp-hero-trust">
                            <div className="lp-avatars">
                                <span style={{ background: 'var(--shape-red)' }}>A</span>
                                <span style={{ background: 'var(--shape-blue)' }}>K</span>
                                <span style={{ background: 'var(--shape-green)' }}>M</span>
                                <span style={{ background: 'var(--shape-gold)' }}>+</span>
                            </div>
                            Joined by <strong>1,000+</strong> learners and educators
                        </div>
                    </div>

                    {/* Animated mock live-quiz card */}
                    <div className="lp-hero-visual">
                        <div className="lp-chip lp-chip-xp"><Zap size={16} strokeWidth={2.4} /> +10 XP</div>
                        <div className="lp-chip lp-chip-streak"><Flame size={16} strokeWidth={2.2} /> 7-day streak</div>
                        <div className="lp-chip lp-chip-rank"><Trophy size={16} strokeWidth={2.2} /> Rank #1</div>

                        <div className="lp-quizmock">
                            <div className="lp-quizmock-top">
                                <span className="lp-quizmock-pill">Question 3 / 10</span>
                                <span className="lp-quizmock-timer">12</span>
                            </div>
                            <div className="lp-quizmock-q">Which planet is known as the Red Planet?</div>
                            <div className="lp-shapes">
                                <span className="lp-shape lp-shape-red"><Triangle size={18} strokeWidth={2.6} /> Venus</span>
                                <span className="lp-shape lp-shape-blue"><Diamond size={18} strokeWidth={2.6} /> Jupiter</span>
                                <span className="lp-shape lp-shape-gold"><Circle size={18} strokeWidth={2.6} /> Saturn</span>
                                <span className="lp-shape lp-shape-green"><Square size={18} strokeWidth={2.6} /> Mars</span>
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
                                <div className="lp-statbar-label">Active learners</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={200} suffix="+" />
                                <div className="lp-statbar-label">Quizzes</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={500} suffix="+" />
                                <div className="lp-statbar-label">Resources</div>
                            </div>
                            <div className="lp-statbar-item">
                                <CountUp end={50} suffix="+" />
                                <div className="lp-statbar-label">Expert teachers</div>
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
                            <div className="lp-kicker">What you get</div>
                            <h2 className="lp-h2">Everything you need to learn, in one place</h2>
                            <p className="lp-lead">
                                From solo practice to live class battles, Meroos brings the whole learning
                                journey together — engaging, measurable, and fun.
                            </p>
                        </div>
                    </Reveal>
                    <div className="lp-features">
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <Reveal key={f.title} delay={(i % 3) * 90}>
                                    <article className="lp-feature" style={{ ['--feat-grad' as string]: f.grad }}>
                                        <div className="lp-feature-icon" style={{ background: f.grad }}>
                                            <Icon size={26} strokeWidth={1.9} />
                                        </div>
                                        <h3 className="lp-feature-title">{f.title}</h3>
                                        <p className="lp-feature-text">{f.text}</p>
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
                            <div className="lp-kicker">How it works</div>
                            <h2 className="lp-h2">Up and running in three steps</h2>
                        </div>
                    </Reveal>
                    <div className="lp-steps">
                        {STEPS.map((s, i) => (
                            <Reveal key={s.title} delay={i * 120}>
                                <div className="lp-step">
                                    <div className="lp-step-num">{i + 1}</div>
                                    <h3>{s.title}</h3>
                                    <p>{s.text}</p>
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
                            <div className="lp-kicker">Built for everyone</div>
                            <h2 className="lp-h2">One platform, every role</h2>
                            <p className="lp-lead">Students, teachers, and admins each get tools designed for what they do.</p>
                        </div>
                    </Reveal>
                    <Reveal>
                        <div className="lp-roles">
                            <div className="lp-role-tabs">
                                {(Object.keys(ROLES) as RoleKey[]).map((key) => {
                                    const r = ROLES[key];
                                    const TabIcon = r.icon;
                                    return (
                                        <button
                                            key={key}
                                            className={`lp-role-tab ${activeRole === key ? 'is-active' : ''}`}
                                            onClick={() => setActiveRole(key)}
                                        >
                                            <span className="lp-role-tab-icon"><TabIcon size={22} strokeWidth={1.9} /></span>
                                            <span>
                                                <span className="lp-role-tab-title" style={{ display: 'block' }}>{r.title}</span>
                                                <span className="lp-role-tab-sub">{r.sub}</span>
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
                                    <h3 style={{ marginBottom: 0 }}>{role.title}</h3>
                                </div>
                                <p className="lp-role-desc">{role.desc}</p>
                                <ul className="lp-role-list">
                                    {role.points.map((p) => (
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
                                <div className="lp-kicker">Try it now</div>
                                <h2 className="lp-h2">This is what a quiz feels like</h2>
                                <p>
                                    Tap an answer to see the instant, colourful feedback students get on every
                                    question. No sign-up needed — go ahead, give it a shot.
                                </p>
                                <div className="lp-demo-score">
                                    <Sparkles size={18} strokeWidth={2} />
                                    {picked === null
                                        ? 'Pick an answer'
                                        : picked === DEMO_CORRECT ? 'Score +10 XP' : 'Try again!'}
                                </div>
                            </div>

                            <div className="lp-demo-card">
                                <div className="lp-quizmock-top" style={{ marginBottom: 'var(--space-4)' }}>
                                    <span className="lp-quizmock-pill">Geography</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--peak-dim)', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                                        <Clock size={15} strokeWidth={2} /> 0:12
                                    </span>
                                </div>
                                <div className="lp-demo-q">What is the capital of France?</div>
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
                                                key={a.label}
                                                className={`lp-answer lp-answer-${i} ${state}`}
                                                disabled={answered}
                                                onClick={() => setPicked(i)}
                                            >
                                                <span className="lp-answer-shape">{a.shape}</span>
                                                {a.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {picked !== null && (
                                    <>
                                        <div className={`lp-demo-feedback ${picked === DEMO_CORRECT ? 'ok' : 'no'}`}>
                                            {picked === DEMO_CORRECT
                                                ? '🎉 Correct! That\'s how you earn points.'
                                                : 'Not quite — Paris is the answer. Keep going!'}
                                        </div>
                                        <button className="btn lp-demo-reset" onClick={() => setPicked(null)}>
                                            Try again
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
                            <h2>Ready to make learning click?</h2>
                            <p>Sign in to start taking quizzes, joining live games, and tracking your progress today.</p>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to="/login" className="btn btn-lg lp-btn-light">
                                    Sign in to Meroos <ArrowRight size={18} strokeWidth={2} />
                                </Link>
                                <button className="btn btn-lg btn-ghost" style={{ color: '#fff' }} onClick={() => navigate('/guest')}>
                                    Continue as guest
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
                            <p>An interactive learning platform that turns quizzes, live games, and resources into measurable progress.</p>
                        </div>
                        <div className="lp-footer-cols">
                            <div className="lp-footer-col">
                                <h4>Platform</h4>
                                <a href="#features">Features</a>
                                <a href="#how">How it works</a>
                                <a href="#roles">For everyone</a>
                                <a href="#demo">Try a quiz</a>
                            </div>
                            <div className="lp-footer-col">
                                <h4>Get started</h4>
                                <Link to="/login">Sign in</Link>
                                <Link to="/guest">Continue as guest</Link>
                            </div>
                            <div className="lp-footer-col">
                                <h4>Contact</h4>
                                <a href="mailto:support@meroos.edu">support@meroos.edu</a>
                                <a href="tel:+15551234567">+1 (555) 123-4567</a>
                            </div>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <span>© {new Date().getFullYear()} Meroos. All rights reserved.</span>
                        <span>Made for curious minds.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
