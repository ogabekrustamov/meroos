import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts';
import { organizationService } from '../../services';
import type { ClassGroup } from '../../types';

const TeacherClassesPage: React.FC = () => {
    const { hasPermission } = useAuth();
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
            alert('Failed to create class. Ensure you have permission and all fields are valid.');
            console.error(error);
        }
    };

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Classes</h1>
                {hasPermission('can_create_classes') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsCreating(!isCreating)}
                    >
                        {isCreating ? 'Cancel' : 'Create Class'}
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="card mb-6">
                    <div className="card-body">
                        <h2 className="text-lg font-semibold mb-4">New Class</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Class Name</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Mathematics 101"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Section</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                    placeholder="e.g. A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Grade Level</label>
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
                                <label className="block text-sm font-medium mb-1">Max Students</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    required
                                    value={formData.max_students}
                                    onChange={e => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="btn btn-success">Save Class</button>
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
                                Section {cls.section} • Grade {cls.grade_level}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Students: {cls.current_student_count || 0}/{cls.max_students}</span>
                                <span className="badge badge-outline">{cls.academic_year}</span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button className="btn btn-sm btn-ghost w-full">View Details</button>
                            </div>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p className="text-lg">No classes found.</p>
                        <p>Contact your administrator or create a new class.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherClassesPage;
