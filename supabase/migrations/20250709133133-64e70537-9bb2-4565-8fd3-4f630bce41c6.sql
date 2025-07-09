-- Create payment_transactions table and related functions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_ref TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'VND',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'vnpay',
  transaction_type TEXT DEFAULT 'membership' CHECK (transaction_type IN ('membership', 'wallet_deposit', 'tournament_fee', 'club_payment')),
  vnpay_response_code TEXT,
  vnpay_transaction_no TEXT,
  refund_amount NUMERIC DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wallets table for user balance
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update transactions" ON public.payment_transactions
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for payment_receipts
CREATE POLICY "Users can view their own receipts" ON public.payment_receipts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payment_transactions pt WHERE pt.id = payment_receipts.transaction_id AND pt.user_id = auth.uid())
  );

CREATE POLICY "System can create receipts" ON public.payment_receipts
  FOR INSERT WITH CHECK (true);

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage wallets" ON public.wallets
  FOR ALL USING (true);

-- Functions for payment processing
CREATE OR REPLACE FUNCTION public.create_payment_transaction(
  p_user_id UUID,
  p_amount NUMERIC,
  p_transaction_ref TEXT,
  p_transaction_type TEXT DEFAULT 'membership',
  p_payment_method TEXT DEFAULT 'vnpay'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO public.payment_transactions (
    user_id, amount, transaction_ref, transaction_type, payment_method
  ) VALUES (
    p_user_id, p_amount, p_transaction_ref, p_transaction_type, p_payment_method
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Function to upgrade membership after successful payment
CREATE OR REPLACE FUNCTION public.upgrade_membership_after_payment(
  p_user_id UUID,
  p_transaction_ref TEXT,
  p_membership_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user profile membership
  UPDATE public.profiles 
  SET 
    membership_type = p_membership_type,
    membership_expires_at = CASE 
      WHEN p_membership_type = 'premium' THEN now() + INTERVAL '1 year'
      WHEN p_membership_type = 'vip' THEN now() + INTERVAL '1 year'
      ELSE NULL
    END,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    p_user_id,
    'membership_upgrade',
    'Nâng cấp thành công',
    'Tài khoản của bạn đã được nâng cấp lên ' || p_membership_type,
    'high'
  );
  
  RETURN TRUE;
END;
$$;

-- Function to process refund
CREATE OR REPLACE FUNCTION public.process_refund(
  p_transaction_id UUID,
  p_refund_amount NUMERIC,
  p_refund_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction 
  FROM public.payment_transactions 
  WHERE id = p_transaction_id AND status = 'success';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not eligible for refund';
  END IF;
  
  IF p_refund_amount > v_transaction.amount THEN
    RAISE EXCEPTION 'Refund amount cannot exceed transaction amount';
  END IF;
  
  -- Update transaction
  UPDATE public.payment_transactions 
  SET 
    status = 'refunded',
    refund_amount = p_refund_amount,
    refund_reason = p_refund_reason,
    refunded_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    v_transaction.user_id,
    'refund_processed',
    'Hoàn tiền thành công',
    'Giao dịch ' || v_transaction.transaction_ref || ' đã được hoàn tiền ' || p_refund_amount || ' VNĐ',
    'normal'
  );
  
  RETURN TRUE;
END;
$$;

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_transaction_type TEXT DEFAULT 'deposit'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create wallet if not exists
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update balance
  UPDATE public.wallets 
  SET 
    balance = CASE 
      WHEN p_transaction_type = 'deposit' THEN balance + p_amount
      WHEN p_transaction_type = 'withdraw' THEN balance - p_amount
      ELSE balance
    END,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- Add missing columns to profiles table for membership
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'membership_type') THEN
    ALTER TABLE public.profiles ADD COLUMN membership_type TEXT DEFAULT 'basic' CHECK (membership_type IN ('basic', 'premium', 'vip'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'membership_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN membership_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;