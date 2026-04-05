import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeLesson = {}; // track user’s current lesson state

/**
 * Tutor engine: fetches lessons dynamically from Supabase
 */
export async function tutor(userId, topicOrAnswer) {
  const topic = topicOrAnswer.toLowerCase();

  // If user is starting a lesson
  if (!activeLesson[userId]) {
    let subject = null;
    if (topic.includes("math")) subject = "math";
    else if (topic.includes("english")) subject = "english";
    else if (topic.includes("coding")) subject = "coding";

    if (!subject) {
      return "Tutor is ready. Say 'Tutor me in math/english/coding' to begin.";
    }

    // Fetch lessons from Supabase
    const { data: lessons, error } = await supabase
      .from("tutor_lessons")
      .select("*")
      .eq("subject", subject)
      .order("step", { ascending: true });

    if (error || !lessons.length) {
      console.error("Error fetching lessons:", error);
      return `No lessons found for ${subject}.`;
    }

    activeLesson[userId] = { subject, step: 0, lessons };
    return `📚 Starting ${subject} lesson. ${lessons[0].question}`;
  }

  // If user is answering a question
  const { subject, step, lessons } = activeLesson[userId];
  const current = lessons[step];

  if (topicOrAnswer.toLowerCase().includes(current.answer.toLowerCase())) {
    // Correct answer
    activeLesson[userId].step++;
    if (activeLesson[userId].step >= lessons.length) {
      delete activeLesson[userId];
      return `✅ Correct! Lesson complete. Great job on ${subject}!`;
    }
    return `✅ Correct! Next: ${lessons[activeLesson[userId].step].question}`;
  } else {
    // Incorrect answer
    return `❌ Not quite. Try again: ${current.question}`;
  }
}
