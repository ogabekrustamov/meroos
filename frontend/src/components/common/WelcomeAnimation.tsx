import React from 'react';
import {
    ShieldCheck, Users, BarChart3, Activity, Settings,
    FilePlus, CheckCircle2, Pencil, HelpCircle, ListChecks,
    BookOpen, Star, Trophy, Flame, Award,
    Lightbulb, Target, GraduationCap, Rocket, Sparkles, Brain,
    Triangle, Diamond, Circle, Square, Play,
} from 'lucide-react';
import './WelcomeAnimation.css';

export type WelcomeVariant = 'admin' | 'teacher' | 'student' | 'guest';

/**
 * Decorative, infinitely-looping animation tailored to each role's job on the
 * quiz platform. Purely cosmetic: rendered behind the welcome-block text and
 * hidden from assistive tech.
 *
 *  - admin   : oversight & control  -> pulsing shield, live analytics bars, network nodes, spinning gear
 *  - teacher : authoring & grading  -> a quiz being built, question marks, ticking grade checklist
 *  - student : learning & earning   -> floating books/stars, a streak flame, a popping "+points" badge
 *  - guest   : play & explore       -> the classic Kahoot answer shapes drifting around a pulsing play button
 */
const WelcomeAnimation: React.FC<{ variant: WelcomeVariant }> = ({ variant }) => {
    return (
        <div className={`welcome-anim welcome-anim--${variant}`} aria-hidden="true">
            {variant === 'admin' && (
                <>
                    <span className="wa-token wa-shield"><ShieldCheck size={40} strokeWidth={1.6} /></span>
                    <div className="wa-bars">
                        <span className="wa-bar" /><span className="wa-bar" /><span className="wa-bar" />
                        <span className="wa-bar" /><span className="wa-bar" />
                    </div>
                    <span className="wa-token wa-node wa-node-1"><Users size={20} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-node wa-node-2"><Activity size={20} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-node wa-node-3"><BarChart3 size={20} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-gear"><Settings size={26} strokeWidth={1.6} /></span>
                </>
            )}

            {variant === 'teacher' && (
                <>
                    <span className="wa-token wa-quizcard">
                        <span className="wa-quizcard-line wa-l1" />
                        <span className="wa-quizcard-line wa-l2" />
                        <span className="wa-quizcard-pencil"><Pencil size={16} strokeWidth={1.85} /></span>
                    </span>
                    <span className="wa-token wa-q wa-q-1"><HelpCircle size={22} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-q wa-q-2"><FilePlus size={22} strokeWidth={1.85} /></span>
                    <div className="wa-checklist">
                        <span className="wa-check wa-check-1"><ListChecks size={18} strokeWidth={1.85} /></span>
                        <span className="wa-check wa-check-2"><CheckCircle2 size={18} strokeWidth={1.85} /></span>
                        <span className="wa-check wa-check-3"><CheckCircle2 size={18} strokeWidth={1.85} /></span>
                    </div>
                </>
            )}

            {variant === 'student' && (
                <>
                    {/* Twinkling knowledge-dust scattered across the whole block */}
                    <span className="wa-spark wa-spark-1" />
                    <span className="wa-spark wa-spark-2" />
                    <span className="wa-spark wa-spark-3" />
                    <span className="wa-spark wa-spark-4" />
                    <span className="wa-spark wa-spark-5" />
                    <span className="wa-spark wa-spark-6" />
                    <span className="wa-spark wa-spark-7" />
                    <span className="wa-spark wa-spark-8" />
                    <span className="wa-spark wa-spark-9" />
                    <span className="wa-spark wa-spark-10" />

                    {/* A learning rocket arcing across the block */}
                    <span className="wa-token wa-rocket"><Rocket size={26} strokeWidth={1.7} /></span>

                    {/* Themed icons drifting at points spanning the full width */}
                    <span className="wa-token wa-float wa-float-1"><GraduationCap size={24} strokeWidth={1.7} /></span>
                    <span className="wa-token wa-float wa-float-2"><BookOpen size={22} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-float wa-float-3"><Lightbulb size={22} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-float wa-float-4"><Brain size={22} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-float wa-float-5"><Target size={22} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-float wa-float-6"><Trophy size={22} strokeWidth={1.85} /></span>

                    {/* Prominent streak flame */}
                    <span className="wa-token wa-flame"><Flame size={30} strokeWidth={1.7} /></span>

                    {/* Reward badges rising and fading from across the bottom */}
                    <span className="wa-rise wa-rise-1"><Star size={15} strokeWidth={2} /> +10 XP</span>
                    <span className="wa-rise wa-rise-2"><Award size={15} strokeWidth={2} /> +25 XP</span>
                    <span className="wa-rise wa-rise-3"><Sparkles size={15} strokeWidth={2} /> Streak!</span>
                </>
            )}

            {variant === 'guest' && (
                <>
                    <span className="wa-token wa-play"><Play size={26} strokeWidth={1.85} /></span>
                    <span className="wa-token wa-shape wa-shape-tri"><Triangle size={22} strokeWidth={2.2} /></span>
                    <span className="wa-token wa-shape wa-shape-dia"><Diamond size={22} strokeWidth={2.2} /></span>
                    <span className="wa-token wa-shape wa-shape-cir"><Circle size={22} strokeWidth={2.2} /></span>
                    <span className="wa-token wa-shape wa-shape-sq"><Square size={22} strokeWidth={2.2} /></span>
                </>
            )}
        </div>
    );
};

export default WelcomeAnimation;
