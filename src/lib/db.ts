import fs from 'fs';
import path from 'path';

// Define DB Types
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
  member_type: 'admin' | 'master' | 'mentor';
  theme: string;
  status: 'Ativo' | 'Inativo';
  added_at: string;
  deactivated_at?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
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
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface CommunityComment {
  id: string;
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
  liked_by_users: string[]; // User IDs
  saved_by_users: string[]; // User IDs
  comments: CommunityComment[];
  post_type: 'standard' | 'status' | 'reels';
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
  user_id: string | null; // null for global
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
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
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

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'mockDb.json');

// Helper to check if running on Server
const isServer = typeof window === 'undefined';

export async function getDb(): Promise<DatabaseSchema> {
  if (isServer) {
    try {
      if (!fs.existsSync(DB_FILE_PATH)) {
        // Fallback or create default
        return {
          members: [], courses: [], modules: [], lessons: [], resources: [],
          member_connections: [], community_posts: [], lesson_comments: [],
          notifications: [], calendar_events: [], ecosystem_banners: [],
          missions: [], mission_submissions: [], story_views: [],
          investment_opportunities: [], projects: [], user_lesson_progress: [],
          webhook_logs: []
        };
      }
      const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
      return JSON.parse(data) as DatabaseSchema;
    } catch (error) {
      console.error('Error reading mockDb from disk:', error);
      throw error;
    }
  } else {
    // Client side fetch
    try {
      const response = await fetch('/api/db');
      if (!response.ok) {
        throw new Error('Failed to fetch DB from API');
      }
      return await response.json() as DatabaseSchema;
    } catch (error) {
      console.error('Error fetching DB on client:', error);
      // fallback to localStorage if api is unreachable
      const localData = localStorage.getItem('bbm_mock_db');
      if (localData) {
        return JSON.parse(localData) as DatabaseSchema;
      }
      throw error;
    }
  }
}

export async function saveDb(db: DatabaseSchema): Promise<void> {
  if (isServer) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing mockDb to disk:', error);
      throw error;
    }
  } else {
    // Client side save
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(db),
      });
      if (!response.ok) {
        throw new Error('Failed to save DB through API');
      }
    } catch (error) {
      console.error('Error saving DB on client:', error);
      // save to localStorage
      localStorage.setItem('bbm_mock_db', JSON.stringify(db));
    }
  }
}

// Convenience wrapper functions
export async function getMembers() {
  const db = await getDb();
  return db.members;
}

export async function updateMember(updatedMember: Member) {
  const db = await getDb();
  db.members = db.members.map(m => m.id === updatedMember.id ? updatedMember : m);
  await saveDb(db);
  return updatedMember;
}

export async function addMember(member: Omit<Member, 'id' | 'added_at'>) {
  const db = await getDb();
  const newMember: Member = {
    ...member,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    added_at: new Date().toISOString()
  };
  db.members.push(newMember);
  await saveDb(db);
  return newMember;
}

export async function deleteMember(id: string) {
  const db = await getDb();
  db.members = db.members.filter(m => m.id !== id);
  await saveDb(db);
}

export async function getCourses() {
  const db = await getDb();
  return db.courses.sort((a, b) => a.sequence_order - b.sequence_order);
}

export async function getModules(courseId: string) {
  const db = await getDb();
  return db.modules
    .filter(m => m.course_id === courseId)
    .sort((a, b) => a.sequence_order - b.sequence_order);
}

export async function getLessons(moduleId: string) {
  const db = await getDb();
  return db.lessons
    .filter(l => l.module_id === moduleId)
    .sort((a, b) => a.sequence_order - b.sequence_order);
}

export async function getResources(lessonId: string) {
  const db = await getDb();
  return db.resources.filter(r => r.lesson_id === lessonId);
}

export async function getCalendarEvents() {
  const db = await getDb();
  return db.calendar_events.sort((a, b) => {
    return new Date(`${a.event_date}T${a.start_time}`).getTime() - new Date(`${b.event_date}T${b.start_time}`).getTime();
  });
}

export async function addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
  const db = await getDb();
  const newEvent: CalendarEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  db.calendar_events.push(newEvent);
  
  // Also create a global notification
  const notification: Notification = {
    id: `notification-${Date.now()}`,
    user_id: null,
    title: 'Novo Evento Criado',
    description: `${event.title} foi agendado para o dia ${event.event_date.split('-').reverse().join('/')}.`,
    type: event.event_type,
    link: '/calendario',
    is_read: false,
    created_at: new Date().toISOString()
  };
  db.notifications.unshift(notification);

  await saveDb(db);
  return newEvent;
}

export async function deleteCalendarEvent(id: string) {
  const db = await getDb();
  db.calendar_events = db.calendar_events.filter(e => e.id !== id);
  await saveDb(db);
}

export async function getCommunityPosts() {
  const db = await getDb();
  // Filter out status posts older than 24 hours
  const now = new Date().getTime();
  const filterPosts = db.community_posts.filter(post => {
    if (post.post_type === 'status') {
      const postTime = new Date(post.created_at).getTime();
      return (now - postTime) < 24 * 60 * 60 * 1000;
    }
    return true;
  });
  return filterPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes_count' | 'liked_by_users' | 'saved_by_users' | 'comments' | 'created_at'>) {
  const db = await getDb();
  const newPost: CommunityPost = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    likes_count: 0,
    liked_by_users: [],
    saved_by_users: [],
    comments: [],
    created_at: new Date().toISOString()
  };
  db.community_posts.unshift(newPost);
  await saveDb(db);
  return newPost;
}

export async function updateCommunityPost(post: CommunityPost) {
  const db = await getDb();
  db.community_posts = db.community_posts.map(p => p.id === post.id ? post : p);
  await saveDb(db);
  return post;
}

export async function getMissions() {
  const db = await getDb();
  return db.missions;
}

export async function getMissionSubmissions() {
  const db = await getDb();
  return db.mission_submissions;
}

export async function addMissionSubmission(submission: Omit<MissionSubmission, 'id' | 'submitted_at' | 'status'>) {
  const db = await getDb();
  
  // Check if approved submission already exists
  const existing = db.mission_submissions.find(s => s.mission_id === submission.mission_id && s.student_id === submission.student_id);
  if (existing && existing.status === 'approved') {
    throw new Error('Essa missão já foi aprovada e não pode ser reenviada.');
  }

  if (existing) {
    // Update existing (e.g. if rejected previously)
    existing.text_answer = submission.text_answer;
    existing.form_submitted_link = submission.form_submitted_link;
    existing.file_url = submission.file_url;
    existing.file_name = submission.file_name;
    existing.status = 'pending';
    existing.feedback = '';
    existing.submitted_at = new Date().toISOString();
    await saveDb(db);
    return existing;
  } else {
    // Create new
    const newSubmission: MissionSubmission = {
      ...submission,
      id: `submission-${Date.now()}`,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };
    db.mission_submissions.push(newSubmission);
    await saveDb(db);
    return newSubmission;
  }
}

export async function updateMissionSubmission(id: string, status: 'pending' | 'approved' | 'rejected', feedback?: string, reviewerId?: string) {
  const db = await getDb();
  db.mission_submissions = db.mission_submissions.map(s => {
    if (s.id === id) {
      return {
        ...s,
        status,
        feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      };
    }
    return s;
  });
  await saveDb(db);
}

export async function getEcosystemBanners() {
  const db = await getDb();
  return db.ecosystem_banners
    .filter(b => !b.disabled)
    .sort((a, b) => a.sequence_order - b.sequence_order);
}

export async function getAllBanners() {
  const db = await getDb();
  return db.ecosystem_banners.sort((a, b) => a.sequence_order - b.sequence_order);
}

export async function saveBanners(banners: EcosystemBanner[]) {
  const db = await getDb();
  db.ecosystem_banners = banners;
  await saveDb(db);
}

export async function getInvestmentOpportunities() {
  const db = await getDb();
  return db.investment_opportunities;
}

export async function getProjects() {
  const db = await getDb();
  return db.projects;
}

export async function getUserLessonProgress(userId: string) {
  const db = await getDb();
  return db.user_lesson_progress.filter(p => p.user_id === userId);
}

export async function updateUserLessonProgress(userId: string, lessonId: string, watchedSeconds: number, totalSeconds: number) {
  const db = await getDb();
  const percent = Math.round((watchedSeconds / totalSeconds) * 100);
  const completed = percent >= 90; // Mark complete at 90%

  const existingIndex = db.user_lesson_progress.findIndex(p => p.user_id === userId && p.lesson_id === lessonId);
  if (existingIndex > -1) {
    db.user_lesson_progress[existingIndex] = {
      ...db.user_lesson_progress[existingIndex],
      watched_seconds: watchedSeconds,
      total_seconds: totalSeconds,
      percent_complete: percent,
      completed: completed || db.user_lesson_progress[existingIndex].completed, // don't revert completion
      last_watched_at: new Date().toISOString()
    };
  } else {
    db.user_lesson_progress.push({
      id: `progress-${Date.now()}`,
      user_id: userId,
      lesson_id: lessonId,
      watched_seconds: watchedSeconds,
      total_seconds: totalSeconds,
      percent_complete: percent,
      completed,
      last_watched_at: new Date().toISOString()
    });
  }
  await saveDb(db);
}

export async function getNotifications(userId: string | null) {
  const db = await getDb();
  return db.notifications.filter(n => n.user_id === null || n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationAsRead(id: string) {
  const db = await getDb();
  db.notifications = db.notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
  await saveDb(db);
}
