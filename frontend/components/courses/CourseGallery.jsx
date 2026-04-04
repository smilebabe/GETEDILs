import CourseCard from './CourseCard';

export default function CourseGallery({ courses = [] }) {
  return (
    <div className="w-full px-3 py-4">
      
      {/* Title */}
      <h2 className="text-white text-lg font-semibold mb-4 tracking-wide">
        🎓 Explore Skills
      </h2>

      {/* Grid */}
      <div
        className="
          grid
          grid-cols-2
          gap-3
          sm:grid-cols-2
          md:grid-cols-3
        "
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

    </div>
  );
}
