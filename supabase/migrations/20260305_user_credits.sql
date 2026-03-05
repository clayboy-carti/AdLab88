-- ============================================================================
-- USER CREDITS
-- Creates the user_credits table, the spend_credit RPC, and the trigger
-- that auto-creates a credits row whenever a new auth user is created.
-- ============================================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 25,
  credits_used      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- 3. spend_credit RPC (called from generate routes)
CREATE OR REPLACE FUNCTION public.spend_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Insert default row if it doesn't exist yet
  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits_remaining INTO v_remaining
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF v_remaining < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits: only % remaining', v_remaining;
  END IF;

  UPDATE public.user_credits
  SET
    credits_remaining = credits_remaining - p_amount,
    credits_used      = credits_used + p_amount,
    updated_at        = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- 4. Auto-create a credits row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop before recreating to avoid duplicate trigger errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
