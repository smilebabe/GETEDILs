// frontend/src/hooks/useCourseEnrollment.ts
import { supabase } from '@/lib/supabase';

export async function enrollInCourse(courseId: string) {
    const { data, error } = await supabase.rpc('enroll_student', {
        target_course_id: courseId,
        p_idempotency_key: `${Date.now()}_${Math.random()}`
    });
    
    if (error) throw error;
    return data;
}

// Usage in component
const handleEnroll = async () => {
    try {
        const result = await enrollInCourse(course.id);
        if (result.success) {
            toast.success(result.message);
            setBalance(result.balance_after);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        console.error('Enrollment failed:', error);
    }
};
