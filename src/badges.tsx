import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ART, BADGES } from './assetkit';
import { colors } from './theme';
import { asNode, Txt } from './ui';

/** Achievement badge from the C7 asset kit; unearned badges show the locked hexagon. */
export function Badge({ id, earned, size = 72 }: { id: string; earned: boolean; size?: number }) {
  const xml = earned ? (BADGES[id] ?? BADGES['first-workout']!) : BADGES.locked!;
  return (
    <View accessibilityLabel={earned ? 'Badge earned' : 'Badge locked'}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

export type ArtName = 'empty-workouts' | 'empty-notifications' | 'no-challenge' | 'invite-only' | 'empty-feed' | 'empty-meals' | 'c7-mark';

export function Art({ name, width = 240, height }: { name: ArtName; width?: number; height?: number }) {
  return <SvgXml xml={ART[name]!} width={width} height={height ?? (name === 'c7-mark' ? width : (width * 200) / 240)} />;
}

/** Illustrated empty state (C7 asset kit) — used for screens with no data yet. */
export function ArtEmpty({ art, title, body, action }: { art: ArtName; title: string; body: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, gap: 8 }}>
      <Art name={art} width={200} />
      <Txt v="h3" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt color={colors.textMuted} style={{ textAlign: 'center' }}>
        {body}
      </Txt>
      {asNode(action)}
    </View>
  );
}
