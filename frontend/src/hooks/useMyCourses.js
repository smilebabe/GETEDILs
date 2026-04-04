import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const useMyCourses = () => {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCourses = async () => {
    setLoading(true);
    // Calling the RPC function DeepSeek just created
    const { data, error } = await supabase.rpc('get_my_courses');

    if (error) {
      console.error('DATABASE_SYNC_ERROR:', error.message);
    } else {
      setMyCourses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  return { myCourses, loading, refresh: fetchMyCourses };
};
