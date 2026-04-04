/**
 * GETEDIL-OS GetSkill Pillar Hook
 * Optimized for Vercel (Linux) Casing & Clean Imports
 * @version 2.1.0
 */

import { useState, useEffect, useCallback } from 'react';
// Imports from src/lib/index.js (Case-sensitive: 'lib' must be lowercase)
import { supabase, eventBus } from '../lib'; 
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';

// ============================================
// TYPES & CONSTANTS
// ============================================

export const COURSE_CATEGORIES = {
    ALL: 'all',
    PROGRAMMING: 'programming',
    MARKETPLACE: 'marketing',
    DESIGN: 'design',
    FINANCE: 'finance',
    PRODUCTIVITY: 'productivity'
};

export const ENROLLMENT_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DROPPED: 'dropped'
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
    const [activeTab, setActiveTab] = useState('marketplace');
    
    // Filter & Pagination
    const [filters, setFilters] = useState({
        category: COURSE_CATEGORIES.ALL,
        searchTerm: '',
        priceRange: { min: 0, max: 20000 },
        level: 'all',
        sortBy: 'popular'
    });
    
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        hasMore: true,
        total: 0
    });

    // ============================================
    // DATA FETCHING (SUPABASE RPC)
    // ============================================
    
    const fetchMyCourses = useCallback(async () => {
        if (!user) return [];
        setIsLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_my_courses', {
                p_user_id: user.id
            });
            
            if (rpcError) throw rpcError;
            
            const formatted = (data || []).map(c => ({
                ...c,
                progress_percentage: c.progress_percentage || 0,
                enrollment_status: c.enrollment_status || 'active'
            }));
            
            setMyCourses(formatted);
            return formatted;
        } catch (err) {
            console.error('Academy Fetch Error:', err);
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchMarketplaceCourses = useCallback(async (reset = true) => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('gs_courses')
                .select('*', { count: 'exact' })
                .eq('is_published', true);

            if (filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters.searchTerm) {
                query = query.ilike('title', `%${filters.searchTerm}%`);
            }

            // Pagination logic
            const from = reset ? 0 : (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error: qError, count } = await query;
            if (qError) throw qError;

            // Mark enrolled courses locally
            const enrolledIds = myCourses.map(c => c.id);
            const enrichedData = (data || []).map(c => ({
                ...c,
                is_enrolled: enrolledIds.includes(c.id)
            }));

            setMarketplaceCourses(prev => reset ? enrichedData : [...prev, ...enrichedData]);
            setPagination(prev => ({ ...prev, total: count || 0, hasMore: (data?.length || 0) === prev.limit }));
        } catch (err) {
            console.error('Marketplace Fetch Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.page, myCourses]);

    // ============================================
    // ENROLLMENT LOGIC
    // ============================================
    
    const enrollInCourse = useCallback(async (course) => {
        if (!user) {
            eventBus.emit('notification:show', { type: 'error', title: 'Login Required', message: 'Please sign in to enroll.' });
            return;
        }

        setIsEnrolling(true);
        try {
            const idempotencyKey = `${user.id}_${course.id}_${Date.now()}`;
            
            const { data, error: rpcError } = await supabase.rpc('enroll_student', {
                target_course_id: course.id,
                p_user_id: user.id,
                p_idempotency_key: idempotencyKey
            });

            if (rpcError) throw rpcError;

            if (data.success) {
                eventBus.emit('notification:show', { 
                    type: 'success', 
                    title: 'Module Initialized', 
                    message: `Successfully enrolled in ${course.title}` 
                });
                // Trigger global refreshes
                refreshBalance();
                fetchMyCourses();
            } else {
                eventBus.emit('notification:show', { type: 'error', title: 'Enrollment Failed', message: data.message });
            }
        } catch (err) {
            console.error('Enrollment Error:', err);
        } finally {
            setIsEnrolling(false);
        }
    }, [user, refreshBalance, fetchMyCourses]);

    // ============================================
    // INITIALIZATION & SUBSCRIPTIONS
    // ============================================

    useEffect(() => {
        if (user) {
            fetchMyCourses().then(() => fetchMarketplaceCourses(true));
        }
    }, [user, filters.category]);

    // Real-time enrollment listener
    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('gs_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gs_enrollments', filter: `user_id=eq.${user.id}` }, 
            () => fetchMyCourses())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, fetchMyCourses]);

    return {
        marketplaceCourses,
        myCourses,
        isLoading,
        isEnrolling,
        error,
        activeTab,
        setActiveTab,
        filters,
        setFilters,
        enrollInCourse,
        fetchMarketplaceCourses,
        balance
    };
};
