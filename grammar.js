'use strict';

const rules = {

  source_file: $ => repeat($.circuit),

  circuit: $ => seq(
    'circuit', $.id, ':'
    // optional($.info), INDENT, prepeat1($.module), DEDENT
  ),

  // module: $ => choce(
  //   seq(   'module', $.id, ':', optional($.info), INDENT, repeat($.port), $.moduleBlock, DEDENT),
  //   seq('extmodule', $.id, ':', optional($.info), INDENT, repeat($.port), optional($.defname), optional($.parameter), DEDENT)
  // ),
  //
  // info: $ =>  $.FileInfo,

  id: $ => /[a-zA-Z_]\w*/,

  comment: $ => token(
    seq(';', /.*/)
  )

};

module.exports = grammar({
  name: 'firrtl',
  word: $ => $.id,
  rules: rules,
  extras: $ => [/\s/, $.comment]
});

/* eslint camelcase: 0 */
/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
