import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from './client';

/* ---------------------------------------------------------------- types -- */

export type Access = 'MEMBER' | 'GUEST' | 'EXPIRED';
export type PackageMode = 'ONLINE' | 'OFFLINE';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
export type Package = {
  id: string; name: string; mode: PackageMode; durationDays: number; price: number; offerPrice: number | null;
  description: string | null; features: string[]; imageUrl: string | null; highlight: boolean; perMonth: number;
  enquiry?: { id: string; status: EnquiryStatus; createdAt: string } | null;
};
export type InvoiceStatus = 'DUE' | 'PAID' | 'PARTIAL' | 'VOID';
export type InvoiceRow = { id: string; number: string; description: string; total: number; amountPaid: number; status: InvoiceStatus; issuedAt: string; dueDate: string | null };
export type Invoice = InvoiceRow & {
  subtotal: number; taxPercent: number; taxAmount: number; discount: number; balance: number; paymentMethod: string | null;
  periodStart: string | null; periodEnd: string | null; notes: string | null;
  billTo: { name: string; email: string | null; memberId: string | null };
  gym: { name: string; address: string; phone: string; email: string; gstin: string };
};
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';
export type AttendanceMonth = {
  month: string;
  days: { date: string; status: AttendanceStatus; checkInAt: string | null; notes: string | null }[];
  stats: { present: number; absent: number; leave: number; rate: number; streak: number; totalVisits: number };
};
export type AnnouncementKind = 'GENERAL' | 'EVENT' | 'OFFER' | 'PAYMENT' | 'CLOSURE';
export type Announcement = { id: string; title: string; body: string; kind: AnnouncementKind; imageUrl: string | null; pinned: boolean; publishedAt: string; expiresAt: string | null; personal: boolean; read: boolean };
export type ReportCategory = 'BLOOD' | 'SCAN' | 'PRESCRIPTION' | 'FITNESS' | 'OTHER';
export type Report = { id: string; title: string; category: ReportCategory; fileType: string; fileSize: number; reportDate: string; notes: string | null; byCoach: boolean; createdAt: string };
export type VideoCategory = 'warmup' | 'cardio' | 'strength' | 'mobility' | 'core' | 'other';
export type Video = { id: string; title: string; description: string | null; category: VideoCategory; videoUrl: string; thumbnailUrl: string | null; durationSec: number; sizeBytes: number; exerciseId: string | null; isAnimated: boolean; updatedAt: string };
export type Pose = 'FRONT' | 'SIDE' | 'BACK';
export type ProgressPhoto = { id: string; imageUrl: string; pose: Pose; takenAt: string; weight: number | null; notes: string | null };
export type BmiCategoryKey = 'UNDER' | 'HEALTHY' | 'OVER' | 'OBESE1' | 'OBESE2';
export type Bmi = {
  height: number | null; weight: number | null; bmi: number | null; category: { key: BmiCategoryKey; label: string } | null;
  healthyWeight: { min: number; max: number } | null; bodyFat: number | null;
  history: { month: string; weight: number; bmi: number | null; category: string | null }[];
  checkup: { nextDate: string; intervalDays: number; notes: string | null; setByCoach: boolean; daysLeft: number; overdue: boolean } | null;
};

/* -------------------------------------------------------------- queries -- */

export const usePackages = (mode?: PackageMode) =>
  useQuery({ queryKey: ['packages', mode ?? 'all'], queryFn: () => api.get<{ access: Access; packages: Package[] }>(`/packages${mode ? `?mode=${mode}` : ''}`) });
export const usePackage = (id?: string) =>
  useQuery({ queryKey: ['package', id], enabled: !!id, queryFn: () => api.get<{ package: Package; enquiry: Package['enquiry']; contact: { phone: string; email: string } }>(`/packages/${id}`) });
export const useEnquiries = () => useQuery({ queryKey: ['enquiries'], queryFn: () => api.get<{ enquiries: { id: string; status: EnquiryStatus; createdAt: string; packageId: string; packageName: string }[] }>('/enquiries') });
export const useInvoices = () => useQuery({ queryKey: ['invoices'], queryFn: () => api.get<{ invoices: InvoiceRow[]; totals: { paid: number; due: number } }>('/invoices') });
export const useInvoice = (id?: string) => useQuery({ queryKey: ['invoice', id], enabled: !!id, queryFn: () => api.get<{ invoice: Invoice }>(`/invoices/${id}`) });
export const useAttendance = (month: string) => useQuery({ queryKey: ['attendance', month], queryFn: () => api.get<AttendanceMonth>(`/attendance?month=${month}`) });
export const useAnnouncements = () => useQuery({ queryKey: ['announcements'], queryFn: () => api.get<{ announcements: Announcement[]; unread: number }>('/announcements') });
export const useReports = () => useQuery({ queryKey: ['reports'], queryFn: () => api.get<{ reports: Report[] }>('/reports') });
export const fetchReportFile = (id: string) => api.get<{ report: Report & { fileUrl: string } }>(`/reports/${id}`);
export const useVideos = (category?: VideoCategory) => useQuery({ queryKey: ['videos', category ?? 'all'], queryFn: () => api.get<{ videos: Video[] }>(`/videos${category ? `?category=${category}` : ''}`) });
export const useVideo = (id?: string) => useQuery({ queryKey: ['video', id], enabled: !!id, queryFn: () => api.get<{ video: Video }>(`/videos/${id}`) });
export const useProgressPhotos = () => useQuery({ queryKey: ['progress-photos'], queryFn: () => api.get<{ photos: ProgressPhoto[] }>('/progress-photos') });
export const useBmi = () => useQuery({ queryKey: ['bmi'], queryFn: () => api.get<Bmi>('/bmi') });

/* ------------------------------------------------------------ mutations -- */

function useAct<V, R>(fn: (v: V) => Promise<R>, keys: QueryKey[]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k }))) });
}

export const useEnquire = () =>
  useAct((b: { packageId: string; phone?: string; message?: string }) => api.post<{ success: true; duplicate?: boolean }>('/enquiries', b), [['packages'], ['package'], ['enquiries']]);
export const useReadAnnouncement = () => useAct((id: string) => api.post(`/announcements/${id}/read`), [['announcements'], ['notifications']]);
export const useReadAllAnnouncements = () => useAct(() => api.post('/announcements/read-all'), [['announcements'], ['notifications']]);
export const useUploadReport = () =>
  useAct((b: { title: string; category: ReportCategory; fileUrl: string; reportDate: string; notes?: string }) => api.post<{ id: string }>('/reports', b), [['reports']]);
export const useDeleteReport = () => useAct((id: string) => api.del(`/reports/${id}`), [['reports']]);
export const useAddProgressPhoto = () =>
  useAct((b: { imageUrl: string; pose: Pose; takenAt: string; weight?: number; notes?: string }) => api.post<{ id: string }>('/progress-photos', b), [['progress-photos']]);
export const useDeleteProgressPhoto = () => useAct((id: string) => api.del(`/progress-photos/${id}`), [['progress-photos']]);

/* ------------------------------------------------------------- helpers -- */

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const durationLabel = (days: number) => (days % 365 === 0 ? `${days / 365} year${days === 365 ? '' : 's'}` : days % 30 === 0 ? `${days / 30} month${days === 30 ? '' : 's'}` : `${days} days`);
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const fileSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const shortDate = (s: string | Date) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
