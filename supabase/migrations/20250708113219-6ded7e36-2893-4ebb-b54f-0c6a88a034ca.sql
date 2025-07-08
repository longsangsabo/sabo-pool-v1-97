-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run tournament automation every hour
SELECT cron.schedule(
  'tournament-automation-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/tournament-status-automation',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- Also create a more frequent check during peak hours (every 15 minutes from 8AM to 10PM)
SELECT cron.schedule(
  'tournament-automation-frequent',
  '*/15 8-22 * * *', -- Every 15 minutes between 8AM-10PM
  $$
  SELECT net.http_post(
    url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/tournament-status-automation',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
    body:='{"scheduled": true, "frequency": "frequent"}'::jsonb
  ) as request_id;
  $$
);