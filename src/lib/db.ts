import { supabase } from './supabase';

// Define DB Types (same as before to avoid breaking UI)
export interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
  industry?: string;
  location?: string;
  initials?: string;
  img?: string;
  bio?: string;
  username?: string;
  member_type: 'admin' | 'mentor' | 'mentorado';
  theme: string;
  status: 'Ativo' | 'Inativo';
  added_at: string;
  deactivated_at?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  badges?: string[];
  hidden_badges?: string[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'published' | 'rascunho';
  sequence_order: number;
  slug: string;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'published' | 'rascunho' | 'agendado';
  sequence_order: number;
  slug: string;
  scheduled_at?: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  long_description?: string;
  duration: string;
  video_url?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  instructor_name?: string;
  instructor_role?: string;
  instructor_avatar?: string;
  status: 'published' | 'rascunho' | 'agendado';
  sequence_order: number;
  slug: string;
  scheduled_at?: string;
  created_at: string;
}

export interface Resource {
  id: string;
  lesson_id: string;
  title: string;
  category: 'spreadsheet' | 'document' | 'presentation' | 'other';
  description?: string;
  file_url: string;
  format?: string;
  size?: string;
  available_at?: string;
  created_at: string;
}

export interface MemberConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CommentReply {
  id: string;
  comment_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  replies: CommentReply[];
}

export interface CommunityPost {
  id: string;
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  author_role?: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  likes_count: number;
  liked_by_users: string[]; 
  saved_by_users: string[]; 
  comments: CommunityComment[];
  post_type: 'feed' | 'status' | 'reels';
  created_at: string;
}

export interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  description?: string;
  type: 'mentoria' | 'atualizacao' | 'masterclass' | 'oportunidade' | 'recurso';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'mentoria' | 'atualizacao';
  event_date: string; 
  start_time: string; 
  end_time: string; 
  mentor_name?: string;
  mentor_role?: string;
  mentor_avatar?: string;
  mentor_bio?: string;
  topic?: string;
  zoom_link?: string;
  created_at: string;
}

export interface EcosystemBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  image: string;
  cta_text: string;
  cta_link: string;
  disabled: boolean;
  sequence_order: number;
  created_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  has_text_question: boolean;
  text_question?: string;
  has_form_link: boolean;
  form_link?: string;
  has_file_upload: boolean;
  file_upload_label?: string;
  created_at: string;
  updated_at: string;
}

export interface MissionSubmission {
  id: string;
  mission_id: string;
  student_id: string;
  text_answer?: string;
  form_submitted_link?: string;
  file_url?: string;
  file_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  watched_seconds: number;
  total_seconds: number;
  percent_complete: number;
  completed: boolean;
  last_watched_at: string;
}

export interface WebhookLog {
  id: string;
  type: string;
  email?: string;
  payload: any;
  created_at: string;
}

export interface DatabaseSchema {
  members: Member[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
  member_connections: MemberConnection[];
  community_posts: CommunityPost[];
  lesson_comments: LessonComment[];
  notifications: Notification[];
  calendar_events: CalendarEvent[];
  ecosystem_banners: EcosystemBanner[];
  missions: Mission[];
  mission_submissions: MissionSubmission[];
  story_views: { id: string; story_id: string; viewer_id: string; created_at: string }[];
  investment_opportunities: any[];
  projects: any[];
  user_lesson_progress: UserLessonProgress[];
  webhook_logs: WebhookLog[];
}

export async function getDb(): Promise<DatabaseSchema> {
  const [
    { data: members }, { data: courses }, { data: modules }, { data: lessons },
    { data: resources }, { data: member_connections }, { data: community_posts },
    { data: lesson_comments }, { data: notifications }, { data: calendar_events },
    { data: ecosystem_banners }, { data: missions }, { data: mission_submissions },
    { data: story_views }, { data: user_lesson_progress }, { data: webhook_logs },
    { data: community_comments }, { data: comment_replies }
  ] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('courses').select('*'),
    supabase.from('modules').select('*'),
    supabase.from('lessons').select('*'),
    supabase.from('resources').select('*'),
    supabase.from('member_connections').select('*'),
    supabase.from('community_posts').select('*'),
    supabase.from('lesson_comments').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('calendar_events').select('*'),
    supabase.from('ecosystem_banners').select('*'),
    supabase.from('missions').select('*'),
    supabase.from('mission_submissions').select('*'),
    supabase.from('story_views').select('*'),
    supabase.from('user_lesson_progress').select('*'),
    supabase.from('webhook_logs').select('*'),
    supabase.from('community_comments').select('*'),
    supabase.from('comment_replies').select('*')
  ]);

  // Reconstruct nested comments for posts
  const mappedPosts = (community_posts || []).map(post => {
    const postComments = (community_comments || []).filter(c => c.post_id === post.id);
    return {
      ...post,
      comments: postComments.map(c => ({
        ...c,
        replies: (comment_replies || []).filter(r => r.comment_id === c.id)
      }))
    };
  });

  // Deserialize custom fields from bio column
  const mappedMembers = (members || []).map(m => {
    let bio = m.bio || '';
    let linkedin = '';
    let instagram = '';
    let website = '';
    let badges: string[] = [];
    let hidden_badges: string[] = [];

    if (bio.includes('|||')) {
      const parts = bio.split('|||');
      bio = parts[0].trim();
      try {
        const meta = JSON.parse(parts[1]);
        linkedin = meta.linkedin || '';
        instagram = meta.instagram || '';
        website = meta.website || '';
        badges = meta.badges || [];
        hidden_badges = meta.hidden_badges || [];
      } catch (e) {
        console.error('Failed to parse member meta:', e);
      }
    }

    return {
      ...m,
      bio,
      linkedin,
      instagram,
      website,
      badges,
      hidden_badges
    };
  });

  return {
    members: mappedMembers || [],
    courses: courses || [],
    modules: modules || [],
    lessons: lessons || [],
    resources: resources || [],
    member_connections: member_connections || [],
    community_posts: mappedPosts,
    lesson_comments: lesson_comments || [],
    notifications: notifications || [],
    calendar_events: calendar_events || [],
    ecosystem_banners: ecosystem_banners || [],
    missions: missions || [],
    mission_submissions: mission_submissions || [],
    story_views: story_views || [],
    investment_opportunities: [],
    projects: [],
    user_lesson_progress: user_lesson_progress || [],
    webhook_logs: webhook_logs || []
  };
}

export async function saveDb(db: DatabaseSchema): Promise<void> {
  // This is a legacy function. Since we are migrating to Supabase, 
  // replacing entire tables on every POST is not recommended. 
  // However, for compatibility with the frontend that still calls fetch('/api/db', {method: 'POST'}), 
  // we will map it to API calls in route.ts or handle individual inserts in the frontend.
  console.warn("saveDb is deprecated. Use direct Supabase queries for mutations.");
}

// Added backwards compatible helper functions
export async function getMembers() { const db = await getDb(); return db.members; }
export async function updateMember(updatedMember: Member) {
  const { linkedin, instagram, website, badges, hidden_badges, ...rest } = updatedMember;
  const meta = {
    linkedin: linkedin || '',
    instagram: instagram || '',
    website: website || '',
    badges: badges || [],
    hidden_badges: hidden_badges || []
  };
  const sanitized = {
    ...rest,
    bio: `${updatedMember.bio || ''} ||| ${JSON.stringify(meta)}`
  };
  await supabase.from('members').update(sanitized).eq('id', updatedMember.id);
  return updatedMember;
}
export async function addMember(member: Omit<Member, 'id' | 'added_at'>) {
  const newMember = { ...member, id: `user-${Date.now()}`, added_at: new Date().toISOString() };
  const { linkedin, instagram, website, badges, hidden_badges, ...rest } = newMember;
  const meta = {
    linkedin: linkedin || '',
    instagram: instagram || '',
    website: website || '',
    badges: badges || [],
    hidden_badges: hidden_badges || []
  };
  const sanitized = {
    ...rest,
    bio: `${newMember.bio || ''} ||| ${JSON.stringify(meta)}`
  };
  await supabase.from('members').insert([sanitized]);
  return newMember as Member;
}
export async function deleteMember(id: string) {
  await supabase.from('members').delete().eq('id', id);
}

export async function getCourses() { const db = await getDb(); return db.courses; }
export async function getModules(courseId: string) { const db = await getDb(); return db.modules.filter(m => m.course_id === courseId); }
export async function getLessons(moduleId: string) { const db = await getDb(); return db.lessons.filter(l => l.module_id === moduleId); }
export async function getResources(lessonId: string) { const db = await getDb(); return db.resources.filter(r => r.lesson_id === lessonId); }
export async function getCalendarEvents() { const db = await getDb(); return db.calendar_events; }
export async function addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
  const newEvent = { ...event, id: `event-${Date.now()}`, created_at: new Date().toISOString() };
  await supabase.from('calendar_events').insert([newEvent]);
  return newEvent as CalendarEvent;
}
export async function deleteCalendarEvent(id: string) {
  await supabase.from('calendar_events').delete().eq('id', id);
}
export async function getCommunityPosts() { const db = await getDb(); return db.community_posts; }
export async function addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes_count' | 'liked_by_users' | 'saved_by_users' | 'comments' | 'created_at'>) {
  const newPost = { ...post, id: `post-${Date.now()}`, likes_count: 0, liked_by_users: [], saved_by_users: [], created_at: new Date().toISOString() };
  await supabase.from('community_posts').insert([newPost]);
  return { ...newPost, comments: [] } as CommunityPost;
}
export async function updateCommunityPost(post: CommunityPost) {
  const { comments, ...rest } = post;
  await supabase.from('community_posts').update(rest).eq('id', post.id);
  return post;
}
export async function getMissions() { const db = await getDb(); return db.missions; }
export async function getMissionSubmissions() { const db = await getDb(); return db.mission_submissions; }
export async function addMissionSubmission(submission: Omit<MissionSubmission, 'id' | 'submitted_at' | 'status'>) {
  const newSub = { ...submission, id: `submission-${Date.now()}`, status: 'pending', submitted_at: new Date().toISOString() };
  await supabase.from('mission_submissions').insert([newSub]);
  return newSub as MissionSubmission;
}
export async function updateMissionSubmission(id: string, status: 'pending' | 'approved' | 'rejected', feedback?: string, reviewerId?: string) {
  await supabase.from('mission_submissions').update({ status, feedback, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
}
export async function getEcosystemBanners() { const db = await getDb(); return db.ecosystem_banners.filter(b => !b.disabled); }
export async function getAllBanners() { const db = await getDb(); return db.ecosystem_banners; }
export async function saveBanners(banners: EcosystemBanner[]) {
  await supabase.from('ecosystem_banners').delete().neq('id', 'temp');
  await supabase.from('ecosystem_banners').insert(banners);
}
export async function getInvestmentOpportunities() { return []; }
export async function getProjects() { return []; }
export async function getUserLessonProgress(userId: string) { const db = await getDb(); return db.user_lesson_progress.filter(p => p.user_id === userId); }
export async function updateUserLessonProgress(userId: string, lessonId: string, watchedSeconds: number, totalSeconds: number) {
  const percent = Math.round((watchedSeconds / totalSeconds) * 100);
  await supabase.from('user_lesson_progress').upsert({ user_id: userId, lesson_id: lessonId, watched_seconds: watchedSeconds, total_seconds: totalSeconds, percent_complete: percent, completed: percent >= 90, last_watched_at: new Date().toISOString() });
}
export async function getNotifications(userId: string | null) { const db = await getDb(); return db.notifications.filter(n => n.user_id === null || n.user_id === userId); }
export async function markNotificationAsRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}
