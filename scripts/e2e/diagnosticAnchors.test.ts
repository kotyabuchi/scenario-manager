import { isNil } from 'ramda';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  createDiagnosticAnchors,
  diagnosticSyntaxHash,
} from './diagnosticAnchors';
import { createSourceFixture } from './fixtures/createSource';
import { diagnosticAnchorSchema } from './inventorySchema';
import { createSourceIndex } from './sourceIndex';

const expression = (text: string) => {
  const source = ts.createSourceFile(
    'sample.ts',
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const statement = source.statements[0];
  if (isNil(statement) || !ts.isExpressionStatement(statement))
    throw new Error('式を指定してください。');
  return statement.expression;
};
const hash = (text: string) => diagnosticSyntaxHash(expression(text));

const callFixture = (text: string) => {
  const context = createSourceFixture({ 'src/sample.ts': text });
  const calls: ts.CallExpression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'missing')
      calls.push(node);
    ts.forEachChild(node, visit);
  };
  for (const file of context.files) visit(file.sourceFile);
  const first = calls[0];
  const second = calls[1];
  if (isNil(first) || isNil(second))
    throw new Error('呼出を2つ指定してください。');
  return {
    first,
    second,
    anchor: createDiagnosticAnchors(createSourceIndex(context)),
  };
};

describe('diagnosticSyntaxHash', () => {
  it('行・コメント・引用符・空白・末尾comma・終端semicolonの整形差を除く', () => {
    const before = "missing({value:'a  b'}, [1,2], () => { return 1 })";
    const after = `
      // 表示位置だけを動かす
      missing(
        /* 値の間のコメント */ { value: "a  b", },
        [1, 2,],
        () => {
          /** 関数本文のコメント */
          return 1;
        },
      );
    `;
    expect(hash(after)).toBe(hash(before));
  });

  it('型memberのseparator整形でも構文hashを維持する', () => {
    expect(hash('missing<{ value: string, }>({ value: "a" })')).toBe(
      hash("missing<{ value: string; }>({ value: 'a' })"),
    );
  });

  it.each([
    ['missing(value)', 'other(value)'],
    ['missing(value)', 'missing(other)'],
    ["missing('a b')", "missing('a  b')"],
    ['missing(/a b/)', 'missing(/a  b/)'],
    ['missing(/a b/i)', 'missing(/a b/g)'],
    ['missing(`a b`)', 'missing(`a  b`)'],
    [`missing(\`a \${value} b\`)`, `missing(\`a \${value}  b\`)`],
    [`missing(\`a \${value} b\`)`, `missing(\`a \${other} b\`)`],
    ['missing(String.raw`a\\nb`)', 'missing(String.raw`a\nb`)'],
    ['missing?.(value)', 'missing(value)'],
    ['missing([,])', 'missing([])'],
    ['missing([1,,])', 'missing([1,])'],
    ['missing((left,right))', 'missing([left,right])'],
    ['missing(() => { const value = 1 })', 'missing(() => { let value = 1 })'],
    ['missing(() => { for (a;b;) {} })', 'missing(() => { for (;a;b) {} })'],
  ])('構文・値の変更を区別する: %s', (before, after) => {
    expect(hash(after)).not.toBe(hash(before));
  });

  it('import宣言の参照先とtype-only属性を保持する', () => {
    const importHash = (text: string) => {
      const source = ts.createSourceFile(
        'sample.ts',
        text,
        ts.ScriptTarget.Latest,
        true,
      );
      const node = source.statements[0];
      if (isNil(node)) throw new Error('importを指定してください。');
      return diagnosticSyntaxHash(node);
    };
    const before = importHash("import { value } from './missing'");
    expect(importHash('import {value,} from "./missing";')).toBe(before);
    expect(importHash("import { value } from './another'")).not.toBe(before);
    expect(importHash("import { type value } from './missing'")).not.toBe(
      before,
    );
    expect(hash("import('./missing')")).not.toBe(hash("import('./another')"));
  });
});

describe('createDiagnosticAnchors', () => {
  it('同じnode/codeの再通知は同一anchorで、別の同一構文だけoccurrenceを増やす', () => {
    const { first, second, anchor } = callFixture(`
      export function run() { missing('a'); missing('a'); }
    `);
    const original = anchor(first, 'UNRESOLVED_CALL');
    expect(anchor(first, 'UNRESOLVED_CALL')).toBe(original);
    expect(anchor(first, 'OTHER_CODE').occurrence).toBe(0);
    expect(anchor(second, 'UNRESOLVED_CALL')).toEqual({
      ...original,
      occurrence: 1,
    });
    expect(original.ownerId).toBe('function:src/sample.ts#run');
    expect(diagnosticAnchorSchema.parse(original)).toEqual(original);
  });

  it('未登録の匿名関数を越えて最寄りの安定関数IDを所有者にする', () => {
    const { first, second, anchor } = callFixture(`
      export function run() {
        missing('a');
        queue(() => { missing('a'); });
      }
    `);
    expect(anchor(first, 'CALL').ownerId).toBe('function:src/sample.ts#run');
    expect(anchor(second, 'CALL')).toEqual({
      ...anchor(first, 'CALL'),
      occurrence: 1,
    });
  });

  it('同一構文でも所有関数が変われば別anchorで各連番は0から始まる', () => {
    const { first, second, anchor } = callFixture(`
      export function first() { missing('a'); }
      export function second() { missing('a'); }
    `);
    const left = anchor(first, 'CALL');
    const right = anchor(second, 'CALL');
    expect(left.ownerId).not.toBe(right.ownerId);
    expect(left.syntaxHash).toBe(right.syntaxHash);
    expect([left.occurrence, right.occurrence]).toEqual([0, 0]);
  });

  it('関数IDのない呼出はmoduleへ所属し、未登録sourceへanchorを捏造しない', () => {
    const { first, second, anchor } = callFixture(
      "missing('a'); missing('a');",
    );
    expect(anchor(first, 'CALL').ownerId).toBe('module:src/sample.ts');
    expect(anchor(second, 'CALL').occurrence).toBe(1);
    expect(() => anchor(expression("missing('a')"), 'CALL')).toThrow(
      '抽出対象外',
    );
  });
});
