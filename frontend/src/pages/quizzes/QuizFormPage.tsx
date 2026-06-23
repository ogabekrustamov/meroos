import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import { quizService, resourceService } from '../../services';
import type { ResourceCategory } from '../../types';

interface QuestionForm {
    id?: number;
    question_text: string;
    question_type: 'single' | 'multiple' | 'true_false';
    points: number;
    image: File | null;
    image_preview: string | null;
    options: {
        id?: number;
        option_text: string;
        is_correct: boolean;
        order: number;
    }[];
}

interface QuizFormData {
    title: string;
    description: string;
    quiz_type: 'standard' | 'kahoot';
    category: number | '';
    difficulty: 'easy' | 'medium' | 'hard';
    timing_mode: 'per_question' | 'total_time';
    time_per_question: number;
    total_time: number;
    passing_score: number;
    is_published: boolean;
    questions: QuestionForm[];
}

const emptyQuestion: QuestionForm = {
    question_text: '',
    question_type: 'single',
    points: 10,
    image: null,
    image_preview: null,
    options: [
        { option_text: '', is_correct: false, order: 0 },
        { option_text: '', is_correct: false, order: 1 },
        { option_text: '', is_correct: false, order: 2 },
        { option_text: '', is_correct: false, order: 3 },
    ],
};

const QuizFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { t } = useTranslation();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const [formData, setFormData] = useState<QuizFormData>({
        title: '',
        description: '',
        quiz_type: 'standard',
        category: '',
        difficulty: 'medium',
        timing_mode: 'per_question',
        time_per_question: 30,
        total_time: 600,
        passing_score: 70,
        is_published: true,
        questions: [{ ...emptyQuestion }],
    });

    // Check permissions
    const canCreate = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_create_quizzes'));
    const canEdit = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_edit_quizzes'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catsData = await resourceService.getCategories();
                setCategories(catsData);

                if (isEditing) {
                    const quiz: any = await quizService.getQuiz(Number(id));
                    setFormData({
                        title: quiz.title,
                        description: quiz.description || '',
                        quiz_type: quiz.quiz_type,
                        category: quiz.category?.id || '',
                        difficulty: quiz.difficulty,
                        timing_mode: quiz.timing_mode || 'per_question',
                        time_per_question: quiz.time_per_question || 30,
                        total_time: quiz.total_time || 600,
                        passing_score: quiz.passing_score || 70,
                        is_published: quiz.is_published ?? true,
                        questions: quiz.questions?.map((q: any) => ({
                            id: q.id,
                            question_text: q.question_text,
                            question_type: q.question_type,
                            points: q.points,
                            image: null,
                            image_preview: q.image || null,
                            options: q.options?.map((o: any, idx: number) => ({
                                id: o.id,
                                option_text: o.option_text,
                                is_correct: o.is_correct ?? false,
                                order: idx,
                            })) || [],
                        })) || [{ ...emptyQuestion }],
                    });
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError(t('quiz.form.loadFailed'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    // Permission check
    if (!loading && ((isEditing && !canEdit) || (!isEditing && !canCreate))) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon"><Ban size={64} strokeWidth={1.75} /></div>
                <h3 className="empty-state-title">{t('quiz.form.accessDenied')}</h3>
                <p className="empty-state-description">
                    {isEditing ? t('quiz.form.noPermissionEdit') : t('quiz.form.noPermissionCreate')}
                </p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const data = {
                title: formData.title,
                description: formData.description,
                quiz_type: formData.quiz_type,
                category: formData.category as number,
                difficulty: formData.difficulty,
                timing_mode: formData.timing_mode,
                time_per_question: formData.time_per_question,
                total_time: formData.total_time,
                passing_score: formData.passing_score,
                is_published: formData.is_published,
                questions: formData.questions.map((q, qIdx) => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    points: q.points,
                    order: qIdx,
                    options: q.options.map((o, oIdx) => ({
                        option_text: o.option_text,
                        is_correct: o.is_correct,
                        order: oIdx,
                    })),
                })),
            };

            // Check if any question has an image to upload
            const questionImages = formData.questions.map((q) => q.image);
            const hasImages = questionImages.some((img) => img !== null);

            if (isEditing) {
                if (hasImages) {
                    await quizService.updateQuizWithImages(Number(id), data, questionImages);
                } else {
                    await quizService.updateQuiz(Number(id), data);
                }
            } else {
                if (hasImages) {
                    await quizService.createQuizWithImages(data, questionImages);
                } else {
                    await quizService.createQuiz(data);
                }
            }
            navigate('/quizzes');
        } catch (err: any) {
            console.error('Failed to save quiz:', err);
            setError(err.response?.data?.detail || t('quiz.form.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const updateQuestion = (index: number, updates: Partial<QuestionForm>) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
        }));
    };

    const updateOption = (qIndex: number, oIndex: number, updates: { option_text?: string; is_correct?: boolean }) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q, qi) =>
                qi === qIndex
                    ? {
                        ...q,
                        options: q.options.map((o, oi) =>
                            oi === oIndex
                                ? { ...o, ...updates }
                                : q.question_type === 'single' && updates.is_correct
                                    ? { ...o, is_correct: false }
                                    : o
                        ),
                    }
                    : q
            ),
        }));
    };

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, { ...emptyQuestion, options: emptyQuestion.options.map((o) => ({ ...o })) }],
        }));
        setActiveQuestionIndex(formData.questions.length);
    };

    const removeQuestion = (index: number) => {
        if (formData.questions.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
        if (activeQuestionIndex >= formData.questions.length - 1) {
            setActiveQuestionIndex(Math.max(0, formData.questions.length - 2));
        }
    };

    const addOption = (qIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === qIndex
                    ? { ...q, options: [...q.options, { option_text: '', is_correct: false, order: q.options.length }] }
                    : q
            ),
        }));
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const question = formData.questions[qIndex];
        if (question.options.length <= 2) return;
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === qIndex ? { ...q, options: q.options.filter((_, oi) => oi !== oIndex) } : q
            ),
        }));
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const activeQuestion = formData.questions[activeQuestionIndex];

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">{isEditing ? t('quiz.form.editTitle') : t('quiz.form.createTitle')}</h1>
                    <p className="text-secondary">
                        {isEditing ? t('quiz.form.editSubtitle') : t('quiz.form.createSubtitle')}
                    </p>
                </div>
            </div>

            {error && (
                <div className="badge badge-error" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'block' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Quiz Details */}
                    <div className="card" style={{ gridColumn: 'span 1' }}>
                        <div className="card-body">
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('quiz.form.quizDetails')}</h3>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">{t('quiz.form.titleLabel')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">{t('quiz.form.description')}</label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">{t('quiz.form.categoryLabel')}</label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value ? Number(e.target.value) : '' }))}
                                    required
                                >
                                    <option value="">{t('quiz.form.selectCategory')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('quiz.form.difficulty')}</label>
                                    <select
                                        className="input"
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                                    >
                                        <option value="easy">{t('difficulty.easy')}</option>
                                        <option value="medium">{t('difficulty.medium')}</option>
                                        <option value="hard">{t('difficulty.hard')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('quiz.form.type')}</label>
                                    <select
                                        className="input"
                                        value={formData.quiz_type}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, quiz_type: e.target.value as any }))}
                                    >
                                        <option value="standard">{t('quiz.form.standard')}</option>
                                        <option value="kahoot">{t('quiz.form.kahoot')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">{t('quiz.form.timingMode')}</label>
                                <select
                                    className="input"
                                    value={formData.timing_mode}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, timing_mode: e.target.value as any }))}
                                >
                                    <option value="per_question">{t('quiz.form.perQuestion')}</option>
                                    <option value="total_time">{t('quiz.form.totalTime')}</option>
                                </select>
                            </div>

                            {formData.timing_mode === 'per_question' ? (
                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">{t('quiz.form.timePerQuestion')}</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min={5}
                                        max={300}
                                        value={formData.time_per_question}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, time_per_question: Number(e.target.value) }))}
                                    />
                                </div>
                            ) : (
                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">{t('quiz.form.totalTimeSeconds')}</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min={60}
                                        max={7200}
                                        value={formData.total_time}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, total_time: Number(e.target.value) }))}
                                    />
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">{t('quiz.form.passingScore')}</label>
                                <input
                                    type="number"
                                    className="input"
                                    min={0}
                                    max={100}
                                    value={formData.passing_score}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, passing_score: Number(e.target.value) }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="flex items-center gap-3" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_published}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <div>
                                        <div className="form-label" style={{ marginBottom: 0 }}>{t('quiz.form.published')}</div>
                                        <span className="text-sm text-muted">{t('quiz.form.publishedHint')}</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Questions */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Question Navigation */}
                        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="card-body flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                                {formData.questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`btn ${activeQuestionIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setActiveQuestionIndex(idx)}
                                        style={{ minWidth: '40px' }}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                <button type="button" className="btn btn-secondary" onClick={addQuestion}>
                                    {t('quiz.form.add')}
                                </button>
                            </div>
                        </div>

                        {/* Active Question Editor */}
                        {activeQuestion && (
                            <div className="card">
                                <div className="card-body">
                                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                                        <h3>{t('quiz.form.questionN', { n: activeQuestionIndex + 1 })}</h3>
                                        {formData.questions.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => removeQuestion(activeQuestionIndex)}
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <Trash2 size={16} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('quiz.form.remove')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                        <label className="form-label">{t('quiz.form.questionText')}</label>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={activeQuestion.question_text}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { question_text: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                        <label className="form-label">{t('quiz.form.questionImage')}</label>
                                        {activeQuestion.image_preview && (
                                            <div style={{ marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxWidth: '300px' }}>
                                                <img src={activeQuestion.image_preview} alt="Question" style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    updateQuestion(activeQuestionIndex, {
                                                        image: file,
                                                        image_preview: URL.createObjectURL(file)
                                                    });
                                                }
                                            }}
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 'var(--space-4)' }}>
                                        <div className="form-group">
                                            <label className="form-label">{t('quiz.form.questionType')}</label>
                                            <select
                                                className="input"
                                                value={activeQuestion.question_type}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, { question_type: e.target.value as any })}
                                            >
                                                <option value="single">{t('quiz.form.singleChoice')}</option>
                                                <option value="multiple">{t('quiz.form.multipleChoice')}</option>
                                                <option value="true_false">{t('quiz.form.trueFalse')}</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('quiz.form.points')}</label>
                                            <input
                                                type="number"
                                                className="input"
                                                min={1}
                                                max={100}
                                                value={activeQuestion.points}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, { points: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">{t('quiz.form.options')}</label>
                                        <div className="flex flex-col gap-3">
                                            {activeQuestion.options.map((option, oIdx) => (
                                                <div key={oIdx} className="flex gap-3 items-center">
                                                    <input
                                                        type={activeQuestion.question_type === 'multiple' ? 'checkbox' : 'radio'}
                                                        name={`question-${activeQuestionIndex}-correct`}
                                                        checked={option.is_correct}
                                                        onChange={(e) => updateOption(activeQuestionIndex, oIdx, { is_correct: e.target.checked })}
                                                        style={{ width: '20px', height: '20px' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        placeholder={t('quiz.form.optionN', { n: oIdx + 1 })}
                                                        value={option.option_text}
                                                        onChange={(e) => updateOption(activeQuestionIndex, oIdx, { option_text: e.target.value })}
                                                        style={{ flex: 1 }}
                                                        required
                                                    />
                                                    {activeQuestion.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={() => removeOption(activeQuestionIndex, oIdx)}
                                                        >
                                                            <X size={16} strokeWidth={1.85} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => addOption(activeQuestionIndex)}
                                            style={{ marginTop: 'var(--space-3)' }}
                                        >
                                            {t('quiz.form.addOption')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end" style={{ marginTop: 'var(--space-6)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/quizzes')}>
                        {t('quiz.form.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? t('quiz.form.saving') : isEditing ? t('quiz.form.updateQuiz') : t('quiz.form.createQuiz')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuizFormPage;
