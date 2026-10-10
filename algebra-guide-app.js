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
    {
      title: 'Sets and functions',
      plain: 'This is where the course starts. You learn what the objects are, how to describe collections, and how to talk about rules that send inputs to outputs.',
      math: 'Sets give the language of membership, subsets, unions and products. Functions give the language of domain, codomain, injective, surjective, bijective and invertible.',
      example: 'once you know what a function is, you can ask whether f(x)=2x+1 is one-to-one or onto.'
    },
    {
      title: 'Equivalence and clock arithmetic',
      plain: 'Instead of treating every integer as separate, you start grouping numbers that behave the same way with respect to a modulus.',
      math: 'Congruence modulo m is an equivalence relation on the integers. Its equivalence classes are the elements of ℤ/mℤ.',
      example: 'mod 5, the integers ..., -3, 2, 7, and 12 all belong to the same class because they leave remainder 2.'
    },
    {
      title: 'Fields',
      plain: 'A field is a number system where arithmetic behaves well enough that you can add, subtract, multiply, and divide by nonzero elements.',
      math: 'A field provides the scalars used later in vector spaces. Typical examples are ℚ, ℝ, ℂ, and ℤ/pℤ when p is prime.',
      example: 'over ℝ you can scale a vector by 2 or by 1/3. That only works cleanly because ℝ is a field.'
    },
    {
      title: 'Vector spaces',
      plain: 'Now the objects are vectors. You can add them together and scale them by numbers from a field.',
      math: 'A vector space V over a field F has vector addition and scalar multiplication satisfying the vector-space axioms.',
      example: 'ℝ² is a vector space over ℝ, and ℂ is a vector space over ℝ as well.'
    },
    {
      title: 'Span and combinations',
      plain: 'Once you have vectors, a natural question is what you can build from a given list of them.',
      math: 'The span of a set S is the set of all linear combinations of vectors from S.',
      example: 'in ℝ², the vectors (1,0) and (0,1) can build any vector (a,b), so they span ℝ².'
    },
    {
      title: 'Independence',
      plain: 'A second natural question is whether some vectors are unnecessary because they can already be built from the others.',
      math: 'A list is linearly independent when the only linear combination giving 0 uses all-zero coefficients.',
      example: '(1,0) and (2,0) are dependent because one is a multiple of the other.'
    },
    {
      title: 'Basis',
      plain: 'A basis is the sweet spot: enough vectors to build everything, but no extra redundant ones.',
      math: 'A basis is a linearly independent spanning set.',
      example: '{(1,0),(0,1)} is a basis of ℝ².'
    },
    {
      title: 'Dimension',
      plain: 'Dimension counts how many independent building blocks a space needs.',
      math: 'The dimension of a finite-dimensional vector space is the number of vectors in any basis.',
      example: 'ℝ² has dimension 2 because every basis has two vectors.'
    }
  ];

  var ROADMAP_CONNECTIONS = [
    {
      from: 0, to: 1, label: 'Sets/functions → equivalence/clock',
      plain: 'Sets let you talk about collections, and functions teach you how mathematics tracks rules and outputs. That language is then reused when you define an equivalence relation, which groups a set into “same kind as” classes.',
      math: 'An equivalence relation is a special subset of S × S. Its equivalence classes partition the set S. Congruence modulo m is one such relation on ℤ.',
      example: 'integers become grouped by remainder mod 5: one class for remainder 0, one for remainder 1, and so on.'
    },
    {
      from: 1, to: 2, label: 'Clock arithmetic → fields',
      plain: 'Clock arithmetic gives you new number systems. Some of those systems are good enough to allow division by every nonzero element, and those are exactly the ones that become fields.',
      math: 'ℤ/mℤ is a ring for every m. It is a field exactly when m is prime.',
      example: 'ℤ/5ℤ is a field, but ℤ/6ℤ is not because 2·3 ≡ 0 mod 6.'
    },
    {
      from: 2, to: 3, label: 'Fields → vector spaces',
      plain: 'Vectors need numbers to scale them. The field tells you which numbers are allowed as scalars and guarantees that scalar arithmetic behaves properly.',
      math: 'A vector space V is defined over a field F, and scalar multiplication is a map F × V → V.',
      example: 'ℝ² is a vector space over ℝ. You can multiply a vector by any real number.'
    },
    {
      from: 3, to: 4, label: 'Vector spaces → span',
      plain: 'After defining a vector space, the next question is what new vectors you can produce from a given list.',
      math: 'Span is defined using linear combinations inside a vector space.',
      example: 'all vectors of the form a(1,0)+b(0,1) make up the span of {(1,0),(0,1)}.'
    },
    {
      from: 3, to: 5, label: 'Vector spaces → independence',
      plain: 'At the same time, you want to know whether a list has unnecessary repeats in disguise.',
      math: 'Independence is tested by asking whether c₁v₁+⋯+cₙvₙ=0 has only the trivial solution.',
      example: 'if one vector is a scalar multiple of another, the list is dependent.'
    },
    {
      from: 4, to: 6, label: 'Span → basis',
      plain: 'Span contributes the “enough vectors” half of the basis idea.',
      math: 'If a list spans V, it can potentially be a basis, but only if it is also independent.',
      example: 'three vectors may span ℝ², but one of them is then redundant.'
    },
    {
      from: 5, to: 6, label: 'Independence → basis',
      plain: 'Independence contributes the “no redundancy” half of the basis idea.',
      math: 'A basis is exactly a spanning set that is also linearly independent.',
      example: '{(1,0),(0,1)} is independent and spans ℝ², so it is a basis.'
    },
    {
      from: 6, to: 7, label: 'Basis → dimension',
      plain: 'Once you find a basis, counting its vectors tells you the dimension.',
      math: 'All bases of the same finite-dimensional vector space have the same size, so dimension is well defined.',
      example: 'every basis of ℝ³ has three vectors, so dim(ℝ³)=3.'
    }
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
        '<circle cx="135" cy="104" r="60" fill="#cfe2ff" stroke="#77a0d8"/><circle cx="205" cy="104" r="60" fill="#ffe6c8" stroke="#d59f60"/><path d="M170 48 A60 60 0 0 1 170 160 A60 60 0 0 1 170 48 Z" fill="#cfdcc0" opacity="0.95"/><text x="112" y="104" text-anchor="middle" font-size="24" font-weight="700" fill="#244264">A</text><text x="228" y="104" text-anchor="middle" font-size="24" font-weight="700" fill="#7e4d17">B</text><text x="170" y="220" text-anchor="middle" font-size="16" fill="#516376">Union = both circles together. Intersection = the overlap.</text>',
        '0 0 340 250',
        'Use the picture to separate “everything in either set” from “only what they share.”'
      ],
      'function': [
        '<rect x="28" y="26" width="115" height="168" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><rect x="197" y="26" width="115" height="168" rx="16" fill="#fff0df" stroke="#d7b07c"/><text x="85" y="48" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">Domain</text><text x="254" y="48" text-anchor="middle" font-size="18" font-weight="700" fill="#7b4d19">Codomain</text><circle cx="85" cy="84" r="10" fill="#3e72b1"/><circle cx="85" cy="125" r="10" fill="#3e72b1"/><circle cx="85" cy="166" r="10" fill="#3e72b1"/><circle cx="254" cy="92" r="10" fill="#c9833a"/><circle cx="254" cy="146" r="10" fill="#c9833a"/><path d="M95 84 C135 84, 185 92, 244 92" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><path d="M95 125 C135 125, 185 146, 244 146" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><path d="M95 166 C135 166, 185 92, 244 92" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#ga)"/><defs><marker id="ga" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">Each input has exactly one arrow leaving it.</text>',
        '0 0 340 245',
        'A function may send different inputs to the same output, but one input cannot split into two outputs.'
      ],
      'injective': [
        '<rect x="20" y="26" width="115" height="168" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><rect x="205" y="26" width="115" height="168" rx="16" fill="#fff0df" stroke="#d7b07c"/><circle cx="78" cy="84" r="10" fill="#3e72b1"/><circle cx="78" cy="125" r="10" fill="#3e72b1"/><circle cx="78" cy="166" r="10" fill="#3e72b1"/><circle cx="262" cy="84" r="10" fill="#c9833a"/><circle cx="262" cy="125" r="10" fill="#c9833a"/><circle cx="262" cy="166" r="10" fill="#c9833a"/><path d="M88 84 C135 84, 185 84, 252 84" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gb)"/><path d="M88 125 C135 125, 185 125, 252 125" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gb)"/><path d="M88 166 C135 166, 185 166, 252 166" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gb)"/><defs><marker id="gb" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">No two different inputs land at the same output.</text>',
        '0 0 340 245',
        'Injective means no collisions.'
      ],
      'surjective': [
        '<rect x="20" y="26" width="115" height="168" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><rect x="205" y="26" width="115" height="168" rx="16" fill="#fff0df" stroke="#d7b07c"/><circle cx="78" cy="84" r="10" fill="#3e72b1"/><circle cx="78" cy="125" r="10" fill="#3e72b1"/><circle cx="78" cy="166" r="10" fill="#3e72b1"/><circle cx="262" cy="84" r="10" fill="#c9833a"/><circle cx="262" cy="125" r="10" fill="#c9833a"/><circle cx="262" cy="166" r="10" fill="#c9833a"/><path d="M88 84 C150 84, 180 84, 252 84" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gc)"/><path d="M88 125 C135 125, 190 125, 252 125" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gc)"/><path d="M88 166 C135 166, 185 166, 252 166" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gc)"/><defs><marker id="gc" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">Every output gets hit by at least one input.</text>',
        '0 0 340 245',
        'Surjective means nothing in the codomain is missed.'
      ],
      'bijective': [
        '<rect x="20" y="26" width="115" height="168" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><rect x="205" y="26" width="115" height="168" rx="16" fill="#fff0df" stroke="#d7b07c"/><circle cx="78" cy="84" r="10" fill="#3e72b1"/><circle cx="78" cy="125" r="10" fill="#3e72b1"/><circle cx="78" cy="166" r="10" fill="#3e72b1"/><circle cx="262" cy="84" r="10" fill="#c9833a"/><circle cx="262" cy="125" r="10" fill="#c9833a"/><circle cx="262" cy="166" r="10" fill="#c9833a"/><path d="M88 84 C135 84, 185 84, 252 84" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gd)"/><path d="M88 125 C135 125, 185 125, 252 125" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gd)"/><path d="M88 166 C135 166, 185 166, 252 166" stroke="#728aa5" stroke-width="3" fill="none" marker-end="url(#gd)"/><defs><marker id="gd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">Each output is reached exactly once, so the rule can be undone.</text>',
        '0 0 340 245',
        'Bijective means both injective and surjective.'
      ],
      'equiv-class': [
        '<rect x="20" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><rect x="105" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><rect x="190" y="40" width="70" height="50" rx="12" fill="#eef4fb" stroke="#a8bfd7"/><text x="55" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">0</text><text x="140" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">1</text><text x="225" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="#20406a">2</text><text x="170" y="135" text-anchor="middle" font-size="17" fill="#516376">mod 3 classes</text><rect x="52" y="155" width="236" height="42" rx="12" fill="#e6f1ea" stroke="#88b49a"/><text x="170" y="181" text-anchor="middle" font-size="16" fill="#275c3c">[1] = {…, −5, −2, 1, 4, 7, …}</text>',
        '0 0 360 220',
        'Pick one element, then collect everything equivalent to it. That collection is its equivalence class.'
      ],
      'congruence': [
        '<circle cx="170" cy="110" r="70" fill="#eef4fb" stroke="#a8bfd7" stroke-width="3"/><g font-size="18" font-weight="700" fill="#20406a" text-anchor="middle"><text x="170" y="52">0</text><text x="228" y="78">1</text><text x="252" y="138">2</text><text x="170" y="190">3</text><text x="94" y="138">4</text></g><circle cx="252" cy="138" r="18" fill="#ffefd7" stroke="#d6a76d"/><text x="252" y="144" text-anchor="middle" font-size="16" font-weight="700" fill="#7b4d19">2</text><text x="170" y="222" text-anchor="middle" font-size="15" fill="#516376">7 and 2 land at the same clock position mod 5.</text>',
        '0 0 340 240',
        'Congruent numbers behave the same with respect to the chosen modulus because they have the same remainder.'
      ],
      'zm': [
        '<circle cx="170" cy="110" r="74" fill="#eef4fb" stroke="#a8bfd7" stroke-width="3"/><g font-size="18" font-weight="700" fill="#20406a" text-anchor="middle"><text x="170" y="43">[0]</text><text x="239" y="83">[1]</text><text x="214" y="165">[2]</text><text x="126" y="165">[3]</text><text x="101" y="83">[4]</text></g><text x="170" y="222" text-anchor="middle" font-size="15" fill="#516376">ℤ/5ℤ has five positions: one class for each remainder.</text>',
        '0 0 340 240',
        'Clock arithmetic does not keep every integer separately. It keeps one class for each remainder.'
      ],
      'units': [
        '<circle cx="170" cy="110" r="74" fill="#eef4fb" stroke="#a8bfd7" stroke-width="3"/><g font-size="18" font-weight="700" fill="#20406a" text-anchor="middle"><text x="170" y="43">0</text><text x="239" y="83">1</text><text x="214" y="165">2</text><text x="126" y="165">3</text><text x="101" y="83">4</text></g><path d="M206 153 C220 135, 232 110, 239 91" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#ge)"/><path d="M231 99 C222 118, 208 140, 190 154" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#ge)"/><defs><marker id="ge" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="170" y="222" text-anchor="middle" font-size="15" fill="#516376">In ℤ/5ℤ, 2 and 3 are partners because 2·3 ≡ 1.</text>',
        '0 0 340 240',
        'A unit has a multiplicative partner that brings you to 1.'
      ],
      'field': [
        '<rect x="32" y="38" width="125" height="148" rx="16" fill="#e7f3ea" stroke="#88b49a"/><rect x="183" y="38" width="125" height="148" rx="16" fill="#fff0df" stroke="#d7b07c"/><text x="94" y="67" text-anchor="middle" font-size="18" font-weight="700" fill="#275c3c">Allowed</text><text x="246" y="67" text-anchor="middle" font-size="18" font-weight="700" fill="#7b4d19">Not allowed</text><text x="94" y="100" text-anchor="middle" font-size="15" fill="#275c3c">add</text><text x="94" y="124" text-anchor="middle" font-size="15" fill="#275c3c">subtract</text><text x="94" y="148" text-anchor="middle" font-size="15" fill="#275c3c">multiply</text><text x="94" y="172" text-anchor="middle" font-size="15" fill="#275c3c">divide by nonzero</text><text x="246" y="124" text-anchor="middle" font-size="15" fill="#7b4d19">divide by 0</text><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">A field is a system where the usual arithmetic works, except division by 0.</text>',
        '0 0 340 240',
        'The picture compresses the idea: fields support the usual arithmetic and inverses for every nonzero element.'
      ],
      'vector-space': [
        '<line x1="45" y1="190" x2="45" y2="28" stroke="#7d90a8" stroke-width="2"/><line x1="30" y1="175" x2="292" y2="175" stroke="#7d90a8" stroke-width="2"/><path d="M45 175 L132 102" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gf)"/><path d="M45 175 L235 145" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gf)"/><path d="M45 175 L215 72" stroke="#2f7a4a" stroke-width="4" fill="none" marker-end="url(#gf)"/><defs><marker id="gf" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="140" y="94" font-size="15" fill="#3e72b1">u</text><text x="240" y="143" font-size="15" fill="#c9833a">v</text><text x="218" y="68" font-size="15" fill="#2f7a4a">2u+v</text><text x="170" y="225" text-anchor="middle" font-size="15" fill="#516376">A vector space lets you add vectors and scale them.</text>',
        '0 0 320 240',
        'The green arrow is built from the blue and orange ones, showing addition and scalar multiplication.'
      ],
      'subspace': [
        '<line x1="40" y1="180" x2="40" y2="32" stroke="#7d90a8" stroke-width="2"/><line x1="25" y1="165" x2="145" y2="165" stroke="#7d90a8" stroke-width="2"/><line x1="55" y1="150" x2="130" y2="80" stroke="#2f7a4a" stroke-width="5"/><circle cx="92" cy="115" r="4" fill="#2f7a4a"/><text x="95" y="220" text-anchor="middle" font-size="14" fill="#516376">through the origin ✓</text><line x1="195" y1="180" x2="195" y2="32" stroke="#7d90a8" stroke-width="2"/><line x1="180" y1="165" x2="300" y2="165" stroke="#7d90a8" stroke-width="2"/><line x1="210" y1="120" x2="285" y2="65" stroke="#c9833a" stroke-width="5"/><text x="245" y="220" text-anchor="middle" font-size="14" fill="#516376">offset line ✗</text>',
        '0 0 330 240',
        'A familiar visual test in ℝ²: a line through the origin can be a subspace; a shifted line cannot.'
      ],
      'lincomb': [
        '<line x1="40" y1="190" x2="40" y2="32" stroke="#7d90a8" stroke-width="2"/><line x1="25" y1="175" x2="300" y2="175" stroke="#7d90a8" stroke-width="2"/><path d="M40 175 L120 125" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gg)"/><path d="M40 175 L80 75" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gg)"/><path d="M40 175 L160 95" stroke="#8b56a8" stroke-width="5" fill="none" marker-end="url(#gg)"/><defs><marker id="gg" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs><text x="125" y="121" font-size="14" fill="#3e72b1">2v₁</text><text x="82" y="70" font-size="14" fill="#c9833a">v₂</text><text x="164" y="92" font-size="14" fill="#8b56a8">2v₁+v₂</text>',
        '0 0 330 240',
        'A linear combination is what you get after scaling some vectors and adding the results.'
      ],
      'span': [
        '<rect x="38" y="46" width="254" height="152" rx="16" fill="#eef4fb" stroke="#a8bfd7"/><line x1="58" y1="174" x2="270" y2="68" stroke="#a14e90" stroke-width="5"/><circle cx="170" cy="120" r="4" fill="#a14e90"/><text x="170" y="220" text-anchor="middle" font-size="15" fill="#516376">All purple points belong to the span.</text><text x="170" y="240" text-anchor="middle" font-size="13" fill="#516376">If one vector is available, the span may be a line.</text>',
        '0 0 330 255',
        'Span is the collection of everything you can reach using linear combinations.'
      ],
      'indep': [
        '<line x1="40" y1="185" x2="40" y2="30" stroke="#7d90a8" stroke-width="2"/><line x1="25" y1="170" x2="145" y2="170" stroke="#7d90a8" stroke-width="2"/><path d="M40 170 L102 110" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gh)"/><path d="M40 170 L134 158" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gh)"/><text x="92" y="220" text-anchor="middle" font-size="14" fill="#516376">independent</text><line x1="190" y1="185" x2="190" y2="30" stroke="#7d90a8" stroke-width="2"/><line x1="175" y1="170" x2="305" y2="170" stroke="#7d90a8" stroke-width="2"/><path d="M190 170 L240 130" stroke="#3e72b1" stroke-width="4" fill="none" marker-end="url(#gh)"/><path d="M190 170 L290 90" stroke="#c9833a" stroke-width="4" fill="none" marker-end="url(#gh)" stroke-dasharray="6 5"/><text x="250" y="220" text-anchor="middle" font-size="14" fill="#516376">dependent if one is built from the other</text><defs><marker id="gh" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#728aa5"/></marker></defs>',
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
