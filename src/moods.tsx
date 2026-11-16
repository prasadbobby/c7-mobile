/** Mood (6) and energy (5) glyphs — ported from the Lovable C7 design (no emoji). */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const mouths = ['M8 16.5c1.2-1.6 2.5-2 4-2s2.8.4 4 2', 'M8.5 16c1-1 2.2-1.3 3.5-1.3s2.5.3 3.5 1.3', 'M8.5 15.5h7', 'M8.5 14.8c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3', 'M8 14.3c1.2 1.6 2.5 2.2 4 2.2s2.8-.6 4-2.2', 'M7.5 13.8h9c0 2.6-2 4.2-4.5 4.2s-4.5-1.6-4.5-4.2z'];
export const moodLabels = ['Awful', 'Low', 'Meh', 'Okay', 'Good', 'Great'];
export const energyLabels = ['Drained', 'Tired', 'Steady', 'Charged', 'Unstoppable'];
export const sleepLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function MoodIcon({ level, size = 26, color }: { level: number; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9.5} fill={color} fillOpacity={0.15} />
      {level <= 1 ? <Path d="M8 9.5l2 1M16 9.5l-2 1" /> : (
        <>
          <Circle cx={9} cy={10} r={0.9} fill={color} />
          <Circle cx={15} cy={10} r={0.9} fill={color} />
        </>
      )}
      <Path d={mouths[level]!} fill={level === 5 ? color : 'none'} fillOpacity={level === 5 ? 0.4 : 0} />
    </Svg>
  );
}

export function EnergyIcon({ level, size = 26, color }: { level: number; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={7} width={16} height={10} rx={3} />
      <Path d="M21 10.5v3" />
      {Array.from({ length: level + 1 }, (_, i) => (
        <Rect key={i} x={5 + i * 2.5} y={9} width={1.6} height={6} rx={0.8} fill={color} stroke="none" />
      ))}
    </Svg>
  );
}
