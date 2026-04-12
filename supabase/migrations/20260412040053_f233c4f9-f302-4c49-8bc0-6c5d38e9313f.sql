ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS audience_role public.app_role,
  ADD COLUMN IF NOT EXISTS target_user_id uuid,
  ADD COLUMN IF NOT EXISTS related_bin_id uuid,
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS idx_notifications_audience_created_at
  ON public.notifications (audience_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created_at
  ON public.notifications (target_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key
  ON public.profiles (user_id);

CREATE OR REPLACE FUNCTION public.complete_account_setup(
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _requested_role public.app_role DEFAULT 'user'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_name text := nullif(trim(coalesce(_full_name, '')), '');
  v_phone text := nullif(trim(coalesce(_phone, '')), '');
  v_requested_role public.app_role := CASE WHEN _requested_role = 'collector' THEN 'collector' ELSE 'user' END;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (v_user_id, v_name, v_phone)
  ON CONFLICT (user_id)
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_requested_role = 'collector' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'collector')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF v_email = 'sahayasathish60@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'is_admin', public.has_role(v_user_id, 'admin'),
    'is_collector', public.has_role(v_user_id, 'collector')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_collectors_for_full_bin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Full' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, '') IS DISTINCT FROM 'Full') THEN
    INSERT INTO public.notifications (type, message, audience_role, related_bin_id)
    VALUES (
      'full',
      format('Bin %s at %s is full and ready for collection.', NEW.bin_id, NEW.location),
      'collector',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_collectors_for_full_bin ON public.waste_bins;
CREATE TRIGGER notify_collectors_for_full_bin
AFTER INSERT OR UPDATE OF status ON public.waste_bins
FOR EACH ROW
EXECUTE FUNCTION public.notify_collectors_for_full_bin();

DROP POLICY IF EXISTS "Anyone authenticated can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view general notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (audience_role IS NULL AND target_user_id IS NULL);

CREATE POLICY "Collectors can view collector notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (audience_role = 'collector' AND public.has_role(auth.uid(), 'collector'));

CREATE POLICY "Users can view targeted notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (target_user_id = auth.uid());

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();