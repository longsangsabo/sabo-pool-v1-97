import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Tournament {
  id: string;
  name: string;
  registration_end: string;
  max_participants: number;
  status: string;
  current_participants: number;
}

interface Registration {
  id: string;
  player_id: string;
  payment_status: string;
  registration_date: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🤖 Tournament automation started...');
    
    // Get all active tournaments
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['registration_open', 'upcoming'])
      .order('registration_end', { ascending: true });

    if (tournamentsError) {
      console.error('❌ Error fetching tournaments:', tournamentsError);
      throw tournamentsError;
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('✅ No active tournaments to process');
      return new Response(JSON.stringify({ message: 'No active tournaments' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    
    for (const tournament of tournaments as Tournament[]) {
      console.log(`\n🏆 Processing tournament: ${tournament.name}`);
      
      // Get paid registrations
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('payment_status', 'paid')
        .order('registration_date', { ascending: true });

      if (regError) {
        console.error(`❌ Error fetching registrations for ${tournament.name}:`, regError);
        continue;
      }

      const paidCount = registrations?.length || 0;
      const now = new Date();
      const registrationEnd = new Date(tournament.registration_end);
      const hoursUntilEnd = (registrationEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      console.log(`📊 Tournament stats:
        - Paid participants: ${paidCount}
        - Max participants: ${tournament.max_participants}
        - Hours until registration end: ${hoursUntilEnd.toFixed(1)}
        - Status: ${tournament.status}`);

      let action = 'none';
      let reason = '';

      // Điều kiện A: Đủ 16 người + Hết hạn đăng ký
      if (paidCount >= 16 && now > registrationEnd) {
        action = 'finalize';
        reason = 'Registration ended with enough participants';
      }
      // Điều kiện B: Đủ 16 người + Còn 24h nữa hết hạn (auto finalize early)
      else if (paidCount >= 16 && hoursUntilEnd <= 24 && hoursUntilEnd > 0) {
        action = 'finalize';
        reason = 'Early finalization - enough participants with 24h remaining';
      }
      // Điều kiện C: Hết hạn đăng ký + Chưa đủ người
      else if (now > registrationEnd && paidCount < 16) {
        action = 'cancel';
        reason = 'Registration ended without enough participants';
      }

      if (action === 'finalize') {
        console.log(`✅ FINALIZING: ${reason}`);
        
        // Get top 16 earliest paid registrations
        const selectedRegistrations = (registrations as Registration[]).slice(0, 16);
        const selectedIds = selectedRegistrations.map(r => r.id);
        
        // Remove unselected registrations
        const { error: removeError } = await supabase
          .from('tournament_registrations')
          .delete()
          .eq('tournament_id', tournament.id)
          .not('id', 'in', `(${selectedIds.map(id => `"${id}"`).join(',')})`);

        if (removeError) {
          console.error('❌ Error removing unselected registrations:', removeError);
          continue;
        }

        // Confirm selected 16
        const { error: confirmError } = await supabase
          .from('tournament_registrations')
          .update({
            status: 'confirmed',
            registration_status: 'confirmed'
          })
          .in('id', selectedIds);

        if (confirmError) {
          console.error('❌ Error confirming registrations:', confirmError);
          continue;
        }

        // Update tournament status
        const { error: tournamentError } = await supabase
          .from('tournaments')
          .update({
            status: 'registration_closed',
            current_participants: 16,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournament.id);

        if (tournamentError) {
          console.error('❌ Error updating tournament:', tournamentError);
          continue;
        }

        // Create notifications for selected participants
        const notifications = selectedRegistrations.map(reg => ({
          user_id: reg.player_id,
          type: 'tournament_finalized',
          title: 'Giải đấu đã chốt sổ!',
          message: `Chúc mừng! Bạn đã được chọn tham gia giải đấu "${tournament.name}". Giải đấu sẽ bắt đầu sớm.`,
          priority: 'high',
          metadata: {
            tournament_id: tournament.id,
            tournament_name: tournament.name
          }
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('❌ Error creating notifications:', notifError);
        }

        results.push({
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          action: 'finalized',
          reason,
          selected_participants: 16,
          removed_participants: paidCount - 16
        });

      } else if (action === 'cancel') {
        console.log(`❌ CANCELING: ${reason}`);
        
        // Update tournament status to cancelled
        const { error: cancelError } = await supabase
          .from('tournaments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', tournament.id);

        if (cancelError) {
          console.error('❌ Error cancelling tournament:', cancelError);
          continue;
        }

        // Notify participants about cancellation
        if (registrations && registrations.length > 0) {
          const cancelNotifications = (registrations as Registration[]).map(reg => ({
            user_id: reg.player_id,
            type: 'tournament_cancelled',
            title: 'Giải đấu đã bị hủy',
            message: `Giải đấu "${tournament.name}" đã bị hủy do không đủ người tham gia. Tiền sẽ được hoàn lại.`,
            priority: 'high',
            metadata: {
              tournament_id: tournament.id,
              tournament_name: tournament.name
            }
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(cancelNotifications);

          if (notifError) {
            console.error('❌ Error creating cancel notifications:', notifError);
          }
        }

        results.push({
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          action: 'cancelled',
          reason,
          participants_to_refund: paidCount
        });

      } else {
        console.log(`⏳ WAITING: ${paidCount}/16 paid, ${hoursUntilEnd.toFixed(1)}h remaining`);
        results.push({
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          action: 'waiting',
          paid_count: paidCount,
          hours_remaining: Math.round(hoursUntilEnd * 100) / 100
        });
      }
    }

    console.log('\n🎯 Automation completed successfully');
    console.log('📋 Results summary:', JSON.stringify(results, null, 2));

    return new Response(JSON.stringify({
      success: true,
      processed_tournaments: tournaments.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Error in tournament automation:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);