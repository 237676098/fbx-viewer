import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FieldTable from '../../src/components/inspector/FieldTable.vue';
import type { InspectorField } from '../../src/domain/types';

describe('FieldTable', () => {
  it('renders field path, value, source, tip, and warning state', () => {
    const fields: InspectorField[] = [
      {
        path: 'geometry.attributes.position.array.length.with.a.very.long.path.segment',
        value: 123,
        displayValue: '123 vertices',
        source: 'BufferGeometry',
        tip: 'Vertex positions',
        severity: 'warning',
      },
    ];

    const wrapper = mount(FieldTable, {
      props: { fields },
    });

    expect(wrapper.get('[data-testid="field-path"]').text()).toContain(
      'geometry.attributes.position.array.length.with.a.very.long.path.segment',
    );
    expect(wrapper.get('[data-testid="field-value"]').text()).toBe('123 vertices');
    expect(wrapper.get('[data-testid="field-source"]').text()).toBe('BufferGeometry');
    expect(wrapper.get('[data-testid="field-tip"]').text()).toBe('Vertex positions');
    expect(wrapper.get('tr.field-row').classes()).toContain('warning');
  });

  it('renders an empty state for empty field arrays', () => {
    const wrapper = mount(FieldTable, {
      props: { fields: [] },
    });

    expect(wrapper.text()).toContain('No fields available');
    expect(wrapper.find('tbody tr').exists()).toBe(false);
  });
});
