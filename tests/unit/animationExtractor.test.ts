import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractAnimationSections } from '../../src/domain/extractors/animationExtractor';

function fieldValue(sections: ReturnType<typeof extractAnimationSections>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

function fieldDisplay(sections: ReturnType<typeof extractAnimationSections>, path: string): string | undefined {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.displayValue;
}

describe('extractAnimationSections', () => {
  it('returns a compact summary for empty animation clips', () => {
    const sections = extractAnimationSections([]);

    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('animations');
    expect(fieldValue(sections, 'animations.clipCount')).toBe(0);
  });

  it('extracts clip totals and track binding details without dumping values', () => {
    const positionTrack = new THREE.VectorKeyframeTrack(
      'Armature.Hips.position',
      [0, 0.5, 1],
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
    const emptyTrack = new THREE.NumberKeyframeTrack('Blink.weight', [0], [1]);
    emptyTrack.times = new Float32Array();
    emptyTrack.values = new Float32Array();
    const clip = new THREE.AnimationClip('Walk', 1.25, [positionTrack, emptyTrack]);

    const sections = extractAnimationSections([clip]);

    expect(fieldValue(sections, 'animations.0.clip.name')).toBe('Walk');
    expect(fieldValue(sections, 'animations.0.clip.duration')).toBe(1.25);
    expect(fieldDisplay(sections, 'animations.0.clip.duration')).toBe('1.250s');
    expect(fieldValue(sections, 'animations.0.clip.tracks.length')).toBe(2);
    expect(fieldValue(sections, 'animations.0.clip.totalKeyframes')).toBe(3);
    expect(fieldValue(sections, 'animations.0.clip.involvedNodeCount')).toBe(2);
    expect(fieldValue(sections, 'animations.0.clip.propertyTypes')).toEqual(['position', 'weight']);

    expect(fieldValue(sections, 'animations.0.tracks.0.name')).toBe('Armature.Hips.position');
    expect(fieldValue(sections, 'animations.0.tracks.0.ValueTypeName')).toBe('vector');
    expect(fieldValue(sections, 'animations.0.tracks.0.times.length')).toBe(3);
    expect(fieldValue(sections, 'animations.0.tracks.0.values.length')).toBe(9);
    expect(fieldValue(sections, 'animations.0.tracks.0.startTime')).toBe(0);
    expect(fieldValue(sections, 'animations.0.tracks.0.endTime')).toBe(1);
    expect(fieldValue(sections, 'animations.0.tracks.0.boundObject')).toBe('Armature.Hips');
    expect(fieldValue(sections, 'animations.0.tracks.0.boundProperty')).toBe('position');

    expect(fieldValue(sections, 'animations.0.tracks.1.startTime')).toBeNull();
    expect(fieldValue(sections, 'animations.0.tracks.1.endTime')).toBeNull();
  });

  it('keeps field paths unique across multiple clips', () => {
    const sections = extractAnimationSections([
      new THREE.AnimationClip('Walk', 1, [
        new THREE.VectorKeyframeTrack('Hips.position', [0], [1, 2, 3]),
      ]),
      new THREE.AnimationClip('Run', 2, [
        new THREE.VectorKeyframeTrack('Hips.position', [0], [4, 5, 6]),
      ]),
    ]);

    const paths = sections.flatMap((section) => section.fields.map((field) => field.path));

    expect(new Set(paths).size).toBe(paths.length);
    expect(fieldValue(sections, 'animations.0.clip.name')).toBe('Walk');
    expect(fieldValue(sections, 'animations.1.clip.name')).toBe('Run');
    expect(fieldValue(sections, 'animations.1.tracks.0.name')).toBe('Hips.position');
  });

  it.each([
    ['Hips.position', 'Hips', 'position'],
    ['Mesh.material[0].color', 'Mesh', 'color'],
    ['NoDotTrack', '', 'NoDotTrack'],
    ['.leading', '', 'leading'],
    ['Trailing.', 'Trailing', 'unknown'],
  ])('parses track binding %s without throwing', (trackName, boundObject, boundProperty) => {
    const clip = new THREE.AnimationClip('Bindings', 1, [
      new THREE.NumberKeyframeTrack(trackName, [0], [1]),
    ]);

    const sections = extractAnimationSections([clip]);

    expect(fieldValue(sections, 'animations.0.tracks.0.boundObject')).toBe(boundObject);
    expect(fieldValue(sections, 'animations.0.tracks.0.boundProperty')).toBe(boundProperty);
  });
});
