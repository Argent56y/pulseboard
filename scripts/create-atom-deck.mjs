import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = path.resolve(".");
const skillDir = "/Users/arsenijkozel/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const runtimePython = "/Users/arsenijkozel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const buildDir = path.join(workspaceDir, ".codex-deck");
const outputDir = path.join(workspaceDir, "submission");
const finalPath = path.join(outputDir, "Pulseboard_ATOM_Startup_Day_2026_RU.pptx");
await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const { finalizePresentation, applyPresentationChartFont } = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);

const W = 1280;
const H = 720;
const C = {
  bg: "#202529", surface: "#293036", elevated: "#30383E", text: "#F1EEE7",
  muted: "#9AA7AC", accent: "#AFC1C7", dim: "#718087", line: "#465158",
  yellow: "#F2C94C", green: "#87B99A", amber: "#D2AA70", red: "#C98A83",
};
const sans = "Geist Sans";
const mono = "Geist Mono";
const presentation = Presentation.create({ slideSize: { width: W, height: H } });
const tableStyles = presentation.theme.textStyles({
  tableBody: { typeface: sans, fontSize: 12, color: C.text, autoFit: "shrinkText" },
  tableHeader: { typeface: sans, fontSize: 13, color: C.accent, bold: true, autoFit: "shrinkText" },
  tableStrong: { typeface: sans, fontSize: 13, color: C.text, bold: true, autoFit: "shrinkText" },
  tableYellow: { typeface: sans, fontSize: 13, color: C.yellow, bold: true, autoFit: "shrinkText" },
  tableGreen: { typeface: sans, fontSize: 13, color: C.green, bold: true, autoFit: "shrinkText" },
  tablePrice: { typeface: sans, fontSize: 24, color: C.text, bold: true, autoFit: "shrinkText" },
  tablePriceAccent: { typeface: sans, fontSize: 24, color: C.yellow, bold: true, autoFit: "shrinkText" },
});

function addText(slide, text, x, y, w, h, size = 24, color = C.text, bold = false, family = sans, alignment = "left") {
  const shape = slide.shapes.add({ geometry: "textbox", position: { left: x, top: y, width: w, height: h }, fill: "none", line: { fill: "none", width: 0 } });
  shape.text = text;
  shape.text.style = { typeface: family, fontSize: size, color, bold, alignment, autoFit: "shrinkText" };
  return shape;
}

function rect(slide, x, y, w, h, fill = C.surface, line = C.line, radius = 0) {
  return slide.shapes.add({ geometry: radius ? "roundRect" : "rect", position: { left: x, top: y, width: w, height: h }, fill, line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 }, ...(radius ? { borderRadius: radius } : {}) });
}

function rule(slide, x, y, w, color = C.line, weight = 1) {
  return slide.shapes.add({ geometry: "line", position: { left: x, top: y, width: w, height: 0 }, fill: "none", line: { style: "solid", fill: color, width: weight } });
}

function header(slide, number, title, subtitle) {
  slide.background.fill = C.bg;
  addText(slide, String(number).padStart(2, "0"), 58, 38, 50, 24, 12, C.accent, true, mono);
  addText(slide, title, 112, 31, 1098, 52, 32, C.text, true);
  if (subtitle) addText(slide, subtitle, 112, 80, 1040, 32, 15, C.muted, false);
  rule(slide, 58, 116, 1164, C.line, 1);
}

function footer(slide, text = "Pulseboard · ATOM Startup Day 2026") {
  addText(slide, text, 58, 688, 640, 16, 9, C.dim, false, mono);
}

async function addImage(slide, file, x, y, w, h, alt, crop) {
  const blob = new Uint8Array(await fs.readFile(file));
  return slide.images.add({ blob, contentType: "image/png", alt, fit: "cover", position: { left: x, top: y, width: w, height: h }, ...(crop ? { crop } : {}) });
}

function addNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

function styleTable(table, headerFill = C.elevated) {
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  for (let r = 0; r < table.rows.length; r += 1) {
    for (let c = 0; c < table.columns.length; c += 1) {
      const cell = table.getCell(r, c);
      cell.fill = r === 0 ? headerFill : (r % 2 ? C.surface : C.bg);
      cell.text.style = r === 0 ? tableStyles.tableHeader : tableStyles.tableBody;
    }
  }
}

function tableValues(values, variant = "default") {
  return values.map((row, rowIndex) => row.map((value, columnIndex) => {
    let color = rowIndex === 0 ? C.accent : C.text;
    let fontSize = rowIndex === 0 ? "13px" : "12px";
    let bold = rowIndex === 0;

    if (variant === "competitors" && rowIndex === values.length - 1) {
      color = columnIndex === 0 ? C.yellow : C.text;
      fontSize = "13px";
      bold = true;
    }
    if (variant === "pricing" && rowIndex === 1) {
      color = columnIndex === 2 ? C.yellow : C.text;
      fontSize = columnIndex === 0 ? "13px" : "24px";
      bold = true;
    }
    if (variant === "finance" && rowIndex === values.length - 1) {
      color = columnIndex === 0 ? C.accent : C.green;
      fontSize = "13px";
      bold = true;
    }

    return [{ run: String(value), textStyle: { typeface: sans, color, fontSize, bold } }];
  }));
}

const shots = path.join(workspaceDir, "tmp/atom/screenshots");

// 1. Cover
{
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  addText(slide, "PULSEBOARD", 58, 42, 300, 26, 12, C.accent, true, mono);
  addText(slide, "Pulseboard", 58, 105, 500, 88, 66, C.text, true);
  addText(slide, "Разрозненные отзывы становятся темами, roadmap и понятными публичными обновлениями.", 58, 206, 440, 116, 25, C.text, false);
  addText(slide, "Козел Арсений Михайлович\nБГТУ, 2 курс\nАвтор проекта и full-stack разработчик", 58, 392, 420, 94, 16, C.muted, false);
  addText(slide, "@Babushkaspa", 58, 520, 240, 28, 16, C.yellow, true, mono);
  rect(slide, 548, 68, 674, 548, C.elevated, C.line, 12);
  await addImage(slide, path.join(shots, "ru-signal-map.png"), 562, 82, 646, 520, "Русская Signal Map Pulseboard", { left: 0.12, top: 0.02, right: 0.01, bottom: 0.02 });
  addText(slide, "РАБОТАЮЩИЙ SOLO-MVP", 58, 630, 300, 22, 11, C.green, true, mono);
  addText(slide, "pulseboard.sevadeva.tech/ru", 850, 644, 360, 22, 12, C.accent, true, mono, "right");
  addNotes(slide, ["Проект: Pulseboard", "Автор: Козел Арсений Михайлович, БГТУ, 2 курс", "Telegram: https://t.me/Babushkaspa", "MVP: https://pulseboard.sevadeva.tech/ru"]);
}

// 2. Problem
{
  const slide = presentation.slides.add(); header(slide, 2, "Отзывы есть. Связи с решениями нет", "Почта, поддержка и интервью сохраняют слова клиента, но не общий контекст.");
  addText(slide, "12%", 58, 164, 250, 92, 70, C.yellow, true);
  addText(slide, "участников исследования Productboard в 2022 году сообщили, что успешно собирают insights из всех доступных источников", 58, 258, 330, 140, 20, C.text, false);
  addText(slide, "Даже собранный отзыв часто теряет путь к принятому приоритету и выпущенной функции.", 58, 446, 330, 100, 17, C.muted, false);
  const sources = [["Почта", 462, 174], ["Поддержка", 462, 270], ["Интервью", 462, 366], ["Таблицы", 462, 462]];
  const target = rect(slide, 938, 284, 244, 154, C.elevated, C.accent, 10);
  addText(slide, "Решение без\nобъяснения", 966, 322, 188, 78, 25, C.text, true, sans, "center");
  for (const [label, x, y] of sources) {
    const box = rect(slide, x, y, 190, 58, C.surface, C.line, 8);
    addText(slide, label, x + 18, y + 18, 154, 24, 16, C.text, true);
    slide.shapes.connect(box, target, { kind: "elbow", fromSide: "right", toSide: "left", line: { style: "dashed", fill: C.dim, width: 1.4 }, head: { type: "arrow", width: "sm", length: "sm" } });
  }
  addText(slide, "Контекст теряется между каналом и приоритетом", 700, 516, 480, 28, 16, C.accent, true, mono, "right");
  addText(slide, "Источник: Productboard, Product Excellence Report 2022, стр. 16-18", 58, 656, 720, 18, 10, C.dim, false, mono);
  footer(slide);
  addNotes(slide, ["Источник: Productboard, Product Excellence Report 2022.", "https://www.productboard.com/wp-content/uploads/2022/11/2022_PE-Report.pdf", "Показатель 12% относится к исследованию 2022 года и используется как внешний ориентир, а не как текущая рыночная метрика Pulseboard."]);
}

// 3. Workflow
{
  const slide = presentation.slides.add(); header(slide, 3, "Как работает Pulseboard", "AI предлагает связи. Founder проверяет их перед тем, как они влияют на roadmap.");
  const labels = ["01  Публичный feedback", "02  AI предлагает темы", "03  Founder подтверждает", "04  Roadmap и changelog"];
  labels.forEach((label, index) => {
    const x = 58 + index * 291;
    rect(slide, x, 142, 262, 54, index === 2 ? C.elevated : C.surface, index === 2 ? C.accent : C.line, 7);
    addText(slide, label, x + 15, 160, 232, 22, 13, index === 2 ? C.text : C.muted, index === 2, mono);
    if (index < labels.length - 1) addText(slide, "→", x + 266, 155, 24, 28, 18, C.dim, false, sans, "center");
  });
  rect(slide, 58, 226, 760, 400, C.elevated, C.line, 10);
  await addImage(slide, path.join(shots, "ru-inbox.png"), 70, 238, 736, 376, "Русский Inbox Pulseboard", { left: 0.13, top: 0.12, right: 0.23, bottom: 0.08 });
  addText(slide, "Inbox сохраняет исходный отзыв", 854, 246, 338, 62, 28, C.text, true);
  addText(slide, "Команда видит источник, охват и состояние анализа. Предложенная тема остаётся рекомендацией, пока founder её не подтвердит.", 854, 326, 330, 132, 18, C.muted, false);
  addText(slide, "Результат", 854, 504, 120, 20, 11, C.accent, true, mono);
  addText(slide, "Решение можно объяснить исходными словами клиента.", 854, 534, 330, 72, 20, C.text, true);
  footer(slide);
  addNotes(slide, ["Все данные на скриншоте являются вымышленными демонстрационными данными.", "Логика MVP: feedback -> AI suggestion -> founder confirmation -> theme -> roadmap -> changelog."]);
}

// 4. Signal Map
{
  const slide = presentation.slides.add(); header(slide, 4, "Signal Map", "Карта связей между отзывами, темами и решениями показывает доказательства приоритета.");
  rect(slide, 58, 142, 858, 498, C.elevated, C.line, 10);
  await addImage(slide, path.join(shots, "ru-signal-map-theme.png"), 70, 154, 834, 474, "Signal Map с выбранной темой", { left: 0.12, top: 0.08, right: 0.23, bottom: 0.06 });
  addText(slide, "Пунктир", 958, 174, 180, 26, 14, C.yellow, true, mono);
  addText(slide, "AI предлагает связь", 958, 206, 240, 36, 19, C.text, true);
  rule(slide, 958, 266, 238, C.line);
  addText(slide, "Сплошная линия", 958, 292, 200, 26, 14, C.accent, true, mono);
  addText(slide, "Founder подтвердил связь", 958, 324, 240, 54, 19, C.text, true);
  rule(slide, 958, 400, 238, C.line);
  addText(slide, "Главное отличие", 958, 426, 200, 26, 14, C.green, true, mono);
  addText(slide, "Pulseboard показывает путь решения, а не только закрытый AI-score.", 958, 460, 240, 98, 20, C.text, true);
  addText(slide, "Демо-данные вымышлены", 958, 596, 220, 20, 10, C.dim, false, mono);
  footer(slide);
  addNotes(slide, ["Скриншот: работающая русская демо-версия Pulseboard.", "https://pulseboard.sevadeva.tech/ru/demo/app/map", "Пунктир обозначает AI suggestion. Сплошная линия обозначает подтверждённую founder-ом связь."]);
}

// 5. Audience and market
{
  const slide = presentation.slides.add(); header(slide, 5, "Первый рынок: небольшие SaaS-команды", "Начальный сегмент: solo-founders и продуктовые команды до 10 человек.");
  addText(slide, "100K+", 58, 160, 300, 72, 58, C.yellow, true);
  addText(slide, "зарегистрированных компаний Canny", 58, 232, 300, 50, 18, C.text, true);
  addText(slide, "6,000+", 446, 160, 300, 72, 58, C.accent, true);
  addText(slide, "продуктовых команд доверяют Productboard", 446, 232, 320, 50, 18, C.text, true);
  addText(slide, "0,5%", 838, 160, 300, 72, 58, C.green, true);
  addText(slide, "от benchmark Canny = цель 500 платящих workspace к третьему году", 838, 232, 340, 72, 18, C.text, true);
  rule(slide, 58, 330, 1164, C.line);
  addText(slide, "Для кого", 58, 368, 260, 30, 14, C.accent, true, mono);
  addText(slide, "Команда уже получает отзывы, но ещё не готова внедрять тяжёлую enterprise-систему.", 58, 410, 480, 92, 25, C.text, true);
  addText(slide, "Основной сценарий", 662, 368, 260, 30, 14, C.accent, true, mono);
  addText(slide, "SaaS собирает запросы через portal, support, email и интервью. Founder объясняет, почему одна тема попала в roadmap раньше другой.", 662, 410, 520, 116, 21, C.text, true);
  addText(slide, "Показатели компаний не складываются. Они подтверждают наличие спроса на категорию.", 58, 604, 720, 28, 13, C.muted, false);
  addText(slide, "Источники: Canny; Productboard", 868, 604, 340, 28, 10, C.dim, false, mono, "right");
  footer(slide);
  addNotes(slide, ["Canny: https://canny.io/use-cases/customer-feedback", "Productboard: https://www.productboard.com/use-cases/customer-insights/", "100K+ и 6,000+ не складываются: компании могут пересекаться. Цель 500 workspace является гипотезой, равной 0,5% от benchmark 100K."]);
}

// 6. Competitors
{
  const slide = presentation.slides.add(); header(slide, 6, "Конкуренты и отличие Pulseboard", "Категория уже существует. Pulseboard делает путь решения видимым и оставляет AI под контролем человека.");
  const values = [
    ["Продукт", "Публичный portal", "AI темы / дубли", "Связь с roadmap", "Evidence map", "Ручное подтверждение AI"],
    ["Canny", "Да", "Да", "Да", "Нет", "Нет: авто-группировка"],
    ["Productboard", "Да", "Да", "Да", "Нет", "Частично: ручные links"],
    ["UserVoice", "Да", "Частично", "Да", "Нет", "Не заявлено"],
    ["Linear Customer Requests", "Нет", "Нет", "Да", "Нет", "Не применяется"],
    ["Pulseboard", "Да", "Да", "Да", "Да", "Да"],
  ];
  const table = slide.tables.add({ rows: values.length, columns: values[0].length, left: 58, top: 154, width: 1164, height: 390, columnTracks: [{ mode: "fr", value: 1.45 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: .9 }, { mode: "fr", value: 1.35 }], values: tableValues(values, "competitors") });
  styleTable(table);
  for (let c = 0; c < values[0].length; c += 1) { table.getCell(5, c).fill = C.elevated; table.getCell(5, c).text.style = c === 0 ? tableStyles.tableYellow : tableStyles.tableStrong; }
  addText(slide, "Pulseboard связывает каждое решение с темами и исходными цитатами", 58, 578, 780, 48, 24, C.text, true);
  addText(slide, "Сравнение функций по официальным страницам продуктов, сентябрь 2026", 862, 592, 352, 28, 10, C.dim, false, mono, "right");
  footer(slide);
  addNotes(slide, ["Canny Autopilot: https://canny.io/features/autopilot", "Productboard insights: https://support.productboard.com/hc/en-us/articles/10071375851155-Review-an-item-s-insights", "Linear Customer Requests: https://linear.app/docs/customer-requests", "UserVoice pricing/features: https://uservoice.com/pricing", "Таблица отражает публично заявленные функции. Значение «Не заявлено» означает, что функция не подтверждена использованной официальной страницей."]);
}

// 7. MVP state
{
  const slide = presentation.slides.add(); header(slide, 7, "Состояние MVP", "Продукт работает. Следующий риск связан не с кодом, а с реальным использованием.");
  rect(slide, 58, 150, 558, 338, C.elevated, C.line, 10);
  await addImage(slide, path.join(shots, "ru-public-board.png"), 70, 162, 534, 314, "Русская публичная доска Pulseboard", { left: 0.08, top: 0.12, right: 0.06, bottom: 0.2 });
  const values = [
    ["Готово", "Требует пилота", "Запланировано"],
    ["Регистрация и workspace", "Онбординг на реальных командах", "Billing"],
    ["Public board, голоса, комментарии", "Качество AI suggestions", "Email updates"],
    ["Inbox и CSV import", "Готовность платить", "Базовые integrations"],
    ["AI embeddings и темы", "Повторное использование", "Custom domain"],
    ["Signal Map, roadmap, changelog", "Метрики активации", "Расширенная аналитика"],
  ];
  const table = slide.tables.add({ rows: values.length, columns: 3, left: 648, top: 150, width: 574, height: 338, columnTracks: [{ mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }], values: tableValues(values) });
  styleTable(table);
  addText(slide, "Демо открывается без регистрации", 58, 526, 480, 42, 25, C.green, true);
  addText(slide, "На скриншотах и в демо используются вымышленные данные. Реальных пользователей и выручки пока нет.", 58, 580, 1120, 52, 17, C.muted, false);
  footer(slide);
  addNotes(slide, ["Работающий MVP: https://pulseboard.sevadeva.tech/ru", "Read-only demo: https://pulseboard.sevadeva.tech/ru/demo", "Все demo/sample data являются вымышленными. У проекта пока нет реальных пользователей и выручки."]);
}

// 8. Monetization
{
  const slide = presentation.slides.add(); header(slide, 8, "Ценовая гипотеза", "Тарифы проверяются на пилотах. Они не являются действующим предложением.");
  const values = [
    ["", "Free", "Starter", "Pro"],
    ["Цена", "$0", "$19 / месяц", "$49 / месяц"],
    ["Команда", "1 workspace", "3 editor", "10 editor"],
    ["Сбор отзывов", "Публичная доска", "Доска + CSV import", "Доска + integrations"],
    ["AI", "Ограниченный анализ", "Themes и duplicates", "Расширенная аналитика"],
    ["Планирование", "Базовый roadmap", "Roadmap + changelog", "Custom domain"],
  ];
  const table = slide.tables.add({ rows: values.length, columns: 4, left: 58, top: 158, width: 1164, height: 350, columnTracks: [{ mode: "fr", value: 1.15 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }], values: tableValues(values, "pricing") });
  styleTable(table);
  [0, 1, 2, 3].forEach((c) => { table.getCell(1, c).text.style = c === 0 ? tableStyles.tableStrong : (c === 2 ? tableStyles.tablePriceAccent : tableStyles.tablePrice); });
  addText(slide, "Ориентир категории", 58, 552, 260, 24, 12, C.accent, true, mono);
  addText(slide, "Canny Pro: $79 / месяц при годовой оплате", 58, 586, 580, 38, 22, C.text, true);
  addText(slide, "Это внешний ценовой benchmark, а не прямой эквивалент Pulseboard.", 676, 586, 520, 42, 16, C.muted, false);
  footer(slide);
  addNotes(slide, ["Все тарифы Pulseboard являются гипотезой для проверки на пилотах.", "Canny pricing, проверено в сентябре 2026: https://canny.io/pricing", "На официальной странице Canny Pro указан от $79 в месяц при годовой оплате."]);
}

// 9. Financial model
{
  const slide = presentation.slides.add(); header(slide, 9, "Финансовая модель на три года", "Предварительный сценарий до налогов. Все значения являются гипотезами.");
  const chart = slide.charts.add("bar", {
    position: { left: 58, top: 160, width: 690, height: 390 },
    categories: ["Год 1", "Год 2", "Год 3"],
    series: [{ name: "ARR, $", values: [6840, 45000, 174000], fill: C.yellow }],
    barOptions: { direction: "column", grouping: "clustered", gapWidth: 55 },
    hasLegend: false,
    xAxis: { visible: true, textStyle: { typeface: sans, fontSize: 13, fill: C.muted }, line: { style: "solid", fill: C.line, width: 1 } },
    yAxis: { visible: true, numberFormatCode: "$#,##0", textStyle: { typeface: sans, fontSize: 11, fill: C.muted }, line: { style: "solid", fill: C.line, width: 1 }, majorGridlines: { style: "solid", fill: C.line, width: 1 } },
    dataLabels: { showValue: true, position: "outEnd", textStyle: { typeface: sans, fontSize: 13, fill: C.text, bold: true } },
    chartFill: C.bg, chartLine: { fill: C.bg, width: 0 }, plotAreaFill: C.bg, plotAreaLine: { fill: C.bg, width: 0 },
  });
  applyPresentationChartFont(chart, { fontFamily: sans });
  const values = [
    ["Показатель", "Год 1", "Год 2", "Год 3"],
    ["Платящие workspace", "30", "150", "500"],
    ["ARPA / месяц", "$19", "$25", "$29"],
    ["ARR", "$6,840", "$45,000", "$174,000"],
    ["Операционные расходы", "$5,000", "$36,000", "$132,000"],
    ["Результат до налогов", "$1,840", "$9,000", "$42,000"],
  ];
  const table = slide.tables.add({ rows: values.length, columns: 4, left: 786, top: 160, width: 436, height: 390, columnTracks: [{ mode: "fr", value: 1.5 }, { mode: "fr", value: .72 }, { mode: "fr", value: .72 }, { mode: "fr", value: .78 }], values: tableValues(values, "finance") });
  styleTable(table);
  for (let c = 0; c < 4; c += 1) { table.getCell(5, c).fill = C.elevated; table.getCell(5, c).text.style = c === 0 ? tableStyles.tableHeader : tableStyles.tableGreen; }
  addText(slide, "Формула: платящие workspace × средний доход с workspace × 12", 58, 584, 720, 28, 15, C.text, true, mono);
  addText(slide, "Расходы годов 2–3 включают продвижение, инфраструктуру, compensation founder-а и помощь подрядчиков.", 58, 622, 1110, 32, 13, C.muted, false);
  footer(slide);
  addNotes(slide, ["Финансовая модель предварительная и не является прогнозом или подтверждённым планом.", "Год 1: 30 * $19 * 12 = $6,840 ARR; $6,840 - $5,000 = $1,840.", "Год 2: 150 * $25 * 12 = $45,000 ARR; $45,000 - $36,000 = $9,000.", "Год 3: 500 * $29 * 12 = $174,000 ARR; $174,000 - $132,000 = $42,000."]);
}

// 10. Roadmap
{
  const slide = presentation.slides.add(); header(slide, 10, "Roadmap проверки гипотез", "Следующие этапы измеряются интервью, пилотами и платящими workspace.");
  const milestones = [
    ["СЕН 2026", "Стабильный RU MVP", "Русские маршруты, demo и конкурсные материалы"],
    ["ОКТ–НОЯ 2026", "3 бесплатных пилота", "10–15 интервью с founders"],
    ["ДЕК 2026", "Контур активации", "Email updates, onboarding и usage metrics"],
    ["Q1 2027", "Первые оплаты", "Billing и базовые integrations"],
    ["Q2–Q4 2027", "30 платящих команд", "Проверка аналитики и Pro-тарифа"],
  ];
  rule(slide, 110, 290, 1060, C.line, 3);
  milestones.forEach((item, index) => {
    const x = 70 + index * 235;
    const top = index % 2 === 0 ? 150 : 352;
    rect(slide, x + 66, 280, 18, 18, index === 0 ? C.yellow : C.accent, "none", 9);
    addText(slide, item[0], x, top, 180, 22, 11, index === 0 ? C.yellow : C.accent, true, mono, "center");
    addText(slide, item[1], x, top + 34, 180, 54, 20, C.text, true, sans, "center");
    addText(slide, item[2], x, top + 92, 180, 70, 13, C.muted, false, sans, "center");
  });
  addText(slide, "Критерий 2027", 58, 590, 180, 22, 11, C.green, true, mono);
  addText(slide, "30 команд регулярно используют продукт и подтверждают ценность оплатой", 250, 578, 900, 50, 26, C.text, true);
  footer(slide);
  addNotes(slide, ["Roadmap является планом проверки гипотез, а не обещанием результата.", "Ближайшая цель: 10-15 интервью и 3 бесплатных пилота в октябре-ноябре 2026."]);
}

// 11. Team and ask
{
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  addText(slide, "11", 58, 38, 50, 24, 12, C.accent, true, mono);
  addText(slide, "Команда и следующий шаг", 112, 31, 800, 52, 32, C.text, true);
  rule(slide, 58, 116, 1164, C.line);
  addText(slide, "Арсений Козел", 58, 162, 560, 70, 52, C.text, true);
  addText(slide, "Автор проекта и full-stack разработчик", 58, 238, 520, 34, 20, C.accent, true);
  addText(slide, "Самостоятельно спроектировал UX/UI, frontend, backend, AI pipeline и deployment Pulseboard. До проекта делал небольшие сайты и скрипты для личных задач.", 58, 306, 520, 128, 19, C.muted, false);
  addText(slide, "Цель участия", 682, 162, 250, 26, 13, C.yellow, true, mono);
  addText(slide, "Экспертная обратная связь", 682, 210, 500, 42, 27, C.text, true);
  addText(slide, "3 пилотные команды", 682, 278, 500, 42, 27, C.text, true);
  addText(slide, "Проверка готовности founders платить", 682, 346, 500, 72, 27, C.text, true);
  rule(slide, 58, 492, 1164, C.line);
  addText(slide, "Открыть работающий MVP", 58, 532, 480, 46, 30, C.text, true);
  addText(slide, "pulseboard.sevadeva.tech/ru", 58, 590, 530, 28, 18, C.green, true, mono);
  addText(slide, "Telegram", 682, 532, 180, 22, 12, C.accent, true, mono);
  addText(slide, "@Babushkaspa", 682, 572, 300, 34, 24, C.yellow, true, mono);
  addText(slide, "БГТУ · 2 курс · Минск", 682, 622, 300, 22, 13, C.muted, false);
  footer(slide, "Pulseboard · спасибо за внимание");
  addNotes(slide, ["Автор: Козел Арсений Михайлович", "БГТУ, 2 курс", "Telegram: https://t.me/Babushkaspa", "Работающий MVP: https://pulseboard.sevadeva.tech/ru", "Цель участия: экспертная обратная связь, три пилотные команды и проверка готовности founders платить."]);
}

const draftPath = path.join(buildDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(draftPath);
const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(buildDir, "montage.webp"), new Uint8Array(await montage.arrayBuffer()));
for (let i = 0; i < presentation.slides.length; i += 1) {
  const preview = await presentation.export({ slide: presentation.slides.getItemAt(i), format: "png", scale: 1 });
  await fs.writeFile(path.join(buildDir, `slide-${String(i + 1).padStart(2, "0")}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const requirements = {
  explicitTotalSlideCount: 11,
  requiredNativeTableOwnerSlides: [6, 7, 8, 9],
  requiredNativeChartOwnerSlides: [9],
  materializeLiteralChartWorkbooks: true,
};
const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath: draftPath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit", "--require-native-table-slide", "6", "--require-native-table-slide", "7", "--require-native-table-slide", "8", "--require-native-table-slide", "9"],
  requiredNativeTableOwnerSlides: requirements.requiredNativeTableOwnerSlides,
  requiredNativeChartOwnerSlides: requirements.requiredNativeChartOwnerSlides,
  materializeLiteralChartWorkbooks: true,
  fontPolicy: { basis: "user_request", families: [sans, mono] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "validation.json"),
});
console.log(JSON.stringify({ finalPath, result }, null, 2));
