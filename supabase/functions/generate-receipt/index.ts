import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transactionId } = await req.json();

    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        profiles!payment_transactions_user_id_fkey(full_name, email, phone)
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      throw new Error('Transaction not found');
    }

    // Generate receipt number if not exists
    const receiptNumber = `RCP-${transaction.transaction_ref}`;
    
    // Check if receipt already exists
    let { data: existingReceipt } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (!existingReceipt) {
      // Create new receipt record
      const { data: newReceipt, error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          transaction_id: transactionId,
          receipt_number: receiptNumber,
        })
        .select()
        .single();

      if (receiptError) {
        console.error('Error creating receipt:', receiptError);
        throw new Error('Failed to create receipt');
      }

      existingReceipt = newReceipt;
    }

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(transaction, receiptNumber);

    // In a real implementation, you would:
    // 1. Generate PDF using a service like jsPDF or Puppeteer
    // 2. Upload PDF to Supabase Storage
    // 3. Return the PDF URL
    
    // For now, return the HTML content
    return new Response(
      JSON.stringify({
        success: true,
        receiptNumber,
        receiptHtml: receiptHTML,
        receiptUrl: `data:text/html;base64,${btoa(receiptHTML)}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Receipt generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateReceiptHTML(transaction: any, receiptNumber: string): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hóa đơn thanh toán - ${receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; }
        .total { background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #1e40af; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>SABO Pool Arena Hub</h1>
          <p>Hóa đơn thanh toán điện tử</p>
        </div>
        
        <div class="content">
          <div class="row">
            <span class="label">Số hóa đơn:</span>
            <span>${receiptNumber}</span>
          </div>
          
          <div class="row">
            <span class="label">Mã giao dịch:</span>
            <span>${transaction.transaction_ref}</span>
          </div>
          
          <div class="row">
            <span class="label">Ngày thanh toán:</span>
            <span>${formatDate(transaction.created_at)}</span>
          </div>
          
          <div class="row">
            <span class="label">Khách hàng:</span>
            <span>${transaction.profiles?.full_name || 'N/A'}</span>
          </div>
          
          <div class="row">
            <span class="label">Loại giao dịch:</span>
            <span>${getTransactionTypeLabel(transaction.transaction_type)}</span>
          </div>
          
          <div class="row">
            <span class="label">Phương thức thanh toán:</span>
            <span>${transaction.payment_method.toUpperCase()}</span>
          </div>
          
          <div class="total">
            <div class="row">
              <span class="label">Tổng tiền:</span>
              <span style="font-size: 18px; color: #1e40af;">${formatCurrency(transaction.amount)}</span>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>Trạng thái:</strong> ${getStatusLabel(transaction.status)}</p>
            ${transaction.refund_amount > 0 ? `
              <p><strong>Số tiền đã hoàn:</strong> ${formatCurrency(transaction.refund_amount)}</p>
              <p><strong>Lý do hoàn tiền:</strong> ${transaction.refund_reason}</p>
            ` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của SABO Pool Arena Hub</p>
          <p>Hóa đơn được tạo tự động vào ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getTransactionTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    membership: 'Nâng cấp thành viên',
    wallet_deposit: 'Nạp tiền vào ví',
    tournament_fee: 'Phí tham gia giải đấu',
    club_payment: 'Thanh toán câu lạc bộ'
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    success: 'Thành công',
    failed: 'Thất bại',
    pending: 'Đang xử lý',
    refunded: 'Đã hoàn tiền'
  };
  return labels[status] || status;
}