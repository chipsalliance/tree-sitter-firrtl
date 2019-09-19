'use strict';

const rules = {

  source_file: $ => repeat($.circuit),

  circuit: $ => seq(
    'circuit', $.id, ':', optional($.info),
    optional(seq($._indent, repeat($.module)))
  ),

  module: $ => choice(
    seq(
      'module', $.id, ':', optional($.info),
      optional(seq(
        $._indent,
        repeat($.port),
        repeat($.simple_stmt),
        $._dedent
      ))
    )
    // TODO
    // seq(
    //   'extmodule', $.id, ':', optional($.info),
    //   INDENT, repeat($.port), optional($.defname), optional($.parameter), DEDENT
    // )
  ),

  port: $ => seq(
    $.dir, $.id, ':', $.type, optional($.info), $._newline
  ),

  dir: $ => choice('input', 'output'),

  type: $ => choice(
    seq(
      choice('UInt', 'SInt', 'Analog'),
      optional(seq('<', $.intLit, '>'))
    ),
    seq(
      'Fixed',
      optional(seq('<', $.intLit, '>')),
      optional(seq('<', '<', $.intLit, '>', '>'))
    ),
    'Clock',
    'AsyncReset',
    'Reset',
    seq('{', repeat($.field), '}'),   // Bundle
    seq($.type, '[', $.intLit, ']')   // Vector
  ),

  field: $ => seq(optional('flip'), $.fieldId, ':', $.type),

  simple_stmt: $ => seq($.stmt, $._newline),

  stmt: $ => choice(
    seq('wire', $.id, $.type, optional($.info))
    // TODO
  ),

  info: $ =>  $.id, // FIXME FileInfo,

  id: $ => /[a-zA-Z_]\w*/,

  fieldId: $ => choice(
    $.id // FIXME
    // $.Id,
    // $.RelaxedId,
    // $.UnsignedInt,
    // $.keywordAsId
  ),

  intLit: $ => choice(
    /[0-9]+/ // FIXME
    // $.UnsignedInt,
    // $.SignedInt,
    // $.HexLit
  ),

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
