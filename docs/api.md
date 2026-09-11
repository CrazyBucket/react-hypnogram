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
| `stageHeight` | `number` | `44` | 每个睡眠层级之间的轨道间距（px）；决定阶段中心位置 |
| `barThickness` | `number` | `26` | 色块实际绘制厚度（px）；等同于 `barHeight` |
| `barHeight` | `number` | `26` | （兼容别名）色块绘制厚度 |
| `rowGap` | `number` | `12` | （兼容别名）未指定 stageHeight 时参与计算层级间距 |
| `radius` | `number` | `12` | 色块圆角半径（px）；0 为直角 |
| `gap` | `number` | `0` | 区块水平间距（px）；设置后色块分离显示 |
| `connectors` | `boolean \| ConnectorOptions` | `true` | 是否绘制相邻不同阶段间的垂直连接线，支持配置 maxGap 容差与线宽 |
| `connectorWidth` | `number` | `2` | 连接线宽度（px） |
| `grid` | `boolean \| GridOptions` | `true` | 网格参考线配置，支持虚线/实线与穿过阶段或穿过中心切换 |
| `axes` | `boolean` | `true` | 是否显示横向与纵向坐标轴线 |
| `xLabels` | `boolean` | `true` | 是否显示底部时间刻度标签 |
| `yLabels` | `boolean` | `true` | 是否显示左侧阶段文字标签 |
| `xAxis` | `AxisLabelOptions` | `{}` | 时间标签的 `labelOffset`（px，可为负数）与 `labelStyle`（CSS） |
| `yAxis` | `AxisLabelOptions` | `{}` | 阶段标签的 `labelOffset`（px，可为负数）与 `labelStyle`（CSS） |
| `dark` | `boolean` | `false` | 暗色模式（反转文字与线条颜色，用于深色容器） |
| `tooltip` | `false \| TooltipOptions<S, M>` | `{}` | 悬停/点击提示气泡；设为 `false` 完全关闭 |
| `interaction` | `InteractionOptions` | `{}` | 悬停与选中高亮配置及自定义样式 |
| `onSelect` | `(segment: HypnogramSegment<S, M> \| null) => void` | — | 选中区间切换或取消选中时回调 |
| `onSegmentClick` | `(segment: HypnogramSegment<S, M>) => void` | — | 点击或轻触区间时回调 |
| `style` | `React.CSSProperties` | — | 根容器内联样式 |
| `className` | `string` | — | 根容器类名 |
| `id` | `string` | — | 根容器 DOM ID |
| `ariaLabel` | `string` | `'Sleep stages over time'` | SVG 无障碍可访问性标签 |

### 层级边距模型（stageHeight 与 barThickness）

- **`stageHeight`**：每个睡眠层级间的轨道高度 / 步长（px）。各阶段中心线位于 `(i + 0.5) * stageHeight`。
- **`barThickness`**：色块实际绘制厚度（px）。各色块垂直居中对齐所在阶段中心线。

**两种典型模式**：
- **无缝阶梯贴合**：设置 `stageHeight={24} barThickness={24}`（或仅 `stageHeight={24}`），相邻层级垂直无缝贴合，无多余留白：
  ```tsx
  <Hypnogram stageHeight={24} barThickness={24} radius={0} />
  ```
- **间隙留白**：设置 `stageHeight={40} barThickness={24}`，层级间自然留出 16 px 通道供连接线跨越穿行：
  ```tsx
  <Hypnogram stageHeight={40} barThickness={24} />
  ```

### 坐标轴文字（AxisLabelOptions）

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `labelOffset` | `number` | `0` | 相对默认位置的偏移（px）。正数远离图表，负数靠近图表，允许移入绘图区。X 轴沿纵向移动，Y 轴沿横向移动 |
| `labelStyle` | `React.CSSProperties` | — | SVG 文字样式，例如 `fill`、`fontSize`、`fontWeight`、`fontFamily`、`letterSpacing` |

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

```tsx
// 阶段间的实线网格
<Hypnogram data={data} grid={{ lineStyle: 'solid', position: 'between' }} />

// 阶段中心的传统虚线网格
<Hypnogram data={data} grid={{ position: 'center' }} />
```

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
  direction?: 'horizontal' | 'vertical'; // 默认 'vertical'
  stops: readonly { offset: number; color: string; opacity?: number }[];
};
```

自定义阶段示例：

```tsx
const customStages = [
  { id: 'wake', label: '清醒', color: '#f59e0b' },
  { id: 'rem', label: '快速眼动', color: '#8b5cf6' },
  { id: 'nrem', label: '非快速眼动', color: '#3b82f6' },
];

<Hypnogram data={data} stages={customStages} />
```

## 交互与 Tooltip

```tsx
<Hypnogram
  data={data}
  interaction={{
    hover: true,
    selection: true,
    hoverColor: '#1D81F512',
    selectionColor: '#005CC726',
    selectionStyle: { stroke: '#005CC7', strokeWidth: 1 },
  }}
  tooltip={{
    render: ({ stage, durationLabel, startLabel, endLabel }) => (
      <div>
        <strong>{stage.label} · {durationLabel}</strong>
        <div>{startLabel} — {endLabel}</div>
      </div>
    ),
    style: { background: '#172b45', color: '#fff', borderRadius: 8 },
  }}
  onSelect={segment => console.log('选中:', segment?.id)}
  onSegmentClick={segment => console.log('点击:', segment.id)}
/>
```

- **交互逻辑**：点击区间即选中（再次点击或点击外部清除），支持键盘 Escape 取消选中；鼠标悬停优先展示悬停区间。
- **自定义气泡**：`tooltip.render` 接收完整上下文，返回 React 节点或返回 `null` 隐藏。

## 导出清单

- **组件**：`Hypnogram`
- **常量**：`DEFAULT_STAGES`
- **时间工具**：`normalizeTimeline`、`buildTimelineTicks`、`formatTimelineValue`
- **类型**：`HypnogramProps`、`HypnogramSegment`、`Stage`、`Paint`、`TimeOptions`、`TooltipOptions`、`TooltipContext`、`InteractionOptions` 等
