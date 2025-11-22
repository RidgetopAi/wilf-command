-- Replace 'your_email@example.com' with your actual email
UPDATE public.users 
SET role = 'rep', rep_id = '78'
WHERE email = 'your_email@example.com';
