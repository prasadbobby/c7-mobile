#!/usr/bin/env node
/**
 * Guards against React Native "Unexpected text node … cannot be a child of a <View>" errors.
 *  1. Raw JSX text outside <Txt>/<Text>.
 *  3. `key={item}` where `item` is the .map() value itself — duplicate values (two equal ticks,
 *     two identical labels) produce "two children with the same key". Key by id or index.
 *  2. `{x && <El/>}` inside a non-text element where `x` isn't clearly boolean —
 *     when x is '' or 0 React renders that value as a text node. Use `!!x &&` or a ternary.
 * Run: npm run check:jsx   (add --fix to rewrite `x &&` → `!!x &&`)
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOTS = ['app', 'src'];
const TEXT_TAGS = /^(Txt|Text|Animated\.Text|SvgText|TSpan|TextPath|Label|Headline|Numeral|L)$/;
const fix = process.argv.includes('--fix');

const files = [];
const walk = (d) => fs.existsSync(d) && fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(p) && files.push(p); });
ROOTS.forEach(walk);

const tagName = (n) => (n.type === 'JSXIdentifier' ? n.name : n.type === 'JSXMemberExpression' ? `${tagName(n.object)}.${n.property.name}` : '?');
const isBooleanish = (e) =>
  (e.type === 'UnaryExpression' && e.operator === '!') ||
  e.type === 'BooleanLiteral' ||
  (e.type === 'BinaryExpression' && ['===', '!==', '==', '!=', '<', '>', '<=', '>=', 'in', 'instanceof'].includes(e.operator)) ||
  (e.type === 'LogicalExpression' && isBooleanish(e.left) && isBooleanish(e.right)) ||
  (e.type === 'CallExpression' && e.callee.type === 'Identifier' && e.callee.name === 'Boolean') ||
  (e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && ['includes', 'some', 'every', 'has', 'startsWith', 'endsWith', 'test', 'isArray'].includes(e.callee.property.name)) ||
  (e.type === 'Identifier' && /^(is|has|can|should|show|open|visible|active|focused|loading|busy|done|ready|selected|editing|enabled|disabled|compact|signedIn|isToday)/.test(e.name)) ||
  (e.type === 'MemberExpression' && !e.computed && /^(is|has|can|show|open|visible|active|isLoading|isError|isFetching|isPending|isFetchingNextPage|hasNextPage|enabled|liked|saved|done|completed|ready)/.test(e.property.name));

let problems = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const edits = [];
  const keyEdits = [];
  traverse(ast, {
    JSXText(p) {
      const parent = p.parentPath.node;
      if (!p.node.value.trim() || parent.type !== 'JSXElement') return;
      if (TEXT_TAGS.test(tagName(parent.openingElement.name))) return;
      problems++; console.log(`${file}:${p.node.loc.start.line}  raw text ${JSON.stringify(p.node.value.trim())} inside <${tagName(parent.openingElement.name)}>`);
    },
    JSXAttribute(p) {
      if (p.node.name.name !== 'key' || p.node.value?.type !== 'JSXExpressionContainer') return;
      const e = p.node.value.expression;
      if (e.type !== 'Identifier') return;
      const fn = p.getFunctionParent();
      const call = fn?.parentPath;
      if (!fn || !call?.isCallExpression() || call.node.callee.type !== 'MemberExpression' || call.node.callee.property.name !== 'map') return;
      const first = fn.node.params[0];
      if (first?.type === 'Identifier' && first.name === e.name) {
        problems++;
        keyEdits.push({ fn: fn.node, key: e, src });
        console.log(`${file}:${e.loc.start.line}  key={${e.name}} uses the mapped value itself — duplicates crash keys; use an id or the index`);
      }
    },
    JSXExpressionContainer(p) {
      const parent = p.parentPath.node;
      if (parent.type !== 'JSXElement' || TEXT_TAGS.test(tagName(parent.openingElement.name))) return;
      const e = p.node.expression;
      if (e.type !== 'LogicalExpression' || e.operator !== '&&' || isBooleanish(e.left)) return;
      // Objects/arrays from queries are fine; only flag when the left side could be a string/number.
      problems++; edits.push(e.left);
      console.log(`${file}:${e.loc.start.line}  \`${src.slice(e.left.start, e.left.end)} && …\` inside <${tagName(parent.openingElement.name)}> — use !!(…) or a ternary`);
    },
  });
  if (fix && keyEdits.length) {
    // key={item} → key={`${item}-${index}`} (adds an index parameter when the callback has none).
    const ops = [];
    for (const { fn, key } of keyEdits) {
      let idx = fn.params[1]?.type === 'Identifier' ? fn.params[1].name : null;
      if (!idx) {
        idx = 'keyIdx';
        const p0 = fn.params[0];
        const parens = src[p0.start - 1] === '(';
        if (parens) ops.push([p0.end, p0.end, `, ${idx}`]);
        else ops.push([p0.start, p0.end, `(${p0.name}, ${idx})`]);
      }
      ops.push([key.start, key.end, `\`\${${key.name}}-\${${idx}}\``]);
    }
    let out = src;
    const seen = new Set();
    for (const [a, b, r] of ops.sort((x, y) => y[0] - x[0])) {
      const k = `${a}:${b}:${r}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out = out.slice(0, a) + r + out.slice(b);
    }
    fs.writeFileSync(file, out);
    continue;
  }
  if (fix && edits.length) {
    let out = src;
    for (const l of edits.sort((a, b) => b.start - a.start)) {
      const t = src.slice(l.start, l.end);
      const simple = ['Identifier', 'MemberExpression', 'OptionalMemberExpression'].includes(l.type);
      out = out.slice(0, l.start) + (simple ? `!!${t}` : `!!(${t})`) + out.slice(l.end);
    }
    fs.writeFileSync(file, out);
  }
}
if (problems && !fix) { console.error(`\n✖ ${problems} JSX risk(s) (text nodes / duplicate keys). Run: npm run check:jsx -- --fix`); process.exit(1); }
console.log(fix ? `Fixed ${problems} expression(s).` : '✓ No JSX text-node or duplicate-key risks.');
