-- Ensure pillar table exists
CREATE TABLE IF NOT EXISTS governance_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Ensure governance_states table exists
CREATE TABLE IF NOT EXISTS governance_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pillar_id uuid NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure tutor_lessons table exists
CREATE TABLE IF NOT EXISTS tutor_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  step integer NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert GetSkill pillar if not already present
INSERT INTO governance_pillars (name, description)
VALUES ('GetSkill', 'Provides tutoring and skill development support')
ON CONFLICT (name) DO NOTHING;

-- Seed Tutor lessons for GetSkill
INSERT INTO tutor_lessons (subject, step, question, answer)
VALUES
('math', 0, 'Solve: 2x + 5 = 15', 'x=5'),
('math', 1, 'What is 7 * 8?', '56'),
('english', 0, 'Form a sentence using "although".', 'Although it was raining, we went outside.'),
('english', 1, 'Identify the verb in: "She runs quickly."', 'runs'),
('coding', 0, 'Write a line of JS that prints "Hello".', 'console.log("Hello");'),
('coding', 1, 'What keyword declares a variable in JS?', 'let');
