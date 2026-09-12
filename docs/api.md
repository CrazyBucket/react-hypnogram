# react-hypnogram API

React 睡眠阶段时间线（Hypnogram / Sleep Chart）组件接口文档。

## 快速上手

```tsx
import { Hypnogram } from 'react-hypnogram';
import type { HypnogramSegment } from 'react-hypnogram';

const data: HypnogramSegment[] = [
  { id: '1', stage: 'awake', start: '2026-09-09T22:14:00+08:00', end: '2026-09-09T22:32:00+08:00' },
  { id: '2', stage: 'light', start: '2026-09-09T22:32:00+08:00', end: '2026-09-09T23:10:00+08:00' },
  { id: '3', stage: 'deep',  start: '2026-09-09T23:10:00+08:00', end: '2026-09-10T00:28:00+08:00' },
  { id: '4', stage: 'rem',   start: '2026-09-10T00:28:00+08:00', end: '2026-09-10T01:10:00+08:00' },
];

export function App() {
  return <Hypnogram data={data} time={{ timeZone: 'Asia/Shanghai' }} />;
}
```

无需引入额外 CSS。默认宽度自适应容器（100%），背景透明，高度由行数、色块高度与间距自动计算。

## Props

| 参数 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `data` | `readonly HypnogramSegment<S, M>[]` | 必需 | 标准时间区间数组；允许空数组 |
| `stages` | `readonly Stage<S>[]` | `DEFAULT_STAGES` | 睡眠阶段定义（纵轴从上至下显示） |
| `time` | `TimeOptions` | `{}` | 时间解析、单位（毫秒/秒）与展示时区配置 |
| `width` | `number \| string` | `'100%'` | 组件宽度；数字表示 px，字符串表示 CSS 宽度 |
| `stageHeight` | `number` | `56` | 每个睡眠层级之间的轨道间距（px）；决定阶段中心位置 |
| `barThickness` | `number` | `26` | 色块实际绘制厚度（px）；不超过 stageHeight |
| `radius` | `number` | `12` | 色块圆角半径（px）；0 为直角 |
| `gap` | `number` | `0` | 区块水平间距（px）；设置后色块分离显示 |
| `connectors` | `boolean \| ConnectorOptions` | `true` | 是否绘制相邻不同阶段间的垂直连接线，支持配置 maxGap 容差与线宽 |
| `connectorWidth` | `number` | `2` | 连接线宽度（px） |
| `grid` | `boolean \| GridOptions` | `true` | 网格参考线配置，支持虚线/实线与穿过阶段或穿过中心切换 |
| `plotPadding` | `{ top?: number; right?: number; bottom?: number; left?: number }` | 自动 | 绘图区四周留白（非负 px）；隐藏标签时可全部设为 0 |
| `outlineStyle` | `CSSProperties` | — | 覆盖轮廓描边，例如 `{ stroke: 'none' }` |
| `axes` | `boolean` | `true` | 是否显示横向与纵向坐标轴线 |
| `xLabels` | `boolean` | `true` | 是否显示底部时间刻度标签 |
| `yLabels` | `boolean` | `true` | 是否显示左侧阶段文字标签 |
| `xAxis` | `AxisLabelOptions` | `{}` | 时间标签的 `labelOffset`（px，可为负数）与 `labelStyle`（CSS） |
| `yAxis` | `AxisLabelOptions` | `{}` | 阶段标签的 `labelOffset`（px，可为负数）与 `labelStyle`（CSS） |
| `dark` | `boolean` | `false` | 暗色模式（反转文字与线条颜色，用于深色容器） |
| `tooltip` | `false \| TooltipOptions<S, M>` | `{}` | 悬停/点击提示气泡；设为 `false` 关闭内置气泡，仍可接收 `onActiveChange` |
| `interaction` | `InteractionOptions` | `{}` | 悬停与选中高亮配置及自定义样式 |
| `onSelect` | `(segment: HypnogramSegment<S, M> \| null) => void` | — | 选中区间切换或取消选中时回调 |
| `onSegmentClick` | `(segment: HypnogramSegment<S, M>) => void` | — | 点击或轻触区间时回调 |
| `onActiveChange` | `(context: ActiveContext<S, M> \| null) => void` | — | 当前活动区间及相对根容器的锚点变化；完全自定义气泡时使用 |
| `style` | `React.CSSProperties` | — | 根容器内联样式 |
| `className` | `string` | — | 根容器类名 |
| `id` | `string` | — | 根容器 DOM ID |
| `ariaLabel` | `string` | `'Sleep stages over time'` | SVG 无障碍可访问性标签 |

### 尺寸

`stageHeight` 是行高，`barThickness` 是居中绘制的色块厚度，上限为行高。两者相等时相邻行贴合；例如 `stageHeight={40} barThickness={24}` 留出 16 px 的垂直间距。

### 连接线（ConnectorOptions）

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否连接相邻的不同阶段 |
| `width` | `number` | `2` | 连接线宽度（px），优先于 connectorWidth |
| `maxGap` | `number` | `2000` | 容许的时间间隙（毫秒）；0 仅连接首尾完全相接的区间，不修改原始数据 |
| `minStageDistance` | `number` | `1` | 至少跨越的阶段行索引差；设为 2 时跳过相邻行之间的连接 |

### 坐标轴文字（AxisLabelOptions）

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `labelOffset` | `number` | `0` | 相对默认位置的偏移（px）。正数远离图表，负数靠近图表，允许移入绘图区。X 轴沿纵向移动，Y 轴沿横向移动 |
| `style` | `React.CSSProperties` | — | 标签样式，支持 `color`、`fill`、`fontSize`、`fontFamily` 等 |
| `labelStyle` | `React.CSSProperties` | — | 标签样式；与 style 合并，重名属性以 style 为准 |

```tsx
<Hypnogram
  data={data}
  xAxis={{ labelOffset: -20, labelStyle: { fill: '#999', fontSize: 12 } }}
  yAxis={{ labelOffset: -6, labelStyle: { fill: '#666', fontSize: 12, fontWeight: 500 } }}
/>
```

默认 X 标签基线位于绘图区下方 29 px，Y 标签右边缘位于绘图区左侧 14 px。字体大小建议使用数字（px）；数字或 `px` 字符串参与文字间距估算。`labelOffset` 不移动数据或轴线；`xLabels={false}` / `yLabels={false}` 仍可独立隐藏标签。

### 网格参考线（GridOptions）

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用网格线 |
| `position` | `'between' \| 'center'` | `'between'` | 线的位置：`'between'` 在各阶段之间穿过（默认），`'center'` 在阶段中心穿过 |
| `lineStyle` | `'dashed' \| 'solid'` | `'dashed'` | 线的类型：`'dashed'` 虚线（默认），`'solid'` 实线 |
| `stroke` | `string` | `'currentColor'` | 线条颜色 |
| `strokeWidth` | `number` | `1` | 线条宽度（px） |
| `opacity` | `number` | `0.18` | 线条透明度 |
| `strokeDasharray` | `string` | `'3 5'` | 自定义虚线间隔（仅 dashed 模式有效） |
| `includeEdges` | `boolean` | `false` | 是否包含最顶端与最底端的边界线 |

## 数据结构

### 区间数据（HypnogramSegment）

```ts
interface HypnogramSegment<S extends string = DefaultStage, M = unknown> {
  readonly id: string;           // 唯一标识符
  readonly stage: S;             // 对应 stages 中的 stage id
  readonly start: number | string; // 开始时间（Unix 毫秒/秒戳，或 ISO 日期时间）
  readonly end: number | string;   // 结束时间（必须大于 start）
  readonly metadata?: M;         // 业务自定义扩展数据，回调与 tooltip 原样回传
}
```

- 允许空数组（渲染空坐标轴）。
- 支持跨午夜、跨多天数据；显示范围自动适应数据区间的最早开始与最晚结束。
- 时间重叠会抛错保护；相同阶段连续时保留各自独立区间。

### 时间配置（TimeOptions）

```ts
interface TimeOptions {
  timestampUnit?: 'milliseconds' | 'seconds'; // 数字时间戳单位，默认 'milliseconds'
  locale?: string;                            // 格式化地区，默认 'en-GB'
  timeZone?: string;                          // 展示时区，例如 'Asia/Shanghai'，默认 'Asia/Shanghai'
  parse?: (value: number | string) => number; // 自定义时间解析器，返回 Unix 毫秒
}
```

## 阶段定义与颜色（Stage & Paint）

默认阶段定义为 `DEFAULT_STAGES`：
- `awake` (清醒): `#D6E7FF`
- `rem` (快速眼动): `#94BDFF`
- `light` (浅睡): `#1D81F5`
- `deep` (深睡): `#005CC7`

```ts
interface Stage<S extends string = DefaultStage> {
  id: S;
  label: string;
  color: string;
  fill?: Paint; // 可选，纯色或渐变；未提供时使用 color
}

type Paint = string | {
  type: 'linear';
  direction?: 'vertical'; // 默认 'vertical'
  stops: readonly { offset: number; color: string; opacity?: number }[];
};
```

每阶段的色标从色块上界（0）到下界（1）定位。行间衔接相邻边缘颜色，间距为 0 时直接换色；跨多个阶段的连接线会经过中间各行的颜色。

## 交互与 Tooltip

悬停查看区间，点击选中，再次点击、点击外部或按 Escape 取消选中。触摸滑动切换当前区间。`interaction.hover` / `selection` 只控制高亮，不关闭 tooltip 或回调。

| InteractionOptions | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `hover` / `selection` | `boolean` | `true` | 悬停 / 选中高亮 |
| `hoverColor` / `selectionColor` | `string` | 阶段色 | 覆盖高亮颜色，支持带透明度的颜色 |
| `hoverStyle` / `selectionStyle` | `HighlightStyle` | — | 高亮区间的 SVG 填充、描边、透明度和圆角 |

`HighlightStyle` 支持 `fill`、`fillOpacity`、`stroke`、`strokeWidth`、`strokeDasharray`、`strokeOpacity`、`opacity`、`rx`、`ry`。

### TooltipOptions

组件负责尺寸测量和边界定位。祖先的 overflow 可能裁切气泡，boundary 可指定外层卡片。

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `render` | `(context: TooltipContext<S, M>) => ReactNode` | 默认内容 | 自定义内容，返回 null 隐藏 |
| `style` | `CSSProperties` | 内置气泡样式 | 覆盖颜色、字号、宽度、边框等；位置、可见性及边界最大宽度由组件管理 |
| `className` | `string` | — | 气泡容器类名，可定义箭头伪元素 |
| `placement` | `'top' \| 'bottom'` | `'top'` | 优先方向；空间不足时自动翻转 |
| `offset` | `number` | `12` | 气泡与色块的距离（非负 px） |
| `boundaryPadding` | `number` | `8` | 距边界的内缩量（非负 px） |
| `boundary` | `() => HTMLElement \| null` | 根容器 | 气泡允许出现的区域，null 时使用根容器 |
| `hideDelay` | `number` | `1500` | 触摸结束后隐藏活动气泡的延迟（非负 ms） |
| `persistOnSelect` | `boolean` | `true` | 选中区间持续显示气泡；false 时点击/轻触后也按 hideDelay 隐藏，不改变选中状态 |

`ActiveContext` 包含原始 `segment`（含 `metadata`）、`stage`、归一化毫秒 `start/end/duration`、`startLabel/endLabel/durationLabel`，以及 `anchor: { x, y, width, height }`。锚点为色块相对根容器定位原点的 CSS 像素边界。

`TooltipContext` 额外包含最终 `placement` 与 `arrowOffset`（箭头在气泡内部的水平位置）。容器同时设置 `data-placement="top|bottom"` 和 CSS 变量 `--hypnogram-arrow-x`，便于自定义箭头。

```tsx
<Hypnogram
  data={data}
  tooltip={{
    boundary: () => cardRef.current,
    persistOnSelect: false,
    hideDelay: 1000,
    render: ({ startLabel, endLabel }) => (
      <span>{startLabel} — {endLabel}</span>
    ),
  }}
/>
```

完全自绘浮层可以设置 `tooltip={false}` 并使用 `onActiveChange`；无需查询内部 SVG 节点或重复实现触摸命中。

## 导出清单

- **组件**：`Hypnogram`
- **常量**：`DEFAULT_STAGES`
- **时间工具**：`normalizeTimeline`、`buildTimelineTicks`、`formatTimelineValue`
- **类型**：`HypnogramProps`、`HypnogramSegment`、`Stage`、`Paint`、`TimeOptions`、`TooltipOptions`、`ActiveContext`、`TooltipContext`、`InteractionOptions` 等
