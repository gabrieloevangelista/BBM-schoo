
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  console.log('Reading mockDb.json...');
  const data = JSON.parse(fs.readFileSync('./src/data/mockDb.json', 'utf-8'));

  console.log('Seeding members...');
  if (data.members && data.members.length > 0) {
    const { error } = await supabase.from('members').insert(data.members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      company: m.company,
      industry: m.industry,
      location: m.location,
      initials: m.initials,
      img: m.img,
      bio: m.bio,
      username: m.username,
      member_type: m.member_type,
      theme: m.theme,
      status: m.status,
      added_at: m.added_at
    })));
    if (error) console.error('Error seeding members:', error);
    else console.log('Members seeded!');
  }

  console.log('Seeding courses...');
  if (data.courses && data.courses.length > 0) {
    const { error } = await supabase.from('courses').insert(data.courses);
    if (error) console.error('Error seeding courses:', error);
    else console.log('Courses seeded!');
  }

  console.log('Seeding modules...');
  if (data.modules && data.modules.length > 0) {
    const { error } = await supabase.from('modules').insert(data.modules);
    if (error) console.error('Error seeding modules:', error);
    else console.log('Modules seeded!');
  }

  console.log('Seeding lessons...');
  if (data.lessons && data.lessons.length > 0) {
    const { error } = await supabase.from('lessons').insert(data.lessons);
    if (error) console.error('Error seeding lessons:', error);
    else console.log('Lessons seeded!');
  }

  console.log('Seeding resources...');
  if (data.resources && data.resources.length > 0) {
    const { error } = await supabase.from('resources').insert(data.resources);
    if (error) console.error('Error seeding resources:', error);
    else console.log('Resources seeded!');
  }

  console.log('Seeding lesson_comments...');
  if (data.lesson_comments && data.lesson_comments.length > 0) {
    const { error } = await supabase.from('lesson_comments').insert(data.lesson_comments);
    if (error) console.error('Error seeding lesson_comments:', error);
    else console.log('lesson_comments seeded!');
  }

  console.log('Seeding community_posts...');
  if (data.community_posts && data.community_posts.length > 0) {
    const { error } = await supabase.from('community_posts').insert(data.community_posts);
    if (error) console.error('Error seeding community_posts:', error);
    else console.log('community_posts seeded!');
  }

  console.log('Seeding calendar_events...');
  if (data.calendar_events && data.calendar_events.length > 0) {
    const { error } = await supabase.from('calendar_events').insert(data.calendar_events);
    if (error) console.error('Error seeding calendar_events:', error);
    else console.log('calendar_events seeded!');
  }

  console.log('Seeding missions...');
  if (data.missions && data.missions.length > 0) {
    const { error } = await supabase.from('missions').insert(data.missions);
    if (error) console.error('Error seeding missions:', error);
    else console.log('missions seeded!');
  }

  console.log('Seeding mission_submissions...');
  if (data.mission_submissions && data.mission_submissions.length > 0) {
    const { error } = await supabase.from('mission_submissions').insert(data.mission_submissions);
    if (error) console.error('Error seeding mission_submissions:', error);
    else console.log('mission_submissions seeded!');
  }

  console.log('Seeding ecosystem_banners...');
  if (data.ecosystem_banners && data.ecosystem_banners.length > 0) {
    const { error } = await supabase.from('ecosystem_banners').insert(data.ecosystem_banners);
    if (error) console.error('Error seeding ecosystem_banners:', error);
    else console.log('ecosystem_banners seeded!');
  }

  console.log('Seeding user_lesson_progress...');
  if (data.user_lesson_progress && data.user_lesson_progress.length > 0) {
    const { error } = await supabase.from('user_lesson_progress').insert(data.user_lesson_progress);
    if (error) console.error('Error seeding user_lesson_progress:', error);
    else console.log('user_lesson_progress seeded!');
  }

  console.log('Seeding notifications...');
  if (data.notifications && data.notifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(data.notifications);
    if (error) console.error('Error seeding notifications:', error);
    else console.log('notifications seeded!');
  }

  console.log('Seeding member_connections...');
  if (data.member_connections && data.member_connections.length > 0) {
    const { error } = await supabase.from('member_connections').insert(data.member_connections);
    if (error) console.error('Error seeding member_connections:', error);
    else console.log('member_connections seeded!');
  }

  console.log('Seeding completed!');
}

seed();
