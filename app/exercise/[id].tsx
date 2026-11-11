import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, Expand, Flame, Gauge, Pause, Pencil, Play, Plus, Timer, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressLine } from '@/charts';
import { workouts } from '@/data';
import { DumbbellGlyph } from '@/icons';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { BackButton, Card, FadeBottom, IconButton, Img, InfoPill, PrimaryButton, Txt } from '@/ui';

const TOTAL = 340;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const HERO = 470;

export default function Exercise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const w = workouts.find((x) => x.id === id) ?? workouts[0]!;
  const insets = useSafeAreaInsets();
  const st = useApp();
  const saved = st.saved.includes(w.id);
  const { y, onScroll } = useScrollY();
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState(false);
  const [more, setMore] = useState(false);
  const [points, setPoints] = useState([22, 48, 30, 41, 28, 42, 34]);
  const r = useStagger(3, { delay: 0.2 });

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setT((v) => (v >= TOTAL ? (setPlaying(false), TOTAL) : v + 1)), 1000);
    return () => clearInterval(iv);
  }, [playing]);

  const pp = useSharedValue(1);
  const ppA = useAnimatedStyle(() => ({ transform: [{ scale: pp.value }] }));
  const toggle = () => {
    pp.value = 0.8;
    pp.value = withSpring(1, { damping: 8 });
    setPlaying(!playing);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        {/* Video hero */}
        <View style={{ height: HERO, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={w.image} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <Pressable onPress={toggle} accessibilityLabel={playing ? 'Pause' : 'Play'} style={{ position: 'absolute', left: '50%', top: '45%', marginLeft: -44, marginTop: -44 }}>
            <Animated.View style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(5,6,5,0.45)', alignItems: 'center', justifyContent: 'center' }, ppA]}>
              {playing ? <Pause size={34} color={colors.text} fill={colors.text} /> : <Play size={34} color={colors.text} fill={colors.text} style={{ marginLeft: 4 }} />}
            </Animated.View>
          </Pressable>
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable onPress={toggle} hitSlop={8}>
                {playing ? <Pause size={22} color={colors.text} fill={colors.text} /> : <Play size={22} color={colors.text} fill={colors.text} />}
              </Pressable>
              <Txt style={{ flex: 1 }}>
                {fmt(t)} - {fmt(TOTAL)}
              </Txt>
              <Pressable onPress={() => setMuted(!muted)} hitSlop={8} accessibilityLabel="Mute">
                {muted ? <VolumeX size={24} color={colors.text} /> : <Volume2 size={24} color={colors.text} />}
              </Pressable>
              <Pressable onPress={() => router.push(`/session/${w.id}`)} hitSlop={8} accessibilityLabel="Fullscreen">
                <Expand size={22} color={colors.text} />
              </Pressable>
            </View>
            <Seek value={t / TOTAL} onSeek={(f) => setT(Math.round(f * TOTAL))} />
          </View>
        </View>

        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <IconButton icon={<Bookmark size={20} color={saved ? colors.primary : colors.text} fill={saved ? colors.primary : 'transparent'} />} label="Save workout" onPress={() => st.toggle('saved', w.id)} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Reveal p={r[0]!} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt v="h2">{w.title}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <DumbbellGlyph size={22} />
                <Txt v="bodyLg" color={colors.textMuted}>
                  {w.subtitle}
                </Txt>
              </View>
            </View>
            <InfoPill icon={Timer} label={`${w.minutes} min`} />
          </Reveal>
          <Reveal p={r[1]!}>
            <Txt color={colors.textMuted} numberOfLines={more ? undefined : 3} style={{ marginTop: 20, lineHeight: 26 }}>
              {w.description}
            </Txt>
            <Txt v="small" color={colors.primary} onPress={() => setMore(!more)} style={{ marginTop: 6 }}>
              {more ? 'Show less' : 'Read more'}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <InfoPill icon={Flame} label={`${w.kcal} kcal`} style={{ flex: 1 }} />
              <InfoPill icon={Gauge} label={w.level} style={{ flex: 1.3 }} />
            </View>
          </Reveal>

          <Reveal p={r[2]!} style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt v="h3">My Progress</Txt>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <Pressable accessibilityLabel="Edit last entry" onPress={() => setPoints(points.map((p, i) => (i === points.length - 1 ? Math.min(52, p + 2.5) : p)))}>
                  <Pencil size={22} color={colors.text} strokeWidth={1.6} />
                </Pressable>
                <Pressable accessibilityLabel="Add entry" onPress={() => setPoints([...points.slice(1), Math.round(20 + Math.random() * 30)])}>
                  <Plus size={24} color={colors.text} strokeWidth={1.6} />
                </Pressable>
              </View>
            </View>
            <Txt style={{ fontFamily: font.light, fontSize: 36, lineHeight: 44, color: colors.primary, marginTop: 6, marginBottom: 28 }}>{points[points.length - 1]! + 5.5}kg</Txt>
            <ProgressLine points={points} labels={['Mon', 'Wed', 'Thr', 'Sun']} />
          </Reveal>

          <ScrollReveal y={y} offset={HERO} style={{ marginTop: 28 }}>
            <Txt v="h3" style={{ marginBottom: 12 }}>
              Session plan
            </Txt>
            {w.steps.map((s, k) => (
              <Card key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.name === 'Rest' ? colors.secondary : 'rgba(198,242,27,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Txt v="small" color={s.name === 'Rest' ? colors.textMuted : colors.primary}>
                    {k + 1}
                  </Txt>
                </View>
                <Txt style={{ flex: 1 }}>{s.name}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {s.reps ?? `${s.seconds}s`}
                </Txt>
              </Card>
            ))}
          </ScrollReveal>
        </View>
      </Animated.ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title="Start Workout" icon={Play} onPress={() => router.push(`/session/${w.id}`)} />
      </View>
    </View>
  );
}

function Seek({ value, onSeek }: { value: number; onSeek: (f: number) => void }) {
  const [w, setW] = useState(1);
  return (
    <Pressable onLayout={(e) => setW(e.nativeEvent.layout.width)} onPress={(e) => onSeek(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)))} style={{ height: 24, justifyContent: 'center', marginTop: 12 }} accessibilityLabel="Seek">
      <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }}>
        <View style={{ width: `${value * 100}%`, height: 4, borderRadius: 2, backgroundColor: colors.text }} />
      </View>
      <View style={{ position: 'absolute', left: `${value * 100}%`, marginLeft: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.surface }} />
    </Pressable>
  );
}

