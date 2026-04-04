/**
 * GETEDIL-OS GetSkill Pillar Hook
 * Manages course data, user enrollments, and RPC calls with Supabase
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { eventBus } from '../../lib/event-bus';
import { useAuth } from '../useAuth';
import { useWallet } from '../useWallet';

// ============================================
// TYPES & CONSTANTS
// ============================================

export const COURSE_CATEGORIES = {
    ALL: 'all',
    PROGRAMMING: 'programming',
    MARKETING: 'marketing',
    DESIGN: 'design',
    FINANCE: 'finance',
    PRODUCTIVITY: 'productivity'
};

export const ENROLLMENT_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DROPPED: 'dropped',
    REFUNDED: 'refunded'
};

// ============================================
// MAIN HOOK
// ============================================

export const useGetSkill = () => {
    const { user } = useAuth();
    const { balance, refreshBalance } = useWallet();
    
    // State Management
    const [marketplaceCourses, setMarketplaceCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'academy'
    
    // Filter & Pagination State
    const [filters, setFilters] = useState({
        category: COURSE_CATEGORIES.ALL,
        searchTerm: '',
        priceRange: { min: 0, max: 10000 },
        level: 'all',
        sortBy: 'popular'
    });
    
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        hasMore: true,
        total: 0
    });
    
    // ============================================
    // SUPABASE RPC CALLS
    // ============================================
    
    /**
     * Fetch user's enrolled courses using RPC function
     * Calls: get_my_courses() - Returns courses user is enrolled in
     */
    const fetchMyCourses = useCallback(async () => {
        if (!user) return [];
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Call the RPC function we created earlier
            const { data, error: rpcError } = await supabase.rpc('get_my_courses', {
                p_user_id: user.id
            });
            
            if (rpcError) throw rpcError;
            
            // Transform data for frontend consumption
            const formattedCourses = (data || []).map(course => ({
                ...course,
                enrollment_status: course.enrollment_status || ENROLLMENT_STATUS.ACTIVE,
                progress_percentage: course.progress_percentage || 0,
                last_accessed_at: course.last_accessed_at,
                certificate_issued: course.certificate_issued || false
            }));
            
            setMyCourses(formattedCourses);
            return formattedCourses;
            
        } catch (err) {
            console.error('Error fetching my courses:', err);
            setError(err.message);
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Failed to Load Courses',
                message: 'Unable to fetch your enrolled courses. Please try again.'
            });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user]);
    
    /**
     * Fetch marketplace courses with filters
     * Standard Supabase query with RLS
     */
    const fetchMarketplaceCourses = useCallback(async (reset = true) => {
        if (!user) return [];
        
        setIsLoading(true);
        setError(null);
        
        try {
            let query = supabase
                .from('gs_courses')
                .select('*', { count: 'exact' })
                .eq('is_published', true);
            
            // Apply filters
            if (filters.category !== COURSE_CATEGORIES.ALL) {
                query = query.eq('category', filters.category);
            }
            
            if (filters.searchTerm) {
                query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,instructor.ilike.%${filters.searchTerm}%`);
            }
            
            // Price range filter
            query = query
                .gte('price_etb', filters.priceRange.min)
                .lte('price_etb', filters.priceRange.max);
            
            // Level filter
            if (filters.level !== 'all') {
                query = query.eq('level', filters.level);
            }
            
            // Sorting
            switch (filters.sortBy) {
                case 'popular':
                    query = query.order('total_students', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'price_low':
                    query = query.order('price_etb', { ascending: true });
                    break;
                case 'price_high':
                    query = query.order('price_etb', { ascending: false });
                    break;
                case 'rating':
                    query = query.order('rating', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }
            
            // Pagination
            const from = reset ? 0 : (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to);
            
            const { data, error: queryError, count } = await query;
            
            if (queryError) throw queryError;
            
            // Check which courses user is already enrolled in
            const enrolledCourseIds = myCourses.map(c => c.id);
            const coursesWithEnrollmentStatus = (data || []).map(course => ({
                ...course,
                is_enrolled: enrolledCourseIds.includes(course.id)
            }));
            
            if (reset) {
                setMarketplaceCourses(coursesWithEnrollmentStatus);
            } else {
                setMarketplaceCourses(prev => [...prev, ...coursesWithEnrollmentStatus]);
            }
            
            setPagination(prev => ({
                ...prev,
                total: count || 0,
                hasMore: (data?.length || 0) === pagination.limit
            }));
            
            return coursesWithEnrollmentStatus;
            
        } catch (err) {
            console.error('Error fetching marketplace courses:', err);
            setError(err.message);
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Failed to Load Marketplace',
                message: 'Unable to fetch courses. Please check your connection.'
            });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user, filters, pagination.page, pagination.limit, myCourses]);
    
    /**
     * Enroll in a course (wraps the enroll_student RPC function)
     */
    const enrollInCourse = useCallback(async (courseId, courseTitle, coursePrice) => {
        if (!user) {
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Authentication Required',
                message: 'Please log in to enroll in courses.'
            });
            return { success: false, message: 'Not authenticated' };
        }
        
        setIsEnrolling(true);
        setError(null);
        
        try {
            // Generate idempotency key
            const idempotencyKey = `${user.id}_${courseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Call the RPC function
            const { data, error: rpcError } = await supabase.rpc('enroll_student', {
                target_course_id: courseId,
                p_user_id: user.id,
                p_idempotency_key: idempotencyKey
            });
            
            if (rpcError) throw rpcError;
            
            if (data.success) {
                // Refresh data after successful enrollment
                await Promise.all([
                    refreshBalance(),           // Update wallet balance
                    fetchMyCourses(),           // Refresh enrolled courses
                    fetchMarketplaceCourses(true) // Refresh marketplace to update enrollment status
                ]);
                
                // Track analytics
                eventBus.emit('analytics:track', {
                    event: 'course_enrollment',
                    course_id: courseId,
                    course_title: courseTitle,
                    amount_paid: coursePrice,
                    success: true
                });
                
                // Show success notification
                eventBus.emit('notification:show', {
                    type: 'success',
                    title: '🎉 Enrollment Successful!',
                    message: data.message || `You are now enrolled in ${courseTitle}`,
                    duration: 5000
                });
                
                return data;
            } else {
                // Handle failed enrollment (insufficient balance, etc.)
                eventBus.emit('notification:show', {
                    type: 'error',
                    title: 'Enrollment Failed',
                    message: data.message || 'Unable to complete enrollment. Please try again.',
                    duration: 5000
                });
                
                return data;
            }
            
        } catch (err) {
            console.error('Enrollment error:', err);
            const errorMessage = err.message || 'Failed to enroll in course. Please try again.';
            setError(errorMessage);
            
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Enrollment Error',
                message: errorMessage,
                duration: 5000
            });
            
            return { success: false, message: errorMessage };
        } finally {
            setIsEnrolling(false);
        }
    }, [user, refreshBalance, fetchMyCourses, fetchMarketplaceCourses]);
    
    /**
     * Update course progress
     */
    const updateProgress = useCallback(async (lessonId, watchTime, isCompleted = false) => {
        if (!user) return;
        
        try {
            const { data, error: rpcError } = await supabase.rpc('update_lesson_progress', {
                p_lesson_id: lessonId,
                p_watch_time_seconds: watchTime,
                p_is_completed: isCompleted
            });
            
            if (rpcError) throw rpcError;
            
            if (data.success) {
                // Update local course progress
                setMyCourses(prev => prev.map(course => {
                    if (course.id === data.course_id) {
                        return {
                            ...course,
                            progress_percentage: data.course_progress
                        };
                    }
                    return course;
                }));
            }
            
            return data;
            
        } catch (err) {
            console.error('Progress update error:', err);
            return { success: false, message: err.message };
        }
    }, [user]);
    
    /**
     * Get course details by ID
     */
    const getCourseById = useCallback(async (courseId) => {
        try {
            const { data, error: queryError } = await supabase
                .from('gs_courses')
                .select('*, lessons:gs_lessons(*)')
                .eq('id', courseId)
                .single();
            
            if (queryError) throw queryError;
            return data;
            
        } catch (err) {
            console.error('Error fetching course:', err);
            return null;
        }
    }, []);
    
    // ============================================
    // EFFECTS
    // ============================================
    
    // Initial load
    useEffect(() => {
        if (user) {
            fetchMyCourses();
            fetchMarketplaceCourses(true);
        }
    }, [user]);
    
    // Refetch marketplace when filters change
    useEffect(() => {
        if (user) {
            fetchMarketplaceCourses(true);
        }
    }, [filters.category, filters.searchTerm, filters.priceRange, filters.level, filters.sortBy]);
    
    // Subscribe to real-time enrollment updates
    useEffect(() => {
        if (!user) return;
        
        const subscription = supabase
            .channel('gs_enrollments_changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'gs_enrollments',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    // Refresh my courses when new enrollment is detected
                    fetchMyCourses();
                    fetchMarketplaceCourses(true);
                }
            )
            .subscribe();
        
        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchMyCourses, fetchMarketplaceCourses]);
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    const loadMoreCourses = useCallback(() => {
        if (pagination.hasMore && !isLoading && activeTab === 'marketplace') {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }, [pagination.hasMore, isLoading, activeTab]);
    
    const resetFilters = useCallback(() => {
        setFilters({
            category: COURSE_CATEGORIES.ALL,
            searchTerm: '',
            priceRange: { min: 0, max: 10000 },
            level: 'all',
            sortBy: 'popular'
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);
    
    const switchTab = useCallback((tab) => {
        setActiveTab(tab);
        if (tab === 'academy') {
            fetchMyCourses();
        }
    }, [fetchMyCourses]);
    
    // ============================================
    // RETURN VALUES
    // ============================================
    
    return {
        // State
        marketplaceCourses,
        myCourses,
        isLoading,
        isEnrolling,
        error,
        activeTab,
        filters,
        pagination,
        balance,
        
        // Actions
        setActiveTab: switchTab,
        setFilters,
        fetchMarketplaceCourses,
        fetchMyCourses,
        enrollInCourse,
        updateProgress,
        getCourseById,
        loadMoreCourses,
        resetFilters,
        
        // Utils
        hasMore: pagination.hasMore,
        totalCourses: pagination.total
    };
};

// ============================================
// EXPORT CUSTOM HOOKS FOR SPECIFIC USE CASES
// ============================================

/**
 * Hook for marketplace-specific operations
 */
export const useMarketplace = () => {
    const { marketplaceCourses, isLoading, filters, setFilters, enrollInCourse, loadMoreCourses, hasMore } = useGetSkill();
    
    return {
        courses: marketplaceCourses,
        isLoading,
        filters,
        setFilters,
        enroll: enrollInCourse,
        loadMore: loadMoreCourses,
        hasMore
    };
};

/**
 * Hook for academy-specific operations
 */
export const useAcademy = () => {
    const { myCourses, isLoading, updateProgress, getCourseById } = useGetSkill();
    
    return {
        courses: myCourses,
        isLoading,
        updateProgress,
        getCourseDetails: getCourseById
    };
};
