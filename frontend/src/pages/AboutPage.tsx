import React from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Target, Presentation, Gamepad2, BarChart3, Trophy,
    GraduationCap, ClipboardList, Mail, Phone, MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div>
            {/* Hero Section */}
            <section className="about-hero">
                <h1 className="about-hero-title">{t('about.heroTitle')}</h1>
                <p className="about-hero-subtitle">
                    {t('about.heroSubtitle')}
                </p>
            </section>

            {/* Features Section */}
            <section className="about-features">
                <div className="about-feature">
                    <div className="about-feature-icon"><BookOpen size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.library.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.library.text')}
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon"><Target size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.quizzes.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.quizzes.text')}
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon"><Presentation size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.teachers.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.teachers.text')}
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon"><Gamepad2 size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.kahoot.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.kahoot.text')}
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon"><BarChart3 size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.progress.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.progress.text')}
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon"><Trophy size={30} strokeWidth={1.85} /></div>
                    <h3 className="about-feature-title">{t('about.features.achievements.title')}</h3>
                    <p className="about-feature-description">
                        {t('about.features.achievements.text')}
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section style={{
                textAlign: 'center',
                padding: 'var(--space-12)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-2xl)',
                marginBottom: 'var(--space-12)'
            }}>
                <h2 style={{
                    fontSize: 'var(--font-size-3xl)',
                    marginBottom: 'var(--space-4)',
                    fontFamily: 'var(--font-family-display)'
                }}>
                    {t('about.missionTitle')}
                </h2>
                <p style={{
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto var(--space-6)',
                    lineHeight: 'var(--line-height-relaxed)'
                }}>
                    {t('about.missionText')}
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/quizzes" className="btn btn-primary btn-lg">
                        {t('about.startLearning')}
                    </Link>
                    <Link to="/resources" className="btn btn-secondary btn-lg">
                        {t('about.exploreResources')}
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-strip" style={{ marginBottom: 'var(--space-12)' }}>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon"><GraduationCap size={24} strokeWidth={1.85} /></div>
                    <div className="stats-strip-value">1000+</div>
                    <div className="stats-strip-label">{t('about.stats.students')}</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon"><BookOpen size={24} strokeWidth={1.85} /></div>
                    <div className="stats-strip-value">500+</div>
                    <div className="stats-strip-label">{t('about.stats.resources')}</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon"><ClipboardList size={24} strokeWidth={1.85} /></div>
                    <div className="stats-strip-value">200+</div>
                    <div className="stats-strip-label">{t('about.stats.quizzes')}</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon"><Presentation size={24} strokeWidth={1.85} /></div>
                    <div className="stats-strip-value">50+</div>
                    <div className="stats-strip-label">{t('about.stats.teachers')}</div>
                </div>
            </section>

            {/* Contact Section */}
            <section style={{
                textAlign: 'center',
                padding: 'var(--space-12)',
                background: 'linear-gradient(135deg, rgba(47, 85, 240, 0.08), rgba(27, 58, 196, 0.05))',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid rgba(47, 85, 240, 0.2)'
            }}>
                <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    marginBottom: 'var(--space-4)',
                    fontFamily: 'var(--font-family-display)'
                }}>
                    {t('about.contactTitle')}
                </h2>
                <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-6)'
                }}>
                    {t('about.contactSubtitle')}
                </p>
                <div className="flex gap-6 justify-center" style={{ flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 'var(--space-2)' }}><Mail size={24} strokeWidth={1.85} /></div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{t('about.email')}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            support@meroos.edu
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 'var(--space-2)' }}><Phone size={24} strokeWidth={1.85} /></div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{t('about.phone')}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            +1 (555) 123-4567
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 'var(--space-2)' }}><MapPin size={24} strokeWidth={1.85} /></div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{t('about.location')}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            123 Education Street
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
