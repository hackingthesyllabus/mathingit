/* App logic for the Algebra I study guide: routing, glossary, practice, question-type tree, checklist, notation filter. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Routing: pages by name, glossary and other entries by id ---------- */
  var PAGES = ['start', 'roadmap', 'glossary', 'worked', 'practice', 'question', 'reference', 'checklist'];

  function route() {
    var h = 'start';
    try { h = decodeURIComponent((location.hash || '').replace('#', '')) || 'start'; } catch (err) { h = 'start'; }
    var pageId = null, target = null;
    if (PAGES.indexOf(h) >= 0) {
      pageId = h;
    } else {
      target = document.getElementById(h);
      if (target) {
        var pg = target.closest('.page');
        if (pg) pageId = pg.id.replace('p-', '');
      }
    }
    if (!pageId) pageId = 'start';
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('on', p.id === 'p-' + pageId);
    });
    document.querySelectorAll('nav.tabs a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + pageId) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (target) {
      var d = target.closest('details');
      if (d) d.open = true;
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  /* ---------- Glossary ---------- */
  function renderGlossary() {
    var q = $('gsearch').value.trim().toLowerCase();
    var st = $('gstage').value;
    var rows = GLOSSARY.filter(function (g) {
      if (st !== 'all' && String(g.stage) !== st) return false;
      if (!q) return true;
      return (g.term + ' ' + g.plain + ' ' + g.formal).toLowerCase().indexOf(q) >= 0;
    });
    $('glist').innerHTML = rows.map(function (g) {
      var visual = getGlossaryVisual(g.id);
      return '<details class="entry" id="g-' + g.id + '">' +
        '<summary>' + esc(g.term) + '<span class="tag">' + esc(STAGES[g.stage]) + '</span></summary>' +
        '<p>' + esc(g.plain) + '</p>' +
        '<h3>Precise version</h3><div class="formula">' + esc(g.formal) + '</div>' +
        visual +
        '<div class="grid"><div><h3>Example</h3><p>' + esc(g.example) + '</p></div>' +
        '<div><h3>Not an example</h3><p>' + esc(g.nonex) + '</p></div></div>' +
        '<details class="check"><summary>Check yourself</summary>' +
        '<p><strong>' + esc(g.check[0]) + '</strong></p><p>' + esc(g.check[1]) + '</p></details>' +
        '<p>' + g.rel.map(function (r) {
          return '<a class="tag" href="#g-' + r + '">' + esc(BYID[r].term) + '</a>';
        }).join(' ') + '</p>' +
        '</details>';
    }).join('') || '<p>No matches. Try a shorter word.</p>';
  }

  /* ---------- Practice ---------- */
  var TOPIC_KEYS = Object.keys(TOPICS);
  var P = { mode: 'topic', topic: 'all', queue: [], i: 0, phase: 'answer', topicPick: null,
            pick: null, checked: false, seen: 0, right: 0 };

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildQueue() {
    var list = QUESTIONS.filter(function (q) { return P.topic === 'all' || q.t === P.topic; });
    P.queue = P.mode === 'mixed' ? shuffle(list.slice()) : list.slice();
    P.i = 0; P.topicPick = null; P.pick = null; P.checked = false;
    P.phase = P.mode === 'mixed' ? 'identify' : 'answer';
  }

  function renderPractice() {
    var area = $('p-area');
    if (!P.queue.length) {
      area.innerHTML = '<p>No questions for this topic yet.</p>';
      $('p-count').textContent = '';
      return;
    }
    var q = P.queue[P.i];
    var mixed = P.mode === 'mixed';
    $('p-count').textContent = 'Question ' + (P.i + 1) + ' of ' + P.queue.length +
      (mixed ? '' : ' · ' + TOPICS[q.t] + ' · level ' + q.lv);
    $('p-score').textContent = P.seen
      ? 'Score this session: ' + P.right + ' of ' + P.seen + ' multiple-choice answers correct.'
      : '';

    if (mixed && P.phase === 'identify') {
      area.innerHTML = '<p class="kicker">Step 1 · What kind of problem is this?</p>' +
        '<p class="prompt">' + esc(q.q) + '</p><div class="stack">' +
        TOPIC_KEYS.map(function (k) {
          return '<button class="opt" data-topic-pick="' + k + '">' + esc(TOPICS[k]) + '</button>';
        }).join('') + '</div>';
      return;
    }

    var h = '';
    if (mixed) {
      var ok = P.topicPick === q.t;
      h += '<p class="feedback ' + (ok ? 'right' : 'wrong') + '">' + (ok ? 'Yes. ' : 'Not quite. ') +
        'This is a <strong>' + esc(TOPICS[q.t]) + '</strong> question. Signal: ' + esc(q.sig) + '</p>';
      h += '<p class="kicker">Step 2 · Answer</p>';
    }
    h += '<p class="prompt">' + esc(q.q) + '</p>';

    if (q.type === 'prove') {
      h += '<textarea id="p-text" aria-label="Your attempt" ' +
        'placeholder="Optional: write your attempt before you look at the model answer."></textarea>';
      h += '<details><summary>What a complete answer includes</summary><ul>' +
        q.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
      h += '<details><summary>Model answer</summary><p>' + esc(q.model) + '</p></details>';
      h += '<div class="row"><button id="p-next" class="primary">Next</button></div>';
    } else {
      h += '<div class="stack">';
      q.o.forEach(function (o, i) {
        h += '<button class="opt" data-opt="' + i + '" aria-pressed="' + (P.pick === i) + '"' +
          (P.checked ? ' disabled' : '') + '>' + esc(o) + '</button>';
      });
      h += '</div>';
      h += '<div class="row"><button id="p-check" class="primary"' + (P.checked ? ' disabled' : '') +
        '>Check answer</button><button id="p-next">Next</button></div>';
      h += '<div id="p-fb"></div>';
      if (P.checked) {
        var right = P.pick === q.a;
        h += '<p class="feedback ' + (right ? 'right' : 'wrong') + '"><strong>' +
          (right ? 'Correct.' : 'Not quite.') + '</strong> The answer is “' + esc(q.o[q.a]) + '”. ' +
          esc(q.e) + '</p>';
      }
    }
    area.innerHTML = h;
  }

  $('p-area').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-topic-pick]'))) {
      P.topicPick = b.getAttribute('data-topic-pick');
      P.phase = 'answer'; P.pick = null; P.checked = false;
      renderPractice();
      return;
    }
    if ((b = e.target.closest('[data-opt]'))) {
      if (!P.checked) {
        P.pick = Number(b.getAttribute('data-opt'));
        renderPractice();
      }
      return;
    }
    if (e.target.closest('#p-check')) {
      if (P.pick === null) {
        $('p-fb').innerHTML = '<p class="muted">Pick an answer first.</p>';
        return;
      }
      P.checked = true;
      P.seen++;
      if (P.pick === P.queue[P.i].a) P.right++;
      renderPractice();
      return;
    }
    if (e.target.closest('#p-next')) {
      P.i = (P.i + 1) % P.queue.length;
      P.phase = P.mode === 'mixed' ? 'identify' : 'answer';
      P.topicPick = null; P.pick = null; P.checked = false;
      renderPractice();
    }
  });

  document.querySelectorAll('.mode').forEach(function (btn) {
    btn.addEventListener('click', function () {
      P.mode = btn.getAttribute('data-mode');
      if (P.mode === 'mixed') {
        P.topic = 'all';
        $('topic-sel').value = 'all';
        $('topic-sel').disabled = true;
      } else {
        $('topic-sel').disabled = false;
      }
      document.querySelectorAll('.mode').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === btn));
      });
      buildQueue();
      renderPractice();
    });
  });

  $('topic-sel').addEventListener('change', function () {
    P.topic = this.value;
    buildQueue();
    renderPractice();
  });

  /* ---------- Question-type tree ---------- */
  var DEC = {
    start: { q: 'What is the question asking you to do?', o: [
      ['Show that something exists, or build one', 'build'],
      ['Show that a claim holds for every element', 'forall'],
      ['Show that two things are equal', 'equal'],
      ['Show that a claim is false', 'L_counter'],
      ['Work with vector spaces, subspaces, spans or bases', 'vec'],
      ['Work with clock numbers, remainders, relations or fields', 'mod']
    ] },
    build: { q: 'What must you produce?', o: [
      ['A specific number, input or vector', 'L_build'],
      ['Coefficients that combine given vectors into a target', 'L_span']
    ] },
    forall: { q: 'What kind of claim is it?', o: [
      ['It is about every element of a set', 'L_arb'],
      ['It is a property of a function', 'fn']
    ] },
    fn: { q: 'Which property?', o: [
      ['No two inputs share an output (injective)', 'L_inj'],
      ['Every output is hit (surjective)', 'L_surj'],
      ['Both, or an inverse exists (bijective or invertible)', 'L_bij']
    ] },
    equal: { q: 'What is being compared?', o: [
      ['Two sets', 'L_sets'],
      ['Two integers mod m', 'L_cong'],
      ['Two subspaces', 'L_subeq']
    ] },
    vec: { q: 'Which vector question?', o: [
      ['Is this set a subspace?', 'L_sub'],
      ['Is this list linearly independent?', 'L_ind'],
      ['Does this list span the space?', 'L_spanq'],
      ['Is this list a basis?', 'L_basis'],
      ['What is the dimension?', 'L_dim']
    ] },
    mod: { q: 'Which question?', o: [
      ['Is this relation an equivalence relation?', 'L_rel'],
      ['Is ℤ/mℤ a field?', 'L_field'],
      ['Does a clock number have a partner (an inverse)?', 'L_unit']
    ] }
  };

  var LEAF = {
    L_build: { t: 'Build it',
      steps: ['Write the candidate explicitly.', 'Check it against every condition in the definition, one at a time.'],
      warn: 'Saying that it probably exists is not a proof. Build it, or prove that it must exist.',
      terms: ['subspace', 'span'] },
    L_span: { t: 'Solve for the coefficients',
      steps: ['Write the target as c₁v₁ + … + cₙvₙ.', 'Write one equation for each coordinate, using the unknown cᵢ.', 'Solve. If a solution exists, the target is in the span. If not, it is not.'],
      terms: ['lincomb', 'span'] },
    L_arb: { t: 'Start with arbitrary elements',
      steps: ['Let x (and y) be arbitrary elements of the set.', 'Use only the definitions, not specific numbers.', 'Conclude the property for that arbitrary element.'],
      warn: 'Checking a few examples does not prove a “for all” claim.',
      terms: ['set', 'subset'] },
    L_inj: { t: 'Show injective',
      steps: ['Assume f(x) = f(y).', 'Use the formula for f to deduce x = y.'],
      terms: ['injective'] },
    L_surj: { t: 'Show surjective',
      steps: ['Take an arbitrary y in the codomain.', 'Solve f(x) = y for an x in the domain.', 'Check that this x really works.'],
      warn: 'The codomain is part of the question. Changing it changes the answer.',
      terms: ['surjective', 'function'] },
    L_bij: { t: 'Show bijective (or invertible)',
      steps: ['Show injective and surjective, or', 'Find g with g(f(x)) = x and f(g(y)) = y.'],
      terms: ['bijective', 'invertible'] },
    L_sets: { t: 'Show two sets are equal',
      steps: ['Show every element of A is in B (A ⊆ B).', 'Show every element of B is in A (B ⊆ A).'],
      terms: ['subset'] },
    L_cong: { t: 'Show a ≡ b (mod m)',
      steps: ['Compute a − b.', 'Show that m divides a − b, that is, a − b = m · k for some integer k.'],
      terms: ['congruence'] },
    L_subeq: { t: 'Show two subspaces are equal',
      steps: ['Show each subspace is contained in the other.', 'Or show one is contained in the other and both have the same finite dimension.'],
      terms: ['subspace', 'dimension'] },
    L_counter: { t: 'Disprove with one example',
      steps: ['Find one specific case that breaks the claim.', 'Check that case against every condition in the definition.'],
      warn: 'One correct counterexample is enough to disprove a “for all” claim.',
      terms: ['injective', 'subspace'] },
    L_sub: { t: 'Check that it is a subspace',
      steps: ['Check that 0 is in the set.', 'Take arbitrary u and v in the set, and show u + v is in the set.', 'Take arbitrary u and a scalar c, and show cu is in the set.'],
      warn: 'If 0 is not in the set, stop: it is not a subspace.',
      terms: ['subspace'] },
    L_ind: { t: 'Check linear independence',
      steps: ['Set c₁v₁ + … + cₙvₙ = 0.', 'Solve for the cᵢ.', 'Only the all-zero solution means independent. Any other solution means dependent.'],
      terms: ['indep'] },
    L_spanq: { t: 'Check whether the list spans',
      steps: ['Take an arbitrary vector v in the space.', 'Solve v = c₁v₁ + … + cₙvₙ for the cᵢ.', 'If a solution exists for every v, the list spans.'],
      warn: 'Checking a few vectors does not prove spanning.',
      terms: ['span', 'spanning'] },
    L_basis: { t: 'Check whether the list is a basis',
      steps: ['Check that the list spans.', 'Check that it is independent.', 'Both must hold.'],
      warn: 'Enough vectors is not enough: they must also be independent. Independence is not enough either: they must span.',
      terms: ['basis'] },
    L_dim: { t: 'Find the dimension',
      steps: ['Find any basis.', 'Count its vectors.', 'All bases of a finite-dimensional space have the same count.'],
      terms: ['dimension', 'replacement'] },
    L_rel: { t: 'Check whether a relation is an equivalence relation',
      steps: ['Reflexive: is a ∼ a for every a?', 'Symmetric: does a ∼ b always give b ∼ a?', 'Transitive: do a ∼ b and b ∼ c always give a ∼ c?'],
      terms: ['equiv-rel', 'relation'] },
    L_field: { t: 'Decide whether ℤ/mℤ is a field',
      steps: ['If m is prime: yes. Every nonzero element then has a partner.', 'If m is not prime: find two nonzero numbers whose product is 0 mod m. Those are zero divisors, so there is no field.'],
      terms: ['fp', 'ring'] },
    L_unit: { t: 'Check for a partner (an inverse)',
      steps: ['Find b with ab ≡ 1 (mod m).', 'If one exists, a is a unit. If none exists, a has no inverse.'],
      terms: ['units'] }
  };

  var D = { hist: [], node: 'start', labels: [] };

  function renderDec() {
    $('d-trail').textContent = D.labels.length ? D.labels.join('  →  ') : 'Start';
    var leaf = LEAF[D.node];
    if (leaf) {
      $('d-q').textContent = leaf.t;
      $('d-opts').innerHTML = '';
      var h = '<ol class="steps">' + leaf.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
      if (leaf.warn) h += '<p class="feedback wrong">' + esc(leaf.warn) + '</p>';
      h += '<p class="muted">Read these first:</p><p>' + leaf.terms.map(function (id) {
        return '<a class="tag" href="#g-' + id + '">' + esc(BYID[id].term) + '</a>';
      }).join(' ') + '</p>';
      $('d-leaf').innerHTML = h;
    } else {
      var n = DEC[D.node];
      $('d-q').textContent = n.q;
      $('d-leaf').innerHTML = '';
      $('d-opts').innerHTML = n.o.map(function (o, i) {
        return '<button class="opt" data-dopt="' + i + '">' + esc(o[0]) + '</button>';
      }).join('');
    }
    $('d-back').disabled = !D.hist.length;
  }

  $('d-opts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-dopt]');
    if (!b) return;
    var o = DEC[D.node].o[Number(b.getAttribute('data-dopt'))];
    D.hist.push({ node: D.node, labels: D.labels.slice() });
    D.labels.push(o[0].length > 46 ? o[0].slice(0, 46) + '…' : o[0]);
    D.node = o[1];
    renderDec();
  });

  $('d-back').addEventListener('click', function () {
    if (!D.hist.length) return;
    var h = D.hist.pop();
    D.node = h.node; D.labels = h.labels;
    renderDec();
  });

  $('d-reset').addEventListener('click', function () {
    D.hist = []; D.node = 'start'; D.labels = [];
    renderDec();
  });

  /* ---------- Checklist (ticks saved in this browser) ---------- */
  var CHECK = [
    ["Stage 1 · Sets and functions · Lecture 1", [
      "Elements, membership (∈), and when two sets are equal",
      "Subsets (⊆) and proper subsets (⊊); the empty set",
      "Union and intersection, including for a whole list of sets",
      "Cartesian product",
      "Domain, codomain and range; when two functions are equal",
      "Image and preimage (the preimage exists even without an inverse function)",
      "Injective, surjective and bijective; restriction of a function",
      "Composition, and why order matters",
      "Invertible functions, and that invertible means bijective"]],
    ["Stage 2 · Fields and complex numbers · Lecture 2", [
      "Field axioms F1 to F5",
      "Examples: ℚ, ℝ, ℚ(√5), and F₂ = {0, 1}",
      "Cancellation laws; uniqueness of 0, 1 and inverses",
      "a · 0 = 0; subtraction and division defined from the axioms",
      "Complex numbers: addition, multiplication, and ℝ inside ℂ",
      "Conjugate, modulus, and the inverse formula z⁻¹ = z̄ / |z|²"]],
    ["Stage 3 · Relations and clock arithmetic · Lecture 3 and Chapter 5", [
      "Relations as subsets of S × S",
      "Equivalence relations: reflexive, symmetric, transitive",
      "Equivalence classes, representatives, and the fact that classes partition the set",
      "Congruence mod m, in all three equivalent forms",
      "Division with remainder: exactly one remainder in {0, …, m − 1}",
      "Addition and multiplication of congruences, and why they are well defined",
      "ℤ/mℤ: m elements, and its operation tables",
      "Units, gcd(a, m) = 1, and units forming a group under multiplication",
      "Zero divisors and rings"]],
    ["Stage 4 · Finite fields · Lecture 4", [
      "The definition of a prime and the property (∗)",
      "ℤ/mℤ is a field if and only if m is prime (both directions)",
      "F_p notation; ℤ/3ℤ, ℤ/5ℤ and ℤ/7ℤ are fields; ℤ/6ℤ and ℤ/8ℤ are not"]],
    ["Stage 5 · Vector spaces · Lectures 4 and 5", [
      "The eight vector space axioms VS1 to VS8",
      "Examples: Fⁿ, Mm×n(F), F(S, F), P(F), P_k(F), and ℂ over ℝ",
      "Non-examples: polynomials of exact degree; sets with no zero vector; scaling by |c|",
      "Vector-space facts: 0 · v = 0 and (−a)v = −(av)",
      "The subspace test; intersections of subspaces are subspaces"]],
    ["Stage 6 · Span · Lecture 6", [
      "Linear combinations and coefficients",
      "span(S), span(∅) = {0}, and span(S) as the smallest subspace containing S",
      "Spanning sets; disjoint lists can still have overlapping spans"]],
    ["Stage 7 · Independence and bases · Lectures 7 and 8", [
      "Linear relations, trivial and nontrivial",
      "Linear independence; subsets of independent sets are independent",
      "For independent S: S ∪ {v} is dependent exactly when v is in span(S)",
      "Independence depends on the field",
      "Basis, and its equivalence with unique representation",
      "The standard basis of Fⁿ",
      "A finite spanning set contains a basis"]],
    ["Stage 8 · Dimension · Lectures 8 and 9", [
      "The replacement theorem (statement and idea of proof)",
      "All finite bases have the same size; the definition of dimension",
      "Finite- and infinite-dimensional spaces; P(F) is infinite-dimensional",
      "Sizes of independent sets, spanning sets and bases in an n-dimensional space",
      "dim W ≤ dim V, and equality implies W = V",
      "Any basis of a subspace extends to a basis of V",
      "Counting exercises such as F₃⁴"]],
    ["Chapter 5 extras", [
      "Divisibility shortcuts by 3, 9, 4, 8 and 11 using digit sums or alternating sums",
      "Powers and negative powers of units",
      "ℤ/mℤ is a commutative ring, and it is not an integral domain when m is composite"]]
  ];

  function loadTicks() {
    try { return JSON.parse(localStorage.getItem('algebra-guide-ticks') || '[]'); } catch (err) { return []; }
  }

  function saveTicks(arr) {
    try { localStorage.setItem('algebra-guide-ticks', JSON.stringify(arr)); } catch (err) { /* storage unavailable: ticks last only this visit */ }
  }

  function renderChecklist() {
    var done = loadTicks();
    $('check-list').innerHTML = CHECK.map(function (s, si) {
      return '<section class="card"><h3>' + esc(s[0]) + '</h3>' +
        s[1].map(function (t, ti) {
          var key = si + '-' + ti;
          return '<label class="check-item"><input type="checkbox" data-key="' + key + '"' +
            (done.indexOf(key) >= 0 ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
        }).join('') + '</section>';
    }).join('');
  }

  $('check-list').addEventListener('change', function (e) {
    var key = e.target.getAttribute('data-key');
    if (!key) return;
    var done = loadTicks().filter(function (k) { return k !== key; });
    if (e.target.checked) done.push(key);
    saveTicks(done);
  });

  /* ---------- Notation filter ---------- */
  $('nsearch').addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    document.querySelectorAll('#notation-body tr').forEach(function (tr) {
      tr.hidden = !!q && tr.textContent.toLowerCase().indexOf(q) < 0;
    });
  });



  /* ---------- Visual roadmap and glossary visuals ---------- */
  var ROADMAP_STAGES = [
    {title:"Sets and functions",plain:"You first learn how to describe a collection and how a rule assigns each allowed input exactly one output.",math:"Sets, Cartesian products, relations and functions provide notation used later in the course.",example:"For f(x)=x², each real input has a single output, but different inputs can share one output."},
    {title:"Fields and complex numbers",plain:"A field is a system of numbers in which you can add, subtract, multiply, and divide by every nonzero number. Complex numbers are one example.",math:"The field axioms specify the arithmetic rules. Examples include ℚ, ℝ and ℂ. Fields supply scalars for vector spaces.",example:"In ℝ, multiplying by 1/2 is allowed because 2 has a multiplicative inverse."},
    {title:"Relations and clock arithmetic",plain:"A relation compares items. An equivalence relation puts items into groups that count as alike under a chosen rule. Clock arithmetic groups integers by remainder.",math:"Congruence modulo m defines an equivalence relation on ℤ, and its classes form ℤ/mℤ.",example:"Modulo 5, 2, 7 and 12 are in the same equivalence class because they leave remainder 2."},
    {title:"Finite fields",plain:"Some clock-number systems obey every field rule. That happens precisely when the number of positions is prime.",math:"ℤ/mℤ is a field if and only if the positive integer m is prime. These are examples of finite fields.",example:"ℤ/5ℤ is a field. ℤ/6ℤ is not, since [2][3]=[0] with neither factor equal to [0]."},
    {title:"Vector spaces",plain:"In a vector space, you may add vectors and multiply them by numbers from a field. The operations must follow specific rules.",math:"A vector space V over field F has addition and scalar multiplication satisfying the vector-space axioms.",example:"ℝ² is a vector space over ℝ; (1,2)+(3,4)=(4,6)."},
    {title:"Span",plain:"Span asks which vectors you can build by scaling and adding the vectors you already have.",math:"span(S) consists of all finite linear combinations of vectors from S.",example:"The two vectors (1,0) and (0,1) span ℝ²."},
    {title:"Independence and bases",plain:"Independence asks whether some vectors are unnecessary. A basis has enough vectors to reach everything, but no redundant ones.",math:"A list is linearly independent if c₁v₁+⋯+cₙvₙ=0 only for all-zero coefficients. A basis is an independent spanning set.",example:"{(1,0),(0,1)} is a basis of ℝ²; neither vector can be built from the other."},
    {title:"Dimension",plain:"Dimension tells you how many vectors are needed in any basis of a finite-dimensional space.",math:"Every basis of a finite-dimensional space has the same number of vectors, and this count is its dimension.",example:"Every basis of ℝ³ has three vectors, so dim ℝ³=3."}
  ];

  var ROADMAP_CONNECTIONS = [
    {from:0,to:2,label:"Sets/functions → relations",plain:"Sets give you the language needed to talk about which ordered pairs are related. A function is another specific kind of rule involving inputs and outputs. This is a conceptual connection, not a requirement to study every function before relations.",math:"A relation on S is a subset of S × S. An equivalence relation is a relation satisfying reflexivity, symmetry and transitivity.",example:"For S={1,2,3}, the relation “same parity” puts 1 and 3 together, with 2 in another group."},
    {from:2,to:3,label:"Clock arithmetic → finite fields",plain:"Once you have integers grouped by remainder, you can ask whether addition and multiplication on the classes satisfy all the field rules. They do exactly when the modulus is prime.",math:"ℤ/mℤ is a field if and only if m is prime (for m>1).",example:"Modulo 5 every nonzero class has a multiplicative inverse; modulo 6, [2][3]=[0], so it is not a field."},
    {from:1,to:3,label:"Field rules → finite fields",plain:"The earlier field definition gives the criteria used to test the clock-number systems. The course teaches fields before this particular example.",math:"Check whether ℤ/mℤ meets the field axioms, especially whether each nonzero class has a multiplicative inverse.",example:"In ℤ/5ℤ, [2]·[3]=[1], so [3] is the inverse of [2]."},
    {from:1,to:4,label:"Fields → vector spaces",plain:"A vector space needs numbers with which to scale its vectors. Those numbers come from a field.",math:"Scalar multiplication is an operation F × V → V, where F is a field and V is a vector space over F.",example:"In ℝ², the real number 3 scales (1,2) to (3,6)."},
    {from:4,to:5,label:"Vector spaces → span",plain:"Once addition and scaling are available, we can ask what combinations of the original vectors can produce.",math:"Span(S) is the set of all finite linear combinations of vectors in S.",example:"2(1,0)+3(0,1)=(2,3), so (2,3) belongs to the span of {(1,0),(0,1)}."},
    {from:4,to:6,label:"Vector spaces → independence",plain:"The operations of a vector space make it possible to test whether one vector is redundant, using equations that add and scale vectors.",math:"A finite list v₁,…,vₙ is independent when c₁v₁+⋯+cₙvₙ=0 only if all coefficients are zero.",example:"(1,0) and (2,0) are dependent because 2(1,0)−(2,0)=(0,0)."},
    {from:5,to:6,label:"Span → basis",plain:"Span contributes the “enough to build everything” half of a basis. Spanning alone is not enough: the list might include extras.",math:"A basis spans the whole space and is linearly independent.",example:"{(1,0),(0,1),(1,1)} spans ℝ² but is not a basis because (1,1) is redundant."},
    {from:6,to:7,label:"Basis → dimension",plain:"Once you find a basis, you can count its vectors. Any other basis of the same finite-dimensional space has the same count.",math:"If B is a basis of a finite-dimensional space V, then dim V=|B|.",example:"{(1,0),(0,1)} is a basis with two vectors, so dim ℝ²=2."}
  ];

  function renderRoadmapControls() {
    if (!$('roadmap-controls')) return;
    $('roadmap-controls').innerHTML = ROADMAP_CONNECTIONS.map(function (c, i) {
      return '<button type="button" data-conn-btn="' + i + '" aria-pressed="false">' + esc(c.label) + '</button>';
    }).join('');
  }

  var activeRoadmap = { type: 'connection', index: 0 };

  function setActiveStageNode(idx) {
    document.querySelectorAll('#roadmap-visual .node[data-stage]').forEach(function (el) {
      el.classList.toggle('active', Number(el.getAttribute('data-stage')) === idx);
    });
  }
  function setActiveEdge(idx) {
    document.querySelectorAll('#roadmap-visual .edge').forEach(function (el, i) {
      el.classList.toggle('active', i === idx);
    });
    document.querySelectorAll('[data-conn-btn]').forEach(function (el) {
      el.setAttribute('aria-pressed', String(Number(el.getAttribute('data-conn-btn')) === idx));
    });
  }

  function showRoadmapStage(idx) {
    if (!$('roadmap-detail')) return;
    activeRoadmap = { type: 'stage', index: idx };
    var s = ROADMAP_STAGES[idx];
    setActiveStageNode(idx);
    setActiveEdge(-1);
    $('roadmap-detail').innerHTML =
      '<div class="detail-label">Topic</div>' +
      '<h3>' + esc(s.title) + '</h3>' +
      '<div class="plain-block"><strong>In everyday English:</strong> ' + esc(s.plain) + '</div>' +
      '<div class="math-block"><strong>In mathematical language:</strong> ' + esc(s.math) + '</div>' +
      '<div class="example-block"><strong>Example:</strong> ' + esc(s.example) + '</div>';
  }

  function showRoadmapConnection(idx) {
    if (!$('roadmap-detail')) return;
    activeRoadmap = { type: 'connection', index: idx };
    var c = ROADMAP_CONNECTIONS[idx];
    setActiveStageNode(-1);
    setActiveEdge(idx);
    $('roadmap-detail').innerHTML =
      '<div class="detail-label">Relationship</div>' +
      '<h3>' + esc(c.label) + '</h3>' +
      '<div class="plain-block"><strong>In everyday English:</strong> ' + esc(c.plain) + '</div>' +
      '<div class="math-block"><strong>In mathematical language:</strong> ' + esc(c.math) + '</div>' +
      '<div class="example-block"><strong>Example:</strong> ' + esc(c.example) + '</div>';
  }

  function initRoadmapVisual() {
    if (!$('roadmap-visual')) return;
    renderRoadmapControls();
    $('roadmap-visual').addEventListener('click', function (e) {
      var stage = e.target.closest('[data-stage]');
      var conn = e.target.closest('[data-conn]');
      if (stage) showRoadmapStage(Number(stage.getAttribute('data-stage')));
      else if (conn) showRoadmapConnection(Number(conn.getAttribute('data-conn')));
    });
    $('roadmap-visual').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var stage = e.target.closest('[data-stage]');
      if (stage) {
        e.preventDefault();
        showRoadmapStage(Number(stage.getAttribute('data-stage')));
      }
    });
    $('roadmap-controls').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-conn-btn]');
      if (btn) showRoadmapConnection(Number(btn.getAttribute('data-conn-btn')));
    });
    showRoadmapConnection(0);
  }

  function svgWrap(inner, viewBox) {
    return '<figure class="glossary-visual"><p class="visual-label">See the idea</p><svg viewBox="' + viewBox + '" role="img" aria-hidden="true">' + inner + '</svg><figcaption>';
  }

  function getGlossaryVisual(id) {
    var visuals = {
      'subset': [
        '<rect x="20" y="20" width="300" height="180" rx="18" fill="#eef4fb" stroke="#a8bfd7"/><rect x="95" y="55" width="150" height="110" rx="18" fill="#dcecff" stroke="#78a0d2"/><text x="170" y="118" text-anchor="middle" font-size="22" font-weight="700" fill="#20406a">A</text><text x="42" y="52" font-size="22" font-weight="700" fill="#20406a">B</text><text x="170" y="230" text-anchor="middle" font-size="16" fill="#516376">Everything in A sits inside B.</text>',
        '0 0 340 250',
        'The smaller collection lies entirely inside the larger one. That is what A ⊆ B means.'
      ],
      'union-intersection': [
        "<defs><clipPath id=\"union-left-clip\"><circle cx=\"155\" cy=\"120\" r=\"55\"/></clipPath><clipPath id=\"intersection-right-clip\"><circle cx=\"535\" cy=\"120\" r=\"55\"/></clipPath></defs>\n<text x=\"155\" y=\"33\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"700\" fill=\"#24364a\">Union: A ∪ B</text>\n<circle cx=\"125\" cy=\"120\" r=\"55\" fill=\"#cbe6f7\"/><circle cx=\"185\" cy=\"120\" r=\"55\" fill=\"#cbe6f7\"/>\n<circle cx=\"125\" cy=\"120\" r=\"55\" fill=\"none\" stroke=\"#5285b3\" stroke-width=\"3\"/>\n<circle cx=\"185\" cy=\"120\" r=\"55\" fill=\"none\" stroke=\"#5285b3\" stroke-width=\"3\"/>\n<text x=\"101\" y=\"122\" font-size=\"18\" fill=\"#244c73\" font-weight=\"700\">A</text><text x=\"207\" y=\"122\" font-size=\"18\" fill=\"#244c73\" font-weight=\"700\">B</text>\n<text x=\"505\" y=\"33\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"700\" fill=\"#24364a\">Intersection: A ∩ B</text>\n<circle cx=\"475\" cy=\"120\" r=\"55\" fill=\"#f9fbfd\" stroke=\"#5285b3\" stroke-width=\"3\"/>\n<circle cx=\"535\" cy=\"120\" r=\"55\" fill=\"#f9fbfd\" stroke=\"#5285b3\" stroke-width=\"3\"/>\n<circle cx=\"475\" cy=\"120\" r=\"55\" fill=\"#77b7a3\" clip-path=\"url(#intersection-right-clip)\"/>\n<text x=\"450\" y=\"122\" font-size=\"18\" fill=\"#244c73\" font-weight=\"700\">A</text><text x=\"555\" y=\"122\" font-size=\"18\" fill=\"#244c73\" font-weight=\"700\">B</text>\n<text x=\"155\" y=\"206\" text-anchor=\"middle\" font-size=\"17\" fill=\"#24364a\">Everything in either set</text>\n<text x=\"505\" y=\"206\" text-anchor=\"middle\" font-size=\"17\" fill=\"#24364a\">Only their shared part</text>",
        "0 0 680 240",
        "The left picture shades both circles (union). The right picture shades only the exact shared region (intersection)."
      ],
      'function': [
        '<rect x="28" y="26" width="115" height="168" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><rect x="197" y="26" width="115" height="168" rx="16" fill="#fff0df" stroke="#d7b07c"/><text x="85" y="48" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">Domain</text><text x="254" y="48" text-anchor="middle" font-size="18" font-weight="700" fill="#7b4d19">Codomain</text><circle cx="85" cy="84" r="10" fill="#3e72b1"/><circle cx="85" cy="125" r="10" fill="#3e72b1"/><circle cx="85" cy="166" r="10" fill="#3e72b1"/><circle cx="254" cy="92" r="10" fill="#c9833a"/><circle cx="254" cy="146" r="10" fill="#c9833a"/><path d="M95 84 C135 84, 185 92, 244 92" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><path d="M95 125 C135 125, 185 146, 244 146" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><path d="M95 166 C135 166, 185 92, 244 92" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><defs><marker id="ga" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">Each input has exactly one arrow leaving it.</text>',
        '0 0 340 245',
        'A function may send different inputs to the same output, but one input cannot split into two outputs.'
      ],
      'injective': [
        "<rect x=\"20\" y=\"26\" width=\"116\" height=\"180\" rx=\"14\" fill=\"#eef4fb\" stroke=\"#9db9d8\"/>\n<rect x=\"204\" y=\"26\" width=\"116\" height=\"180\" rx=\"14\" fill=\"#fff0df\" stroke=\"#dbb383\"/>\n<text x=\"78\" y=\"48\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#20406a\">2 inputs</text>\n<text x=\"262\" y=\"48\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#805223\">4 outputs</text>\n<g fill=\"#3670ae\"><circle cx=\"78\" cy=\"95\" r=\"10\"/><circle cx=\"78\" cy=\"160\" r=\"10\"/></g>\n<g fill=\"#d58a48\"><circle cx=\"262\" cy=\"70\" r=\"9\"/><circle cx=\"262\" cy=\"108\" r=\"9\"/><circle cx=\"262\" cy=\"146\" r=\"9\"/><circle cx=\"262\" cy=\"184\" r=\"9\"/></g>\n<g stroke=\"#526b8a\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M90 95 L250 70\"/><path d=\"M90 160 L250 146\"/></g>\n<text x=\"170\" y=\"232\" text-anchor=\"middle\" font-size=\"15\" fill=\"#24364a\">Different inputs, different destinations.</text>",
        "0 0 340 250",
        "The two inputs land at two different outputs. Two other possible outputs are not reached, which is allowed for injectivity."
      ],
      'surjective': [
        "<rect x=\"20\" y=\"24\" width=\"116\" height=\"190\" rx=\"14\" fill=\"#eef4fb\" stroke=\"#9db9d8\"/>\n<rect x=\"204\" y=\"24\" width=\"116\" height=\"190\" rx=\"14\" fill=\"#fff0df\" stroke=\"#dbb383\"/>\n<text x=\"78\" y=\"47\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#20406a\">4 inputs</text>\n<text x=\"262\" y=\"47\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#805223\">3 outputs</text>\n<g fill=\"#3670ae\"><circle cx=\"78\" cy=\"78\" r=\"10\"/><circle cx=\"78\" cy=\"113\" r=\"10\"/><circle cx=\"78\" cy=\"148\" r=\"10\"/><circle cx=\"78\" cy=\"183\" r=\"10\"/></g>\n<g fill=\"#d58a48\"><circle cx=\"262\" cy=\"83\" r=\"10\"/><circle cx=\"262\" cy=\"130\" r=\"10\"/><circle cx=\"262\" cy=\"179\" r=\"10\"/></g>\n<g stroke=\"#526b8a\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M90 78 L250 83\"/><path d=\"M90 113 L250 130\"/><path d=\"M90 148 L250 130\"/><path d=\"M90 183 L250 179\"/></g>\n<text x=\"170\" y=\"237\" text-anchor=\"middle\" font-size=\"15\" fill=\"#24364a\">Every output is hit; one is hit twice.</text>",
        "0 0 340 255",
        "All three outputs are reached. Two inputs share the middle output: this is surjective but not injective."
      ],
      'bijective': [
        "<rect x=\"20\" y=\"24\" width=\"116\" height=\"190\" rx=\"14\" fill=\"#eef4fb\" stroke=\"#9db9d8\"/>\n<rect x=\"204\" y=\"24\" width=\"116\" height=\"190\" rx=\"14\" fill=\"#fff0df\" stroke=\"#dbb383\"/>\n<text x=\"78\" y=\"47\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#20406a\">3 inputs</text>\n<text x=\"262\" y=\"47\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#805223\">3 outputs</text>\n<g fill=\"#3670ae\"><circle cx=\"78\" cy=\"83\" r=\"10\"/><circle cx=\"78\" cy=\"130\" r=\"10\"/><circle cx=\"78\" cy=\"179\" r=\"10\"/></g>\n<g fill=\"#d58a48\"><circle cx=\"262\" cy=\"83\" r=\"10\"/><circle cx=\"262\" cy=\"130\" r=\"10\"/><circle cx=\"262\" cy=\"179\" r=\"10\"/></g>\n<g stroke=\"#526b8a\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M90 83 L250 83\"/><path d=\"M90 130 L250 130\"/><path d=\"M90 179 L250 179\"/></g>\n<text x=\"170\" y=\"237\" text-anchor=\"middle\" font-size=\"15\" fill=\"#24364a\">Each output is hit exactly once.</text>",
        "0 0 340 255",
        "A perfect pairing. No output is missed, and no two inputs share one: bijective means injective and surjective."
      ],
      'equiv-class': [
        '<rect x="20" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><rect x="105" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><rect x="190" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><text x="55" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">0</text><text x="140" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">1</text><text x="225" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">2</text><text x="170" y="135" text-anchor="middle" font-size="17" fill="#516376">mod 3 classes</text><rect x="52" y="155" width="236" height="42" rx="12" fill="#e6f1ea" stroke="#88b49a"/><text x="170" y="181" text-anchor="middle" font-size="16" fill="#275c3c">[1] = {…, −5, −2, 1, 4, 7, …}</text>',
        '0 0 360 220',
        'Pick one element, then collect everything equivalent to it. That collection is its equivalence class.'
      ],
      'congruence': [
        "<circle cx=\"170\" cy=\"115\" r=\"86\" fill=\"#eef4fb\" stroke=\"#9bb5d3\" stroke-width=\"3\"/>\n<g font-size=\"21\" font-weight=\"700\" fill=\"#20406a\" text-anchor=\"middle\">\n<text x=\"170\" y=\"61\">0</text><text x=\"223\" y=\"102\">1</text><text x=\"137\" y=\"170\">3</text><text x=\"117\" y=\"102\">4</text></g>\n<circle cx=\"203\" cy=\"161\" r=\"21\" fill=\"#ffe8c3\" stroke=\"#c2833d\" stroke-width=\"2\"/>\n<text x=\"203\" y=\"168\" font-size=\"21\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#7b4a14\">2</text>\n<text x=\"170\" y=\"230\" text-anchor=\"middle\" font-size=\"16\" fill=\"#24364a\">7 and 2 both leave remainder 2 (mod 5).</text>",
        "0 0 340 250",
        "Numbers at the same remainder position belong to the same congruence class; both 7 and 2 give remainder 2 on division by 5."
      ],
      'zm': [
        '<circle cx="170" cy="110" r="74" fill="#eef4fb" stroke="#a8bfd7" stroke-width="3"/><g font-size="18" font-weight="700" fill="#20406a" text-anchor="middle"><text x="170" y="43">[0]</text><text x="239" y="83">[1]</text><text x="214" y="165">[2]</text><text x="126" y="165">[3]</text><text x="101" y="83">[4]</text></g><text x="170" y="222" text-anchor="middle" font-size="15" fill="#516376">Five classes: [0], [1], [2], [3], [4].</text>',
        '0 0 340 240',
        'Clock arithmetic does not keep every integer separately. It keeps one class for each remainder.'
      ],
      'units': [
        "<circle cx=\"170\" cy=\"116\" r=\"86\" fill=\"#eef4fb\" stroke=\"#9bb5d3\" stroke-width=\"3\"/>\n<g font-size=\"21\" font-weight=\"700\" fill=\"#20406a\" text-anchor=\"middle\">\n<text x=\"170\" y=\"61\">0</text><text x=\"223\" y=\"102\">1</text><text x=\"203\" y=\"170\">2</text><text x=\"137\" y=\"170\">3</text><text x=\"117\" y=\"102\">4</text></g>\n<path d=\"M185 174 Q170 199 155 174\" fill=\"none\" stroke=\"#b6672b\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n<path d=\"M185 174 l-1 12 l-10 -8 M155 174 l9 5 l-8 9\" fill=\"none\" stroke=\"#b6672b\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n<text x=\"170\" y=\"232\" font-size=\"16\" fill=\"#24364a\" text-anchor=\"middle\">2 × 3 ≡ 1 (mod 5)</text>",
        "0 0 340 250",
        "The curved connection joins the positions for 2 and 3, because multiplying them gives remainder 1 modulo 5."
      ],
      'field': [
        '<rect x="32" y="38" width="125" height="148" rx="16" fill="#e7f3ea" stroke="#88b49a"/><rect x="183" y="38" width="125" height="148" rx="16" fill="#fff0df" stroke="#d7b07c"/><text x="94" y="67" text-anchor="middle" font-size="18" font-weight="700" fill="#275c3c">Allowed</text><text x="246" y="67" text-anchor="middle" font-size="18" font-weight="700" fill="#7b4d19">Not allowed</text><text x="94" y="100" text-anchor="middle" font-size="15" fill="#275c3c">add</text><text x="94" y="124" text-anchor="middle" font-size="15" fill="#275c3c">subtract</text><text x="94" y="148" text-anchor="middle" font-size="15" fill="#275c3c">multiply</text><text x="94" y="172" text-anchor="middle" font-size="15" fill="#275c3c">divide by nonzero</text><text x="246" y="124" text-anchor="middle" font-size="15" fill="#7b4d19">divide by 0</text><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">Division by nonzero elements is allowed.</text>',
        '0 0 340 240',
        'The picture compresses the idea: fields support the usual arithmetic and inverses for every nonzero element.'
      ],
      'vector-space': [
        "<defs><marker id=\"vs-arrow\" markerWidth=\"8\" markerHeight=\"8\" refX=\"6\" refY=\"4\" orient=\"auto\"><path d=\"M0 0 L7 4 L0 8Z\" fill=\"#2a506e\"/></marker></defs>\n<line x1=\"36\" y1=\"214\" x2=\"288\" y2=\"214\" stroke=\"#aebdcb\" stroke-width=\"2\"/>\n<line x1=\"50\" y1=\"230\" x2=\"50\" y2=\"28\" stroke=\"#aebdcb\" stroke-width=\"2\"/>\n<circle cx=\"50\" cy=\"214\" r=\"4\" fill=\"#24364a\"/><text x=\"35\" y=\"235\" font-size=\"13\" fill=\"#24364a\">0</text>\n<path d=\"M50 214 L110 174\" stroke=\"#2a68ae\" stroke-width=\"4\" fill=\"none\" marker-end=\"url(#vs-arrow)\"/>\n<path d=\"M50 214 L85 154\" stroke=\"#c4742c\" stroke-width=\"4\" fill=\"none\" marker-end=\"url(#vs-arrow)\"/>\n<path d=\"M50 214 L170 134\" stroke=\"#2a68ae\" stroke-width=\"3\" stroke-dasharray=\"6 4\" fill=\"none\"/>\n<path d=\"M170 134 L205 74\" stroke=\"#c4742c\" stroke-width=\"4\" fill=\"none\" marker-end=\"url(#vs-arrow)\"/>\n<path d=\"M50 214 L205 74\" stroke=\"#2c8a59\" stroke-width=\"5\" fill=\"none\" marker-end=\"url(#vs-arrow)\"/>\n<text x=\"108\" y=\"160\" font-size=\"15\" fill=\"#24588f\">u</text>\n<text x=\"74\" y=\"137\" font-size=\"15\" fill=\"#9a541c\">v</text>\n<text x=\"141\" y=\"120\" font-size=\"14\" fill=\"#24588f\">2u</text>\n<text x=\"214\" y=\"68\" font-size=\"15\" fill=\"#247148\">2u + v</text>",
        "0 0 340 260",
        "Blue u is doubled to the dashed 2u; then orange v is moved to its tip. The green arrow from zero to the final point is exactly 2u + v."
      ],
      'subspace': [
        '<line x1="40" y1="180" x2="40" y2="32" stroke="#7d90a8" stroke-width="2"/><line x1="25" y1="165" x2="145" y2="165" stroke="#7d90a8" stroke-width="2"/><line x1="55" y1="150" x2="130" y2="80" stroke="#2f7a4a" stroke-width="5"/><circle cx="92" cy="115" r="4" fill="#2f7a4a"/><text x="95" y="220" text-anchor="middle" font-size="14" fill="#516376">through the origin ✓</text><line x1="195" y1="180" x2="195" y2="32" stroke="#7d90a8" stroke-width="2"/><line x1="180" y1="165" x2="300" y2="165" stroke="#7d90a8" stroke-width="2"/><line x1="210" y1="120" x2="285" y2="65" stroke="#c9833a" stroke-width="5"/><text x="245" y="220" text-anchor="middle" font-size="14" fill="#516376">offset line ✗</text>',
        '0 0 330 240',
        'A familiar visual test in ℝ²: a line through the origin can be a subspace; a shifted line cannot.'
      ],
      'lincomb': [
        "<defs><marker id=\"lc-arrow\" markerWidth=\"9\" markerHeight=\"9\" refX=\"7\" refY=\"4.5\" orient=\"auto\"><path d=\"M0 0 L8 4.5 L0 9Z\" fill=\"#374f75\"/></marker></defs>\n<line x1=\"42\" y1=\"210\" x2=\"294\" y2=\"210\" stroke=\"#bac7d5\" stroke-width=\"2\"/>\n<line x1=\"60\" y1=\"222\" x2=\"60\" y2=\"28\" stroke=\"#bac7d5\" stroke-width=\"2\"/>\n<circle cx=\"60\" cy=\"210\" r=\"4\" fill=\"#24364a\"/><text x=\"43\" y=\"229\" font-size=\"13\" fill=\"#24364a\">0</text>\n<path d=\"M60 210 L180 210\" stroke=\"#2a68ae\" stroke-width=\"5\" fill=\"none\" marker-end=\"url(#lc-arrow)\"/>\n<path d=\"M180 210 L180 126\" stroke=\"#cb772e\" stroke-width=\"5\" fill=\"none\" marker-end=\"url(#lc-arrow)\"/>\n<path d=\"M60 210 L180 126\" stroke=\"#7e4fa3\" stroke-width=\"5\" fill=\"none\" marker-end=\"url(#lc-arrow)\"/>\n<path d=\"M60 210 L60 126 L180 126\" stroke=\"#9daabb\" stroke-width=\"2\" stroke-dasharray=\"5 4\" fill=\"none\"/>\n<text x=\"112\" y=\"237\" font-size=\"15\" fill=\"#24588f\" text-anchor=\"middle\">2v₁</text>\n<text x=\"194\" y=\"169\" font-size=\"15\" fill=\"#9a541c\">v₂</text>\n<text x=\"198\" y=\"111\" font-size=\"14\" fill=\"#67428c\">2v₁ + v₂</text>",
        "0 0 340 255",
        "From the origin, move right by 2v₁ (blue), then add v₂ (orange, translated to the blue arrow’s tip). The purple result ends at exactly the same point."
      ],
      'span': [
        "<line x1=\"30\" y1=\"205\" x2=\"306\" y2=\"205\" stroke=\"#bdcad7\" stroke-width=\"2\"/>\n<line x1=\"90\" y1=\"227\" x2=\"90\" y2=\"26\" stroke=\"#bdcad7\" stroke-width=\"2\"/>\n<line x1=\"25\" y1=\"232\" x2=\"280\" y2=\"62\" stroke=\"#9055b4\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n<circle cx=\"90\" cy=\"189\" r=\"5\" fill=\"#24364a\"/>\n<text x=\"71\" y=\"211\" font-size=\"14\" fill=\"#24364a\">0</text>\n<path d=\"M90 189 L164 140\" stroke=\"#2a68ae\" stroke-width=\"5\" fill=\"none\"/>\n<path d=\"M153 143 L164 140 L158 153\" stroke=\"#2a68ae\" stroke-width=\"4\" fill=\"none\"/>\n<text x=\"169\" y=\"136\" font-size=\"16\" fill=\"#24588f\">v</text>\n<text x=\"170\" y=\"247\" text-anchor=\"middle\" font-size=\"15\" fill=\"#24364a\">The purple line shows all real multiples of v.</text>",
        "0 0 340 262",
        "The origin is 0. The blue generating vector v lies on the purple line, and any real multiple of v also lies on that line (including negative multiples)."
      ],
      'indep': [
        '<line x1="40" y1="185" x2="40" y2="30" stroke="#7d90a8" stroke-width="2"/><line x1="25" y1="170" x2="145" y2="170" stroke="#7d90a8" stroke-width="2"/><path d="M40 170 L102 110" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gh)"/><path d="M40 170 L134 158" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gh)"/><text x="92" y="220" text-anchor="middle" font-size="14" fill="#516376">independent</text><line x1="190" y1="185" x2="190" y2="30" stroke="#7d90a8" stroke-width="2"/><line x1="175" y1="170" x2="305" y2="170" stroke="#7d90a8" stroke-width="2"/><path d="M190 170 L240 130" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gh)"/><path d="M190 170 L290 90" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gh)" stroke-dasharray="6 5"/><text x="250" y="220" text-anchor="middle" font-size="14" fill="#516376">dependent</text><defs><marker id="gh" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs>',
        '0 0 330 240',
        'Independent vectors contribute genuinely new directions.'
      ],
      'basis': [
        '<rect x="25" y="30" width="125" height="170" rx="16" fill="#e7f3ea" stroke="#88b49a"/><rect x="185" y="30" width="125" height="170" rx="16" fill="#fff0df" stroke="#d7b07c"/><text x="87" y="60" text-anchor="middle" font-size="17" font-weight="700" fill="#275c3c">Enough</text><text x="87" y="88" text-anchor="middle" font-size="15" fill="#275c3c">spans the space</text><text x="247" y="60" text-anchor="middle" font-size="17" font-weight="700" fill="#7b4d19">No extras</text><text x="247" y="88" text-anchor="middle" font-size="15" fill="#7b4d19">independent</text><text x="170" y="150" text-anchor="middle" font-size="22" font-weight="700" fill="#20406a">basis</text><text x="170" y="222" text-anchor="middle" font-size="15" fill="#516376">A basis combines spanning and independence.</text>',
        '0 0 340 240',
        'Think of a basis as “enough vectors, but not too many.”'
      ],
      'dimension': [
        '<rect x="25" y="56" width="80" height="80" rx="14" fill="#eef4fb" stroke="#a8bfd7"/><rect x="130" y="56" width="80" height="80" rx="14" fill="#eef4fb" stroke="#a8bfd7"/><rect x="235" y="56" width="80" height="80" rx="14" fill="#eef4fb" stroke="#a8bfd7"/><text x="65" y="103" text-anchor="middle" font-size="26" font-weight="700" fill="#20406a">v₁</text><text x="170" y="103" text-anchor="middle" font-size="26" font-weight="700" fill="#20406a">v₂</text><text x="275" y="103" text-anchor="middle" font-size="26" font-weight="700" fill="#20406a">v₃</text><text x="170" y="185" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">3 vectors in a basis → dimension 3</text>',
        '0 0 340 215',
        'Dimension is the count of vectors in any basis of the space.'
      ]
    };
    var v = visuals[id];
    if (!v) return '';
    return svgWrap(v[0], v[1]) + esc(v[2]) + '</figcaption></figure>';
  }


  /* ---------- Startup ---------- */
  $('topic-sel').innerHTML = '<option value="all">All topics</option>' + TOPIC_KEYS.map(function (k) {
    return '<option value="' + k + '">' + esc(TOPICS[k]) + '</option>';
  }).join('');

  $('gsearch').addEventListener('input', renderGlossary);
  $('gstage').addEventListener('change', renderGlossary);

  renderGlossary();
  buildQueue();
  renderPractice();
  renderDec();
  renderChecklist();
  initRoadmapVisual();
  route();
  window.addEventListener('hashchange', route);
})();
