import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  skillLevel: string;
  autoConfirm: boolean;
}

interface CreateAdminRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  create_admin?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestBody = await req.json();
    const isAdminRequest = requestBody.create_admin === true;

    if (isAdminRequest) {
      // Handle admin creation
      const { email, password, full_name = 'System Admin', phone }: CreateAdminRequest = requestBody;
      
      console.log(`Creating admin user: ${email}`);

      // Create user with admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name,
          phone,
          role: 'admin'
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: 'Admin creation failed' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`Admin user created successfully: ${authData.user.id}`);

      // Create admin profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          phone: phone,
          display_name: 'Admin',
          full_name,
          email,
          role: 'admin',
          is_admin: true,
          email_verified: true,
          city: 'Hồ Chí Minh',
          district: 'Quận 1',
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        // Cleanup: delete the auth user if profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return new Response(
          JSON.stringify({ error: `Admin profile creation failed: ${profileError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Create admin wallet
      await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: authData.user.id,
          balance: 0,
          points_balance: 1000,
          status: 'active'
        });

      // Create admin ranking
      await supabaseAdmin
        .from('player_rankings')
        .insert({
          player_id: authData.user.id,
          elo: 1500,
          elo_points: 1500,
          spa_points: 1000,
          total_matches: 0,
          wins: 0,
          losses: 0
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin user created successfully',
          user: {
            id: authData.user.id,
            email: authData.user.email,
            full_name,
            role: 'admin',
            is_admin: true
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Handle regular user creation
      const {
        email,
        password,
        fullName,
        phone,
        skillLevel,
        autoConfirm
      }: CreateUserRequest = requestBody;

      console.log(`Creating user: ${email}`);

      // Create user with admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName,
          phone: phone,
        },
        email_confirm: autoConfirm
      });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`User created successfully: ${authData.user.id}`);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        phone: phone,
        display_name: fullName.split(' ').slice(-2).join(' '),
        full_name: fullName,
        role: 'player',
        skill_level: skillLevel,
        city: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'][Math.floor(Math.random() * 5)],
        district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
        bio: `Demo user - ${skillLevel} level`,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: `Profile creation failed: ${profileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create initial ranking
    const { error: rankingError } = await supabaseAdmin
      .from('player_rankings')
      .insert({
        player_id: authData.user.id,
        elo: 800 + Math.floor(Math.random() * 400),
        spa_points: Math.floor(Math.random() * 100),
        total_matches: Math.floor(Math.random() * 20),
        wins: Math.floor(Math.random() * 15),
        losses: Math.floor(Math.random() * 10),
      });

    if (rankingError) {
      console.error('Ranking error:', rankingError);
      // Don't fail for ranking error, it's optional
    }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            phone: phone,
            full_name: fullName,
            skill_level: skillLevel,
            confirmed: autoConfirm
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});