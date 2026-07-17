import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json(db);
  } catch (error) {
    console.error('API GET DB error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await request.json();
    
    // Upsert standard tables
    if (db.members?.length) await supabase.from('members').upsert(db.members);
    if (db.courses?.length) await supabase.from('courses').upsert(db.courses);
    if (db.modules?.length) await supabase.from('modules').upsert(db.modules);
    if (db.lessons?.length) await supabase.from('lessons').upsert(db.lessons);
    if (db.resources?.length) await supabase.from('resources').upsert(db.resources);
    if (db.member_connections?.length) await supabase.from('member_connections').upsert(db.member_connections);
    if (db.calendar_events?.length) await supabase.from('calendar_events').upsert(db.calendar_events);
    if (db.ecosystem_banners?.length) await supabase.from('ecosystem_banners').upsert(db.ecosystem_banners);
    if (db.missions?.length) await supabase.from('missions').upsert(db.missions);
    if (db.mission_submissions?.length) await supabase.from('mission_submissions').upsert(db.mission_submissions);
    if (db.user_lesson_progress?.length) await supabase.from('user_lesson_progress').upsert(db.user_lesson_progress);
    if (db.notifications?.length) await supabase.from('notifications').upsert(db.notifications);

    // Handle community_posts and comments
    if (db.community_posts) {
      const postsToUpsert: any[] = [];
      const allComments: any[] = [];
      const allReplies: any[] = [];
      
      for (const p of db.community_posts) {
        const { comments, ...rest } = p;
        postsToUpsert.push(rest);
        if (comments) {
          for (const c of comments) {
            const { replies, ...cRest } = c;
            allComments.push({ ...cRest, post_id: p.id });
            if (replies) {
              for (const r of replies) {
                allReplies.push({ ...r, comment_id: c.id });
              }
            }
          }
        }
      }
      
      if (postsToUpsert.length) await supabase.from('community_posts').upsert(postsToUpsert);
      if (allComments.length) await supabase.from('community_comments').upsert(allComments);
      if (allReplies.length) await supabase.from('comment_replies').upsert(allReplies);
      
      // Handle simple deletions by deleting anything not in the payload
      // Delete child rows first to prevent foreign key constraint violations
      const incomingReplyIds = allReplies.map(r => r.id);
      if (incomingReplyIds.length > 0) {
        await supabase.from('comment_replies').delete().not('id', 'in', `(${incomingReplyIds.join(',')})`);
      } else {
        await supabase.from('comment_replies').delete().neq('id', 'temp');
      }

      const incomingCommentIds = allComments.map(c => c.id);
      if (incomingCommentIds.length > 0) {
        await supabase.from('community_comments').delete().not('id', 'in', `(${incomingCommentIds.join(',')})`);
      } else {
        await supabase.from('community_comments').delete().neq('id', 'temp');
      }

      const incomingPostIds = postsToUpsert.map(p => p.id);
      if (incomingPostIds.length > 0) {
        await supabase.from('community_posts').delete().not('id', 'in', `(${incomingPostIds.join(',')})`);
      } else {
        await supabase.from('community_posts').delete().neq('id', 'temp');
      }
    }
    
    // Delete calendar events that are missing
    if (db.calendar_events) {
      const incomingEventIds = db.calendar_events.map((e: any) => e.id);
      if (incomingEventIds.length > 0) {
        await supabase.from('calendar_events').delete().not('id', 'in', `(${incomingEventIds.join(',')})`);
      }
    }
    
    // Delete members that are missing
    if (db.members) {
      const incomingMemberIds = db.members.map((m: any) => m.id);
      if (incomingMemberIds.length > 0) {
        await supabase.from('members').delete().not('id', 'in', `(${incomingMemberIds.join(',')})`).neq('id', 'admin-01');
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API POST DB error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
