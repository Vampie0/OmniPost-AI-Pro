'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flag,
  Share2,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Video,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { PostItem, PlatformType, PostStatus } from '@socialpilot/types';
import { exportToCsv } from '@/lib/csv';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';

const MOCK_POSTS: PostItem[] = [
  {
    id: 'post_1',
    user_id: 'usr_1',
    folder_id: null,
    title: 'Product Hunt Launch Announcement',
    content:
      'We are officially live on Product Hunt! 🚀 Meet SocialPilot AI Pro — autonomous AI copywriting, multi-platform publishing, and custom white-label client portals. Check out our launch and grab special lifetime perks today!',
    hashtags: ['#SaaS', '#ProductHunt', '#AI', '#SocialMediaMarketing'],
    media_urls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'],
    platforms: ['twitter', 'linkedin', 'threads'],
    status: 'published',
    scheduled_at: null,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    analytics: { likes: 240, shares: 56, comments: 38 },
    error_message: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'post_2',
    user_id: 'usr_2',
    folder_id: null,
    title: 'Agency Growth Playbook 2026',
    content:
      'How we scaled from $5k to $60k MRR managing 40+ brands with AI workflows. 🧵 1/7 The biggest bottleneck for social agencies isn’t client acquisition; it is manual copywriting iteration...',
    hashtags: ['#AgencyLife', '#MarketingTips', '#GrowthHacking'],
    media_urls: [],
    platforms: ['twitter'],
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    published_at: null,
    analytics: {},
    error_message: null,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'post_3',
    user_id: 'usr_4',
    folder_id: null,
    title: 'Suspicious Free Crypto Airdrop',
    content:
      'CLAIM 5000 FREE USDT NOW! Click the unverified link in bio immediately before allocation expires! Send 0.1 ETH to verify wallet.',
    hashtags: ['#Crypto', '#FreeMoney', '#Airdrop'],
    media_urls: [],
    platforms: ['instagram', 'facebook'],
    status: 'failed',
    scheduled_at: null,
    published_at: null,
    analytics: {},
    error_message: 'Flagged by content safety filters: Potential phishing scam detected.',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'post_4',
    user_id: 'usr_5',
    folder_id: null,
    title: 'Behind the Scenes Camera Setup',
    content:
      'Lighting breakdown for our latest commercial shoot: Aputure 600d with lantern diffuser + rim kicker. Clean minimal shadows.',
    hashtags: ['#Cinematography', '#Filmmaking', '#BTS'],
    media_urls: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'],
    platforms: ['instagram', 'tiktok'],
    status: 'published',
    scheduled_at: null,
    published_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    analytics: { likes: 890, shares: 120, comments: 67 },
    error_message: null,
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function PostsModerationPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setPosts(MOCK_POSTS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPosts((data as PostItem[]) || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredData = useMemo(() => {
    return posts.filter((p) => {
      if (platformFilter !== 'all' && !p.platforms.includes(platformFilter as PlatformType)) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [posts, platformFilter, statusFilter]);

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    try {
      if (isPlaceholderUrl) {
        setPosts(posts.filter((p) => p.id !== id));
        if (selectedPost?.id === id) setSelectedPost(null);
        toast.success('Post removed by administrator');
        return;
      }

      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setPosts(posts.filter((p) => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
      toast.success('Post deleted successfully');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleToggleFlag = async (post: PostItem) => {
    const nextStatus: PostStatus = post.status === 'failed' ? 'draft' : 'failed';
    try {
      if (isPlaceholderUrl) {
        setPosts(
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  status: nextStatus,
                  error_message: nextStatus === 'failed' ? 'Flagged manually by Super Admin' : null,
                }
              : p
          )
        );
        toast.success(`Post marked as ${nextStatus}`);
        return;
      }

      const { error } = await supabase
        .from('posts')
        .update({
          status: nextStatus,
          error_message: nextStatus === 'failed' ? 'Flagged manually by Super Admin' : null,
        })
        .eq('id', post.id);

      if (error) throw error;
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                status: nextStatus,
                error_message: nextStatus === 'failed' ? 'Flagged manually by Super Admin' : null,
              }
            : p
        )
      );
      toast.success(`Post status updated to ${nextStatus}`);
    } catch {
      toast.error('Failed to flag post');
    }
  };

  const handleExportCsv = () => {
    exportToCsv('moderation_posts', filteredData, {
      id: 'Post ID',
      user_id: 'Creator ID',
      title: 'Title',
      content: 'Content',
      status: 'Status',
      created_at: 'Created Date',
    });
    toast.success('Posts exported to CSV');
  };

  const renderPlatformIcon = (platform: PlatformType) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />;
      case 'twitter':
        return <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'facebook':
        return <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />;
      case 'tiktok':
        return <Video className="w-3.5 h-3.5 text-[#FF0050]" />;
      default:
        return <Share2 className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const columns = useMemo<ColumnDef<PostItem>[]>(
    () => [
      {
        accessorKey: 'content',
        header: 'Content & Media',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-start gap-3 max-w-lg">
              {p.media_urls?.[0] ? (
                <img
                  src={p.media_urls[0]}
                  alt="Post preview"
                  className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-text-muted shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-bold text-text-primary truncate">
                  {p.title || 'Untitled Post'}
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                  {p.content}
                </p>
                {p.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.hashtags.slice(0, 3).map((h, idx) => (
                      <span key={idx} className="text-[10px] text-primary font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'platforms',
        header: 'Platforms',
        cell: ({ getValue }) => {
          const platforms = getValue() as PlatformType[];
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {platforms.map((plat) => (
                <div
                  key={plat}
                  title={plat}
                  className="p-1.5 rounded-lg bg-surface-subtle border border-border"
                >
                  {renderPlatformIcon(plat)}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as PostStatus;
          const config = {
            published: { label: 'Published', icon: CheckCircle2, cls: 'bg-success-10 text-success border-success-30' },
            scheduled: { label: 'Scheduled', icon: Clock, cls: 'bg-primary-10 text-primary border-border-active-30' },
            publishing: { label: 'Publishing', icon: Clock, cls: 'bg-warning-10 text-warning border-warning-30' },
            draft: { label: 'Draft', icon: FileText, cls: 'bg-surface-subtle text-text-muted border-border' },
            failed: { label: 'Flagged / Error', icon: AlertTriangle, cls: 'bg-danger-10 text-danger border-danger-30' },
          }[status] || { label: status, icon: Clock, cls: 'bg-surface-subtle text-text-muted border-border' };

          const Icon = config.icon;
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${config.cls}`}>
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const dateStr = getValue() as string;
          return (
            <span className="text-xs text-text-muted">
              {new Date(dateStr).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setSelectedPost(p)}
                title="View Full Post"
                className="p-1.5 rounded-lg border border-border bg-surface-subtle text-text-primary hover:border-active-50 transition"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggleFlag(p)}
                title={p.status === 'failed' ? 'Unflag post' : 'Flag suspicious post'}
                className={`p-1.5 rounded-lg border transition ${
                  p.status === 'failed'
                    ? 'text-warning bg-warning-10 border-warning-30'
                    : 'text-text-muted hover:text-warning hover:bg-warning-10 border-border'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePost(p.id)}
                title="Delete Post"
                className="p-1.5 rounded-lg border border-danger-30 text-danger bg-danger-10 hover:bg-danger-20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            <span>Content & Moderation Matrix</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Review user-generated social posts, scheduled queues, and enforce community safety
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPosts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold shadow-md shadow-glow-20 hover:opacity-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search content, title, tags..."
            className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-active transition"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-active transition"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="failed">Flagged / Failed</option>
          </select>
        </div>
      </div>

      {/* TanStack Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="No Posts Found"
            description="No social media posts match the current search or moderation filters."
            icon={FileText}
            actionLabel="Clear Filters"
            onAction={() => {
              setGlobalFilter('');
              setPlatformFilter('all');
              setStatusFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-subtle-70">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary select-none"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border-60">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-subtle-40 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
              {filteredData.length} posts)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Post Moderation Inspector — a record to read, so it gets a detail panel */}
      <Drawer
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        eyebrow="Content Moderation"
        title={selectedPost?.title || 'Untitled Post'}
        subtitle={selectedPost ? `Status: ${selectedPost.status}` : undefined}
        avatar={
          <div className="w-11 h-11 rounded-xl bg-primary-10 border border-primary-30 flex items-center justify-center text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        }
        footer={
          selectedPost && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePost(selectedPost.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Post
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleFlag(selectedPost)}
                className="text-warning bg-warning-10 border-warning-30 hover:bg-warning-20"
              >
                <Flag className="w-3.5 h-3.5" />
                {selectedPost.status === 'failed' ? 'Unflag Post' : 'Flag as Suspicious'}
              </Button>
            </>
          )
        }
      >
        {selectedPost && (
          <>
            {selectedPost.media_urls?.[0] && (
              <img
                src={selectedPost.media_urls[0]}
                alt="Post media"
                className="w-full h-56 rounded-2xl object-cover border border-border shadow-card"
              />
            )}

            <DrawerSection label="Post Copy">
              <p className="px-4 py-3.5 text-sm text-text-secondary bg-surface-subtle-70 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>
            </DrawerSection>

            {selectedPost.hashtags?.length > 0 && (
              <DrawerSection label="Hashtags">
                <div className="flex flex-wrap gap-1.5 p-4">
                  {selectedPost.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-primary-10 border border-border-active-30 text-primary font-mono text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </DrawerSection>
            )}

            {selectedPost.error_message && (
              <DrawerSection label="Enforcement">
                <div className="p-4 flex items-start gap-2 text-danger text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Moderation Error / Flag Notice:</span>
                    <p className="mt-0.5 leading-relaxed">{selectedPost.error_message}</p>
                  </div>
                </div>
              </DrawerSection>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
