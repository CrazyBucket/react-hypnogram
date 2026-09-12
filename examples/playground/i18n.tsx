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
    overviewLead: 'React 睡眠阶段图表。横轴表示时间，纵轴表示阶段，色块长度表示持续时间。',
    sections: {
      overview: '概览',
      basic: '基础与数据',
      appearance: '轮廓与间距',
      gradients: '阶段颜色',
      interaction: 'Tooltip 与交互',
      axes: '坐标轴与网格',
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
      title: '基础与数据',
      description: '传入时间区间；可编辑数据，尝试时间戳、ISO 日期和自定义阶段。',
    },
    appearanceDemo: {
      title: '轮廓与间距',
      description: '调整行高、厚度和圆角；水平间隔大于 0 时，分段独立显示。',
      radius: '圆角',
      stageHeight: '层级高度',
      barThickness: '色块厚度',
      connectorWidth: '连接宽度',
      gap: '水平间隔',
      connectors: '连接线',
    },
    axesDemo: {
      title: '坐标轴与网格',
      description: '配置标签字号、颜色和位置；偏移量支持负数。',
      grid: '网格',
      gridSolid: '实线网格',
      gridCenter: '穿过中心',
      axes: '坐标轴',
      xLabels: '时间标签',
      yLabels: '阶段标签',
      fontSize: '字号', xOffset: '时间标签偏移', yOffset: '阶段标签偏移', color: '文字颜色',
    },
    gradientsDemo: {
      title: '阶段颜色',
      description: '每阶段配置纯色或纵向渐变，行间自动衔接边缘颜色。',
      gradientFill: '渐变填充',
      startColor: '起点颜色',
      endColor: '终点颜色',
    },
    interactionDemo: {
      title: 'Tooltip 与交互',
      description: '悬停查看区间，点击选中。内容、容器样式和高亮可以分别配置。',
      tooltip: 'Tooltip',
      customContent: '自定义内容',
      editContent: '编辑 Tooltip 内容',
      hoverHighlight: '悬停高亮',
      selectionHighlight: '选中高亮',
      hoverColor: '悬停色',
      selectionColor: '选中色',
    },
    dataDemo: {
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
      typesTitle: '数据类型与配置',
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
    overviewLead: 'A sleep-stage chart for React. Time runs horizontally, stages vertically, and bar length shows duration.',
    sections: {
      overview: 'Overview',
      basic: 'Data & Stages',
      appearance: 'Shape & Spacing',
      gradients: 'Stage Colors',
      interaction: 'Tooltip & Interaction',
      axes: 'Axes & Grid',
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
      title: 'Data & Stages',
      description: 'Edit intervals to try timestamps, ISO dates, and custom stages.',
    },
    appearanceDemo: {
      title: 'Shape & Spacing',
      description: 'Adjust row height, thickness, and corners. A horizontal gap separates the bars.',
      radius: 'Radius',
      stageHeight: 'Stage Height',
      barThickness: 'Bar Thickness',
      connectorWidth: 'Connector Width',
      gap: 'Horizontal Gap',
      connectors: 'Connectors',
    },
    axesDemo: {
      title: 'Axes & Grid',
      description: 'Set label size, color, and position. Negative offsets move labels inward.',
      grid: 'Grid',
      gridSolid: 'Solid Grid',
      gridCenter: 'Center Grid',
      axes: 'Axes',
      xLabels: 'Time Labels',
      yLabels: 'Stage Labels',
      fontSize: 'Font Size', xOffset: 'Time Label Offset', yOffset: 'Stage Label Offset', color: 'Text Color',
    },
    gradientsDemo: {
      title: 'Stage Colors',
      description: 'Configure solid fills or vertical gradients per stage. Gaps blend the adjoining edge colors.',
      gradientFill: 'Gradient Fill',
      startColor: 'Start color',
      endColor: 'End color',
    },
    interactionDemo: {
      title: 'Tooltip & Interaction',
      description: 'Hover to inspect intervals, click to select. Content, styles, and highlight overlays are customizable.',
      tooltip: 'Tooltip',
      customContent: 'Custom Content',
      editContent: 'Edit Tooltip Content',
      hoverHighlight: 'Hover Highlight',
      selectionHighlight: 'Selection Highlight',
      hoverColor: 'Hover Color',
      selectionColor: 'Selection Color',
    },
    dataDemo: {
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
      typesTitle: 'Types & Configuration',
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
  gap: { desc: 'Horizontal gap between bars in px.' },
  plotPadding: { desc: 'Override automatic plot margins in non-negative px.' },
  outlineStyle: { desc: 'Override the silhouette outline style.' },
  onActiveChange: { desc: 'Active interval and root-relative anchor, including with tooltip disabled.' },
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
