/* Practice bank for the Algebra I study guide.
   Multiple choice: t = topic, lv = level (1 easy, 3 harder), q = question, o = options,
   a = index of the correct option, sig = the signal that tells you the topic, e = explanation.
   Write-your-own: type = "prove", with list (what a complete answer includes) and model (one model answer). */
var TOPICS = {
  sets: "Sets and subsets",
  functions: "Functions",
  fields: "Fields and complex numbers",
  modular: "Clock arithmetic and congruence",
  vectors: "Vector spaces and subspaces",
  span: "Span and linear combinations",
  bases: "Independence and bases",
  dimension: "Dimension"
};

var QUESTIONS = [
  /* ---------- Sets ---------- */
  {t:"sets", lv:1, q:"Which statement says that the number 2 is one of the elements of {1, 2, 3}?",
   o:["2 ⊆ {1, 2, 3}", "2 ∈ {1, 2, 3}", "2 = {1, 2, 3}"], a:1,
   sig:"Is one item being placed inside a collection, or is one collection being compared with another?",
   e:"∈ says a single item belongs to a set. ⊆ compares two sets, and the number 2 is not a set."},

  {t:"sets", lv:1, q:"Let A = {1, 2} and B = {1, 2, 3}. Which statement is true?",
   o:["A ⊊ B", "B ⊆ A", "A = B"], a:0,
   sig:"Compare which collection contains the other, and whether they are equal.",
   e:"Every element of A is in B, and B has an extra element 3. So A is a proper subset of B."},

  {t:"sets", lv:2, q:"What is ({1, 2, 3} ∩ {3, 4}) ∪ {5}?",
   o:["{3, 5}", "{1, 2, 3, 4, 5}", "{3, 4, 5}"], a:0,
   sig:"Intersections and unions combined: work from the inside out.",
   e:"{1, 2, 3} ∩ {3, 4} = {3}, and {3} ∪ {5} = {3, 5}."},

  {t:"sets", lv:2, q:"Let A = {x ∈ ℤ : x > 0} and B = {x ∈ ℤ : x < 0}. What is A ∪ B?",
   o:["ℤ", "ℤ without 0", "∅"], a:1,
   sig:"Ask which integers belong to neither set.",
   e:"Every nonzero integer is positive or negative, but 0 is in neither set."},

  {t:"sets", lv:2, q:"Is ∅ ⊆ {1, 2}?",
   o:["Yes: the empty set is a subset of every set", "No: the empty set has nothing to compare", "Only if {1, 2} is also empty"], a:0,
   sig:"Check the definition of ⊆ for a set that has no elements.",
   e:"“Every element of ∅ is in {1, 2}” is true, because ∅ has no elements to check."},

  /* ---------- Functions ---------- */
  {t:"functions", lv:1, q:"A rule sends 4 to both 7 and 9. Can it be a function with 4 in its domain?",
   o:["Yes, every rule is a function", "No: each input must have exactly one output", "No: different inputs must give different outputs"], a:1,
   sig:"Count the outputs for each input.",
   e:"A function gives each input exactly one output. Two outputs for the input 4 rule it out."},

  {t:"functions", lv:2, q:"Let f(x) = x² on ℝ. What is f⁻¹({4})?",
   o:["{2}", "{−2, 2}", "{4}"], a:1,
   sig:"A preimage collects the inputs that land in a given set.",
   e:"Both −2 and 2 square to 4, so the preimage is {−2, 2}."},

  {t:"functions", lv:2, q:"Let f(x) = 2x + 1 on ℝ. Which statement is true?",
   o:["f is injective", "f(0) = f(1)", "f is not defined for negative numbers"], a:0,
   sig:"Test whether two different inputs can give the same output.",
   e:"If 2x + 1 = 2y + 1, then x = y. Here f(0) = 1 and f(1) = 3."},

  {t:"functions", lv:2, q:"Let f : ℤ → ℤ, f(x) = 2x + 1. Is f surjective?",
   o:["Yes: every integer is odd", "No: even integers are never hit", "Yes: f(0) = 1"], a:1,
   sig:"Ask whether every element of the codomain is reached.",
   e:"Every output is odd, so the even integers are missed. Surjective means nothing in the codomain is missed."},

  {t:"functions", lv:2, q:"Let f(x) = x³ on ℝ. Which statement is true?",
   o:["f is bijective", "f is injective but not surjective", "f is surjective but not injective"], a:0,
   sig:"Check both one-to-one and onto.",
   e:"Different real numbers have different cubes, and every real number has a real cube root."},

  {t:"functions", lv:2, q:"Let f(x) = x + 1 and g(x) = 2x. What is (g ∘ f)(3)?",
   o:["7", "8", "6"], a:1,
   sig:"Read the composition from right to left: f first, then g.",
   e:"f(3) = 4, then g(4) = 8."},

  {t:"functions", lv:2, q:"Let f(x) = 2x + 1 on ℝ. Which function is its inverse?",
   o:["g(y) = (y − 1)/2", "g(y) = 2y − 1", "g(y) = y + 1"], a:0,
   sig:"Undo the steps in reverse order.",
   e:"Subtract 1, then divide by 2. Check: f(g(y)) = 2 · (y − 1)/2 + 1 = y."},

  {t:"functions", lv:2, q:"Let f(x) = x² on ℝ. What is the range of f?",
   o:["All real numbers", "All nonnegative real numbers", "Only the positive real numbers"], a:1,
   sig:"Ask which outputs are actually produced, not which ones are allowed.",
   e:"x² is never negative, and every nonnegative number is a square, including 0."},

  /* ---------- Fields ---------- */
  {t:"fields", lv:1, q:"Which of these is a field?",
   o:["ℤ", "ℤ/6ℤ", "ℤ/5ℤ"], a:2,
   sig:"Does every nonzero element have a multiplicative partner?",
   e:"ℤ fails because 2 has no inverse. ℤ/6ℤ fails because 2 · 3 = 0. ℤ/5ℤ is a field because 5 is prime."},

  {t:"fields", lv:2, q:"Why is ℤ/9ℤ not a field?",
   o:["Because 9 is odd", "Because 3 · 3 ≡ 0 (mod 9) and 3 ≠ 0", "Because it has more than 5 elements"], a:1,
   sig:"Look for a nonzero element with no partner.",
   e:"3 is nonzero, but 3 · b is always 0, 3 or 6 mod 9, never 1."},

  {t:"fields", lv:2, q:"In ℤ/7ℤ, what is 3⁻¹?",
   o:["5", "4", "3"], a:0,
   sig:"Find b with 3b ≡ 1 (mod 7).",
   e:"3 · 5 = 15 ≡ 1 (mod 7)."},

  {t:"fields", lv:2, q:"Is F₂ = {0, 1} with 1 + 1 = 0 a field?",
   o:["Yes", "No, because 1 + 1 = 0", "No, because 0 has no multiplicative inverse"], a:0,
   sig:"Check each axiom. Only nonzero elements need multiplicative inverses.",
   e:"1 is nonzero and 1 · 1 = 1, so it is its own inverse. The rule 1 + 1 = 0 is allowed. Zero never needs an inverse."},

  {t:"fields", lv:2, q:"What is (1 + i)²?",
   o:["2 + 2i", "2i", "0"], a:1,
   sig:"Expand, then replace i² with −1.",
   e:"1 + 2i + i² = 1 + 2i − 1 = 2i."},

  {t:"fields", lv:2, q:"For z = 3 + 4i, what is |z|?",
   o:["5", "7", "√7"], a:0,
   sig:"The modulus is the square root of a² + b².",
   e:"√(3² + 4²) = √25 = 5."},

  {t:"fields", lv:3, q:"Which statement is true in every field F, for every a in F?",
   o:["a · 0 = a", "a · 0 = 0", "a + 0 = 0"], a:1,
   sig:"Use the axioms, or the field facts about multiplying by 0.",
   e:"a · 0 = a(0 + 0) = a · 0 + a · 0, and cancelling gives a · 0 = 0. The other two are false in general: a + 0 = a."},

  /* ---------- Modular arithmetic ---------- */
  {t:"modular", lv:1, q:"What is 13 mod 5, using the remainder in {0, 1, 2, 3, 4}?",
   o:["2", "3", "4"], a:1,
   sig:"Subtract the largest multiple of 5 that fits.",
   e:"13 = 2 · 5 + 3, so the remainder is 3."},

  {t:"modular", lv:1, q:"Is 7 ≡ 1 (mod 3)?",
   o:["Yes", "No", "Only if 7 is prime"], a:0,
   sig:"Does 3 divide 7 − 1?",
   e:"7 − 1 = 6 = 3 · 2."},

  {t:"modular", lv:2, q:"In ℤ/5ℤ, what is [3] + [4]?",
   o:["[2]", "[1]", "[0]"], a:0,
   sig:"Add the representatives, then reduce mod 5.",
   e:"3 + 4 = 7 ≡ 2 (mod 5)."},

  {t:"modular", lv:2, q:"In ℤ/9ℤ, what is [3] · [7]?",
   o:["[3]", "[1]", "[0]"], a:0,
   sig:"Multiply the representatives, then reduce mod 9.",
   e:"3 · 7 = 21 = 2 · 9 + 3, so the answer is [3]."},

  {t:"modular", lv:2, q:"Which of 2, 4, 5 is a unit in ℤ/8ℤ?",
   o:["2", "4", "5"], a:2,
   sig:"A unit needs a partner b with ab ≡ 1 (mod 8).",
   e:"5 · 5 = 25 ≡ 1 (mod 8). Multiples of 2 or 4 are always even, so they never give 1 mod 8."},

  {t:"modular", lv:2, q:"Which of these is NOT an equivalence relation on ℤ?",
   o:["a ∼ b iff a ≡ b (mod 3)", "a ∼ b iff a < b", "a ∼ b iff a and b have the same parity"], a:1,
   sig:"Test symmetry: if a ∼ b, must b ∼ a?",
   e:"a < b does not imply b < a. The other two are reflexive, symmetric and transitive."},

  {t:"modular", lv:2, q:"How many equivalence classes does congruence mod 4 have on ℤ?",
   o:["2", "4", "Infinitely many"], a:1,
   sig:"The classes correspond to the possible remainders.",
   e:"The remainders are 0, 1, 2, 3, so there are 4 classes, even though ℤ is infinite."},

  {t:"modular", lv:2, q:"Using the digit sum, what is 1234 mod 9?",
   o:["1", "4", "0"], a:0,
   sig:"A number is congruent mod 9 to the sum of its digits.",
   e:"1 + 2 + 3 + 4 = 10 ≡ 1 (mod 9)."},

  {t:"modular", lv:3, q:"Using alternating digit sums, what is 121 mod 11?",
   o:["0", "1", "2"], a:0,
   sig:"Since 10 ≡ −1 (mod 11), the signs alternate from the right.",
   e:"1 − 2 + 1 = 0, so 121 ≡ 0 (mod 11). Indeed 121 = 11 · 11."},

  /* ---------- Vector spaces ---------- */
  {t:"vectors", lv:1, q:"Is {(x, y, z) ∈ ℝ³ : x + y + z = 0} a subspace of ℝ³?",
   o:["Yes", "No: it does not contain 0", "No: it has no basis"], a:0,
   sig:"Check for the zero vector, closure under addition, and closure under scaling.",
   e:"0 + 0 + 0 = 0. Sums and scalar multiples of vectors whose coordinates sum to 0 still have coordinates summing to 0."},

  {t:"vectors", lv:2, q:"Is {(x, y) ∈ ℝ² : x ≥ 0} a subspace of ℝ²?",
   o:["Yes", "No: scaling (1, 0) by −1 leaves the set", "No: it is not a line"], a:1,
   sig:"Does the set stay inside when you scale by negative numbers?",
   e:"(1, 0) is in the set, but −1 · (1, 0) = (−1, 0) is not."},

  {t:"vectors", lv:2, q:"Which is a vector space over ℝ?",
   o:["Polynomials of degree exactly 3", "Polynomials of degree at most 3", "The circle {(x, y) : x² + y² = 1}"], a:1,
   sig:"Does the set contain 0 and stay closed under addition?",
   e:"Degree at most 3 includes the zero polynomial and is closed under addition and scaling. Degree exactly 3 has no zero, and the circle is not closed under addition."},

  {t:"vectors", lv:2, q:"Is ℂ a vector space over ℝ?",
   o:["Yes", "No", "Only over ℂ"], a:0,
   sig:"Can real numbers scale complex numbers while the axioms still hold?",
   e:"Yes. Over ℝ, ℂ has dimension 2."},

  {t:"vectors", lv:2, q:"Which is a subspace of P₂(ℝ), the polynomials of degree at most 2?",
   o:["Polynomials with constant term 1", "Polynomials with constant term 0", "Polynomials of degree exactly 2"], a:1,
   sig:"A subspace must contain the zero polynomial.",
   e:"The zero polynomial has constant term 0. The others fail: constant term 1 excludes zero, and degree exactly 2 excludes zero too."},

  {t:"vectors", lv:1, q:"In any vector space, what is 0 · v?",
   o:["The number 0", "The vector v", "The zero vector"], a:2,
   sig:"Multiplying a vector by the scalar 0.",
   e:"0 · v is the zero vector. Scalars and vectors are different things."},

  /* ---------- Span ---------- */
  {t:"span", lv:1, q:"Which set spans ℝ²?",
   o:["{(1, 0)}", "{(1, 0), (2, 0)}", "{(1, 0), (0, 1)}"], a:2,
   sig:"Can you reach every point of the plane?",
   e:"(a, b) = a(1, 0) + b(0, 1). The other two sets stay on the x-axis."},

  {t:"span", lv:2, q:"Which expresses (2, 3) as a linear combination of (1, 0) and (0, 1)?",
   o:["2(1, 0) − 3(0, 1)", "3(1, 0) + 2(0, 1)", "2(1, 0) + 3(0, 1)"], a:2,
   sig:"The coefficients are the coordinates.",
   e:"2(1, 0) + 3(0, 1) = (2, 0) + (0, 3) = (2, 3)."},

  {t:"span", lv:2, q:"Is (4, 5, 6) in span{(1, 0, 1), (0, 1, 1)}?",
   o:["Yes", "No", "Only if the list is a basis"], a:1,
   sig:"Solve a(1, 0, 1) + b(0, 1, 1) = (4, 5, 6).",
   e:"The first two coordinates give a = 4 and b = 5, but the third would be a + b = 9, not 6."},

  {t:"span", lv:2, q:"Does span{(1, 1)} contain (2, 2)?",
   o:["Yes", "No", "Only if (1, 1) is zero"], a:0,
   sig:"Look for a scalar multiple.",
   e:"(2, 2) = 2 · (1, 1)."},

  {t:"span", lv:2, q:"Which set spans P₂(ℝ)?",
   o:["{1, x}", "{1, x, x²}", "{x²}"], a:1,
   sig:"Every polynomial of degree at most 2 must be a combination.",
   e:"a₀ + a₁x + a₂x² = a₀ · 1 + a₁ · x + a₂ · x²."},

  {t:"span", lv:3, q:"Let S₁ = {(1, 0)} and S₂ = {(2, 0)}. Are their spans intersecting only in 0?",
   o:["Yes, the sets are disjoint", "No: both spans are the x-axis", "Yes, because (1, 0) ≠ (2, 0)"], a:1,
   sig:"Disjoint sets can still have overlapping spans.",
   e:"Both spans equal the whole x-axis, so they share many vectors. Disjoint lists do not guarantee disjoint spans."},

  /* ---------- Bases ---------- */
  {t:"bases", lv:1, q:"Is {(1, 0), (0, 1), (1, 1)} a basis of ℝ²?",
   o:["Yes", "No: it is linearly dependent", "No: it does not span ℝ²"], a:1,
   sig:"Check independence first: is there a redundant vector?",
   e:"(1, 1) = (1, 0) + (0, 1), so the list is dependent. It spans ℝ², but it is not a basis."},

  {t:"bases", lv:2, q:"Is {(1, 2), (2, 4)} linearly independent?",
   o:["Yes", "No: 2(1, 2) − (2, 4) = 0", "Yes, because the vectors are different"], a:1,
   sig:"Look for a combination with nonzero coefficients that equals zero.",
   e:"2(1, 2) − (2, 4) = (0, 0), with nonzero coefficients, so the list is dependent."},

  {t:"bases", lv:2, q:"Over F₂, is {(1, 0, 1), (1, 1, 0), (0, 1, 1)} linearly independent?",
   o:["Yes", "No: their sum is zero", "Yes, over any field"], a:1,
   sig:"Add the three vectors, using 1 + 1 = 0.",
   e:"The sum is (1 + 1 + 0, 0 + 1 + 1, 1 + 0 + 1) = (0, 0, 0) in F₂. So they are dependent over F₂."},

  {t:"bases", lv:2, q:"Over ℝ, is {(1, 0, 1), (1, 1, 0), (0, 1, 1)} linearly independent?",
   o:["Yes", "No: their sum is zero", "No: three vectors are never independent"], a:0,
   sig:"Same vectors as the last question, different field.",
   e:"Over ℝ the sum is (2, 2, 2), not zero. Solving c₁v₁ + c₂v₂ + c₃v₃ = 0 forces every cᵢ = 0."},

  {t:"bases", lv:2, q:"Which is the standard basis of ℝ³?",
   o:["{(1, 1, 1)}", "{(1, 0, 0), (0, 1, 0), (0, 0, 1)}", "{(0, 0, 0), (1, 0, 0)}"], a:1,
   sig:"Standard basis vectors have one 1 and zeros elsewhere.",
   e:"The three coordinate vectors are independent and span ℝ³."},

  {t:"bases", lv:3, q:"Which statement is equivalent to “the list β is linearly independent”?",
   o:["Every vector has at least one representation as a combination of β",
      "Every vector in the span of β has at most one representation as a combination of β",
      "β contains no zero vector"], a:1,
   sig:"Independence means the zero vector has only one representation. Uniqueness is the general version.",
   e:"Independence means 0 has only the trivial representation, which is the same as uniqueness of representation for every vector in the span. The third option is weaker: a list with no zero vector can still be dependent."},

  /* ---------- Dimension ---------- */
  {t:"dimension", lv:1, q:"What is dim P₅(ℝ)?",
   o:["5", "6", "Infinite"], a:1,
   sig:"Count a basis such as 1, x, x², …, x⁵.",
   e:"The basis 1, x, x², x³, x⁴, x⁵ has six vectors."},

  {t:"dimension", lv:2, q:"What is the dimension of ℂ over ℝ?",
   o:["1", "2", "Infinite"], a:1,
   sig:"Over ℝ, a + bi = a · 1 + b · i.",
   e:"{1, i} is a basis over ℝ. Over ℂ itself, the dimension is 1."},

  {t:"dimension", lv:2, q:"Can ℝ³ contain four linearly independent vectors?",
   o:["Yes, if they are all nonzero", "No: an independent list has at most 3 vectors", "Yes, if they are over ℝ"], a:1,
   sig:"Use the replacement theorem: an independent list is never longer than a spanning list.",
   e:"ℝ³ is spanned by 3 vectors, so no independent list can have 4."},

  {t:"dimension", lv:2, q:"True or false: every basis of a finite-dimensional vector space has the same number of vectors.",
   o:["True", "False: each space has exactly one basis", "False: bases can have different sizes"], a:0,
   sig:"Recall the consequence of the replacement theorem.",
   e:"Any two finite bases have the same size. That is why dimension is well defined."},

  {t:"dimension", lv:2, q:"How many elements does F₃⁴ have?",
   o:["81", "64", "12"], a:0,
   sig:"Each coordinate has 3 choices.",
   e:"3⁴ = 81."},

  {t:"dimension", lv:3, q:"How many distinct lines through the origin does F₃⁴ have?",
   o:["27", "40", "80"], a:1,
   sig:"Each line through 0 contains exactly two nonzero vectors in F₃ (v and 2v).",
   e:"There are 80 nonzero vectors, and each line through 0 uses 2 of them, so there are 80 ÷ 2 = 40 lines."},

  {t:"dimension", lv:2, q:"Let W be a subspace of a finite-dimensional space V with dim W = dim V. What follows?",
   o:["W = V", "W is a proper subset of V", "W = {0}"], a:0,
   sig:"Use the subspace-dimension theorem.",
   e:"An independent list in W of length dim V is a basis of V, so W = V."},

  /* ---------- Write-your-own items ---------- */
  {t:"sets", lv:2, type:"prove",
   q:"Prove that if A ⊆ B and B ⊆ C, then A ⊆ C.",
   list:["Take an arbitrary x in A and show x is in C", "Use each inclusion in turn", "State the conclusion for all of A"],
   model:"Let x be an arbitrary element of A. Since A ⊆ B, x is in B. Since B ⊆ C, x is in C. Since x was arbitrary, every element of A is in C, so A ⊆ C."},

  {t:"functions", lv:2, type:"prove",
   q:"Prove that f(x) = 2x + 1 from ℝ to ℝ is injective.",
   list:["Start by assuming f(x) = f(y)", "Use the formula to deduce x = y", "State the conclusion"],
   model:"Assume 2x + 1 = 2y + 1. Subtracting 1 and dividing by 2 gives x = y. Hence f is injective."},

  {t:"modular", lv:2, type:"prove",
   q:"Prove that congruence mod m is reflexive: a ≡ a (mod m) for every integer a.",
   list:["Use the definition: m must divide a − a", "Show a − a is a multiple of m", "Conclude"],
   model:"a − a = 0 = m · 0, so m divides a − a. By definition, a ≡ a (mod m)."},

  {t:"fields", lv:3, type:"prove",
   q:"In any field, prove that (−a) · b = −(a · b).",
   list:["Use the distributive law on (a · b) + (−a) · b", "Use the additive inverse axiom and a · 0 = 0", "Use uniqueness of additive inverses"],
   model:"(a · b) + (−a) · b = (a + (−a)) · b = 0 · b = 0, using distributivity, then the inverse axiom, then 0 · b = 0. So (−a) · b is an additive inverse of a · b. Additive inverses are unique, hence (−a) · b = −(a · b)."},

  {t:"vectors", lv:2, type:"prove",
   q:"Prove that W = {(x, y, z) ∈ ℝ³ : x = 2y} is a subspace of ℝ³.",
   list:["Show 0 is in W", "Take arbitrary elements of W; show their sum is in W", "Take a scalar and an element of W; show the product is in W"],
   model:"(0, 0, 0) satisfies 0 = 2 · 0, so 0 is in W. If u = (2s, s, p) and v = (2t, t, q) are in W, then u + v = (2(s + t), s + t, p + q), which satisfies the condition with s + t, so u + v is in W. For c in ℝ, cu = (2cs, cs, cp) also satisfies x = 2y, so cu is in W. Therefore W is a subspace."},

  {t:"bases", lv:3, type:"prove",
   q:"Prove that {(1, 0), (1, 1)} is a basis of ℝ².",
   list:["Spanning: express an arbitrary (a, b) as a combination", "Independence: set a combination to zero and solve", "Conclude both conditions hold"],
   model:"Spanning: (a, b) = (a − b)(1, 0) + b(1, 1). Independence: if c₁(1, 0) + c₂(1, 1) = (0, 0), the second coordinate gives c₂ = 0, and then the first gives c₁ = 0. Both conditions hold, so the list is a basis."}
];
