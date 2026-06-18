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
    expect(wrapper.get('[data-testid="field-path"] code').attributes('title')).toBe(
      'Vertex positions',
    );
    expect(wrapper.find('[data-testid="field-tip"]').exists()).toBe(false);
    expect(wrapper.findAll('th').map((cell) => cell.text())).toEqual(['字段', '值', '来源']);
    expect(wrapper.get('tr.field-row').classes()).toContain('warning');
  });

  it('renders an empty state for empty field arrays', () => {
    const wrapper = mount(FieldTable, {
      props: { fields: [] },
    });

    expect(wrapper.text()).toContain('暂无字段');
    expect(wrapper.find('tbody tr').exists()).toBe(false);
  });

  it('renders inspector fields without source, visible tips, or copy controls', () => {
    const fields: InspectorField[] = [
      {
        path: 'object.position.x',
        value: 1,
        displayValue: '1',
        source: 'Object3D.position',
        tip: '节点在本地空间的 X 轴位置',
        copyValue: '1',
      },
    ];

    const wrapper = mount(FieldTable, {
      props: { fields, variant: 'inspector' },
    });

    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.get('[data-testid="inspector-field-name"]').text()).toBe('object.position.x');
    expect(wrapper.get('[data-testid="inspector-field-name"]').attributes('title')).toBe(
      '节点在本地空间的 X 轴位置',
    );
    expect(wrapper.get('[data-testid="inspector-field-value"]').text()).toBe('1');
    expect(wrapper.text()).not.toContain('Object3D.position');
    expect(wrapper.find('[data-testid="field-tip"]').exists()).toBe(false);
    expect(wrapper.find('.field-copy').exists()).toBe(false);
  });
});
