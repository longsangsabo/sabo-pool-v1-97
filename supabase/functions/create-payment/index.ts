import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  userId: string;
  membershipType?: string;
  amount?: number;
  type?: string;
  paymentMethod?: string;
  description?: string;
}

function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

async function createSecureHash(
  params: Record<string, any>,
  secretKey: string
): Promise<string> {
  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');

  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const dataToSign = encoder.encode(signData);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating payment request...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid authentication token');
    }

    const {
      userId,
      membershipType,
      amount = 99000,
      type = 'membership',
      paymentMethod = 'vnpay',
      description = 'Payment for SABO Pool Arena',
    }: PaymentRequest = await req.json();

    if (!userId || !amount) {
      throw new Error('Missing required parameters: userId and amount');
    }

    console.log('Payment request details:', { userId, amount, type, paymentMethod });

    // Create transaction reference
    const transactionRef = `SABO_${userId.substring(0, 8)}_${Date.now()}`;

    // Save transaction to database
    const { data: transactionData, error: transactionError } = await supabase.rpc('create_payment_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_ref: transactionRef,
      p_transaction_type: type,
      p_payment_method: paymentMethod,
    });

    if (transactionError) {
      console.error('Database error:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    console.log('Transaction created with ID:', transactionData);

    // VNPay configuration
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const siteUrl = Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://knxevbkkkiadgppxbphh.supabase.co';
    const returnUrl = `${siteUrl.replace('/rest/v1', '')}/functions/v1/payment-callback`;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:]/g, '').split('.')[0];

    // VNPay parameters
    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: Deno.env.get('VNPAY_TMN_CODE') || '',
      vnp_Amount: String(amount * 100), // VNPay requires amount in VND * 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionRef,
      vnp_OrderInfo: description,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    console.log('VNPay parameters:', vnpParams);

    // Create secure hash
    const secretKey = Deno.env.get('VNPAY_HASH_SECRET') || '';
    if (!secretKey) {
      throw new Error('VNPAY_HASH_SECRET not configured');
    }

    const secureHash = await createSecureHash(vnpParams, secretKey);

    // Build payment URL
    const query = new URLSearchParams({
      ...vnpParams,
      vnp_SecureHash: secureHash,
    });
    const paymentUrl = `${vnpUrl}?${query.toString()}`;

    console.log('Payment URL created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        transactionRef,
        transactionId: transactionData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});