/**
 * Custom duotone icon set (from the reference design) + social logos.
 * UI glyphs come from lucide-react-native at strokeWidth 1.8 (see Icon in ui.tsx).
 */
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from './theme';

type P = { size?: number; color?: string };

export const DumbbellGlyph = ({ size = 24, color = colors.primary }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2.5" y="8" width="4" height="8" rx="2" fill={color} fillOpacity={0.25} />
    <Rect x="17.5" y="8" width="4" height="8" rx="2" fill={color} fillOpacity={0.25} />
    <Rect x="6.5" y="5.5" width="3" height="13" rx="1.5" />
    <Rect x="14.5" y="5.5" width="3" height="13" rx="1.5" />
    <Path d="M9.5 12h5" />
  </Svg>
);

export const FlameIcon = ({ size = 28 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2.5c.6 3-2.6 4.6-4.4 7.3A6.8 6.8 0 0 0 12 21.5a6.8 6.8 0 0 0 6.6-8.6c-.4-1.6-1.4-2.8-2.4-3.6.1 1.6-.5 2.7-1.5 3.1.4-4.3-1-8-2.7-9.9z" fill={colors.calories} />
    <Path d="M12 21.5a3.4 3.4 0 0 1-3.2-4.6c.6-1.6 2.3-2.4 2.8-4.4 1.9 1.5 3.6 3.5 3.6 5.5a3.3 3.3 0 0 1-3.2 3.5z" fill={colors.carbs} />
  </Svg>
);

export const ProteinIcon = ({ size = 28 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.protein} strokeWidth={2.4} strokeLinecap="round">
    <Path d="M4 5c4 0 4 3 8 3s4-3 8-3" />
    <Path d="M4 12c4 0 4 3 8 3s4-3 8-3" opacity={0.8} />
    <Path d="M4 19c4 0 4-3 8-3s4 3 8 3" opacity={0.6} />
  </Svg>
);

export const CarbsIcon = ({ size = 28 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 20 18 7" stroke={colors.carbs} strokeWidth={2} strokeLinecap="round" />
    {[0, 1, 2].map((i) => (
      <G key={i} fill={colors.carbs}>
        <Ellipse cx={9 + i * 3} cy={11 - i * 3} rx={1.6} ry={3} transform={`rotate(45 ${9 + i * 3} ${11 - i * 3})`} />
        <Ellipse cx={12 + i * 3} cy={14 - i * 3} rx={1.6} ry={3} transform={`rotate(45 ${12 + i * 3} ${14 - i * 3})`} opacity={0.7} />
      </G>
    ))}
  </Svg>
);

export const FatIcon = ({ size = 28 }: P) => {
  const pts = [[12, 5], [8.5, 9], [15.5, 9], [12, 12.5], [5.5, 13], [18.5, 13], [8.5, 16.5], [15.5, 16.5], [12, 20]];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {pts.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.6} fill={colors.fat} opacity={1 - i * 0.05} />
      ))}
    </Svg>
  );
};

export const WaterIcon = ({ size = 28 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2.5c3.5 4.5 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 8.5 7 12 2.5z" fill={colors.protein} />
    <Path d="M9 14.5a3 3 0 0 0 3 3" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" fill="none" />
  </Svg>
);

const I = ({ size = 28, children }: P & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {children}
  </Svg>
);

export const ingredientIcons = [
  (s?: number) => (
    <I size={s} key="pepper">
      <Path d="M12 6c4 0 6 3 6 7 0 5-3 9-6 9s-6-4-6-9c0-4 2-7 6-7z" fill={colors.danger} />
      <Path d="M12 6c0-2 1-3 3-3" stroke={colors.primaryGlow} strokeWidth={2} fill="none" strokeLinecap="round" />
    </I>
  ),
  (s?: number) => (
    <I size={s} key="avo">
      <Path d="M12 2c3 0 5 5 6 9a6 6 0 1 1-12 0c1-4 3-9 6-9z" fill={colors.primaryGlow} />
      <Path d="M12 6c2 0 3.5 4 4 6.5a4 4 0 1 1-8 0C8.5 10 10 6 12 6z" fill="#DDEB8A" />
      <Circle cx={12} cy={14} r={2.4} fill="#7A5A2E" />
    </I>
  ),
  (s?: number) => (
    <I size={s} key="cherry">
      <Path d="M8 15c1-5 3-8 8-11M16 15c-1-4-.5-7 0-11" stroke={colors.primaryGlow} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Circle cx={7.5} cy={17} r={4} fill={colors.danger} />
      <Circle cx={16.5} cy={17} r={4} fill={colors.danger} />
    </I>
  ),
  (s?: number) => (
    <I size={s} key="meat">
      <Path d="M4 11c0-5 5-8 10-7s7 6 5 10-6 7-10 6-5-4-5-9z" fill="#E5533F" />
      <Circle cx={13} cy={11} r={3.2} fill="#F6E9DB" />
    </I>
  ),
  (s?: number) => (
    <I size={s} key="leaf">
      <Path d="M3 18C3 9 10 4 21 4c0 11-5 17-14 17-2 0-4-1-4-3z" fill={colors.teal} />
      <Path d="M5 19 15 9" stroke="#0B4A3E" strokeWidth={1.6} strokeLinecap="round" />
    </I>
  ),
  (s?: number) => (
    <I size={s} key="mush">
      <Path d="M3 12a9 8 0 0 1 18 0c0 1-1 1.5-2 1.5H5c-1 0-2-.5-2-1.5z" fill={colors.carbs} />
      <Path d="M9 13.5h6l-1 7a2 2 0 0 1-4 0z" fill="#EFE6D6" />
    </I>
  ),
];

export const GoogleIcon = ({ size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </Svg>
);

export const FacebookIcon = ({ size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={12} fill="#1877F2" />
    <Path fill="#fff" d="M15.1 12.9l.4-2.8h-2.7V8.3c0-.8.4-1.5 1.6-1.5h1.2V4.4s-1.1-.2-2.2-.2c-2.2 0-3.7 1.4-3.7 3.8v2.1H7.3v2.8h2.4V20h3.1v-7.1h2.3z" />
  </Svg>
);

export const AppleIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M16.4 12.6c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.2zM13.9 5.1c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
  </Svg>
);
