import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
    return (
        <div>
            {/* Hero Section */}
            <section className="about-hero">
                <h1 className="about-hero-title">About Meroos</h1>
                <p className="about-hero-subtitle">
                    Empowering students with world-class education through innovative technology
                    and expert mentorship. Your journey to knowledge starts here.
                </p>
            </section>

            {/* Features Section */}
            <section className="about-features">
                <div className="about-feature">
                    <div className="about-feature-icon">📚</div>
                    <h3 className="about-feature-title">Extensive Library</h3>
                    <p className="about-feature-description">
                        Access thousands of resources, study materials, and educational content
                        curated by expert educators.
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon">🎯</div>
                    <h3 className="about-feature-title">Interactive Quizzes</h3>
                    <p className="about-feature-description">
                        Test your knowledge with gamified quizzes, earn points, and track your
                        progress on the leaderboard.
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon">👨‍🏫</div>
                    <h3 className="about-feature-title">Expert Teachers</h3>
                    <p className="about-feature-description">
                        Learn from experienced mentors who are passionate about helping you
                        achieve your educational goals.
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon">🎮</div>
                    <h3 className="about-feature-title">Kahoot Games</h3>
                    <p className="about-feature-description">
                        Join live quiz games with your classmates for a fun and competitive
                        learning experience.
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon">📊</div>
                    <h3 className="about-feature-title">Progress Tracking</h3>
                    <p className="about-feature-description">
                        Monitor your learning journey with detailed statistics, streaks, and
                        personalized insights.
                    </p>
                </div>

                <div className="about-feature">
                    <div className="about-feature-icon">🏆</div>
                    <h3 className="about-feature-title">Achievements</h3>
                    <p className="about-feature-description">
                        Earn badges and climb the leaderboard as you complete quizzes and
                        maintain your learning streak.
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
                    Our Mission
                </h2>
                <p style={{
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto var(--space-6)',
                    lineHeight: 'var(--line-height-relaxed)'
                }}>
                    At Meroos, we believe that quality education should be accessible, engaging,
                    and fun. Our platform combines cutting-edge technology with proven pedagogical
                    methods to create a learning experience that inspires curiosity and drives results.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/quizzes" className="btn btn-primary btn-lg">
                        Start Learning
                    </Link>
                    <Link to="/resources" className="btn btn-secondary btn-lg">
                        Explore Resources
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-strip" style={{ marginBottom: 'var(--space-12)' }}>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon">👨‍🎓</div>
                    <div className="stats-strip-value">1000+</div>
                    <div className="stats-strip-label">Active Students</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon">📚</div>
                    <div className="stats-strip-value">500+</div>
                    <div className="stats-strip-label">Resources</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon">📝</div>
                    <div className="stats-strip-value">200+</div>
                    <div className="stats-strip-label">Quizzes</div>
                </div>
                <div className="stats-strip-item">
                    <div className="stats-strip-icon">👩‍🏫</div>
                    <div className="stats-strip-value">50+</div>
                    <div className="stats-strip-label">Expert Teachers</div>
                </div>
            </section>

            {/* Contact Section */}
            <section style={{
                textAlign: 'center',
                padding: 'var(--space-12)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    marginBottom: 'var(--space-4)',
                    fontFamily: 'var(--font-family-display)'
                }}>
                    Get in Touch
                </h2>
                <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-6)'
                }}>
                    Have questions? We'd love to hear from you.
                </p>
                <div className="flex gap-6 justify-center" style={{ flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>📧</div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Email</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            support@meroos.edu
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>📞</div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Phone</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            +1 (555) 123-4567
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>📍</div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Location</div>
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
