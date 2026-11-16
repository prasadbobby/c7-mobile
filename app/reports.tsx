import * as DocumentPicker from 'expo-document-picker';
import { ArrowUpRight, FileText, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { today } from '@/api/dates';
import { fetchReportFile, fileSize, shortDate, useDeleteReport, useReports, useUploadReport, type Report, type ReportCategory } from '@/api/gym';
import { openDataUrl, toDataUrl } from '@/files';
import { Empty, Headline, Label, Numeral, Page } from '@/gymui';
import { colors, font } from '@/theme';
import { Chip, Field, Press, PrimaryButton, SecondaryButton, Sheet, Skeleton, toast, Txt } from '@/ui';

const CATS: { id: ReportCategory; label: string }[] = [
  { id: 'BLOOD', label: 'Blood test' },
  { id: 'SCAN', label: 'Scan / X-ray' },
  { id: 'PRESCRIPTION', label: 'Prescription' },
  { id: 'FITNESS', label: 'Fitness assessment' },
  { id: 'OTHER', label: 'Other' },
];
const MAX = 10 * 1024 * 1024;

/** Medical reports the coach should know about. Visible only to you and the studio's coaches. */
export default function Reports() {
  const q = useReports();
  const upload = useUploadReport();
  const del = useDeleteReport();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<ReportCategory>('BLOOD');
  const [date, setDate] = useState(today());
  const [file, setFile] = useState<{ name: string; dataUrl: string; size: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Report | null>(null);

  const pick = async () => {
    setErr(null);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, base64: false });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if ((a.size ?? 0) > MAX) return setErr('That file is over 10 MB. Export a smaller PDF or take a photo instead.');
    try {
      const dataUrl = await toDataUrl({ uri: a.uri, mimeType: a.mimeType ?? (a.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') });
      setFile({ name: a.name, dataUrl, size: a.size ?? 0 });
      if (!title) setTitle(a.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 60));
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  const save = async () => {
    setErr(null);
    if (!file) return setErr('Choose a PDF or photo of the report.');
    if (title.trim().length < 2) return setErr('Give the report a short name.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) return setErr('Enter the report date as YYYY-MM-DD (not in the future).');
    try {
      await upload.mutateAsync({ title: title.trim(), category: cat, fileUrl: file.dataUrl, reportDate: date });
      toast.ok('Report added');
      setOpen(false);
      setFile(null);
      setTitle('');
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  const view = async (r: Report) => {
    setOpening(r.id);
    try {
      const f = await fetchReportFile(r.id);
      await openDataUrl(f.report.fileUrl, r.title);
    } catch (e) {
      toast.error(e);
    } finally {
      setOpening(null);
    }
  };

  const list = q.data?.reports ?? [];
  const [sel, setSel] = useState<Report | null>(null);
  return (
    <Page title="Medical reports" error={q.error} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 16 }}>
        <Headline lead="Your health," tail="on record." size={34} />
        <Numeral size={52}>{String(list.length).padStart(2, '0')}</Numeral>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 18 }}>
        <Label>Private · you and your coaches</Label>
        <Press onPress={() => setOpen(true)} accessibilityLabel="Add report" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
          <Plus size={14} color={colors.primary} />
          <Txt v="caption" color={colors.primary}>
            Add report
          </Txt>
        </Press>
      </View>
      {!q.data ? (
        <Skeleton height={200} />
      ) : list.length === 0 ? (
        <Empty art="medical" title="No reports yet" body="Add a PDF or a clear photo of blood work, scans or prescriptions. Your coach can also add assessments here." action={<PrimaryButton title="Add a report" onPress={() => setOpen(true)} style={{ marginTop: 8, alignSelf: 'stretch' }} />} />
      ) : (
        list.map((r, i) => (
          <Press key={r.id} onPress={() => setSel(r)} scaleTo={0.99} accessibilityLabel={`Open ${r.title}`} style={{ marginTop: 12, marginBottom: 6 }}>
            {/* folder ear */}
            <View style={{ width: 80, height: 12, backgroundColor: colors.card, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
            <View style={{ backgroundColor: colors.card, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 18, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt style={{ fontSize: 10, letterSpacing: 1 }} color={r.fileType === 'application/pdf' ? colors.primary : colors.protein}>
                  {r.fileType === 'application/pdf' ? 'PDF' : 'IMG'} / {String(i + 1).padStart(2, '0')} · {CATS.find((c) => c.id === r.category)?.label.toUpperCase()}
                </Txt>
                {opening === r.id ? <Txt v="caption" color={colors.textMuted}>Opening…</Txt> : <ArrowUpRight size={18} color={colors.textMuted} />}
              </View>
              <Txt style={{ fontFamily: font.light, fontSize: 18, lineHeight: 24, marginTop: 12 }}>{r.title}</Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Txt style={{ fontSize: 10 }} color={colors.textMuted}>
                  {shortDate(r.reportDate).toUpperCase()} · {fileSize(r.fileSize)}
                </Txt>
                <Txt style={{ fontSize: 10 }} color={r.byCoach ? colors.primary : colors.textMuted}>
                  {r.byCoach ? 'Coach' : 'You'}
                </Txt>
              </View>
            </View>
          </Press>
        ))
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.title ?? ''}>
        {!!sel && (
          <View style={{ gap: 12 }}>
            <Label>{`${CATS.find((c) => c.id === sel.category)?.label} · ${shortDate(sel.reportDate)} · ${sel.byCoach ? 'added by your coach' : 'added by you'}`}</Label>
            {!!sel.notes && <Txt v="small" color={colors.textMuted}>{sel.notes}</Txt>}
            <PrimaryButton title={sel.fileType === 'application/pdf' ? 'Open PDF' : 'Open image'} icon={FileText} loading={opening === sel.id} onPress={() => view(sel)} />
            {!sel.byCoach && <SecondaryButton title="Delete report" leading={<Trash2 size={16} color={colors.danger} />} onPress={() => (setConfirm(sel), setSel(null))} />}
            {!!sel.byCoach && <Txt v="caption" color={colors.textMuted}>Reports your coach added can only be removed by the studio.</Txt>}
          </View>
        )}
      </Sheet>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add a report">
        <View style={{ gap: 12 }}>
          <SecondaryButton title={file ? `${file.name} · ${fileSize(file.size)}` : 'Choose PDF or photo'} onPress={pick} />
          <Field placeholder="Report name, e.g. Lipid profile" value={title} onChangeText={setTitle} accessibilityLabel="Report name" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATS.map((c) => (
              <Chip key={c.id} label={c.label} active={cat === c.id} onPress={() => setCat(c.id)} />
            ))}
          </View>
          <Field placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} accessibilityLabel="Report date" />
          {!!err && (
            <Txt v="small" color={colors.danger} accessibilityRole="alert">
              {err}
            </Txt>
          )}
          <PrimaryButton title="Save report" onPress={save} loading={upload.isPending} />
        </View>
      </Sheet>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Delete this report?">
        <Txt color={colors.textMuted} style={{ marginBottom: 16 }}>
          “{confirm?.title}” will be removed for you and your coach. This can’t be undone.
        </Txt>
        <PrimaryButton title="Delete" onPress={() => confirm && del.mutateAsync(confirm.id).then(() => (setConfirm(null), toast.ok('Report deleted'))).catch(toast.error)} loading={del.isPending} />
      </Sheet>
    </Page>
  );
}
