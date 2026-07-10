import { NextResponse } from 'next/server';
import { getDb, saveDb, Member, WebhookLog } from '@/lib/db';

const HUBLA_WEBHOOK_TOKEN = process.env.HUBLA_WEBHOOK_TOKEN || 'hubla-secret-token-123';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-hubla-token');
    
    // Header authentication check
    if (token !== HUBLA_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { event, data } = payload;

    if (!event || !data || !data.email) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const db = await getDb();
    const email = data.email.toLowerCase();
    
    // Log the webhook in public.webhook_logs
    const newLog: WebhookLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event,
      email,
      payload,
      created_at: new Date().toISOString()
    };
    db.webhook_logs.push(newLog);

    if (event === 'customer.member_added') {
      const existingIndex = db.members.findIndex(m => m.email.toLowerCase() === email);
      if (existingIndex > -1) {
        // Activate existing
        db.members[existingIndex].status = 'Ativo';
        db.members[existingIndex].deactivated_at = undefined;
      } else {
        // Create new member
        const name = data.name || email.split('@')[0];
        const nameParts = name.trim().split(/\s+/);
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : nameParts[0][0].toUpperCase();

        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '.');
        let usernameCount = 1;
        let finalUsername = username;
        while (db.members.some(m => m.username === finalUsername)) {
          finalUsername = `${username}.${usernameCount}`;
          usernameCount++;
        }

        const newMember: Member = {
          id: `mentor-uuid-${Date.now()}`,
          name,
          email,
          role: 'Mentorado Hubla',
          company: 'Membro',
          industry: 'Desconhecida',
          location: 'Brasil',
          initials,
          img: '',
          bio: 'Adicionado via Hubla.',
          username: finalUsername,
          member_type: 'mentor',
          theme: 'dark',
          status: 'Ativo',
          added_at: new Date().toISOString()
        };
        db.members.push(newMember);
      }
    } else if (event === 'customer.member_removed') {
      const existingIndex = db.members.findIndex(m => m.email.toLowerCase() === email);
      if (existingIndex > -1) {
        // Deactivate member
        db.members[existingIndex].status = 'Inativo';
        db.members[existingIndex].deactivated_at = new Date().toISOString();
      }
    }

    await saveDb(db);

    return NextResponse.json({ success: true, processed: event });

  } catch (error) {
    console.error('Hubla Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
