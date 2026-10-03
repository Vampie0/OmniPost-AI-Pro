// send-push: fans out a stored notification row to the user's registered
// Expo push devices. Invoked by the DB trigger (dispatch_push) on
// notifications INSERT — no JWT is attached by pg_net, so deploy this
// function with:  supabase functions deploy send-push --no-verify-jwt
// The trigger only passes a notification id; this function re-reads the row
// with the service key, so a forged call can at most re-send an existing
// notification to its own owner — it can never invent content or target.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  try {
    const { notification_id } = await req.json();
    if (!notification_id) {
      return json({ error: 'notification_id is required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: notification } = await admin
      .from('notifications')
      .select('id, user_id, title, body, type, metadata')
      .eq('id', notification_id)
      .maybeSingle();

    if (!notification) {
      return json({ ok: true, sent: 0, reason: 'notification not found' });
    }

    const { data: tokens, error: tokensError } = await admin
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', notification.user_id);

    if (tokensError || !tokens || tokens.length === 0) {
      return json({ ok: true, sent: 0, reason: 'no registered devices' });
    }

    const messages = tokens.map((t) => ({
      to: t.token,
      title: notification.title,
      body: notification.body,
      sound: 'default' as const,
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...(notification.metadata ?? {}),
      },
    }));

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!expoRes.ok) {
      const text = await expoRes.text();
      console.error('Expo push API error', expoRes.status, text);
      return json({ ok: false, error: `expo ${expoRes.status}` }, 502);
    }

    // Purge tokens whose device unregistered (receipt-level errors).
    const tickets = (await expoRes.json()) as {
      data: Array<{ status: string; message?: string } | null>;
    };
    const deadTokenIds = tickets.data
      .map((ticket, i) =>
        ticket?.status === 'error' && ticket.message === 'DeviceNotRegistered'
          ? tokens[i].id
          : null
      )
      .filter((id): id is string => id !== null);

    if (deadTokenIds.length > 0) {
      await admin.from('push_tokens').delete().in('id', deadTokenIds);
    }

    return json({ ok: true, sent: messages.length, purged: deadTokenIds.length });
  } catch (err) {
    console.error('send-push failed:', err);
    return json({ error: err instanceof Error ? err.message : 'unknown' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
