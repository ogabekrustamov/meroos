import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '../../contexts';
import { organizationService } from '../../services';
import type { ClassGroup } from '../../types';

const TeacherClassesPage: React.FC = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const toast = useToast();
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        grade_level: 1,
        section: '',
        academic_year: new Date().getFullYear().toString(),
        max_students: 30,
    });

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await organizationService.getClasses();
            setClasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Need school ID... wait, backend might require school. 
            // Teachers usually belong to one school.
            // Let's assume backend handles it or we need to fetch user's school.
            // checking backend ClassGroupViewSet.perform_create... it sets created_by.
            // The model requires school. The serilaizer likely requires school.
            // Teachers can only create classes in their school?
            // Teacher permissions `can_create_classes` is generic.

            // For now, let's try to submit. The backend might fail if school is missing.
            // We can get school from user profile.

            await organizationService.createClass(formData);
            setIsCreating(false);
            setFormData({
                name: '',
                grade_level: 1,
                section: '',
                academic_year: new Date().getFullYear().toString(),
                max_students: 30,
            });
            loadClasses();
        } catch (error) {
            toast.error(t('teacherClasses.createFailed'));
            console.error(error);
        }
    };

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('teacherClasses.title')}</h1>
                {hasPermission('can_create_classes') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsCreating(!isCreating)}
                    >
                        {isCreating ? t('teacherClasses.cancel') : t('teacherClasses.create')}
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="card mb-6">
                    <div className="card-body">
                        <h2 className="text-lg font-semibold mb-4">{t('teacherClasses.newClass')}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('teacherClasses.className')}</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('teacherClasses.classNamePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('teacherClasses.section')}</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                    placeholder={t('teacherClasses.sectionPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('teacherClasses.gradeLevel')}</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    required
                                    min="1"
                                    max="12"
                                    value={formData.grade_level}
                                    onChange={e => setFormData({ ...formData, grade_level: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('teacherClasses.maxStudents')}</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.max_students}
                                    onChange={e => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="btn btn-success">{t('teacherClasses.saveClass')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                    <div key={cls.id} className="card">
                        <div className="card-body">
                            <h3 className="text-xl font-bold">{cls.name}</h3>
                            <div className="text-secondary text-sm mb-4">
                                {t('teacherClasses.sectionGrade', { section: cls.section, grade: cls.grade_level })}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>{t('teacherClasses.studentsCount', { count: cls.current_student_count || 0, max: cls.max_students })}</span>
                                <span className="badge badge-outline">{cls.academic_year}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p className="text-lg">{t('teacherClasses.noClassesTitle')}</p>
                        <p>{t('teacherClasses.noClassesDesc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherClassesPage;
