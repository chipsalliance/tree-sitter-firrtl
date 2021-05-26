'use strict';

function optseq() {
  return optional(prec.left(seq.apply(null, arguments)));
}

function repseq() {
  return repeat(prec.left(seq.apply(null, arguments)));
}

function sep1(separator, rule) {
  return prec.left(seq(
    rule,
    repeat(prec.left(seq(separator, rule)))
  ));
}

const rules = {

  source_file: $ => repeat($.circuit),

  circuit: $ => seq(
    'circuit', $.id, ':', optional($.info),
    optseq($._indent, repeat($.module))
  ),

  module: $ => choice(
    seq(
      'module', $.id, ':', optional($.info),
      optseq(
        $._indent,
        repeat($.port),
        repeat($.simple_stmt),
        $._dedent
      )
    ),
    seq(
      'extmodule', $.id, ':', optional($.info),
      optseq(
        $._indent,
        repeat($.port),
        optional($.defname),
        repeat($.parameter),
        $._dedent
      )
    )
  ),

  port: $ => seq(
    $.dir, $.id, ':', $.type, optional($.info), $._newline
  ),

  dir: $ => choice('input', 'output'),

  type: $ => choice(
    seq(
      choice('UInt', 'SInt', 'Analog'),
      optseq('<', $.intLit, '>')
    ),
    seq(
      'Fixed',
      optseq('<', $.intLit, '>'),
      optseq('<', '<', $.intLit, '>', '>')
    ),
    'Clock',
    'AsyncReset',
    'Reset',
    seq('{', optional(sep1(',', $.field)), '}'), // Bundle  // no commas in ANTLR
    seq($.type, '[', $.intLit, ']')   // Vector
  ),

  field: $ => seq(optional('flip'), $.fieldId, ':', $.type),

  defname: $ => seq('defname', '=', $.id, $._newline),

  parameter: $ => seq('parameter', $.id,
    '=',
    choice(
      $.intLit,
      $.StringLit,
      $.DoubleLit,
      $.RawString
    ),
    $._newline
  ),

  simple_stmt: $ => $.stmt, // choice($.stmt, $._newline),

  simple_reset0: $ => seq('reset', '=>', '(', $.exp, ',', $.exp, ')'),

  simple_reset: $ => choice(
    $.simple_reset0,
    seq('(', $.simple_reset0, ')')
  ),

  reset_block: $ => choice(
    seq($._indent, $.simple_reset, optional($.info), $._newline, $._dedent),
    seq('(', $.simple_reset, ')')
  ),

  stmt: $ => choice(
    $.wire,
    $.cmem,
    $.smem,
    $.reg,
    $.mem,
    seq($.mdir, 'mport', $.id, '=', $.id, '[', $.exp, ']', ',', $.exp, optional($.info)),
    $.inst,
    $.node,
    seq($.exp, '<=', $.exp, optional($.info)),
    seq($.exp, '<-', $.exp, optional($.info)),
    seq($.exp, 'is', 'invalid', optional($.info)),
    $.when,
    $.stop,
    $.printf,
    $.verif,
    $.skip,
    $.attach
  ),

  wire: $ => seq('wire', $.id, ':', $.type, optional($.info)),

  cmem: $ => seq('cmem', $.id, ':', $.type, optional($.info)),

  smem: $ => seq('smem', $.id, ':', $.type, optional($.info)),

  reg: $ => seq('reg', $.id, ':', $.type, ',', $.exp,
    optseq('with', ':', $.reset_block), // no comma in ANTLR
    optional($.info)
  ),

  mem: $ => seq('mem', $.id, ':', optional($.info),
    $._indent, repeat($.memField), $._dedent),

  inst: $ => seq('inst', $.id, 'of', $.id, optional($.info)),

  node: $ => seq('node', $.id, '=', $.exp, optional($.info)),

  memField: $ => seq(
    choice(
      seq('data-type', '=>', $.type),
      seq(
        choice('depth', 'read-latency', 'write-latency'),
        '=>', $.intLit
      ),
      seq('read-under-write', '=>', $.ruw),
      seq(choice('reader', 'writer', 'readwriter'), '=>', sep1(',', $.id))
    ),
    $._newline
  ),

  suite: $ => choice(
    $.simple_stmt,
    seq($._indent, repeat1($.simple_stmt), $._dedent)
  ),

  when: $ => prec.left(seq(
    'when',
    $.exp,
    ':',
    optional($.info),
    $.suite,
    optseq(
      'else',
      choice(
        $.when,
        seq(
          ':',
          optional($.info),
          $.suite
        )
      )
    )
  )),

  stop: $ => seq('stop', '(', $.exp, ',', $.exp, ',', $.intLit, ')', optional($.info)),

  printf: $ => seq(
    'printf',
    '(',
    $.exp, ',',
    $.exp, ',',
    $.StringLit,
    repseq(',', $.exp),
    ')',
    optional($.info)
  ),

  verif: $ => seq(
    choice('assert', 'assume', 'cover'),
    '(',
    $.exp, ',',
    $.exp, ',',
    $.exp, ',',
    $.StringLit,
    ')'
  ),

  skip: $ => seq('skip', optional($.info)),

  attach: $ => seq('attach', '(', sep1(',', $.exp, ')'), optional($.info)),

  info: $ =>  /@\[.*\]/, // $.FileInfo,

  mdir: $ => choice('infer', 'read', 'write', 'rdwr'),

  ruw: $ => choice('old', 'new', 'undefined'),

  litType: $ => seq(
    choice('UInt', 'SInt'),
    optseq('<', $.intLit, '>')
  ),

  exp: $ => choice(
    seq($.litType, '(', $.intStrLit, ')'),
    $.id,     // Ref
    seq($.exp, '.', $.fieldId),
    seq($.exp, '.', $.DoubleLit), // TODO Workaround for #470
    seq($.exp, '[', $.intLit, ']'),
    seq($.exp, '[', $.exp, ']'),
    seq('mux', '(', $.exp, ',', $.exp, ',', $.exp, ')'), // no commas in ANTLR
    seq('validif', '(', $.exp, ',', $.exp, ')'),
    seq($.primop, '(', sep1(',', choice($.exp, $.intLit)), ')') // no commas in ANTLR
  ),

  // id: $ => $.Id, // /[a-zA-Z_]\w*/,

  fieldId: $ => choice(
    $.id, // $.Id,
    $.RelaxedId,
    $.UnsignedInt
    // $.keywordAsId
  ),

  intLit: $ => choice(
    $.UnsignedInt,
    $.SignedInt
  ),

  intStrLit: $ => choice(
    $.UnsignedInt,
    $.SignedInt,
    $.BinLit,
    $.OctLit,
    $.HexLit
  ),

  primop: $ => choice(
    'add',
    'sub',
    'mul',
    'div',
    'rem',
    'lt',
    'leq',
    'gt',
    'geq',
    'eq',
    'neq',
    'pad',
    'asUInt',
    'asAsyncReset',
    'asSInt',
    'asClock',
    'shl',
    'shr',
    'dshl',
    'dshlw',
    'dshr',
    'dshrw',
    'cvt',
    'neg',
    'not',
    'and',
    'or',
    'xor',
    'andr',
    'orr',
    'xorr',
    'cat',
    'bits',
    'head',
    'tail',
    'asFixedPoint',
    'bpshl',
    'bpshr',
    'bpset'
  ),

  // Tokens

  UnsignedInt: $ => choice('0', /[1-9][0-9]*/),

  SignedInt: $ => seq(choice('+', '-'), /[1-9][0-9]*/),

  // PosInt: $ => /[1-9][0-9]*/,

  HexLit: $ => /"h[+-]?[a-fA-F0-9]+"/,

  OctLit: $ => /"o[+-]?[0-7]+"/,

  BinLit: $ => /"b[+-]?[01]+"/,

  DoubleLit: $ => /[+-]*[0-9]+\.[0-9]+(E[+-]?[0-9]+)?/,

  StringLit: $ => /"([\x09\x20\x21\x23-\xFE]|\\")*"/,

  RawString: $ => /'[^\\']*'/,

  FileInfo: $ => /@\[.*\]/,

  // Id: $ => /[a-zA-Z_][a-zA-Z0-9$]*/, // LegalStartChar (LegalIdChar)*
  id: $ => /[a-zA-Z_][a-zA-Z0-9_$]*/, // LegalStartChar (LegalIdChar)*

  RelaxedId: $ => /[a-zA-Z0-9_$]+/, // (LegalIdChar)+

  comment: $ => token(
    seq(';', /.*/)
  )

};

module.exports = grammar({
  name: 'firrtl',
  word: $ => $.id,
  rules: rules,
  extras: $ => [/\s/, $.comment],
  externals: $ => [
    $._newline,
    $._indent,
    $._dedent
  ]
});

/* eslint camelcase: 0 */
/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
