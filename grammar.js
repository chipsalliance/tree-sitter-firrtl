/**
 * @file FIRRTL grammar for tree-sitter
 * @author Aliaksei Chapyzhenka <alex.drom@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @author Andrew Young <youngar17@gmail.com>
 * @license Apache-2.0
 * @see {@link https://www.chisel-lang.org/firrtl|official website}
 * @see {@link https://github.com/chipsalliance/firrtl|official repository}
 * @see {@link https://github.com/chipsalliance/firrtl-spec|official spec}
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

'use strict';

/**
  * Creates a rule to match one or more of the rules separated by the separator
  *
  * @param {string} sep - The separator to use.
  * @param {Rule} rule
  *
  * @return {SeqRule}
  *
  */
function sep1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

module.exports = grammar({
  name: 'firrtl',

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent
  ],

  extras: $ => [
    $.comment,
    /\s/
  ],

  inline: $ => [
    $.keyword_identifier
  ],

  supertypes: $ => [
    $.expression,
    $.statement
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.circuit),

    circuit: $ => seq(
      'circuit', $.identifier, ':', optional($.info),
      optional(seq($._indent, repeat($.module), $._dedent))
    ),

    module: $ => choice(
      seq(
        'module', $.identifier, ':', optional($.info),
        optional(seq(
          $._indent,
          repeat($.port),
          repeat($.statement),
          $._dedent
        ))
      ),
      seq(
        'extmodule', $.identifier, ':', optional($.info),
        optional(seq(
          $._indent,
          repeat($.port),
          optional($.defname),
          repeat($.parameter),
          $._dedent
        ))
      )
    ),

    port: $ => seq(
      $.dir, $.identifier, ':', optional($.qualifier), $.type, optional($.info), $._newline
    ),

    dir: _ => choice('input', 'output'),

    qualifier: _ => choice('const'),

    type: $ => choice(
      seq(
        choice('UInt', 'SInt', 'Analog'),
        optional(seq('<', $.number, '>'))
      ),
      seq(
        'Fixed',
        optional(seq('<', $.number, '>')),
        optional(seq('<', '<', $.number, '>', '>'))
      ),
      'Clock',
      'AsyncReset',
      'Reset',
      seq('{', optional(sep1(',', $.field)), '}'), // Bundle  // no commas in ANTLR
      seq($.type, '[', $.number, ']') // Vector
    ),

    field: $ => seq(optional('flip'), $.field_id, ':', $.type),

    defname: $ => seq('defname', '=', $.identifier, $._newline),

    parameter: $ => seq(
      'parameter', $.identifier,
      '=',
      choice(
        $.number,
        $.string,
        $.double,
        $.raw_string
      ),
      $._newline
    ),

    _reset: $ => seq('reset', '=>', '(', $.expression, ',', $.expression, ')'),

    reset: $ => choice(
      $._reset,
      seq('(', $._reset, ')')
    ),

    reset_block: $ => choice(
      seq($._indent, $.reset, optional($.info), $._newline, $._dedent),
      seq('(', $.reset, ')')
    ),

    statement: $ => choice(
      $.wire,
      $.cmem,
      $.smem,
      $.register,
      $.memory,
      $.rdwr,
      $.inst,
      $.node,
      $.connection,
      $.partial_connection,
      $.is_invalid,
      $.when,
      $.stop,
      $.printf,
      $.verif,
      $.skip,
      $.attach
    ),

    wire: $ => seq('wire', $.identifier, ':', $.type, optional($.info)),

    cmem: $ => seq('cmem', $.identifier, ':', $.type, optional($.info)),

    smem: $ => seq('smem', $.identifier, ':', $.type, optional($.info)),

    register: $ => seq(
      'reg', $.identifier, ':', $.type, ',', $.expression,
      optional(seq('with', ':', $.reset_block)), // no comma in ANTLR
      optional($.info)
    ),

    memory: $ => seq(
      'mem', $.identifier, ':', optional($.info),
      $._indent, repeat($.memory_field), $._dedent
    ),

    rdwr: $ => seq(
      $.mdir, 'mport', $.identifier,
      '=',
      $.identifier, '[', $.expression, ']', ',', $.expression,
      optional($.info)
    ),

    inst: $ => seq('inst', $.identifier, 'of', $.identifier, optional($.info)),

    node: $ => seq('node', $.identifier, '=', $.expression, optional($.info)),

    connection: $ => seq($.expression, '<=', $.expression, optional($.info)),

    partial_connection: $ => seq($.expression, '<-', $.expression, optional($.info)),

    is_invalid: $ => seq($.expression, 'is', 'invalid', optional($.info)),

    memory_field: $ => seq(
      choice(
        seq('data-type', '=>', $.type),
        seq(
          choice('depth', 'read-latency', 'write-latency'),
          '=>', $.number
        ),
        seq('read-under-write', '=>', $.ruw),
        seq(choice('reader', 'writer', 'readwriter'), '=>', sep1(',', $.identifier))
      ),
      $._newline
    ),

    suite: $ => choice(
      $.statement,
      seq($._indent, repeat1($.statement), $._dedent)
    ),

    when: $ => prec.right(seq(
      'when',
      $.expression,
      ':',
      optional($.info),
      optional($.suite),
      optional($.else)
    )),
    else: $ => seq(
      'else',
      choice(
        $.when,
        seq(':', optional($.info), $.suite)
      )
    ),

    stop: $ => seq('stop', '(', $.expression, ',', $.expression, ',', $.number, ')', optional($.info)),

    printf: $ => seq(
      'printf',
      '(',
      $.expression, ',',
      $.expression, ',',
      $.string,
      repeat(seq(',', $.expression)),
      ')',
      optional($.info)
    ),

    verif: $ => seq(
      choice('assert', 'assume', 'cover'),
      '(',
      $.expression, ',',
      $.expression, ',',
      $.expression, ',',
      $.string,
      ')'
    ),

    skip: $ => seq('skip', optional($.info)),

    attach: $ => seq('attach', '(', sep1(',', $.expression), ')', optional($.info)),

    info: _ => /@\[.*\]/, // $.FileInfo,

    mdir: _ => choice('infer', 'read', 'write', 'rdwr'),

    ruw: _ => choice('old', 'new', 'undefined'),

    litType: $ => seq(
      choice('UInt', 'SInt'),
      optional(seq('<', $.number, '>'))
    ),

    expression: $ => choice(
      $.literal,
      $.identifier,
      $.keyword_identifier,
      $.sub_field,
      $.sub_index,
      $.sub_access,
      $.mux,
      $.conditionally_valid,
      $.primitive_operation
    ),

    literal: $ => seq($.litType, '(', choice($.number, $.number_str), ')'),

    sub_field: $ => seq($.expression, '.', $.field_id),

    sub_index: $ => seq($.expression, '[', $.number, ']'),

    sub_access: $ => seq($.expression, '[', $.expression, ']'),

    mux: $ => seq('mux', '(', $.expression, ',', $.expression, ',', $.expression, ')'), // no commas in ANTLR

    conditionally_valid: $ => seq('validif', '(', $.expression, ',', $.expression, ')'),

    primitive_operation: $ => seq($.primop, '(', sep1(',', choice($.expression, $.number)), ')'), // no commas in ANTLR

    field_id: $ => choice(
      $.identifier,
      $.relaxed_identifier,
      $.uint
    ),

    primop: _ => choice(
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

    uint: _ => choice('0', /[1-9][0-9]*/),

    sint: _ => seq(choice('+', '-'), /[1-9][0-9]*/),

    number: $ => alias(choice($.uint, $.sint), $.number),

    number_str: _ => {
      const hex = /"h[+-]?[a-fA-F0-9]+"/;

      const octal = /"o[+-]?[0-7]+"/;

      const binary = /"b[+-]?[01]+"/;

      return token(choice(
        hex,
        octal,
        binary
      ));
    },

    double: _ => /[+-]*[0-9]+\.[0-9]+(E[+-]?[0-9]+)?/,

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $._escape_sequence
      )),
      '"'
    ),

    raw_string: $ => seq(
      '\'',
      repeat(choice(
        alias($.raw_string_content, $.string_content),
        $._escape_sequence
      )),
      '\''
    ),

    string_content: _ => token(prec(-1, /[^"\\]+/)),
    raw_string_content: _ => token(prec(-1, /[^'\\]+/)),

    _escape_sequence: $ =>
      choice(
        prec(2, token.immediate(seq('\\', /[^abfnrtvxu'"\\?]/))),
        prec(1, $.escape_sequence)
      ),
    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u{[0-9a-fA-F]+}/
      ))),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_$]*/, // LegalStartChar (LegalIdChar)*
    relaxed_identifier: _ => /[a-zA-Z0-9_$]+/, // (LegalIdChar)+
    keyword_identifier: $ => prec(-3, alias(
      choice(
        $.primop,
        'mux'
      ),
      $.identifier
    )),

    comment: _ => token(seq(';', /.*/))
  }
});
