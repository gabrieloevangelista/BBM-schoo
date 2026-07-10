import { NextResponse } from 'next/server';
import { getDb, saveDb, Member } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if user already exists
    const userExists = db.members.some(
      m => m.email.toLowerCase() === email.toLowerCase()
    );
    if (userExists) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    // Generate username: only lowercase letters, numbers, underscores or periods
    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '.');
    // Ensure username is unique
    let usernameCount = 1;
    let finalUsername = username;
    while (db.members.some(m => m.username === finalUsername)) {
      finalUsername = `${username}.${usernameCount}`;
      usernameCount++;
    }

    // Generate initials (e.g., "John Doe" -> "JD")
    const nameParts = name.trim().split(/\s+/);
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0][0].toUpperCase();

    // Create the Member record
    const newMemberId = `mentor-uuid-${Date.now()}`;
    const newMember: Member = {
      id: newMemberId,
      name,
      email: email.toLowerCase(),
      role: 'Mentorado Elite',
      company: 'Membro',
      industry: 'Real Estate',
      location: 'Brasil',
      initials,
      img: '',
      bio: 'Novo membro da comunidade BBM School.',
      username: finalUsername,
      member_type: 'mentor',
      theme: 'dark',
      status: 'Ativo',
      added_at: new Date().toISOString()
    };

    // Simulate transaction rollback:
    // If saving the profile fails, we would delete the Auth user.
    // In our mock layer, we can simulate this by putting it in a try-catch.
    try {
      db.members.push(newMember);
      await saveDb(db);
    } catch (saveError) {
      console.error('Rollback triggered. DB Save failed:', saveError);
      // In Supabase, we would call: supabase.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: 'Erro ao criar o perfil do usuário. Cadastro cancelado.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        username: newMember.username,
        member_type: newMember.member_type
      }
    });

  } catch (error) {
    console.error('API register-mentorado error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
