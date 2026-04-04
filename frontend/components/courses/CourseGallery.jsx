import React from 'react';
import CourseCard from './CourseCard';

const CourseGallery = ({ courses }) => {
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      {courses.map((course, index) => (
        <CourseCard
          key={index}
          title={course.title}
          instructor={course.instructor}
          price={course.price}
          pillar={course.pillar} // Pass pillar type
        />
      ))}
    </div>
  );
};

export default CourseGallery;
