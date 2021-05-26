;;; Highlighting for firrtl

; circuit
(circuit "circuit" @keyword.function)

; module 
(module
["module"
"extmodule"] @keyword.function)
(port (dir) @keyword)

; extmodule
(parameter "parameter" @keyword)
(defname "defname" @keyword)

; mem
(mdir) @keyword
(mem "mem" @keyword)
(memField) @keyword
(ruw) @keyword

; wire
(wire "wire" @keyword)

; cmem
(cmem "cmem" @keyword)

; smem
(smem "smem" @keyword)

; reg
(reg ["reg" "with"] @keyword)
(simple_reset0 ["reset" "=>"] @keyword)

; node
(node "node" @keyword)

; when
(when
[
  "when"
  "else"
] @conditional)

; stop
(stop "stop" @keyword)

; printf
(printf "printf" @keyword)

; verif
(verif ["assert" "assume" "cover"] @keyword)

; skip
(skip) @keyword

; attach
(attach "attach" @keyword)

; Primitives
(exp ["mux" "validif"] @function)
(primop) @function

; (IntStrLit) @string
(StringLit) @string

; literals
[
(UnsignedInt)
(SignedInt)
(DoubleLit)
] @number

; types
[
(type)
(litType)
] @type

; comments
[(info) (comment)] @comment

["(" ")" "<" ">" "{" "}"] @punctuation.bracket
["=>" "<=" "="] @operator
["," ":"] @punctuation.delimiter

(id) @variable

; Error
(ERROR) @error

