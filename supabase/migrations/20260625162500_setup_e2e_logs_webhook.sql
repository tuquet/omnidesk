-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create Webhook Function
CREATE OR REPLACE FUNCTION public.e2e_logs_webhook_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mnplydmluozurzatgjcc.supabase.co/functions/v1/bug-alert',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS e2e_logs_webhook ON public.e2e_logs;
CREATE TRIGGER e2e_logs_webhook
AFTER INSERT ON public.e2e_logs
FOR EACH ROW
EXECUTE FUNCTION public.e2e_logs_webhook_fn();
