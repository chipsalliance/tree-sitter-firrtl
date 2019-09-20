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
        optional($.parameter),
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

  parameter: $ => seq(
    'parameter', $.id, '=',
    choice(
      $.intLit,
      $.StringLit,
      $.DoubleLit,
      $.RawString
    ),
    $._newline
  ),

  simple_stmt: $ => seq($.stmt, $._newline),

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
    seq(
      choice('wire', 'cmem', 'smem'),
      $.id, ':', $.type,
      optional($.info)
    ),
    seq('reg',
      $.id, ':', $.type, ',', $.exp, optseq('with', ':', $.reset_block), // no comma in ANTLR
      optional($.info)
    ),
    seq('mem', $.id, ':', optional($.info), $._indent, repeat($.memField), $._dedent),
    seq($.mdir, 'mport', $.id, '=', $.id, '[', $.exp, ']', ',', $.exp, optional($.info)),
    seq('inst', $.id, 'of', $.id, optional($.info)),
    seq('node', $.id, '=', $.exp, optional($.info)),
    seq($.exp, '<=', $.exp, optional($.info)),
    seq($.exp, '<-', $.exp, optional($.info)),
    seq($.exp, 'is', 'invalid', optional($.info)),
    $.when,
    seq('stop', '(', $.exp, ',', $.exp, ',', $.intLit, ')', optional($.info)),
    seq('printf', '(', $.exp, ',', $.exp, ',', $.StringLit, repseq(',', $.exp), ')', optional($.info)),
    seq('skip', optional($.info)),
    seq('attach', '(', sep1(',', $.exp, ')'), optional($.info))
  ),

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

  when: $ => seq(
    'when', $.exp, ':', optional($.info),
    optional($.suite),
    optseq('else',
      choice($.when,
        seq(':', optional($.info), optional($.suite))
      )
    )
  ),

  info: $ =>  $.FileInfo,

  mdir: $ => choice('infer', 'read', 'write', 'rdwr'),

  ruw: $ => choice('old', 'new', 'undefined'),

  exp: $ => choice(
    seq('UInt', optseq('<', $.intLit, '>'), '(', $.intLit, ')'),
    seq('SInt', optseq('<', $.intLit, '>'), '(', $.intLit, ')'),
    $.id,     // Ref
    seq($.exp, '.', $.fieldId),
    seq($.exp, '.', $.DoubleLit), // TODO Workaround for #470
    seq($.exp, '[', $.intLit, ']'),
    seq($.exp, '[', $.exp, ']'),
    seq('mux(', $.exp, ',', $.exp, ',', $.exp, ')'), // no commas in ANTLR
    seq('validif', '(', $.exp, ',', $.exp, ')'),
    seq($.primop, '(', sep1(',', choice($.exp, $.intLit)), ')') // no commas in ANTLR
  ),

  id: $ => /[a-zA-Z_]\w*/,

  fieldId: $ => choice(
    $.id // FIXME
    // $.Id,
    // $.RelaxedId,
    // $.UnsignedInt,
    // $.keywordAsId
  ),

  intLit: $ => choice(
    $.UnsignedInt,
    $.SignedInt,
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
    'dshr',
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

  UnsignedInt: $ => choice('0', $.PosInt),

  SignedInt: $ => seq(choice('+', '-'), $.PosInt),

  PosInt: $ => /[1-9][0-9]*/,

  HexLit: $ => /"h[+-]?[a-fA-F0-9]+"/,

  DoubleLit: $ => /[+-]*[0-9]+\.[0-9]+(E[+-]?[0-9]+)?/,

  StringLit: $ => seq('"', /([\x09\x20\x21\x23-\xFE]|\\")*/, '"'),

  RawString: $ => /'[^\\']*'/,

  FileInfo: $ => /@\[.*\]/,

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
