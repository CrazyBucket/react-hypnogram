# 时间与数据指南

`react-hypnogram` 接收标准区间数组，本篇提供常见数据格式的处理指南。

## 1. 时间戳（毫秒与秒）

默认以 **Unix 毫秒** 处理；时间标签展示与刻度吸附默认使用 `Asia/Shanghai`。其他时区可通过 `time.timeZone` 显式指定：

```tsx
// 毫秒时间戳（默认）
<Hypnogram data={millisecondsData} />

// 秒级时间戳（显式声明）
<Hypnogram
  data={secondsData}
  time={{ timestampUnit: 'seconds', timeZone: 'Asia/Shanghai' }}
/>
```

## 2. ISO 日期时间字符串

支持标准 ISO 8601 格式，跨午夜时使用递增的日期即可：

```ts
const data = [
  { id: '1', stage: 'awake', start: '2026-09-09T23:30:00+08:00', end: '2026-09-10T00:15:00+08:00' },
  { id: '2', stage: 'deep',  start: '2026-09-10T00:15:00+08:00', end: '2026-09-10T01:45:00+08:00' },
];
```

## 3. 业务数据字段映射

若后端返回字段名称不同，在传入前转换即可：

```ts
interface MyApiRecord {
  recordId: string;
  sleepState: 'W' | 'R' | 'L' | 'D';
  startTime: number;
  endTime: number;
  heartRateAvg: number;
}

const stageMap = {
  W: 'awake',
  R: 'rem',
  L: 'light',
  D: 'deep',
} as const;

const data = apiRecords.map(item => ({
  id: item.recordId,
  stage: stageMap[item.sleepState],
  start: item.startTime,
  end: item.endTime,
  metadata: item, // 原始业务对象可保存在 metadata 中
}));
```

## 4. 自定义时间解析（time.parse）

若数据中包含特殊格式的时间，可通过 `time.parse` 自行解析为 Unix 毫秒：

```tsx
<Hypnogram
  data={data}
  time={{
    timeZone: 'Asia/Shanghai',
    parse: (value) => new Date(value).getTime(),
  }}
/>
```
