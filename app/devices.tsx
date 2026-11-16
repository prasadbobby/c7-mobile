import { Footprints, Link2, Smartphone, Watch } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { today } from '@/api/dates';
import { useLogSteps, useSteps } from '@/api/hooks';
import { FeatureArt, Group, Page, Row, Tag } from '@/gymui';
import { phoneStepsAvailable, phoneStepsFor, type StepSource } from '@/health';
import { colors } from '@/theme';
import { PrimaryButton, Txt, toast } from '@/ui';

const WEB = (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://c7personalfitness.com').replace(/\/$/, '');

/** Phone & watch step sources. */
export default function Devices() {
  const steps = useSteps();
  const log = useLogSteps();
  const [src, setSrc] = useState<StepSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  useEffect(() => {
    phoneStepsAvailable().then(setSrc);
  }, []);
  const fitbit = steps.data?.fitbit;

  const sync = async () => {
    setBusy(true);
    try {
      const n = await phoneStepsFor(today());
      if (n <= 0) return toast.ok('No steps counted on this phone yet today');
      // Never lower a day's total that came from another source (e.g. Fitbit or a manual entry).
      const current = steps.data?.todayLog?.actualSteps ?? 0;
      if (n <= current) return toast.ok(`Already up to date (${current.toLocaleString()} steps)`);
      await log.mutateAsync({ steps: n, date: today() });
      setLast(n);
      toast.ok(`${n.toLocaleString()} steps synced`);
    } catch (e) {
      toast.error(new Error(errorMessage(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Devices" onRefresh={() => steps.refetch()} refreshing={steps.isRefetching}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <FeatureArt name="watchSync" width={140} />
        <Txt v="h2" style={{ textAlign: 'center' }}>Steps from your phone and watch</Txt>
        <Txt color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 360 }}>Synced steps count towards your coach’s daily target and the challenge leaderboard.</Txt>
      </View>

      <Group label="This phone" style={{ marginTop: 24 }}>
        <Row
          icon={Smartphone}
          title={Platform.OS === 'ios' ? 'iPhone motion sensor' : 'Phone step counter'}
          sub={src?.available ? (last ? `Synced ${last.toLocaleString()} steps today` : 'Ready — sync any time') : src?.reason ?? 'Checking…'}
          right={src?.available ? <Tag label="Available" tone={colors.primary} /> : undefined}
          last
        />
      </Group>
      {!!src?.available && <PrimaryButton title="Sync today’s steps" icon={Footprints} onPress={sync} loading={busy} style={{ marginTop: 12 }} />}

      <Group label="Watches & trackers" style={{ marginTop: 28 }}>
        <Row
          icon={Watch}
          title="Fitbit"
          sub={fitbit?.isConnected ? `Connected${fitbit.lastSyncAt ? ` · last sync ${new Date(fitbit.lastSyncAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}` : 'Connect once on the C7 website — steps then sync here automatically.'}
          right={fitbit?.isConnected ? <Tag label="Connected" tone={colors.primary} /> : undefined}
          onPress={fitbit?.isConnected ? undefined : () => Linking.openURL(`${WEB}/step-tracking`)}
          label="Connect Fitbit"
        />
        <Row icon={Watch} title={Platform.OS === 'android' ? 'Wear OS · Health Connect' : 'Apple Watch · Apple Health'} sub="Arrives with the C7 App Store / Play Store build. Until then, sync from this phone or Fitbit." right={<Tag label="Soon" />} last />
      </Group>

      <Group label="Help" style={{ marginTop: 28 }}>
        <Row icon={Link2} title="Steps look wrong?" sub="The highest count for a day wins. Your coach can correct a day from the studio dashboard." last />
      </Group>
    </Page>
  );
}
