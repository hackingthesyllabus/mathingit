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
      return '<details class="entry" id="g-' + g.id + '">' +
        '<summary>' + esc(g.term) + '<span class="tag">' + esc(STAGES[g.stage]) + '</span></summary>' +
        '<p>' + esc(g.plain) + '</p>' +
        '<h3>Precise version</h3><div class="formula">' + esc(g.formal) + '</div>' +
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
  route();
  window.addEventListener('hashchange', route);
})();
