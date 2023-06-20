// ------------------------------------------------------------------------------------------------
// Copyright © 2023 Aliaksei Chapyzhenka <alex.drom@gmail.com>, Amaan Qureshi <amaanq12@gmail.com>,
// Andrew Young <youngar17@gmail.com>
// See the LICENSE file in this repo for license details.
// ------------------------------------------------------------------------------------------------

//! This crate provides FIRRTL language support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [language][language func] function to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! let code = "";
//! let mut parser = tree_sitter::Parser::new();
//! parser.set_language(tree_sitter_firrtl::language()).expect("Error loading FIRRTL grammar");
//! let tree = parser.parse(code, None).unwrap();
//! ```
//!
//! [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
//! [language func]: fn.language.html
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter::Language;

extern "C" {
    fn tree_sitter_firrtl() -> Language;
}

/// Get the tree-sitter [Language][] for this grammar.
///
/// [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
pub fn language() -> Language {
    unsafe { tree_sitter_firrtl() }
}

/// The source of the Rust tree-sitter grammar description.
pub const GRAMMAR: &str = include_str!("../../grammar.js");

/// The folds query for this language.
pub const FOLDS_QUERY: &str = include_str!("../../queries/folds.scm");

/// The syntax highlighting query for this language.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

/// The indents query for this language.
pub const INDENTS_QUERY: &str = include_str!("../../queries/indents.scm");

/// The injection query for this language.
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

/// The symbol tagging query for this language.
pub const LOCALS_QUERY: &str = include_str!("../../queries/locals.scm");

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(super::language())
            .expect("Error loading FIRRTL grammar");
    }

    #[test]
    fn test_can_parse_grammar() {
        let mut parser = tree_sitter::Parser::new();
        let source_code = "circuit Adder :\n\tmodule Adder :\n\t\tinput clock: Clock\n\t\tskip";
        parser
            .set_language(super::language())
            .expect("Error loading FIRRTL grammar");
        let tree = parser.parse(source_code, None).unwrap();
        let root_node = tree.root_node();
        assert_eq!(root_node.to_sexp(), "(source_file (circuit (identifier) (module (identifier) (port (dir) (identifier) (type)) (skip))))");
    }
}
