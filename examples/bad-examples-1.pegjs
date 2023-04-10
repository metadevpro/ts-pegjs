// Example grammar with some unicode rules. These can cause errors if they
// are not escaped properly.
WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / Zs

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"
  
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]
