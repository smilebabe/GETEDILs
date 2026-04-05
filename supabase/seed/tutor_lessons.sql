-- Create table if not exists
CREATE TABLE IF NOT EXISTS tutor_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  step integer NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Math lessons
INSERT INTO tutor_lessons (subject, step, question, answer)
VALUES
('math', 0, 'Solve: 2x + 5 = 15', 'x=5'),
('math', 1, 'What is 7 * 8?', '56');

-- English lessons
INSERT INTO tutor_lessons (subject, step, question, answer)
VALUES
('english', 0, 'Form a sentence using "although".', 'Although it was raining, we went outside.'),
('english', 1, 'Identify the verb in: "She runs quickly."', 'runs');

-- Coding lessons
INSERT INTO tutor_lessons (subject, step, question, answer)
VALUES
('coding', 0, 'Write a line of JS that prints "Hello".', 'console.log("Hello");'),
('coding', 1, 'What keyword declares a variable in JS?', 'let');
