import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatDuration } from '../../utils/format';

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'FBX animation',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function parseTrackBinding(name: string): { boundObject: string; boundProperty: string } {
  const lastDot = name.lastIndexOf('.');
  if (lastDot < 0) return { boundObject: '', boundProperty: name };

  return {
    boundObject: name.slice(0, lastDot),
    boundProperty: name.slice(lastDot + 1),
  };
}

function getTrackTimeBounds(times: THREE.KeyframeTrack['times']): { startTime: number | null; endTime: number | null } {
  if (times.length === 0) return { startTime: null, endTime: null };

  return {
    startTime: times[0],
    endTime: times[times.length - 1],
  };
}

function getClipSummaryFields(clip: THREE.AnimationClip): InspectorField[] {
  const bindings = clip.tracks.map((track) => parseTrackBinding(track.name));
  const involvedNodes = new Set(bindings.map((binding) => binding.boundObject).filter(Boolean));
  const propertyTypes = Array.from(new Set(bindings.map((binding) => binding.boundProperty).filter(Boolean)));
  const totalKeyframes = clip.tracks.reduce((total, track) => total + track.times.length, 0);

  return [
    field('clip.name', clip.name),
    field('clip.duration', clip.duration, formatDuration(clip.duration)),
    field('clip.tracks.length', clip.tracks.length),
    field('clip.totalKeyframes', totalKeyframes),
    field('clip.involvedNodeCount', involvedNodes.size),
    field('clip.propertyTypes', propertyTypes),
  ];
}

function getTrackFields(track: THREE.KeyframeTrack, index: number): InspectorField[] {
  const path = `animation.tracks.${index}`;
  const { boundObject, boundProperty } = parseTrackBinding(track.name);
  const { startTime, endTime } = getTrackTimeBounds(track.times);

  return [
    field(`${path}.name`, track.name),
    field(`${path}.ValueTypeName`, track.ValueTypeName),
    field(`${path}.times.length`, track.times.length),
    field(`${path}.values.length`, track.values.length),
    field(`${path}.startTime`, startTime, startTime === null ? 'null' : formatDuration(startTime)),
    field(`${path}.endTime`, endTime, endTime === null ? 'null' : formatDuration(endTime)),
    field(`${path}.boundObject`, boundObject),
    field(`${path}.boundProperty`, boundProperty),
  ];
}

export function extractAnimationSections(clips: THREE.AnimationClip[]): InspectorSection[] {
  if (clips.length === 0) {
    return [
      {
        id: 'animations',
        title: 'Animations',
        fields: [field('animations.clipCount', 0)],
      },
    ];
  }

  return clips.map((clip, clipIndex) => ({
    id: `animation-${clipIndex}`,
    title: clip.name || `Animation ${clipIndex + 1}`,
    fields: [
      ...getClipSummaryFields(clip),
      ...clip.tracks.flatMap((track, trackIndex) => getTrackFields(track, trackIndex)),
    ],
  }));
}
