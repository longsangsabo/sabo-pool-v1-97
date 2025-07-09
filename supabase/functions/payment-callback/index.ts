import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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

async function verifySecureHash(
  params: Record<string, any>,
  secretKey: string,
  receivedHash: string
): Promise<boolean> {
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
  const calculatedHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return calculatedHash === receivedHash;
}

serve(async req => {
  console.log('Payment callback received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    console.log('VNPay callback received:', params);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      vnp_ResponseCode,
      vnp_TxnRef,
      vnp_TransactionNo,
      vnp_SecureHash,
      vnp_Amount,
      ...otherParams
    } = params;

    // Verify secure hash
    const secretKey = Deno.env.get('VNPAY_HASH_SECRET') || '';
    if (!secretKey) {
      console.error('VNPAY_HASH_SECRET not configured');
      throw new Error('Payment verification failed - configuration error');
    }

    const isValidHash = await verifySecureHash(
      otherParams,
      secretKey,
      vnp_SecureHash
    );

    if (!isValidHash) {
      console.error('Invalid secure hash verification');
      return Response.redirect(
        `${Deno.env.get('SITE_URL') || 'https://knxevbkkkiadgppxbphh.supabase.co'}/payment/result?status=error&message=invalid_hash`,
        302
      );
    }

    console.log('Hash verification successful');

    // Update transaction status
    const paymentStatus = vnp_ResponseCode === '00' ? 'success' : 'failed';
    const amount = vnp_Amount ? parseInt(vnp_Amount) / 100 : 0; // Convert back from VNPay format

    console.log('Updating transaction:', { vnp_TxnRef, paymentStatus, vnp_ResponseCode });

    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        vnpay_response_code: vnp_ResponseCode,
        vnpay_transaction_no: vnp_TransactionNo,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_ref', vnp_TxnRef);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      throw new Error('Failed to update transaction');
    }

    console.log('Transaction updated successfully');

    // If payment successful, upgrade membership and update wallet
    if (vnp_ResponseCode === '00') {
      // Get user ID from transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('user_id, transaction_type')
        .eq('transaction_ref', vnp_TxnRef)
        .single();

      if (fetchError) {
        console.error('Failed to fetch transaction details:', fetchError);
      } else if (transaction) {
        console.log('Processing successful payment for user:', transaction.user_id);

        // Update wallet balance
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: transaction.user_id,
          p_amount: amount,
          p_transaction_type: 'deposit'
        });

        if (walletError) {
          console.error('Failed to update wallet:', walletError);
        } else {
          console.log('Wallet updated successfully');
        }

        // If it's a membership transaction, upgrade membership
        if (transaction.transaction_type === 'membership') {
          const { error: upgradeError } = await supabase.rpc(
            'upgrade_membership_after_payment',
            {
              p_user_id: transaction.user_id,
              p_transaction_ref: vnp_TxnRef,
              p_membership_type: 'premium',
            }
          );

          if (upgradeError) {
            console.error('Failed to upgrade membership:', upgradeError);
          } else {
            console.log('Membership upgraded successfully for user:', transaction.user_id);
          }
        }

        // Create notification for successful payment
        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          type: 'payment_success',
          title: 'Thanh toán thành công',
          message: `Giao dịch ${vnp_TxnRef} đã được xử lý thành công. Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ`,
          priority: 'high'
        });
      }
    } else {
      console.log('Payment failed with code:', vnp_ResponseCode);
      
      // Get user ID for failed payment notification
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('user_id')
        .eq('transaction_ref', vnp_TxnRef)
        .single();

      if (transaction) {
        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          type: 'payment_failed',
          title: 'Thanh toán thất bại',
          message: `Giao dịch ${vnp_TxnRef} không thành công. Mã lỗi: ${vnp_ResponseCode}`,
          priority: 'normal'
        });
      }
    }

    // Redirect to frontend with result
    const siteUrl = Deno.env.get('SITE_URL') || 'https://knxevbkkkiadgppxbphh.supabase.co';
    const redirectUrl = `${siteUrl}/payment/result?status=${paymentStatus}&ref=${vnp_TxnRef}&amount=${amount}`;

    console.log('Redirecting to:', redirectUrl);

    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Payment callback error:', error);

    const siteUrl = Deno.env.get('SITE_URL') || 'https://knxevbkkkiadgppxbphh.supabase.co';
    const redirectUrl = `${siteUrl}/payment/result?status=error&message=${encodeURIComponent(error.message)}`;

    return Response.redirect(redirectUrl, 302);
  }
});