import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CourseGallery from './CourseGallery';
import { useEnrollment } from '../hooks/useEnrollment';

const fetchCourses = async () => {
  // Replace with real API call
  return [
    { title: 'React Basics', instructor: 'Amanuel', price: 500, category: 'Programming', is_published: true },
    { title: 'Marketing 101', instructor: 'Sara', price: 300, category: 'Marketing', is_published: true },
    { title: 'Node.js Advanced', instructor: 'Getachew', price: 700, category: 'Programming', is_published: true },
    { title: 'Social Media Growth', instructor: 'Lily', price: 400, category: 'Marketing', is_published: true },
  ];
};

const CATEGORY_OPTIONS = ['All', 'Programming', 'Marketing', 'Design', 'Finance'];

const MarketplaceView = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { enroll } = useEnrollment();

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchCourses();
      setCourses(data.filter(c => c.is_published));
    };
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [courses, search, activeCategory]);

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 bg-[#0a0a0a] text-white font-sans">
      
      {/* Search Input with Holographic Glow */}
      <motion.div
        whileFocus={{ boxShadow: '0 0 20px #EAB308, 0 0 40px #EAB308/50' }}
        className="mb-4"
      >
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-[#EAB308] rounded-lg py-2 px-4 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/50 transition-all"
        />
      </motion.div>

      {/* Category Filter Bar with Glow */}
      <div className="flex overflow-x-auto space-x-4 mb-6 py-2">
        {CATEGORY_OPTIONS.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            whileHover={{ scale: 1.1, boxShadow: '0 0 12px #EAB308, 0 0 24px #EAB308/50' }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-[#EAB308] text-black shadow-lg'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Course Gallery */}
      <div className="flex-1 overflow-y-auto">
        <CourseGallery
          courses={filteredCourses.map(c => ({
            ...c,
            enroll: () => enroll(c),
          }))}
        />
      </div>
    </div>
  );
};

export default MarketplaceView;
