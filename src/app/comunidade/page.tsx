'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Send, 
  X, 
  Play, 
  Plus, 
  Trash2, 
  CornerDownRight, 
  Eye, 
  Users,
  Film,
  Search,
  UserPlus,
  Check,
  HelpCircle,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import { CommunityPost, CommunityComment, CommentReply, Member, MemberConnection } from '@/lib/db';
import { customAlert, customConfirm } from '@/components/CustomConfirm';
import { ComunidadeSkeleton } from '@/components/SkeletonLoaders';

export default function ComunidadePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stories (status posts)
  const [stories, setStories] = useState<CommunityPost[]>([]);
  const [archivedStories, setArchivedStories] = useState<CommunityPost[]>([]);
  const [activeUserStories, setActiveUserStories] = useState<CommunityPost[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const activeStory = activeUserStories.length > 0 ? activeUserStories[currentStoryIndex] : null;
  const [storyViewers, setStoryViewers] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const storyInputRef = React.useRef<HTMLInputElement>(null);

  // Post Creator states
  const [postType, setPostType] = useState<'standard' | 'status' | 'reels'>('standard');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string>('');

  // Lightbox state
  const [lightboxPost, setLightboxPost] = useState<CommunityPost | null>(null);

  // Inline Comment states
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null);

  // Overhaul states for Case style
  const [activeTab, setActiveTab] = useState<'all' | 'reels'>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<MemberConnection[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const fetchFeedData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // 1. Filter normal timeline posts: standard & reels
        let timelineList = db.community_posts.filter((p: CommunityPost) => p.post_type !== 'status');
        timelineList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPosts(timelineList);

        // 2. Filter stories: status posts created in the last 24 hours
        const nowTime = new Date().getTime();
        let storyList = db.community_posts.filter((p: CommunityPost) => {
          if (p.post_type !== 'status') return false;
          const postTime = new Date(p.created_at).getTime();
          return (nowTime - postTime) < 24 * 60 * 60 * 1000;
        });
        storyList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setStories(storyList);

        // 2.5 Archived stories: user's status posts older than 24 hours
        if (user) {
          let archivedList = db.community_posts.filter((p: CommunityPost) => {
            if (p.post_type !== 'status' || p.user_id !== user.id) return false;
            const postTime = new Date(p.created_at).getTime();
            return (nowTime - postTime) >= 24 * 60 * 60 * 1000;
          });
          archivedList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setArchivedStories(archivedList);
        }

        // 3. Set members and connections
        setMembers(db.members || []);
        setConnections(db.member_connections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectToggle = async (targetId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        if (!db.member_connections) db.member_connections = [];
        
        const existingIndex = db.member_connections.findIndex((c: MemberConnection) => 
          (c.requester_id === user.id && c.receiver_id === targetId) ||
          (c.requester_id === targetId && c.receiver_id === user.id)
        );

        if (existingIndex === -1) {
          // Send request
          const newConn: MemberConnection = {
            id: `conn-${Date.now()}`,
            requester_id: user.id,
            receiver_id: targetId,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          db.member_connections.push(newConn);
        } else {
          const conn = db.member_connections[existingIndex];
          if (conn.status === 'pending') {
            if (conn.requester_id === user.id) {
              // Cancel pending request sent by us
              db.member_connections.splice(existingIndex, 1);
            } else {
              // Accept request received by us
              conn.status = 'accepted';
              conn.updated_at = new Date().toISOString();
            }
          } else {
            // Remove connection (accepted status)
            db.member_connections.splice(existingIndex, 1);
          }
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });
        fetchFeedData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedData();
    }
  }, [user]);

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Direct Story Upload Logic
  const handleDirectStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    const doUpload = async (mediaUrl: string, type: 'status' | 'reels' = 'status') => {
      try {
        let base64Media;
        if (file) {
          base64Media = await fileToBase64(file);
        }

        // Moderation Check
        const modRes = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '', mediaUrl, base64Media, type })
        });
        
        if (!modRes.ok) {
          customAlert('Erro ao validar a imagem. O arquivo pode ser muito grande ou o servidor está indisponível.');
          return;
        }
        const modData = await modRes.json();
        if (!modData.safe) {
          customAlert(modData.reason || 'Conteúdo bloqueado pelos nossos filtros de segurança.');
          return;
        }

        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          const newPost: CommunityPost = {
            id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: user?.id,
            author_name: user?.name || 'Membro BBM',
            author_avatar: user?.img || '',
            author_role: user?.role || 'Mentorado',
            content: '',
            image_url: !isVideo ? mediaUrl : undefined,
            video_url: isVideo ? mediaUrl : undefined,
            likes_count: 0,
            liked_by_users: [],
            saved_by_users: [],
            comments: [],
            post_type: type,
            created_at: new Date().toISOString()
          };
          if (!db.community_posts) db.community_posts = [];
          db.community_posts.unshift(newPost);
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
          fetchFeedData();
        }
      } catch (e) {
        console.error(e);
        customAlert('Ocorreu um erro inesperado ao tentar postar. Tente novamente.');
      }
      if (storyInputRef.current) storyInputRef.current.value = '';
    };

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = async () => {
        if (video.duration <= 60) {
          const isStatus = await customConfirm('Postar como Story?', 'Confirmar');
          doUpload(localUrl, isStatus ? 'status' : 'reels');
        } else {
          customAlert('Para Stories ou Reels, o vídeo deve ter 1 minuto ou menos.');
        }
      };
      video.src = localUrl;
    } else {
      doUpload(localUrl, 'status');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      const localUrl = URL.createObjectURL(file);
      setAttachedPreview(localUrl);

      if (file.type.startsWith('image/')) {
        setPostType('standard');
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
          const duration = video.duration;
          if (duration > 180) {
            setPostType('standard');
          } else if (duration >= 60 && duration <= 180) {
            setPostType('reels');
          } else {
            const isStatus = await customConfirm(
              'Este vídeo tem menos de 1 minuto. Deseja postá-lo como um Story (Status)?\nClique em [Confirmar] para Story, ou [Cancelar] para postá-lo como Vídeo Curto normal.',
              'Formato do Vídeo'
            );
            if (isStatus) {
              setPostType('status');
            } else {
              setPostType('reels');
            }
          }
        };
        video.src = localUrl;
      }
    }
  };

  const handleRemoveAttachment = () => {
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
    }
    setAttachedFile(null);
    setAttachedPreview('');
  };

  // Handle post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedPreview) return;

    try {
      let base64Media;
      if (attachedFile) {
        base64Media = await fileToBase64(attachedFile);
      }

      // Moderation Check
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content.trim(), mediaUrl: attachedPreview || undefined, base64Media, type: postType })
      });

      if (!modRes.ok) {
        customAlert('Erro ao validar o conteúdo. O arquivo pode ser muito grande ou o servidor está indisponível.');
        return;
      }
      const modData = await modRes.json();
      if (!modData.safe) {
        customAlert(modData.reason || 'Conteúdo bloqueado pelos nossos filtros de segurança.');
        return;
      }

      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const isVideo = attachedFile?.type.startsWith('video') || false;
        
        const newPost: CommunityPost = {
          id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: user?.id,
          author_name: user?.name || 'Membro BBM',
          author_avatar: user?.img || '',
          author_role: user?.role || 'Mentorado Elite',
          content: content.trim(),
          image_url: attachedPreview && !isVideo ? attachedPreview : undefined,
          video_url: attachedPreview && isVideo ? attachedPreview : undefined,
          likes_count: 0,
          liked_by_users: [],
          saved_by_users: [],
          comments: [],
          post_type: postType,
          created_at: new Date().toISOString()
        };

        if (!db.community_posts) db.community_posts = [];
        db.community_posts.unshift(newPost);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Reset
        setContent('');
        handleRemoveAttachment();
        setPostType('standard');
        fetchFeedData();
      }
    } catch (err) {
      console.error(err);
      customAlert('Ocorreu um erro inesperado ao tentar postar. Tente novamente.');
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    const isConfirmed = await customConfirm('Deseja excluir esta publicação permanentemente?', 'Excluir Publicação');
    if (!isConfirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.community_posts = db.community_posts.filter((p: CommunityPost) => p.id !== postId);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });
        
        if (activeStory && activeStory.id === postId) {
          if (activeUserStories.length <= 1) setActiveUserStories([]);
          else fetchFeedData(); // Let it re-evaluate or we can handle nextStory
        }
        if (lightboxPost?.id === postId) setLightboxPost(null);
        fetchFeedData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Like
  const handleLikePost = async (postId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.community_posts = db.community_posts.map((p: CommunityPost) => {
          if (p.id === postId) {
            const liked = p.liked_by_users.includes(user.id);
            const newList = liked 
              ? p.liked_by_users.filter(id => id !== user.id)
              : [...p.liked_by_users, user.id];
            
            return {
              ...p,
              liked_by_users: newList,
              likes_count: newList.length
            };
          }
          return p;
        });

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchFeedData();
        // Update lightbox if open
        if (lightboxPost && lightboxPost.id === postId) {
          const updated = db.community_posts.find((p: CommunityPost) => p.id === postId);
          setLightboxPost(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Save
  const handleSavePost = async (postId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.community_posts = db.community_posts.map((p: CommunityPost) => {
          if (p.id === postId) {
            const saved = p.saved_by_users.includes(user.id);
            const newList = saved 
              ? p.saved_by_users.filter(id => id !== user.id)
              : [...p.saved_by_users, user.id];
            
            return {
              ...p,
              saved_by_users: newList
            };
          }
          return p;
        });

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchFeedData();
        if (lightboxPost && lightboxPost.id === postId) {
          const updated = db.community_posts.find((p: CommunityPost) => p.id === postId);
          setLightboxPost(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Story views logger
  const handleOpenStory = async (story: CommunityPost) => {
    const listToUse = showArchived ? archivedStories : stories;
    const userStories = listToUse.filter((s: CommunityPost) => s.user_id === story.user_id);
    
    // Reverse the order so the oldest story plays first, just like Instagram
    const sortedUserStories = [...userStories].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Se clicou em um story específico (para arquivados ou caso genérico), tentamos achar o índice dele
    // Mas para o feed normal, sempre começamos do primeiro não visto ou do início
    let startIndex = sortedUserStories.findIndex(s => s.id === story.id);
    if (startIndex === -1) startIndex = 0;
    
    setActiveUserStories(sortedUserStories);
    setCurrentStoryIndex(startIndex);

    if (!user) return;
    
    const currentStory = sortedUserStories[startIndex];

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // Log view in story_views table
        const exists = db.story_views.some(
          (v: any) => v.story_id === currentStory.id && v.viewer_id === user.id
        );
        if (!exists) {
          db.story_views.push({
            id: `view-${Date.now()}`,
            story_id: currentStory.id,
            viewer_id: user.id,
            created_at: new Date().toISOString()
          });

          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
        }

        // Load viewer profiles
        const viewersList = db.story_views
          .filter((v: any) => v.story_id === currentStory.id)
          .map((v: any) => {
            const member = db.members.find((m: any) => m.id === v.viewer_id);
            return member ? member.name : 'Membro';
          });
        setStoryViewers(viewersList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Comment/Reply to Community Post
  const handleAddComment = async (postId: string, parentCommentId?: string) => {
    const text = parentCommentId ? replyTexts[parentCommentId] : commentTexts[postId];
    if (!text || !text.trim() || !user) return;

    try {
      // Moderation Check
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type: 'comment' })
      });
      const modData = await modRes.json();
      if (!modData.safe) {
        customAlert(modData.reason || 'Conteúdo bloqueado pelos nossos filtros de segurança.');
        return;
      }

      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();

        db.community_posts = db.community_posts.map((post: CommunityPost) => {
          if (post.id === postId) {
            const newCommentId = `comm-${Date.now()}`;
            
            if (parentCommentId) {
              // 2nd level reply
              const newReply: CommentReply = {
                id: newCommentId,
                user_id: user.id,
                user_name: user.name,
                user_avatar: user.img || '',
                content: text.trim(),
                created_at: new Date().toISOString()
              };
              
              return {
                ...post,
                comments: post.comments.map(c => {
                  if (c.id === parentCommentId) {
                    return {
                      ...c,
                      replies: [...c.replies, newReply]
                    };
                  }
                  return c;
                })
              };
            } else {
              // Root level comment
              const newComment: CommunityComment = {
                id: newCommentId,
                user_id: user.id,
                user_name: user.name,
                user_avatar: user.img || '',
                content: text.trim(),
                created_at: new Date().toISOString(),
                replies: []
              };
              
              return {
                ...post,
                comments: [...post.comments, newComment]
              };
            }
          }
          return post;
        });

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        if (parentCommentId) {
          setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
          setActiveReplyBox(null);
        } else {
          setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        }

        fetchFeedData();

        // Update active Lightbox post if open
        if (lightboxPost && lightboxPost.id === postId) {
          const updated = db.community_posts.find((p: CommunityPost) => p.id === postId);
          setLightboxPost(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete comment from post
  const handleDeleteComment = async (postId: string, commentId: string, isReply: boolean = false, parentId?: string) => {
    const isConfirmed = await customConfirm('Deseja excluir este comentário?', 'Excluir Comentário');
    if (!isConfirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        db.community_posts = db.community_posts.map((post: CommunityPost) => {
          if (post.id === postId) {
            if (isReply && parentId) {
              return {
                ...post,
                comments: post.comments.map(c => {
                  if (c.id === parentId) {
                    return {
                      ...c,
                      replies: c.replies.filter(r => r.id !== commentId)
                    };
                  }
                  return c;
                })
              };
            } else {
              return {
                ...post,
                comments: post.comments.filter(c => c.id !== commentId)
              };
            }
          }
          return post;
        });

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchFeedData();

        if (lightboxPost && lightboxPost.id === postId) {
          const updated = db.community_posts.find((p: CommunityPost) => p.id === postId);
          setLightboxPost(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <ComunidadeSkeleton />;
  }

  const getConnectionState = (otherId: string): 'none' | 'pending_sent' | 'pending_received' | 'connected' => {
    if (!user) return 'none';
    const conn = connections.find(c => 
      (c.requester_id === user.id && c.receiver_id === otherId) || 
      (c.requester_id === otherId && c.receiver_id === user.id)
    );
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    return conn.requester_id === user.id ? 'pending_sent' : 'pending_received';
  };

  const filteredMembers = members
    .filter(m => m.id !== user?.id)
    .filter(m => {
      if (!memberSearch) return true;
      return m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
             (m.role && m.role.toLowerCase().includes(memberSearch.toLowerCase()));
    });

  const filteredTimelinePosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    return post.post_type === 'reels';
  });

  const nextStory = () => {
    if (currentStoryIndex < activeUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      setActiveUserStories([]);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Feed da Comunidade</h1>
        <p className="page-subtitle">Acompanhe as novidades, interaja com postagens e conecte-se com os Masters da comunidade.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-0 mb-2 gap-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-all duration-200 ${
            activeTab === 'all'
              ? 'border-primary-lemon text-primary-lemon'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
          style={{ background: 'transparent' }}
        >
          Feed da Comunidade
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-all duration-200 ${
            activeTab === 'reels'
              ? 'border-primary-lemon text-primary-lemon'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
          style={{ background: 'transparent' }}
        >
          Vídeos Curtos
        </button>
      </div>

      {/* Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column - Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Stories Bar */}
          <section className="glass-panel p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center w-full px-1">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stories</span>
              {archivedStories.length > 0 && (
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary-lemon bg-transparent border-0 cursor-pointer"
                >
                  <Archive size={12} />
                  <span>{showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}</span>
                </button>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-none items-center mt-2">
              <input 
                type="file" 
                ref={storyInputRef} 
                onChange={handleDirectStoryUpload}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />
              {/* Novo Status Story Circle */}
              <div 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => storyInputRef.current?.click()}
              >
                <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                    {user?.img ? (
                      <img src={user.img} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                      </div>
                    )}
                  </div>
                  <div 
                    className="absolute bg-primary-lemon text-black rounded-full flex items-center justify-center" 
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      bottom: '-2px', 
                      right: '-2px', 
                      border: '2px solid #111' 
                    }}
                  >
                    <Plus size={12} strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary mt-1.5 font-medium">Seu Story</span>
              </div>

            {(showArchived ? archivedStories : stories)
              .filter((story, index, self) => 
                // Group by user_id, keeping only the first (newest) story for each user
                index === self.findIndex((s) => s.user_id === story.user_id)
              )
              .map(story => (
              <div 
                key={story.id} 
                onClick={() => handleOpenStory(story)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  flexShrink: 0,
                  opacity: showArchived ? 0.7 : 1
                }}
              >
                <div 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    padding: '2px', 
                    border: showArchived ? '2px solid var(--color-text-muted)' : '2px solid #C1FF07',
                    background: 'var(--bg-deep)'
                  }}
                >
                  {story.author_avatar ? (
                    <img src={story.author_avatar} alt={story.author_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: showArchived ? 'var(--color-text-muted)' : '#C1FF07', fontSize: '0.85rem', fontWeight: 600 }} className="flex-center">
                      {story.author_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {story.author_name.split(' ')[0]}
                </span>
              </div>
            ))}

            {stories.length === 0 && !showArchived && (
              <span className="text-xs text-text-muted italic ml-2">Nenhum story ativo</span>
            )}
            </div>
          </section>

          {/* Post Creator Panel */}
          <section className="glass-panel p-5">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-3.5 items-start mb-4">
                {user?.img ? (
                  <img src={user.img} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-primary-lemon/20" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-lemon/10 border border-primary-lemon text-primary-lemon flex items-center justify-center font-bold text-sm">
                    {user?.initials}
                  </div>
                )}

                <div className="flex-grow">
                  <textarea 
                    className="w-full bg-transparent border-0 text-white placeholder-text-muted focus:outline-none text-sm min-h-[70px] p-0 resize-none" 
                    placeholder="Compartilhe um insight, atualização de obra ou dúvida com a comunidade..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />

                  {/* Attachment Preview Section */}
                  {attachedPreview && (
                    <div className="mt-3 relative inline-block rounded overflow-hidden border border-white/10 max-h-[220px]">
                      {attachedFile?.type.startsWith('video') ? (
                        <video src={attachedPreview} controls className="max-h-[200px] object-contain rounded" />
                      ) : (
                        <img src={attachedPreview} alt="Anexo" className="max-h-[200px] object-contain rounded" />
                      )}
                      <button 
                        type="button" 
                        onClick={handleRemoveAttachment} 
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85 flex items-center justify-center text-white cursor-pointer border-0 transition duration-150"
                        style={{ minWidth: 'auto' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 flex-wrap gap-4">
                <div className="flex gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => setPostType('standard')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                      postType === 'standard' 
                        ? 'bg-white/10 text-white border border-white/20' 
                        : 'border border-transparent text-text-secondary hover:text-white'
                    }`}
                    style={{ background: postType === 'standard' ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                  >
                    <MessageSquare size={12} />
                    <span>Feed Geral</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPostType('status')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                      postType === 'status' 
                        ? 'bg-white/10 text-white border border-white/20' 
                        : 'border border-transparent text-text-secondary hover:text-white'
                    }`}
                    style={{ background: postType === 'status' ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                  >
                    <Users size={12} />
                    <span>Status / Story</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPostType('reels')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                      postType === 'reels' 
                        ? 'bg-white/10 text-white border border-white/20' 
                        : 'border border-transparent text-text-secondary hover:text-white'
                    }`}
                    style={{ background: postType === 'reels' ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                  >
                    <Film size={12} />
                    <span>Reels Interno</span>
                  </button>

                  <div className="w-[1px] h-4 bg-white/10 mx-1" />

                  {/* Hidden Input File */}
                  <input 
                    type="file" 
                    id="post-file-upload" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="post-file-upload" 
                    className="p-1.5 text-text-secondary hover:text-white cursor-pointer transition duration-150 rounded hover:bg-white/5 flex items-center justify-center"
                    title="Anexar foto ou vídeo"
                  >
                    <ImageIcon size={16} />
                  </label>
                </div>

                <div className="flex gap-2.5 items-center justify-end">
                  <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer hover:shadow-[0_0_12px_rgba(193,255,7,0.2)] transition-all duration-200 uppercase font-outfit" style={{ borderRadius: '2px' }}>
                    <span>Publicar</span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Main Feed List */}
          <div className="flex flex-col gap-6">
            {filteredTimelinePosts.map(post => {
              const isLiked = user && post.liked_by_users.includes(user.id);
              const isSaved = user && post.saved_by_users.includes(user.id);
              const isAuthor = user && post.user_id === user.id;
              const isAdmin = user?.member_type === 'admin';

              return (
                <article key={post.id} className="glass-panel p-6">
                  {/* Post Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3 items-center">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full object-cover border border-white/5" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-lemon/10 border border-primary-lemon/20 text-primary-lemon flex items-center justify-center font-bold text-sm">
                          {post.author_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight font-outfit">{post.author_name}</h3>
                        <p className="text-[11px] text-text-secondary mt-0.5">{post.author_role} • {new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      {post.post_type === 'reels' && (
                        <span className="badge badge-lemon text-[9px] flex items-center gap-1">
                          <Film size={10} /> Reels
                        </span>
                      )}
                      {(isAuthor || isAdmin) && (
                        <button onClick={() => handleDeletePost(post.id)} className="outline-btn border-0 p-1 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-white text-sm mb-4 leading-relaxed white-space-pre-wrap">
                    {post.content}
                  </p>

                  {/* Post Media (Image / Video Player) */}
                  {(post.image_url || post.video_url) && (
                    <div 
                      onClick={() => setLightboxPost(post)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-white/5 bg-[#000] mb-4 relative max-h-[400px] flex-center"
                    >
                      {post.video_url ? (
                        <div className="w-full relative">
                          <video src={post.video_url} className="w-full max-h-[400px] block" muted loop autoPlay />
                          <div className="absolute top-3 right-3 bg-black/60 p-2 rounded-full text-white">
                            <Play size={16} />
                          </div>
                        </div>
                      ) : (
                        <img src={post.image_url} alt="Media" className="w-full max-h-[400px] object-contain block" />
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center border-y border-white/5 py-1 mb-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className="outline-btn border-0 text-xs flex items-center gap-1.5"
                        style={{ minWidth: 'auto', padding: '6px 12px', color: isLiked ? '#FF4A4A' : 'var(--color-text-secondary)' }}
                        title="Curtir Post"
                      >
                        <Heart size={16} fill={isLiked ? '#FF4A4A' : 'transparent'} />
                      </button>

                      <button 
                        onClick={() => setLightboxPost(post)}
                        className="outline-btn border-0 text-xs flex items-center gap-1.5"
                        style={{ minWidth: 'auto', padding: '6px 12px' }}
                        title="Comentários"
                      >
                        <MessageSquare size={16} />
                        <span className="text-[11px] font-bold text-white/50">{post.comments.length}</span>
                      </button>

                      <button 
                        onClick={() => handleSavePost(post.id)}
                        className="outline-btn border-0 text-xs flex items-center gap-1.5"
                        style={{ minWidth: 'auto', padding: '6px 12px', color: isSaved ? '#C1FF07' : 'var(--color-text-secondary)' }}
                        title="Salvar Post"
                      >
                        <Bookmark size={16} fill={isSaved ? '#C1FF07' : 'transparent'} />
                      </button>
                    </div>

                    {/* Liked Users Avatar Stack */}
                    {post.liked_by_users.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {post.liked_by_users.slice(0, 3).map(userId => {
                            const liker = members.find(m => m.id === userId);
                            if (!liker) return null;
                            return (
                              <div 
                                key={userId}
                                className="w-5 h-5 rounded-full ring-2 ring-[#12131a] bg-[#171821] flex items-center justify-center text-[7px] font-bold text-[#C1FF07] overflow-hidden"
                                title={liker.name}
                              >
                                {liker.img ? (
                                  <img src={liker.img} alt={liker.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{liker.initials || '??'}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-outfit">
                          {post.likes_count} {post.likes_count === 1 ? 'curtida' : 'curtidas'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick comments input */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id); }}
                    className="flex gap-2.5"
                  >
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      placeholder="Escreva um comentário..."
                      value={commentTexts[post.id] || ''}
                      onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: '6px' }}
                    />
                    <button type="submit" className="outline-btn text-xs" style={{ padding: '8px 12px', minWidth: 'auto' }}>
                      <Send size={12} />
                    </button>
                  </form>
                </article>
              );
            })}

            {filteredTimelinePosts.length === 0 && (
              <div className="glass-panel p-8 text-center text-text-secondary text-sm italic">
                Nenhuma publicação encontrada no feed.
              </div>
            )}
          </div>
        </div>

        {/* Right column - Masters sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2 uppercase tracking-wider">
              <Users size={16} className="text-primary-lemon" />
              <span>Masters</span>
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-text-muted z-10 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar Master..."
                className="form-input text-xs w-full pr-4 py-2"
                style={{ paddingLeft: '32px' }}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            {/* Members List */}
            <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-none">
              {filteredMembers.map(m => {
                const connectionState = getConnectionState(m.id);
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/1">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.img ? (
                        <img src={m.img} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-white/5" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#C1FF07]/10 border border-[#C1FF07]/20 text-[#C1FF07] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {m.initials || m.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate leading-snug">{m.name}</h4>
                        <p className="text-[10px] text-text-secondary truncate leading-normal">{m.role || 'Membro BBM'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConnectToggle(m.id)}
                      className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                        connectionState === 'connected'
                          ? 'border-[#34D399]/20 text-[#34D399] bg-[#34D399]/5'
                          : connectionState === 'pending_sent' || connectionState === 'pending_received'
                            ? 'border-white/10 text-text-secondary hover:bg-white/5'
                            : 'border-[#C1FF07]/20 text-[#C1FF07] hover:bg-[#C1FF07]/5'
                      }`}
                      style={{ minWidth: '75px', textAlign: 'center' }}
                    >
                      {connectionState === 'connected' && 'CONECTADO'}
                      {connectionState === 'pending_sent' && 'PENDENTE'}
                      {connectionState === 'pending_received' && 'ACEITAR'}
                      {connectionState === 'none' && 'CONECTAR'}
                    </button>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="text-center py-6 text-text-muted text-xs font-medium">
                  Nenhum membro encontrado.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Story Viewer Lightbox (Instagram Style) */}
      {activeStory && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Navigation Click Areas (Desktop) */}
          <div onClick={prevStory} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 2010, cursor: 'pointer' }} />
          <div onClick={nextStory} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', zIndex: 2010, cursor: 'pointer' }} />

          <div 
            style={{
              maxWidth: '400px',
              width: '100%',
              height: '90vh',
              maxHeight: '800px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#111',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 2020 // Above click areas so buttons still work
            }}
          >
            {/* Nav Arrows inside Modal for Mobile/Clarity */}
            {currentStoryIndex > 0 && (
              <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white rounded-full p-2 border border-white/20 hover:bg-black/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}
            <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white rounded-full p-2 border border-white/20 hover:bg-black/80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>

            {/* Story Media */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {activeStory.image_url && (
                <>
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img src={activeStory.image_url} alt="Story BG" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px)', transform: 'scale(1.15)', opacity: 0.5 }} />
                  </div>
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <img src={activeStory.image_url} alt="Story" style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </>
              )}
              {activeStory.video_url && (
                <>
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <video src={activeStory.video_url} autoPlay muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px)', transform: 'scale(1.15)', opacity: 0.5 }} />
                  </div>
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <video src={activeStory.video_url} autoPlay controls playsInline loop style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </>
              )}
              {(!activeStory.image_url && !activeStory.video_url) && (
                <div style={{ padding: '30px', textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', fontWeight: 'bold' }}>
                    "{activeStory.content}"
                  </p>
                </div>
              )}
            </div>

            {/* Dark Gradient Overlay for Top Info */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '120px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', zIndex: 10 }}></div>

            {/* Top Bar (Progress & Header) */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Progress Pills */}
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                {activeUserStories.map((_, idx) => (
                  <div key={idx} style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: idx < currentStoryIndex ? '100%' : (idx === currentStoryIndex ? '100%' : '0%'), 
                        height: '100%', 
                        background: '#fff',
                        transition: 'width 0.1s linear'
                      }} 
                    />
                  </div>
                ))}
              </div>

              {/* Author & Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', padding: '1px', border: '1px solid rgba(255,255,255,0.5)', overflow: 'hidden' }}>
                    {activeStory.author_avatar ? (
                       <img src={activeStory.author_avatar} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <div style={{ width: '100%', height: '100%', background: '#222', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {activeStory.author_name.substring(0, 2).toUpperCase()}
                       </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{activeStory.author_name}</h4>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {new Date().getTime() - new Date(activeStory.created_at).getTime() > 24 * 60 * 60 * 1000 ? 'Arquivado' : 'Hoje'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(activeStory.user_id === user?.id || user?.member_type === 'admin') && (
                    <button 
                      onClick={() => {
                        handleDeletePost(activeStory.id);
                        if (activeUserStories.length === 1) setActiveUserStories([]);
                      }}
                      className="border-0 bg-transparent text-white cursor-pointer hover:text-red-400 p-1"
                      title="Excluir Story"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveUserStories([])}
                    className="border-0 bg-transparent text-white cursor-pointer hover:text-gray-300 p-1"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Post Lightbox Modal */}
      {lightboxPost && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.92)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel"
            style={{
              maxWidth: '900px',
              width: '100%',
              height: '80vh',
              maxHeight: '650px',
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              border: '1px solid rgba(193, 255, 7, 0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }}
          >
            {/* Left side: Media column */}
            <div 
              style={{ 
                flex: '1.2', 
                background: '#000', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                borderRight: '1px solid rgba(193, 255, 7, 0.1)'
              }}
            >
              {lightboxPost.video_url ? (
                <video src={lightboxPost.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay loop />
              ) : lightboxPost.image_url ? (
                <img src={lightboxPost.image_url} alt="Lightbox Media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: 'var(--text-secondary)', padding: '30px', textAlign: 'center' }}>
                  Sem mídia para visualização.
                </div>
              )}
            </div>

            {/* Right side: Comments panel column */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', height: '100%' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(193, 255, 7, 0.1)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {lightboxPost.author_avatar ? (
                    <img src={lightboxPost.author_avatar} alt="Author" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#C1FF07' }} className="flex-center font-bold text-xs">
                      {lightboxPost.author_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{lightboxPost.author_name}</h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{lightboxPost.author_role}</span>
                  </div>
                </div>

                <button onClick={() => setLightboxPost(null)} className="outline-btn border-0 p-1 text-gray-400 hover:text-white" style={{ minWidth: 'auto' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Comments area */}
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.5, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {lightboxPost.content}
                </p>

                {/* Likes summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Heart size={12} fill="#FF4A4A" className="text-red-500" />
                  <span>{lightboxPost.liked_by_users.length} curtidas</span>
                </div>

                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  {lightboxPost.comments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '20px 0' }}>
                      Nenhum comentário. Seja o primeiro!
                    </div>
                  ) : (
                    lightboxPost.comments.map(c => {
                      const isCommentAuthor = user?.id === c.user_id;
                      const isPostAdmin = user?.member_type === 'admin';

                      return (
                        <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            {c.user_avatar ? (
                              <img src={c.user_avatar} alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} className="flex-center font-bold text-xs">
                                {c.user_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div style={{ flexGrow: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>{c.user_name}</span>
                                {(isCommentAuthor || isPostAdmin) && (
                                  <button onClick={() => handleDeleteComment(lightboxPost.id, c.id)} className="outline-btn border-0 p-1 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>{c.content}</p>
                              
                              <button 
                                onClick={() => setActiveReplyBox(activeReplyBox === c.id ? null : c.id)}
                                className="outline-btn border-0 text-xs text-gray-500 p-0 hover:text-white"
                                style={{ minWidth: 'auto', marginTop: '4px', fontSize: '0.65rem' }}
                              >
                                Responder
                              </button>

                              {activeReplyBox === c.id && (
                                <form onSubmit={(e) => { e.preventDefault(); handleAddComment(lightboxPost.id, c.id); }} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                  <input 
                                    type="text" 
                                    className="form-input text-xs" 
                                    placeholder="Escrever resposta..."
                                    value={replyTexts[c.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                    style={{ padding: '6px 10px' }}
                                  />
                                  <button type="submit" className="gold-glow-btn text-xs" style={{ padding: '6px 10px', minWidth: 'auto' }}>
                                    <Send size={10} />
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>

                          {/* Nested Replies */}
                          {c.replies && c.replies.map(r => {
                            const isReplyAuthor = user?.id === r.user_id;

                            return (
                              <div key={r.id} style={{ display: 'flex', gap: '8px', marginLeft: '24px', alignItems: 'flex-start' }}>
                                <CornerDownRight size={12} className="text-gray-600 flex-shrink-0" style={{ marginTop: '4px' }} />
                                {r.user_avatar ? (
                                  <img src={r.user_avatar} alt="User" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                ) : (
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} className="flex-center font-bold text-xs">
                                    {r.user_name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ flexGrow: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>{r.user_name}</span>
                                    {(isReplyAuthor || isPostAdmin) && (
                                      <button onClick={() => handleDeleteComment(lightboxPost.id, r.id, true, c.id)} className="outline-btn border-0 p-1 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                                        <Trash2 size={8} />
                                      </button>
                                    )}
                                  </div>
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>{r.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom comments form */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAddComment(lightboxPost.id); }}
                style={{ padding: '16px', borderTop: '1px solid rgba(193, 255, 7, 0.1)', display: 'flex', gap: '10px' }}
              >
                <input 
                  type="text" 
                  className="form-input text-xs" 
                  placeholder="Comentar..."
                  value={commentTexts[lightboxPost.id] || ''}
                  onChange={(e) => setCommentTexts(prev => ({ ...prev, [lightboxPost.id]: e.target.value }))}
                />
                <button type="submit" className="gold-glow-btn text-xs" style={{ padding: '8px 12px', minWidth: 'auto' }}>
                  <Send size={12} />
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
