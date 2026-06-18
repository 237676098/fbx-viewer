const exactTips = new Map<string, string>([
  ['clip.name', '动画片段名称，通常来自 FBX 的 take 或 stack。'],
  ['clip.duration', '该动画片段的总播放时长，单位为秒。'],
  ['clip.blendMode', '控制该动画片段与其它播放动作混合时的方式。'],
  ['track.name', '轨道绑定路径，通常由目标对象名和被驱动属性组成。'],
  ['track.ValueTypeName', 'Three.js 在运行时识别的关键帧轨道数值类型。'],
  ['track.times.length', '该轨道保存的关键帧时间点数量。'],
  [
    'track.values.length',
    '扁平化后的关键帧数值数量。位置和缩放每帧 3 个值，四元数每帧 4 个值。',
  ],
  ['material.name', '材质名称，来自 FBX 文件或加载器运行时赋值。'],
  ['material.type', 'Three.js 用来渲染该表面的材质类名。'],
  ['material.color', '基础材质颜色，会与贴图和光照共同影响最终显示。'],
  ['material.opacity', '表面不透明度。小于 1 时通常需要开启透明混合。'],
  ['material.transparent', '开启后，不透明度或贴图 alpha 才能参与透明混合。'],
  ['material.roughness', 'PBR 材质的粗糙度，影响高光范围和表面哑光程度。'],
  ['material.metalness', 'PBR 材质的金属度，影响表面对光照和反射的响应。'],
  ['texture.slot', '该纹理挂载在材质上的槽位，例如 map、normalMap。'],
  ['texture.material', '引用该纹理的材质名称。'],
  ['texture.name', '纹理名称，来自源文件或 Three.js 运行时对象。'],
  ['texture.image.width', '浏览器可读取图像数据时的纹理宽度，单位为像素。'],
  ['texture.image.height', '浏览器可读取图像数据时的纹理高度，单位为像素。'],
  [
    'texture.colorSpace',
    '颜色贴图通常应使用 sRGB；法线、粗糙度、金属度等数据贴图通常不应使用 sRGB。',
  ],
  [
    'texture.flipY',
    '控制纹理垂直方向。取值不匹配时，导入纹理可能会上下颠倒。',
  ],
  ['texture.wrapS', '控制 UV 超出 0-1 范围时，水平方向如何采样纹理。'],
  ['texture.wrapT', '控制 UV 超出 0-1 范围时，垂直方向如何采样纹理。'],
  ['geometry.index.count', '索引数量。三角面网格中通常除以 3 可得到三角形数量。'],
  ['object.name', '从 FBX 场景层级导入的对象名称。'],
  ['object.type', '该场景节点对应的 Three.js 运行时对象类型。'],
  ['object.visible', '该对象及其子对象是否参与渲染。'],
]);

const prefixTips: Array<[string, string]> = [
  ['animation.tracks', '动画轨道数据，描述目标属性的关键帧时间和值。'],
  ['material.map', '基础颜色贴图，会根据网格 UV 采样。'],
  ['material.normalMap', '法线贴图，在不改变几何体的情况下影响光照细节。'],
  ['material.roughnessMap', '控制每个像素表面粗糙度的贴图。'],
  ['material.metalnessMap', '控制每个像素金属度的贴图。'],
  ['texture.wrap', '控制 UV 超出 0-1 范围时如何采样纹理。'],
  ['texture.repeat', '控制该纹理在 UV 空间中的重复缩放。'],
  ['texture.offset', '控制该纹理在 UV 空间中的采样偏移。'],
  ['texture.center', '纹理在 UV 空间中旋转时使用的中心点。'],
  ['geometry.attributes.position', '顶点位置缓冲。count 通常就是几何体顶点数。'],
  [
    'geometry.attributes.normal',
    '顶点法线缓冲，用于光照计算。缺失法线可能导致表面发黑或光照异常。',
  ],
  ['geometry.attributes.uv', '主 UV 缓冲，大多数贴图槽都会使用它进行采样。'],
  ['geometry.attributes.color', '顶点颜色缓冲，可参与材质颜色混合。'],
  ['geometry.attributes.skinIndex', '蒙皮骨骼索引缓冲，用于 SkinnedMesh 动画。'],
  ['geometry.attributes.skinWeight', '蒙皮权重缓冲，用于 SkinnedMesh 动画。'],
  ['object.position', '相对父对象的本地位移。'],
  ['object.rotation', '相对父对象的本地欧拉旋转。'],
  ['object.quaternion', '相对父对象的本地四元数旋转。'],
  ['object.scale', '相对父对象的本地缩放。'],
  ['object.matrix', '由位置、旋转和缩放计算出的本地变换矩阵。'],
  ['object.matrixWorld', '应用父级变换后的世界变换矩阵。'],
];

const patternTips: Array<[RegExp, string]> = [
  [/^animation\.tracks\.\d+\.times\.length$/, '该动画轨道包含的关键帧时间点数量。'],
  [
    /^animation\.tracks\.\d+\.values\.length$/,
    '该轨道扁平化后的动画数值数量，可结合关键帧数量和值类型判断每帧分量数。',
  ],
  [
    /^animation\.tracks\.\d+\.name$/,
    '该动画轨道的目标绑定路径，通常由对象名和被驱动属性组成。',
  ],
  [
    /^geometry\.attributes\.[^.]+\.count$/,
    '该几何属性缓冲中的逻辑元素数量。',
  ],
  [
    /^geometry\.attributes\.[^.]+\.itemSize$/,
    '每个几何属性元素包含的数值分量数量。',
  ],
];

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`);
}

export function getFieldTip(path: string): string | undefined {
  const exact = exactTips.get(path);
  if (exact) return exact;

  const pattern = patternTips.find(([candidate]) => candidate.test(path));
  if (pattern) return pattern[1];

  const prefix = prefixTips.find(([candidate]) => matchesPrefix(path, candidate));
  return prefix?.[1];
}
