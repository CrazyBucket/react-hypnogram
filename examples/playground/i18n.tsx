import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'hypnogram_lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'zh',
  setLang: () => {},
  toggleLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'zh';
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached === 'en' || cached === 'zh' ? cached : 'zh';
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  };

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const translations = {
  zh: {
    skipLink: '跳至文档',
    githubAria: '在 GitHub 查看 react-hypnogram',
    themeDark: '切换至浅色模式',
    themeLight: '切换至深色模式',
    langToggle: 'Switch to English',
    langButtonText: 'EN',
    sidebarExpand: '展开左侧菜单',
    sidebarCollapse: '收起左侧菜单',
    sidebarLabel: 'COMPONENT',
    onThisPage: 'ON THIS PAGE',
    backToTop: '返回顶部 ↑',
    overviewLead: '专为 React 打造的 SVG 睡眠图表（Sleep Chart）组件，清晰可视化清醒、快速眼动（REM）、浅睡与深睡等睡眠阶段变化，适用于睡眠健康报告与阶段时间线。',
    sections: {
      overview: '概览',
      basic: '基础用法',
      appearance: '圆角与连接',
      gradients: '逐阶段填充',
      interaction: 'Tooltip 与交互',
      'data-lab': '数据与阶段',
      size: 'Size',
      api: 'API Reference',
    },
    size: {
      title: 'Size',
      desc: '仅展示 Hypnogram 的组件代码体积。',
      transfer: '组件传输体积',
      minified: '压缩后的 JavaScript',
    },
    ui: {
      preview: '预览',
      code: '代码',
      copy: '复制',
      copied: '已复制',
      copyError: '请选中代码复制',
      viewAria: (title: string) => `${title}视图`,
    },
    basicDemo: {
      title: '基础用法',
      description: '横轴表示时间，纵轴表示阶段。色块长度对应每一段的持续时间。',
      footer: '11 个区间 · 8 小时 14 分钟',
    },
    appearanceDemo: {
      title: '层级尺寸与网格',
      description: '配置层级高度、色块厚度与连接宽度；支持虚线/实线与穿过阶段或穿过中心切换。',
      radius: '圆角',
      stageHeight: '层级高度',
      barThickness: '色块厚度',
      connectorWidth: '连接宽度',
      connectors: '连接线',
      grid: '网格',
      gridSolid: '实线网格',
      gridCenter: '穿过中心',
      axes: '坐标轴',
      xLabels: '时间标签',
      yLabels: '阶段标签',
    },
    gradientsDemo: {
      title: '逐阶段填充',
      description: '每行配置自己的纯色或渐变。横向渐变贯穿整行，纵向渐变覆盖行高。',
      gradientFill: '渐变填充',
      startColor: '起点颜色',
      endColor: '终点颜色',
      direction: '渐变方向',
      vertical: '纵向',
      horizontal: '横向',
    },
    interactionDemo: {
      title: 'Tooltip 与交互',
      description: '悬停查看区间，点击选中。内容、容器样式和高亮可以分别配置。',
      tooltip: 'Tooltip',
      customContent: '自定义内容',
      hoverHighlight: '悬停高亮',
      selectionHighlight: '选中高亮',
      hoverColor: '悬停色',
      selectionColor: '选中色',
    },
    dataDemo: {
      title: '数据与阶段',
      description: '接受时间戳或 ISO 日期时间，显示范围随数据变化。自定义阶段通过 stages 指定。',
      editData: '编辑数据',
      intervals: (count: number) => `${count} 个区间`,
      formatLabel: '示例格式',
      timestamp: 'Unix 毫秒',
      iso: 'ISO 日期时间',
      apply: '应用数据',
      limitHint: '最多 200 个演示区间',
      errorMax: '请输入最多 200 个区间的数组。',
      errorEmpty: '每段需要非空的 id 和 stage。',
    },
    apiRef: {
      title: 'API Reference',
      desc: 'data 为必需参数；自定义阶段 ID 时还需提供 stages。',
      thProp: '参数 / 类型',
      thDefault: '默认值',
      thDesc: '描述与用法',
      note1: '范围取数据的最早开始与最晚结束；保留空档，拒绝重叠区间。默认阶段为 Awake、REM、Light、Deep。',
      note2: 'Tooltip 在组件内部绝对定位，祖先的 overflow 可能裁切超出部分。再次点击区间、点击外部或按 Escape 会清除选中。',
      typesTitle: '数据类型与配置',
      layoutTitle: '绘制规则与时间工具',
      layoutP1: '使用连续波形圆角轮廓；色块可通过 gap 设置水平间隔；连接线支持 maxGap 容差配置。',
      layoutP2: '色块高于 44 px 时行高随之增加；负 rowGap 只能压缩未被色块占用的空间。实际色块不纵向重叠。',
      layoutP3: '还可导入 DEFAULT_STAGES、normalizeTimeline、buildTimelineTicks 和 formatTimelineValue。',
      thField: '字段',
      thType: '类型',
      thNote: '说明',
    },
  },
  en: {
    skipLink: 'Skip to content',
    githubAria: 'View react-hypnogram on GitHub',
    themeDark: 'Switch to light mode',
    themeLight: 'Switch to dark mode',
    langToggle: '切换为中文',
    langButtonText: '中',
    sidebarExpand: 'Expand sidebar',
    sidebarCollapse: 'Collapse sidebar',
    sidebarLabel: 'COMPONENT',
    onThisPage: 'ON THIS PAGE',
    backToTop: 'Back to top ↑',
    overviewLead: 'Customizable, lightweight SVG sleep-stage chart component for React. Visualize awake, REM, light, and deep sleep stages over time for sleep reports and health dashboards.',
    sections: {
      overview: 'Overview',
      basic: 'Basic Usage',
      appearance: 'Corners & Connectors',
      gradients: 'Stage Gradients',
      interaction: 'Tooltip & Interaction',
      'data-lab': 'Data & Stages',
      size: 'Size',
      api: 'API Reference',
    },
    size: {
      title: 'Size',
      desc: 'Bundle size for the Hypnogram component only.',
      transfer: 'Transfer size',
      minified: 'Minified JavaScript',
    },
    ui: {
      preview: 'Preview',
      code: 'Code',
      copy: 'Copy',
      copied: 'Copied',
      copyError: 'Select text to copy',
      viewAria: (title: string) => `${title} view`,
    },
    basicDemo: {
      title: 'Basic Usage',
      description: 'Time on the horizontal axis, sleep stages on the vertical axis. Bar lengths represent stage durations.',
      footer: '11 intervals · 8 hr 14 min',
    },
    appearanceDemo: {
      title: 'Stage Geometry & Grid',
      description: 'Configure stage height, bar thickness and connectors; toggle between dashed/solid grid and between/center position.',
      radius: 'Radius',
      stageHeight: 'Stage Height',
      barThickness: 'Bar Thickness',
      connectorWidth: 'Connector Width',
      connectors: 'Connectors',
      grid: 'Grid',
      gridSolid: 'Solid Grid',
      gridCenter: 'Center Grid',
      axes: 'Axes',
      xLabels: 'Time Labels',
      yLabels: 'Stage Labels',
    },
    gradientsDemo: {
      title: 'Stage Gradients',
      description: 'Configure custom solid fills or gradients per stage. Horizontal spans the timeline; vertical covers row height.',
      gradientFill: 'Gradient Fill',
      startColor: 'Start color',
      endColor: 'End color',
      direction: 'Gradient direction',
      vertical: 'Vertical',
      horizontal: 'Horizontal',
    },
    interactionDemo: {
      title: 'Tooltip & Interaction',
      description: 'Hover to inspect intervals, click to select. Content, styles, and highlight overlays are customizable.',
      tooltip: 'Tooltip',
      customContent: 'Custom Content',
      hoverHighlight: 'Hover Highlight',
      selectionHighlight: 'Selection Highlight',
      hoverColor: 'Hover Color',
      selectionColor: 'Selection Color',
    },
    dataDemo: {
      title: 'Data & Stages',
      description: 'Accepts Unix timestamps or ISO datetimes. Time range adapts to data automatically. Custom stages are specified via stages.',
      editData: 'Edit Data',
      intervals: (count: number) => `${count} intervals`,
      formatLabel: 'Format',
      timestamp: 'Unix ms',
      iso: 'ISO Datetime',
      apply: 'Apply Data',
      limitHint: 'Up to 200 demo intervals',
      errorMax: 'Please enter an array with at most 200 intervals.',
      errorEmpty: 'Each interval requires a non-empty id and stage.',
    },
    apiRef: {
      title: 'API Reference',
      desc: 'data is required; provide stages when using custom stage IDs.',
      thProp: 'Prop / Type',
      thDefault: 'Default',
      thDesc: 'Description & Usage',
      note1: 'Domain spans from earliest start to latest end; gaps are preserved without overlapping intervals. Default stages are Awake, REM, Light, Deep.',
      note2: 'Tooltip is absolutely positioned within the component; parent overflow may clip overflowing content. Clicking an interval again, clicking outside, or pressing Escape clears the selection.',
      typesTitle: 'Types & Configuration',
      layoutTitle: 'Layout Rules & Utilities',
      layoutP1: 'Uses continuous rounded outlines; bars can be separated with gap; connectors and gap tolerance supported.',
      layoutP2: 'Row height increases when bars exceed 44px; negative rowGap compresses unoccupied space without vertical bar overlap.',
      layoutP3: 'Also exports DEFAULT_STAGES, normalizeTimeline, buildTimelineTicks, and formatTimelineValue.',
      thField: 'Field',
      thType: 'Type',
      thNote: 'Description',
    },
  },
} as const;

export const propDescriptionsEn: Record<string, { defaultVal?: string; desc: string }> = {
  data: { desc: 'Standard interval data array; allows empty array.' },
  stages: { desc: 'Stage definitions displayed from top to bottom.' },
  time: { desc: 'Timestamp unit (ms/s), display time zone, and custom parser.' },
  width: { desc: 'Component width; number in px or CSS width string.' },
  stageHeight: { desc: 'Track height / vertical distance between stage centers in px.' },
  barThickness: { desc: 'Visual thickness of each stage bar in px.' },
  radius: { desc: 'Bar corner radius in px; 0 for sharp corners.' },
  barHeight: { desc: 'Height of each stage bar in px.' },
  rowGap: { desc: 'Vertical gap between stage rows in px.' },
  gap: { desc: 'Horizontal gap between bars in px.' },
  connectors: { desc: 'Render vertical connector stems between adjacent stages.' },
  connectorWidth: { desc: 'Width of vertical connector stems in px.' },
  grid: { desc: 'Grid reference lines; supports dashed/solid lineStyle and between/center position.' },
  axes: { desc: 'Horizontal and vertical axis lines.' },
  xLabels: { desc: 'Timeline labels along the bottom axis.' },
  yLabels: { desc: 'Stage name labels along the left gutter.' },
  xAxis: { desc: 'Time labelOffset in px (negative moves toward the plot) and labelStyle (CSS).' },
  yAxis: { desc: 'Stage labelOffset in px (negative moves toward the plot) and labelStyle (CSS).' },
  dark: { desc: 'Light foreground and outline for dark backgrounds.' },
  tooltip: { desc: 'Hover and click tooltip options; false to disable.' },
  interaction: { desc: 'Hover/selection highlight switches and custom styles.' },
  onSelect: { desc: 'Callback invoked when selection changes or is cleared.' },
  onSegmentClick: { desc: 'Callback invoked on clicking or tapping an interval.' },
  style: { desc: 'Custom inline CSS styles for the root container.' },
  className: { desc: 'Custom CSS class name for the root container.' },
  id: { desc: 'Custom HTML id attribute for the root container.' },
  ariaLabel: { desc: 'Accessible label for the SVG chart.' },
};
