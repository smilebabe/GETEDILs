// frontend/src/pillars/getskill/MyAcademyView.jsx
import React from 'react';
import { motion } from 'framer-motion';
import CourseProgressCard from '../../components/education/CourseProgressCard';

const MyAcademyView = ({ courses, isLoading, onRefresh }) => {
    if (isLoading && courses.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading your courses...</p>
                </div>
            </div>
        );
    }
    
    if (courses.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
            >
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Courses Yet</h3>
                <p className="text-slate-400 mb-6">
                    You haven't enrolled in any courses yet.
                    Browse the marketplace to start learning!
                </p>
                <button
                    onClick={onRefresh}
                    className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    Refresh
                </button>
            </motion.div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Courses</h2>
                    <p className="text-slate-400">
                        {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
                    </p>
                </div>
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                    🔄
                </button>
            </div>
            
            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                    <CourseProgressCard
                        key={course.id}
                        course={course}
                    />
                ))}
            </div>
        </div>
    );
};

export default MyAcademyView;
