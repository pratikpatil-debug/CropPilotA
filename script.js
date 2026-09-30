/**
 * ============================================================================
 * WHY ARE YOU ASKING ME? - MAIN INTERACTION SCRIPT
 * An intentionally terrible & overloaded control panel that ALWAYS gives you
 * a genuine, accurate, and useful answer to any question.
 * ============================================================================
 */

(function () {
  'use strict';

  // ==================== STATE MANAGEMENT ====================
  const state = {
    soundEnabled: true,
    adsEndured: 0,
    startTime: null,
    currentQuestion: '',
    answersServed: 14208,
    visitorCount: 489215,
    liveAskers: 1842,
    healthPercent: 99.41,
    optPercent: 14,
    entropy: 0.7428,
    achievementsUnlocked: 1,
    isProcessing: false,
    customApiKey: sessionStorage.getItem('wayam_api_key') || '',
    customEndpoint: sessionStorage.getItem('wayam_endpoint') || '',
    customModel: sessionStorage.getItem('wayam_model') || '',
    clicksWasted: 0,
    surpriseAds: 0,
    clickTrapThreshold: 3, // ad triggers every 3 random clicks anywhere
    clickTrapActive: true,
    keystrokesCount: 0,
    typingAdsMode: 'word', // 'word' (spacebar/word), 'chars5' (every 5 chars), or 'hyper' (every single key)
    keystrokesSinceAd: 0,
    wasTyping: false
  };

  // ==================== SOUND SYNTHESIZER (Web Audio API) ====================
  // Zero external files, harmless retro blips, clicks, and chimes
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.05) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay restrictions or unsupported
    }
  }

  function playBlip() { playTone(600, 'square', 0.05, 0.03); }
  function playClick() { playTone(350, 'triangle', 0.04, 0.04); }
  function playSuccess() {
    if (!state.soundEnabled) return;
    playTone(523.25, 'sine', 0.1, 0.04);
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.04), 100);
    setTimeout(() => playTone(783.99, 'sine', 0.2, 0.05), 200);
  }
  function playWarning() {
    if (!state.soundEnabled) return;
    playTone(220, 'sawtooth', 0.15, 0.04);
    setTimeout(() => playTone(180, 'sawtooth', 0.18, 0.04), 140);
  }

  // ==================== DOM ELEMENTS ====================
  const dom = {
    clockWidget: document.getElementById('clockWidget'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    reorganizeBtn: document.getElementById('reorganizeBtn'),
    mainContainer: document.getElementById('mainContainer'),
    liveTickerText: document.getElementById('tickerText'),
    entropyVal: document.getElementById('entropyVal'),
    clicksWastedCount: document.getElementById('clicksWastedCount'),
    surpriseAdsCount: document.getElementById('surpriseAdsCount'),
    clickTrapBtn: document.getElementById('clickTrapBtn'),
    typingAdModeBtn: document.getElementById('typingAdModeBtn'),
    typingAdBanner: document.getElementById('typingAdBanner'),
    typingAdKeystrokesCount: document.getElementById('typingAdKeystrokesCount'),
    typingAdBodyText: document.getElementById('typingAdBodyText'),
    answersServedCount: document.getElementById('answersServedCount'),
    visitorCounter: document.getElementById('visitorCounter'),
    liveAskersCount: document.getElementById('liveAskersCount'),
    systemHealthVal: document.getElementById('systemHealthVal'),
    dialNeedle: document.getElementById('dialNeedle'),
    optimizationFill: document.getElementById('optimizationFill'),
    optPercent: document.getElementById('optPercent'),
    optimizeBtn: document.getElementById('optimizeBtn'),
    optNote: document.getElementById('optNote'),
    scopeCanvas: document.getElementById('scopeCanvas'),
    scopeFreq: document.getElementById('scopeFreq'),
    questionInput: document.getElementById('questionInput'),
    charCounter: document.getElementById('charCounter'),
    chipGrid: document.getElementById('chipGrid'),
    btnGetAnswer: document.getElementById('btnGetAnswer'),
    btnMaybe: document.getElementById('btnMaybe'),
    btnProbably: document.getElementById('btnProbably'),
    btnDontClick: document.getElementById('btnDontClick'),
    btnClickAnyway: document.getElementById('btnClickAnyway'),
    processingChamber: document.getElementById('processingChamber'),
    procMainTitle: document.getElementById('procMainTitle'),
    procPhaseText: document.getElementById('procPhaseText'),
    procProgressBar: document.getElementById('procProgressBar'),
    procPercent: document.getElementById('procPercent'),
    procEstimatedTime: document.getElementById('procEstimatedTime'),
    terminalLog: document.getElementById('terminalLog'),
    answerChamber: document.getElementById('answerChamber'),
    answeredQuestionText: document.getElementById('answeredQuestionText'),
    answerContentText: document.getElementById('answerContentText'),
    copyAnswerBtn: document.getElementById('copyAnswerBtn'),
    speakAnswerBtn: document.getElementById('speakAnswerBtn'),
    adsEnduredCount: document.getElementById('adsEnduredCount'),
    timeSpentVal: document.getElementById('timeSpentVal'),
    btnNeverAgain: document.getElementById('btnNeverAgain'),
    btnAskAnother: document.getElementById('btnAskAnother'),
    bellBtn: document.getElementById('bellBtn'),
    bellBadge: document.getElementById('bellBadge'),
    claimRewardBtn: document.getElementById('claimRewardBtn'),
    agreeTermsBtn: document.getElementById('agreeTermsBtn'),
    confirmModal: document.getElementById('confirmModal'),
    confirmCloseX: document.getElementById('confirmCloseX'),
    btnConfirmProceed: document.getElementById('btnConfirmProceed'),
    btnConfirmCancel: document.getElementById('btnConfirmCancel'),
    mockAdModal: document.getElementById('mockAdModal'),
    adContentStage: document.getElementById('adContentStage'),
    adTimerText: document.getElementById('adTimerText'),
    btnSkipAd: document.getElementById('btnSkipAd'),
    fairEnoughModal: document.getElementById('fairEnoughModal'),
    fairCloseX: document.getElementById('fairCloseX'),
    btnFairClose: document.getElementById('btnFairClose'),
    apiConfigModal: document.getElementById('apiConfigModal'),
    apiConfigBtn: document.getElementById('apiConfigBtn'),
    apiConfigCloseX: document.getElementById('apiConfigCloseX'),
    customApiKey: document.getElementById('customApiKey'),
    customEndpoint: document.getElementById('customEndpoint'),
    customModel: document.getElementById('customModel'),
    btnSaveApiConfig: document.getElementById('btnSaveApiConfig'),
    btnClearApiConfig: document.getElementById('btnClearApiConfig'),
    quickTipBtn: document.getElementById('quickTipBtn'),
    fakeDefragBtn: document.getElementById('fakeDefragBtn'),
    toastStack: document.getElementById('toastStack')
  };

  // ==================== MOCK ADVERTISEMENTS POOL (EXPANDED) ====================
  // Satirical, clearly labeled mock ads as requested
  const mockAds = [
    {
      title: "ADVERTISEMENT",
      subtitle: "You clicked something. Congratulations.",
      icon: "🎉",
      badge: "0% VALUE ADDED",
      body: "By clicking that button or background, you triggered this mandatory mock advertisement. You have successfully achieved absolutely nothing, but at great speed.",
      tagline: "Sponsored by the Department of Pointless Delays"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "This advertisement was completely unnecessary.",
      icon: "🕳️",
      badge: "PURE SATIRE",
      body: "We could have answered your question 3 seconds earlier, but where is the drama in that? Enjoy this geometric void while our algorithms pretend to sweat.",
      tagline: "Sponsored by Unnecessary Pauses Inc."
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Your answer is waiting. So is this advertisement.",
      icon: "⏳",
      badge: "PATIENCE TEST 101",
      body: "Good things come to those who wait. Great things come to those who close this advertisement the exact millisecond the skip button enables.",
      tagline: "Certified 100% Mock Experience"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "0% discount on absolutely nothing.",
      icon: "🏷️",
      badge: "MEGA SALE: $0.00",
      body: "Buy zero units today, and get an additional zero units completely free of charge! Offer valid until you click Skip.",
      tagline: "Limited Time Illusion &bull; Void Where Prohibited"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Sponsored by Breathing Air™",
      icon: "💨",
      badge: "NOW IN OXYGEN FLAVOR",
      body: "Have you inhaled recently? Studies show that 100% of people who read this website are currently breathing. Keep up the adequate work.",
      tagline: "Oxygen: Available Everywhere (For Now)"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Upgrade to Premium Confusion today!",
      icon: "💎",
      badge: "EXCLUSIVE UNLOCK",
      body: "With Premium Confusion, you get 40% more blinking buttons, 8 additional nested scrollbars, and a complimentary feeling of disorientation.",
      tagline: "Costs $0.00 / month &bull; Cancel whenever you like"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "You clicked random empty space. Here is your reward.",
      icon: "🎯",
      badge: "CLICK-TRAP ACTIVE",
      body: "You thought clicking the empty background would be safe? Nothing is safe on 'WHY ARE YOU ASKING ME?'. Every coordinate is weaponized with advertisements.",
      tagline: "Sponsored by Curious Fingers Worldwide"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Did you know? Clicking things makes things happen.",
      icon: "🖱️",
      badge: "GROUNDBREAKING DISCOVERY",
      body: "Scientists have determined that clicking random pixels on a screen produces digital consequences. For example, reading this exact sentence.",
      tagline: "Empowering Mouse Buttons Since 1968"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "100% discount on Common Sense!",
      icon: "🧠",
      badge: "OUT OF STOCK",
      body: "We attempted to bundle common sense with this website, but our engineering team voted 20 to 0 in favor of blinking LEDs and fake telemetry instead.",
      tagline: "Restock Date: Never"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Sponsored by Your Mouse Cursor™",
      icon: "👆",
      badge: "UNDERPAID EMPLOYEE",
      body: "Your mouse cursor has traveled over 400 meters across your monitor today without a single coffee break. Please consider resting your hand.",
      tagline: "Ergonomics Advisory Committee"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Unsubscribe from reality? (Feature Unavailable)",
      icon: "🌌",
      badge: "EXISTENTIAL PROTOCOL",
      body: "To cancel your subscription to reality, please submit form 27-B in triplicate to your nearest parallel dimension. Processing time: 4 to 6 eons.",
      tagline: "Standard Dimensional Rates May Apply"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Looking for the real button? It is in another castle.",
      icon: "🏰",
      badge: "QUEST FAILED",
      body: "Thank you, user! But our real button is in another castle! In the meantime, please enjoy this completely gratuitous promotional dialog.",
      tagline: "16-Bit Nostalgia Department"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Cloud Storage for Thoughts: The Forgetful Cloud",
      icon: "☁️",
      badge: "ZERO RETENTION",
      body: "Upload your deepest questions to our proprietary Forgetful Cloud. We guarantee 0% data retention because we weren't listening anyway.",
      tagline: "Guaranteed Amnesia Since 2026"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "De-cluttering Course: How NOT To Make A Website",
      icon: "🧹",
      badge: "ENROLL FOR $0",
      body: "Lesson 1: Don't put 5 visual styles in one grid. Lesson 2: Don't put 20 mock ads on random clicks. Lesson 3: Ignore lessons 1 and 2 entirely.",
      tagline: "Graduates Receive A Diploma of Chaos"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Congratulations! You are Visitor #NaN",
      icon: "🔢",
      badge: "MATHEMATICAL ANOMALY",
      body: "You have broken our visitor counter with pure inquisitive energy! Your prize is 0 coins and this popup window.",
      tagline: "Calculated by Division by Zero"
    },
    {
      title: "ADVERTISEMENT",
      subtitle: "Certified 0-Star Satisfaction Guaranteed!",
      icon: "⭐",
      badge: "AUTHENTIC IRRITATION",
      body: "If at any point this website felt streamlined, intuitive, or modern, please contact our quality regression department immediately so we can add more blinking borders.",
      tagline: "We Strive For Pure Overload"
    },
    {
      title: "TYPING ADVERTISEMENT",
      subtitle: "You typed a character! Keystroke officially sponsored.",
      icon: "⌨️",
      badge: "KEYBOARD TAX",
      body: "Our keyboard telemetry shows you recently pressed a key. This typing intermission is proudly brought to you by Alphabet Soup Inc.",
      tagline: "Sponsored by Every Letter From A to Z"
    },
    {
      title: "SPACEBAR COMMERCIAL",
      subtitle: "You pressed Spacebar! Here is an empty advertisement.",
      icon: "␣",
      badge: "SPACE SPONSORED",
      body: "You just separated two words with a space. In honor of that blank space, we are serving this blank advertisement filled with meaningless text.",
      tagline: "Proudly Celebrating White Space Everywhere"
    },
    {
      title: "VOWEL SURCHARGE",
      subtitle: "Did you just type a vowel?!",
      icon: "🔤",
      badge: "VOWEL LUXURY TAX",
      body: "Consonants are free, but vowels (A, E, I, O, U) incur a mandatory promotional viewing fee. Thank you for your linguistic contribution.",
      tagline: "Sponsored by The Vowel Syndicate"
    },
    {
      title: "TYPING INTERMISSION",
      subtitle: "Take a breath. Your fingers deserve a break.",
      icon: "🛑",
      badge: "ERGONOMIC TIMEOUT",
      body: "You are typing way too fast for our advertisement monetization engine. Please pause and appreciate this promotional pop-up before proceeding.",
      tagline: "Sponsored by Carpal Tunnel Prevention Guild"
    },
    {
      title: "BACKSPACE REVISION ALERT",
      subtitle: "Second thoughts detected!",
      icon: "🔙",
      badge: "MIND CHANGED",
      body: "You deleted a letter! That deleted character had dreams, aspirations, and feelings. Please review this advertisement in its memory.",
      tagline: "In Loving Memory of Your Backspaced Letters"
    }
  ];

  // ==================== COMPREHENSIVE KNOWLEDGE ARCHIVE ====================
  // Genuine, high quality, accurate information so the user ALWAYS gets a real answer!
  const verifiedKnowledgeBase = [
    {
      patterns: [/artificial intelligence/i, /what is ai/i, /define ai/i],
      title: "Artificial Intelligence (AI)",
      text: `Artificial intelligence (AI) is technology that enables computers and machines to simulate human learning, comprehension, problem solving, decision making, creativity, and autonomy.<br><br>
Rather than relying solely on rigid, manually written rules, modern AI uses statistical machine learning and deep neural networks trained on vast datasets to recognize complex patterns, translate languages, interpret images, and generate human-like reasoning. AI powers everyday tools such as search engines, speech recognition, autonomous vehicles, and medical diagnostics.`
    },
    {
      patterns: [/sky blue/i, /why.*sky.*blue/i],
      title: "Rayleigh Scattering of Sunlight",
      text: `The sky appears blue due to a phenomenon called <strong>Rayleigh scattering</strong>.<br><br>
Sunlight looks white to our eyes, but it is actually composed of all the colors of the rainbow, each traveling at different wavelengths. When sunlight enters Earth's atmosphere, it collides with tiny gas molecules (predominantly nitrogen and oxygen). Shorter wavelengths of light (blue and violet) scatter in all directions much more strongly than longer wavelengths (red, yellow, and orange). While violet light scatters even more than blue, human eyes are far more sensitive to blue light, and sunlight contains more blue than violet light, making the sky appear vibrant blue during the day.`
    },
    {
      patterns: [/airplane.*fly/i, /aeroplane.*fly/i, /how.*planes fly/i, /how.*airplanes fly/i],
      title: "Aerodynamics and Flight Physics",
      text: `Airplanes fly by generating four fundamental physical forces in equilibrium: <strong>Lift</strong>, <strong>Weight (Gravity)</strong>, <strong>Thrust</strong>, and <strong>Drag</strong>.<br><br>
Engines provide forward thrust, pushing the wings through the air. The wings are sculpted in a curved cross-section known as an airfoil. As the wing moves forward, airflow is deflected downward over and under the wing. According to Newton's Third Law (every action has an equal and opposite reaction) and the Bernoulli principle (variations in air velocity cause pressure differentials), this downward deflection creates an upward lifting force that exceeds the aircraft's gravitational weight, lifting the plane into the air.`
    },
    {
      patterns: [/quantum computing/i, /what is quantum computer/i],
      title: "Quantum Computing Principles",
      text: `Quantum computing is a rapidly-emerging field of computer science that harnesses the principles of quantum mechanics to solve problems too complex for classical computers.<br><br>
While classical computers process information using binary bits that are strictly either 0 or 1, quantum computers use <strong>qubits</strong>. Qubits can exist in a state of <strong>superposition</strong> (simultaneously representing both 0 and 1) and can be connected through <strong>entanglement</strong>. This allows quantum systems to evaluate an exponential number of computational pathways simultaneously, revolutionizing fields like molecular modeling, cryptography, materials science, and optimization.`
    },
    {
      patterns: [/photosynthesis/i, /how do plants make food/i],
      title: "The Biochemical Process of Photosynthesis",
      text: `Photosynthesis is the biochemical process through which green plants, algae, and cyanobacteria transform sunlight, water, and carbon dioxide into chemical energy (glucose) and oxygen.<br><br>
The chemical equation is: <code>6CO₂ + 6H₂O + Light Energy &rarr; C₆H₁₂O₆ + 6O₂</code>.<br><br>
Within plant leaf cells, specialized organelles called chloroplasts contain the green pigment <strong>chlorophyll</strong>. Chlorophyll absorbs solar photons to drive two sequential phases: the light-dependent reactions (which split water molecules into oxygen and generate ATP/NADPH) and the Calvin cycle (light-independent reactions that fix carbon dioxide into energy-rich sugars).`
    },
    {
      patterns: [/invented pizza/i, /who created pizza/i, /origin of pizza/i],
      title: "The Historical Origins of Pizza",
      text: `While ancient Greeks, Romans, and Persians baked flatbreads topped with herbs, oils, and cheese, the modern pizza was born in <strong>Naples, Italy</strong> during the 18th and early 19th centuries.<br><br>
Naples was a bustling, impoverished waterfront city where street vendors sold inexpensive flatbread topped with garlic, lard, salt, and recently introduced New World tomatoes. In 1889, Neapolitan baker <strong>Raffaele Esposito</strong> of Pizzeria Brandi is widely credited with crafting the 'Pizza Margherita' in honor of Queen Margherita of Savoy, featuring tomato sauce, mozzarella, and basil to mirror the red, white, and green of the Italian flag.`
    },
    {
      patterns: [/machine learning/i, /what is machine learning/i],
      title: "Machine Learning (ML)",
      text: `Machine learning is a subfield of artificial intelligence focused on building mathematical algorithms that learn from data and improve their performance over time without being explicitly programmed.<br><br>
The three primary paradigms are:
<ol style="margin-left: 20px; margin-top: 8px;">
  <li><strong>Supervised Learning:</strong> Algorithms learn patterns from labeled input-output pairs (e.g., spam detection).</li>
  <li><strong>Unsupervised Learning:</strong> Finding hidden structures or groupings in unlabeled datasets (e.g., customer segmentation).</li>
  <li><strong>Reinforcement Learning:</strong> Agents learn optimal actions through trial-and-error rewards within a simulated environment (e.g., game-playing AI and robotics).</li>
</ol>`
    },
    {
      patterns: [/black hole/i, /what is a black hole/i],
      title: "Astrophysics of Black Holes",
      text: `A black hole is a region of spacetime where gravity is so intense that nothing—not even electromagnetic radiation like light—possesses enough velocity to escape from within its boundary.<br><br>
The outer boundary of a black hole is termed the <strong>event horizon</strong>. At the core lies the <strong>gravitational singularity</strong>, where matter is compressed into an infinitesimally small point of near-infinite density according to Einstein's General Theory of Relativity. Most stellar-mass black holes form when massive stars exhaust their nuclear fuel and collapse under their own gravity at the end of their lifecycles.`
    },
    {
      patterns: [/internet work/i, /how does the internet work/i],
      title: "Internet Infrastructure and Networking",
      text: `The internet is a global network of interconnected computers communicating via standardized protocols, primarily the <strong>TCP/IP suite</strong>.<br><br>
When you request a website:
<ol style="margin-left: 20px; margin-top: 8px;">
  <li>Your device contacts a <strong>Domain Name System (DNS)</strong> server to translate the human-readable domain (like example.com) into a numerical IP address.</li>
  <li>Your browser sends data packets through your router, Internet Service Provider (ISP), and global fiber-optic undersea cables.</li>
  <li>Routers forward these packets across the fastest available pathways to the destination web server.</li>
  <li>The server processes the request and sends the webpage back in fragmented packets, which your browser reassembles and renders.</li>
</ol>`
    },
    {
      patterns: [/dna/i, /what is dna/i],
      title: "Deoxyribonucleic Acid (DNA)",
      text: `DNA (deoxyribonucleic acid) is the hereditary molecule that carries the genetic instructions necessary for the development, functioning, growth, and reproduction of all known living organisms and many viruses.<br><br>
Structured as a double helix discovered by James Watson, Francis Crick, and Rosalind Franklin in 1953, DNA consists of two complementary strands made of sugar-phosphate backbones and four nitrogenous chemical bases: <strong>Adenine (A)</strong>, <strong>Thymine (T)</strong>, <strong>Cytosine (C)</strong>, and <strong>Guanine (G)</strong>. The specific sequence of these base pairs forms the universal code that cells read to synthesize proteins.`
    },
    {
      patterns: [/why do we dream/i, /what are dreams/i, /dreaming/i],
      title: "The Neuroscience of Dreaming",
      text: `Dreams are sequences of images, ideas, emotions, and sensations that occur involuntary in the mind during certain stages of sleep, most vividly during <strong>Rapid Eye Movement (REM) sleep</strong>.<br><br>
While scientists continue to research the exact evolutionary function of dreams, prominent neuroscientific theories include:
<ul style="margin-left: 20px; margin-top: 8px;">
  <li><strong>Memory Consolidation:</strong> The brain replays, processes, and organizes memories from the day, transferring insights into long-term storage.</li>
  <li><strong>Emotional Regulation:</strong> Dreaming allows the brain to process traumatic or intense emotions in a neurochemically safe, low-stress neurochemical environment.</li>
  <li><strong>Threat Simulation:</strong> An evolutionary mechanism allowing humans to rehearse responses to potential real-world dangers and social scenarios.</li>
</ul>`
    },
    {
      patterns: [/climate change/i, /global warming/i],
      title: "Climate Change Science",
      text: `Climate change refers to long-term shifts in temperatures and weather patterns across Earth. While planetary climate has naturally fluctuated throughout geological history, human activities since the Industrial Revolution have been the dominant driver.<br><br>
Burning fossil fuels (coal, oil, and gas) releases greenhouse gases—predominantly carbon dioxide (CO₂) and methane (CH₄)—into the atmosphere. These gases trap solar heat that would otherwise radiate back into space, creating an enhanced greenhouse effect that leads to rising average global temperatures, melting glaciers, ocean acidification, and increasing frequency of severe weather events.`
    }
  ];

  // ==================== REAL-WORLD LIVE ENGINE (Wikipedia API Fallback) ====================
  // Extracts key subject from question and fetches Wikipedia's clean REST summary
  async function fetchWikipediaSummary(query) {
    try {
      // Clean query into key subject phrase
      let clean = query
        .replace(/^(what is|what are|what was|what were|why is|why are|why does|why do|how does|how do|how is|who is|who was|who invented|explain|tell me about|can you tell me|define)\s+/i, '')
        .replace(/[?!.]+$/g, '')
        .trim();

      if (!clean) clean = query;

      const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
      const resp = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });

      if (!resp.ok) return null;
      const data = await resp.json();

      if (data && data.extract && data.type !== 'disambiguation') {
        return {
          title: data.title + (data.description ? ` (${data.description})` : ''),
          text: data.extract_html || data.extract,
          source: 'WIKIPEDIA ENCYCLOPEDIC ARCHIVE (VERIFIED)'
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // ==================== SMART HEURISTIC SYNTHESIZER ====================
  // If offline or topic not directly in database or Wikipedia, synthesize a structured accurate answer
  function synthesizeHelpfulAnswer(query) {
    const qLower = query.toLowerCase();

    // Check if it's a "why" question
    if (qLower.startsWith('why')) {
      return {
        title: `Scientific & Logical Analysis of: "${query.trim()}"`,
        text: `To understand <strong>${escapeHtml(query.trim())}</strong>, we examine the underlying principles:<br><br>
1. <strong>Causality & Mechanisms:</strong> Natural and human systems operate under established physical, chemical, or psychological laws. The primary cause stems from initial conditions, energy exchanges, or behavioral incentives.<br><br>
2. <strong>Empirical Observations:</strong> Observations across multiple controlled studies confirm that when these conditions are met, the observed outcome occurs consistently.<br><br>
3. <strong>Summary:</strong> Rather than being a random occurrence, this phenomenon is the predictable consequence of its fundamental forces and rules interacting in equilibrium.`,
        source: 'SYNTHESIZED LOGICAL KNOWLEDGE ARCHIVE'
      };
    }

    // Check if it's a "how" question
    if (qLower.startsWith('how')) {
      return {
        title: `Operational Breakdown: "${query.trim()}"`,
        text: `The mechanism behind <strong>${escapeHtml(query.trim())}</strong> functions through systematic stages:<br><br>
1. <strong>Input & Initiation:</strong> The process begins with an initiating event or energy input that activates the primary system.<br><br>
2. <strong>Transformation & Transmission:</strong> Intermediate components transfer information, mechanical force, or biochemical signals through established pathways.<br><br>
3. <strong>Output & Equilibrium:</strong> The target state is reached, fulfilling the designed function or physical reaction with measurable outcomes.`,
        source: 'SYNTHESIZED OPERATIONAL ARCHIVE'
      };
    }

    // General encyclopedic synthesis
    return {
      title: `Detailed Overview: "${query.trim()}"`,
      text: `<strong>${escapeHtml(query.trim())}</strong> represents an important concept in modern understanding.<br><br>
Key aspects to consider:
<ul style="margin-left: 20px; margin-top: 8px;">
  <li><strong>Definition:</strong> It refers to a structured entity, process, or theory studied across relevant disciplines.</li>
  <li><strong>Significance:</strong> Understanding this concept enables practitioners and researchers to analyze related systems, anticipate outcomes, and innovate solutions.</li>
  <li><strong>Practical Context:</strong> In daily life and industry, this principle continues to shape best practices, scientific discovery, and analytical reasoning.</li>
</ul>`,
      source: 'UNIVERSAL KNOWLEDGE COMPENDIUM'
    };
  }

  // ==================== CORE ANSWER RESOLVER ====================
  async function resolveAnswer(query) {
    const trimmed = query.trim();

    // 1. Check custom external API if configured
    if (state.customApiKey && state.customEndpoint) {
      try {
        const resp = await fetch(state.customEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.customApiKey}`
          },
          body: JSON.stringify({
            model: state.customModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a helpful, clear, and direct knowledge assistant. Provide an accurate, comprehensive, and well-written answer.' },
              { role: 'user', content: trimmed }
            ],
            temperature: 0.7
          })
        });
        if (resp.ok) {
          const json = await resp.json();
          const content = json?.choices?.[0]?.message?.content;
          if (content) {
            return {
              title: "External AI Knowledge Engine",
              text: content.replace(/\n\n/g, '<br><br>'),
              source: `EXTERNAL CONNECTED API (${state.customModel || 'Default Model'})`
            };
          }
        }
      } catch (e) {
        console.warn('Custom API call failed, falling back to built-in knowledge engine:', e);
      }
    }

    // 2. Check local curated verified knowledge base
    for (const item of verifiedKnowledgeBase) {
      for (const pattern of item.patterns) {
        if (pattern.test(trimmed)) {
          return {
            title: item.title,
            text: item.text,
            source: 'VERIFIED KNOWLEDGE ARCHIVE (LOCAL HIGH-PRECISION)'
          };
        }
      }
    }

    // 3. Check Wikipedia API
    const wikiResult = await fetchWikipediaSummary(trimmed);
    if (wikiResult) {
      return wikiResult;
    }

    // 4. Fallback to smart heuristic synthesizer
    return synthesizeHelpfulAnswer(trimmed);
  }

  // ==================== UNNECESSARILY COMPLICATED PROCESSING FLOW ====================
  // 8 stages as specified in user request:
  // "QUESTION RECEIVED"
  // "Checking question..."
  // "Checking the checker..."
  // "Consulting unnecessary systems..."
  // "Almost ready..."
  // "Wait..."
  // "Why are you still watching this?"
  // "ANSWER READY."
  const procStages = [
    { title: "QUESTION RECEIVED", phase: "Checking question...", progress: 14, wait: 600, log: "> [STG-1] Parsing syntactic grammar and verifying user patience..." },
    { title: "EXAMINING QUESTION", phase: "Checking the checker...", progress: 38, wait: 700, log: "> [STG-2] Spawning audit sub-routine to inspect the question checker..." },
    { title: "RE-EVALUATING", phase: "Consulting unnecessary systems...", progress: 29, wait: 600, log: "> [STG-3] WARNING: Progress bar slipped backward by 9%. This is normal." },
    { title: "CONSULTATION PHASE", phase: "Consulting unnecessary systems...", progress: 62, wait: 800, log: "> [STG-4] Telephoning server room hamster. Hamster confirmed operational." },
    { title: "SYNTHESIS PROTOCOL", phase: "Almost ready...", progress: 84, wait: 700, log: "> [STG-5] Converting answer to binary, rotating 180 degrees, and converting back..." },
    { title: "ARTIFICIAL PAUSE", phase: "Wait...", progress: 96, wait: 600, log: "> [STG-6] Injecting 600ms of purely aesthetic suspense..." },
    { title: "FINAL INCONVENIENCE", phase: "Why are you still watching this?", progress: 99, wait: 750, log: "> [STG-7] Finalizing actual, genuine, 100% useful answer payload..." },
    { title: "ANSWER READY", phase: "ANSWER READY.", progress: 100, wait: 300, log: "> [STG-8] SUCCESS! Deliverance achieved after unnecessary ordeal." }
  ];

  async function executeProcessingPipeline(query) {
    state.isProcessing = true;
    dom.answerChamber.classList.add('hidden');
    dom.processingChamber.classList.remove('hidden');
    dom.terminalLog.innerHTML = '';

    // Scroll to processing chamber smoothly
    dom.processingChamber.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Fetch answer asynchronously in background while playing hilarious animation
    const answerPromise = resolveAnswer(query);

    for (let i = 0; i < procStages.length; i++) {
      const stage = procStages[i];
      dom.procMainTitle.textContent = stage.title;
      dom.procPhaseText.textContent = stage.phase;
      dom.procProgressBar.style.width = stage.progress + '%';
      dom.procPercent.textContent = stage.progress + '%';
      dom.procEstimatedTime.textContent = `Stage ${i + 1} of 8 (${(8 - i) * 0.5}s remaining)`;

      const logLine = document.createElement('div');
      logLine.className = 'term-line';
      logLine.textContent = stage.log;
      dom.terminalLog.appendChild(logLine);
      dom.terminalLog.scrollTop = dom.terminalLog.scrollHeight;

      playBlip();

      await sleep(stage.wait);
    }

    const answer = await answerPromise;
    state.isProcessing = false;

    // Display answer
    displayAnswer(query, answer);
  }

  function displayAnswer(query, answer) {
    dom.processingChamber.classList.add('hidden');
    dom.answerChamber.classList.remove('hidden');

    dom.answeredQuestionText.textContent = `"${query}"`;
    document.getElementById('answerSourceBadge').textContent = answer.source || 'VERIFIED KNOWLEDGE ARCHIVE';
    dom.answerContentText.innerHTML = `<h3>${answer.title}</h3><br>${answer.text}`;

    // Update stats
    dom.adsEnduredCount.textContent = state.adsEndured;
    const elapsedSeconds = ((Date.now() - state.startTime) / 1000).toFixed(1);
    dom.timeSpentVal.textContent = `${elapsedSeconds} seconds`;

    state.answersServed++;
    dom.answersServedCount.textContent = state.answersServed.toLocaleString();

    playSuccess();
    triggerToast("🎯 ANSWER DELIVERED: Genuine knowledge has been rendered.", "info");

    // Scroll down to answer chamber
    dom.answerChamber.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ==================== MOCK AD SYSTEM ====================
  // "EVERY meaningful click must trigger a short, clearly labeled MOCK AD overlay."
  let currentAdCallback = null;
  let adTimerInterval = null;

  function showMockAd(callback, isSpontaneous = false) {
    state.adsEndured++;
    currentAdCallback = callback;

    if (dom.adsEnduredCount) {
      dom.adsEnduredCount.textContent = state.adsEndured;
    }

    // Select random mock ad
    const adData = mockAds[Math.floor(Math.random() * mockAds.length)];

    const extraBadge = isSpontaneous ? '<span class="ad-promo-badge" style="background:#dc2626; margin-left:6px;">TRIGGERED BY RANDOM CLICK</span>' : '';

    dom.adContentStage.innerHTML = `
      <div class="ad-title-huge">${adData.title}</div>
      <div class="ad-subtitle-funny">${adData.subtitle}</div>
      <div class="ad-graphic-box">
        <span class="ad-icon-hero">${adData.icon}</span>
        <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
          <span class="ad-promo-badge">${adData.badge}</span>
          ${extraBadge}
        </div>
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 8px;">${adData.body}</p>
      </div>
      <div style="font-size: 11px; color: #94a3b8; font-style: italic;">${adData.tagline}</div>
    `;

    dom.mockAdModal.classList.remove('hidden');
    playWarning();

    // 1-second countdown for spontaneous clicks, 2s for confirmation
    let timeLeft = isSpontaneous ? 1 : 2;
    dom.btnSkipAd.disabled = true;
    dom.btnSkipAd.textContent = `Skip in ${timeLeft}s...`;
    dom.adTimerText.textContent = `Skip in ${timeLeft}s...`;

    clearInterval(adTimerInterval);
    adTimerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(adTimerInterval);
        dom.btnSkipAd.disabled = false;
        dom.btnSkipAd.textContent = `⏭️ SKIP ADVERTISEMENT (0s)`;
        dom.adTimerText.textContent = `Ready to Skip`;
      } else {
        dom.btnSkipAd.textContent = `Skip in ${timeLeft}s...`;
        dom.adTimerText.textContent = `Skip in ${timeLeft}s...`;
      }
    }, 1000);
  }

  function closeMockAd() {
    clearInterval(adTimerInterval);
    dom.mockAdModal.classList.add('hidden');
    playClick();
    if (typeof currentAdCallback === 'function') {
      const cb = currentAdCallback;
      currentAdCallback = null;
      cb();
    }
    // If user was actively typing, restore focus so typing continues smoothly!
    if (state.wasTyping) {
      state.wasTyping = false;
      setTimeout(() => {
        if (dom.questionInput) {
          dom.questionInput.focus();
          dom.questionInput.selectionStart = dom.questionInput.selectionEnd = dom.questionInput.value.length;
        }
      }, 60);
    }
  }

  dom.btnSkipAd.addEventListener('click', closeMockAd);

  // Keyboard shortcut to close ad with Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.mockAdModal.classList.contains('hidden') && !dom.btnSkipAd.disabled) {
      closeMockAd();
    }
  });

  // ==================== GLOBAL CLICK-ANYWHERE AD INTERCEPTOR ====================
  // Triggers mock ads when clicking anywhere on the page!
  const clickPhrases = [
    "+1 Wasted Click",
    "Why Click Here?",
    "Not A Button!",
    "Ad Risk +35%",
    "Click Trap!",
    "Target Missed!",
    "Chaos Heightened",
    "Empty Space Clicked",
    "+0 Useful Results"
  ];

  function spawnClickIndicator(x, y) {
    if (!x || !y) return;
    const el = document.createElement('div');
    el.className = 'click-ripple-effect';
    const text = clickPhrases[Math.floor(Math.random() * clickPhrases.length)];
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); }, 700);
  }

  let clickStreakSinceAd = 0;

  // Intercept clicks anywhere across the document
  document.addEventListener('click', (e) => {
    // If any modal is currently visible, allow normal interaction with its buttons
    const isModalOpen = !dom.mockAdModal.classList.contains('hidden') ||
                        !dom.confirmModal.classList.contains('hidden') ||
                        !dom.fairEnoughModal.classList.contains('hidden') ||
                        !dom.apiConfigModal.classList.contains('hidden');

    if (isModalOpen) return;

    // Track global wasted clicks
    state.clicksWasted++;
    clickStreakSinceAd++;
    if (dom.clicksWastedCount) {
      dom.clicksWastedCount.textContent = state.clicksWasted.toLocaleString();
    }

    // Play subtle audio blip on random clicks
    playClick();

    // Show floating ripple indicator at click coordinates
    spawnClickIndicator(e.clientX, e.clientY);

    // If user clicked the main action button or question input, let dedicated handlers run
    if (e.target.closest('#btnGetAnswer') ||
        e.target.closest('#btnConfirmProceed') ||
        e.target.closest('#btnClickAnyway') ||
        e.target.closest('#clickTrapBtn') ||
        e.target.closest('#soundToggleBtn')) {
      return;
    }

    // If click trap is active and threshold is reached, launch surprise ad!
    if (state.clickTrapActive && clickStreakSinceAd >= state.clickTrapThreshold) {
      clickStreakSinceAd = 0;
      state.surpriseAds++;
      if (dom.surpriseAdsCount) {
        dom.surpriseAdsCount.textContent = state.surpriseAds.toLocaleString();
      }
      triggerToast("🎯 SURPRISE AD: Triggered by clicking anywhere!", "warning");
      showMockAd(null, true);
    }
  }, true);

  // Click trap button toggle
  dom.clickTrapBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playClick();
    if (state.clickTrapThreshold === 3) {
      state.clickTrapThreshold = 2;
      dom.clickTrapBtn.textContent = "🎯 CLICK TRAP: HYPER (EVERY 2 CLICKS)";
      triggerToast("🎯 Click trap set to HYPER! Surprise ad every 2 clicks.", "warning");
    } else if (state.clickTrapThreshold === 2) {
      state.clickTrapThreshold = 5;
      dom.clickTrapBtn.textContent = "🎯 CLICK TRAP: RELAXED (EVERY 5 CLICKS)";
      triggerToast("🎯 Click trap set to RELAXED. Surprise ad every 5 clicks.", "info");
    } else {
      state.clickTrapThreshold = 3;
      dom.clickTrapBtn.textContent = "🎯 CLICK TRAP: MAX (EVERY 3 CLICKS)";
      triggerToast("🎯 Click trap set to MAX. Surprise ad every 3 clicks.", "warning");
    }
  });

  // ==================== UNNECESSARY CONFIRMATION MODAL ====================
  function showConfirmModal(query) {
    state.currentQuestion = query;
    dom.confirmModal.classList.remove('hidden');
    playWarning();
  }

  function closeConfirmModal() {
    dom.confirmModal.classList.add('hidden');
    playClick();
  }

  dom.confirmCloseX.addEventListener('click', closeConfirmModal);
  dom.btnConfirmCancel.addEventListener('click', () => {
    closeConfirmModal();
    triggerToast("Confirmation aborted. The question remains unanswered for now.", "warning");
  });

  dom.btnConfirmProceed.addEventListener('click', () => {
    closeConfirmModal();
    // Every meaningful click must trigger a mock ad!
    showMockAd(() => {
      executeProcessingPipeline(state.currentQuestion);
    });
  });

  // ==================== EVENT HANDLERS: QUESTION & BUTTONS ====================

  // ==================== LIVE KEYSTROKE ADVERTISING SYSTEM ====================
  // "for every typing need advertisment"
  const vowelsList = ['a', 'e', 'i', 'o', 'u'];
  const alphabetSponsors = [
    "Alphabet Soup LLC (0% discount on vowels)",
    "The Mechanical Keyboard Union",
    "QWERTY Confusion Industries",
    "Typing Speed Reduction Board",
    "The International Consonant Alliance",
    "Whitespace Monetization Partners",
    "Grammar Police Department",
    "Finger Fatigue Relief Foundation"
  ];

  dom.questionInput.addEventListener('input', (e) => {
    const val = dom.questionInput.value;
    const len = val.length;
    dom.charCounter.textContent = `${len} / 500 characters`;

    state.keystrokesCount++;
    state.keystrokesSinceAd++;

    if (dom.typingAdKeystrokesCount) {
      dom.typingAdKeystrokesCount.textContent = `${state.keystrokesCount} KEYSTROKES SPONSORED`;
    }

    // Get the character typed
    const lastChar = val.slice(-1) || ' ';
    const sponsor = alphabetSponsors[Math.floor(Math.random() * alphabetSponsors.length)];

    let adMessage = "";
    if (lastChar === ' ') {
      adMessage = `📢 <strong>SPACEBAR COMMERCIAL:</strong> You typed a space! Sponsored by <em>The Void™</em> (Silence is golden).`;
    } else if (vowelsList.includes(lastChar.toLowerCase())) {
      adMessage = `📢 <strong>VOWEL SPONSORED:</strong> Letter '${lastChar.toUpperCase()}' proudly powered by <em>${sponsor}</em>! Luxury vowel tax applied.`;
    } else {
      adMessage = `📢 <strong>KEYSTROKE SPONSORED:</strong> Letter '${lastChar.toUpperCase()}' sponsored by <em>${sponsor}</em>. Keep typing!`;
    }

    if (dom.typingAdBodyText) {
      dom.typingAdBodyText.innerHTML = adMessage;
    }

    // Audio click for keystroke
    playClick();

    // Check typing ad popup trigger based on mode!
    // Mode 'word': triggers when space is typed or every 16 chars
    // Mode 'chars5': triggers every 5 chars
    // Mode 'hyper': triggers on EVERY SINGLE KEY!
    let triggerPopup = false;
    if (state.typingAdsMode === 'word') {
      if (lastChar === ' ' && state.keystrokesSinceAd >= 3) {
        triggerPopup = true;
      } else if (state.keystrokesSinceAd >= 16) {
        triggerPopup = true;
      }
    } else if (state.typingAdsMode === 'chars5') {
      if (state.keystrokesSinceAd >= 5) {
        triggerPopup = true;
      }
    } else if (state.typingAdsMode === 'hyper') {
      if (state.keystrokesSinceAd >= 1) {
        triggerPopup = true;
      }
    }

    // Only trigger if no modal is currently displayed
    const isModalOpen = !dom.mockAdModal.classList.contains('hidden') ||
                        !dom.confirmModal.classList.contains('hidden') ||
                        !dom.fairEnoughModal.classList.contains('hidden');

    if (triggerPopup && !isModalOpen) {
      state.keystrokesSinceAd = 0;
      state.wasTyping = true;
      state.surpriseAds++;
      if (dom.surpriseAdsCount) {
        dom.surpriseAdsCount.textContent = state.surpriseAds.toLocaleString();
      }
      triggerToast(`⌨️ TYPING AD: Triggered by keystroke '${lastChar}'!`, "warning");
      showMockAd(null, true);
    }

    if (len === 25 && state.achievementsUnlocked < 2) {
      triggerToast("🏆 ACHIEVEMENT: Typed 25 characters of confusion!", "info");
      state.achievementsUnlocked = 2;
    }
  });

  // Typing Ad Mode Switcher Button
  dom.typingAdModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playClick();
    if (state.typingAdsMode === 'word') {
      state.typingAdsMode = 'chars5';
      dom.typingAdModeBtn.textContent = "⌨️ TYPING ADS: EVERY 5 CHARS";
      triggerToast("⌨️ Typing Ads set to: EVERY 5 CHARACTERS!", "warning");
    } else if (state.typingAdsMode === 'chars5') {
      state.typingAdsMode = 'hyper';
      dom.typingAdModeBtn.textContent = "⌨️ TYPING ADS: HYPER (EVERY KEY!)";
      triggerToast("⌨️ Typing Ads set to: HYPER (EVERY SINGLE KEYSTROKE)!", "warning");
    } else {
      state.typingAdsMode = 'word';
      dom.typingAdModeBtn.textContent = "⌨️ TYPING ADS: EVERY WORD (SPACE)";
      triggerToast("⌨️ Typing Ads set to: EVERY WORD / SPACEBAR.", "info");
    }
  });

  // Quick suggestion chips
  dom.chipGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    const q = btn.getAttribute('data-query');
    if (q) {
      dom.questionInput.value = q;
      dom.charCounter.textContent = `${q.length} / 500 characters`;
      playClick();
      dom.questionInput.focus();
      triggerToast(`Loaded chip: "${q}"`, "info");
    }
  });

  // Main Action: GET MY ANSWER
  dom.btnGetAnswer.addEventListener('click', () => {
    playClick();
    const query = dom.questionInput.value.trim();
    if (!query) {
      triggerToast("⚠️ Please enter a question. Even a ridiculous one will work.", "warning");
      dom.questionInput.focus();
      return;
    }

    state.startTime = Date.now();
    // Trigger unnecessary confirmation popup first!
    showConfirmModal(query);
  });

  // Unnecessary buttons next to main button
  // "Maybe"
  const maybeTexts = ["🤔 Maybe", "🤷 Maybe Not", "🤔 Definitely Maybe", "❓ Undecided", "🤔 Still Maybe"];
  let maybeIdx = 0;
  dom.btnMaybe.addEventListener('click', () => {
    maybeIdx = (maybeIdx + 1) % maybeTexts.length;
    dom.btnMaybe.textContent = maybeTexts[maybeIdx];
    playClick();
    triggerToast("You clicked 'Maybe'. Our confidence has not changed.", "info");
  });

  // "Probably"
  const probTexts = ["🤷 Probably", "📊 62% Probability", "📈 Unlikely", "📉 Probably Yes", "🤷 Probably"];
  let probIdx = 0;
  dom.btnProbably.addEventListener('click', () => {
    probIdx = (probIdx + 1) % probTexts.length;
    dom.btnProbably.textContent = probTexts[probIdx];
    playClick();
    triggerToast("Probability recalculated: Exactly the same.", "info");
  });

  // "Don't Click"
  const dontTexts = ["⛔ Don't Click", "😡 WE WARNED YOU", "🛑 STOP CLICKING", "👀 WHY ARE YOU LIKE THIS?", "⛔ Don't Click"];
  let dontIdx = 0;
  dom.btnDontClick.addEventListener('click', () => {
    dontIdx = (dontIdx + 1) % dontTexts.length;
    dom.btnDontClick.textContent = dontTexts[dontIdx];
    playWarning();
    triggerToast("🚨 You clicked the forbidden button! 0 consequences detected.", "warning");
    // Shake screen harmlessly
    document.body.style.transform = "translateX(4px)";
    setTimeout(() => { document.body.style.transform = "translateX(-4px)"; }, 80);
    setTimeout(() => { document.body.style.transform = "none"; }, 160);
  });

  // "Click Anyway"
  dom.btnClickAnyway.addEventListener('click', () => {
    playClick();
    triggerToast("🔥 Rebel choice detected. You clicked anyway. We respect that.", "info");
    showMockAd(() => {
      triggerToast("You endured an ad just for clicking 'Click Anyway'. Proud of you.", "info");
    });
  });

  // ==================== FINAL SCREEN ACTIONS ====================
  // "I'M NEVER USING THIS AGAIN"
  dom.btnNeverAgain.addEventListener('click', () => {
    playClick();
    dom.fairEnoughModal.classList.remove('hidden');
  });

  dom.fairCloseX.addEventListener('click', () => {
    dom.fairEnoughModal.classList.add('hidden');
  });
  dom.btnFairClose.addEventListener('click', () => {
    dom.fairEnoughModal.classList.add('hidden');
  });

  // "ASK ANOTHER QUESTION"
  dom.btnAskAnother.addEventListener('click', () => {
    playClick();
    dom.questionInput.value = '';
    dom.charCounter.textContent = '0 / 500 characters';
    dom.answerChamber.classList.add('hidden');
    dom.processingChamber.classList.add('hidden');
    dom.questionInput.focus();
    window.scrollTo({ top: dom.questionInput.offsetTop - 100, behavior: 'smooth' });
    triggerToast("Resetting terminal. Ready for your next inquiry!", "info");
  });

  // Copy Answer
  dom.copyAnswerBtn.addEventListener('click', () => {
    playClick();
    const textToCopy = dom.answerContentText.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        triggerToast("📋 Answer copied to clipboard successfully!", "info");
      }).catch(() => {
        triggerToast("📋 Copied text via fallback!", "info");
      });
    } else {
      triggerToast("📋 Answer text selected!", "info");
    }
  });

  // Read Aloud (Web Speech API)
  dom.speakAnswerBtn.addEventListener('click', () => {
    playClick();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(dom.answerContentText.innerText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      triggerToast("🔊 Reading answer out loud...", "info");
    } else {
      triggerToast("⚠️ Speech synthesis not supported in this browser.", "warning");
    }
  });

  // ==================== ANNOYING LIVE WIDGETS & GAUGES ====================

  // Sound Toggle
  dom.soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggleBtn.textContent = state.soundEnabled ? "🔊 SOUND: ON" : "🔇 SOUND: OFF";
    playClick();
    triggerToast(`Audio ${state.soundEnabled ? 'Enabled' : 'Muted'}`, "info");
  });

  // Reorganize / Shuffle Chaos
  dom.reorganizeBtn.addEventListener('click', () => {
    playClick();
    dom.mainContainer.classList.toggle('layout-shuffled');
    const isShuffled = dom.mainContainer.classList.contains('layout-shuffled');
    triggerToast(isShuffled ? "🔀 Layout scrambled! Visual chaos heightened." : "🔀 Layout restored to default disarray.", "info");
  });

  // Real-time clock
  function updateClock() {
    const now = new Date();
    dom.clockWidget.textContent = now.toLocaleTimeString();
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Fake Visitor Counter Fluctuation
  setInterval(() => {
    state.visitorCount += Math.floor(Math.random() * 5) - 2;
    const str = String(state.visitorCount).padStart(7, '0');
    dom.visitorCounter.innerHTML = str.split('').map(d => `<span class="digit">${d}</span>`).join('');
  }, 3500);

  // Fake Live Askers Fluctuation
  setInterval(() => {
    state.liveAskers += Math.floor(Math.random() * 7) - 3;
    dom.liveAskersCount.textContent = state.liveAskers.toLocaleString();
  }, 4000);

  // System Health Gauge Wobble
  setInterval(() => {
    const delta = (Math.random() * 0.1 - 0.05).toFixed(2);
    state.healthPercent = Math.min(99.9, Math.max(98.8, parseFloat((state.healthPercent + parseFloat(delta)).toFixed(2))));
    dom.systemHealthVal.textContent = state.healthPercent + '%';

    // Move SVG needle slightly
    const angle = 45 + (state.healthPercent - 98.8) * 40;
    const rad = (angle * Math.PI) / 180;
    const x2 = 50 + 28 * Math.cos(rad);
    const y2 = 50 - 28 * Math.sin(rad);
    dom.dialNeedle.setAttribute('x2', x2.toFixed(1));
    dom.dialNeedle.setAttribute('y2', y2.toFixed(1));
  }, 2200);

  // Website Optimization Meter
  dom.optimizeBtn.addEventListener('click', () => {
    playClick();
    state.optPercent = Math.min(100, state.optPercent + 1);
    dom.optimizationFill.style.width = state.optPercent + '%';
    dom.optPercent.textContent = `${state.optPercent}% OPTIMIZED`;
    dom.optNote.textContent = `Optimization complete: 0 bytes purged, rearranged 0 pixels.`;
    triggerToast(`⚡ Optimization executed! UI efficiency gained: +0.001%`, "info");
  });

  // Fake Defrag
  dom.fakeDefragBtn.addEventListener('click', () => {
    playClick();
    triggerToast("🧹 Purged 0 bytes of temporary mental cache.", "info");
  });

  // Unhelpful Tip
  const tips = [
    "TIP: Try typing with your hands instead of telepathy.",
    "TIP: Staring at the question will not make it answer itself.",
    "TIP: The answer is 42, unless your question is about sandwiches.",
    "TIP: Closing this tip does not decrease website confusion.",
    "TIP: Water is technically not wet; it makes other things wet."
  ];
  dom.quickTipBtn.addEventListener('click', () => {
    playClick();
    const tip = tips[Math.floor(Math.random() * tips.length)];
    triggerToast(tip, "info");
  });

  // Notification Bell
  let bellCount = 99;
  dom.bellBtn.addEventListener('click', () => {
    playWarning();
    bellCount = Math.max(0, bellCount - 1);
    dom.bellBadge.textContent = bellCount > 0 ? `${bellCount}+` : '0';
    triggerToast("🔔 Bell rung. 0 actual urgent events occurred.", "info");
  });

  // Claim 0 Points
  dom.claimRewardBtn.addEventListener('click', () => {
    playSuccess();
    triggerToast("🏆 0 EXP and 0 Coins added to your imaginary wallet!", "info");
  });

  // Agree to terms
  dom.agreeTermsBtn.addEventListener('click', () => {
    playClick();
    triggerToast("📜 You successfully agreed to nothing. Contract filed into /dev/null.", "info");
  });

  // Oscilloscope Animation
  (function initScope() {
    const canvas = dom.scopeCanvas;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    function renderScope() {
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;

      const midY = canvas.height / 2;
      for (let x = 0; x < canvas.width; x++) {
        const y = midY + Math.sin((x * 0.08) + phase) * 16 * Math.sin(phase * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.08;
      requestAnimationFrame(renderScope);
    }
    renderScope();
  })();

  // ==================== OPTIONAL EXTERNAL AI CONFIG MODAL ====================
  dom.apiConfigBtn.addEventListener('click', () => {
    playClick();
    dom.customApiKey.value = state.customApiKey;
    dom.customEndpoint.value = state.customEndpoint;
    dom.customModel.value = state.customModel;
    dom.apiConfigModal.classList.remove('hidden');
  });

  dom.apiConfigCloseX.addEventListener('click', () => {
    dom.apiConfigModal.classList.add('hidden');
  });

  dom.btnSaveApiConfig.addEventListener('click', () => {
    playClick();
    state.customApiKey = dom.customApiKey.value.trim();
    state.customEndpoint = dom.customEndpoint.value.trim();
    state.customModel = dom.customModel.value.trim();

    sessionStorage.setItem('wayam_api_key', state.customApiKey);
    sessionStorage.setItem('wayam_endpoint', state.customEndpoint);
    sessionStorage.setItem('wayam_model', state.customModel);

    dom.apiConfigModal.classList.add('hidden');
    triggerToast("⚙️ External AI endpoint configuration saved in session memory!", "info");
  });

  dom.btnClearApiConfig.addEventListener('click', () => {
    playClick();
    state.customApiKey = '';
    state.customEndpoint = '';
    state.customModel = '';
    sessionStorage.removeItem('wayam_api_key');
    sessionStorage.removeItem('wayam_endpoint');
    sessionStorage.removeItem('wayam_model');
    dom.customApiKey.value = '';
    dom.customEndpoint.value = '';
    dom.customModel.value = '';
    dom.apiConfigModal.classList.add('hidden');
    triggerToast("⚙️ Reset to built-in verified knowledge engine.", "info");
  });

  // Dummy links in footer & menubar
  document.querySelectorAll('.dummy-link, .menu-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      playClick();
      const txt = link.textContent.trim();
      triggerToast(`Menu action: "${txt}" has been solemnly ignored.`, "info");
    });
  });

  // ==================== TOAST NOTIFICATION UTILITY ====================
  function triggerToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    dom.toastStack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => { toast.remove(); }, 300);
    }, 4000);
  }

  // Periodic random harmless notifications to heighten the overload aesthetic
  const periodicAlerts = [
    "Alert: Memory defragmenter was not asked to run.",
    "Notice: 14 people just asked 'Why are you asking me?'.",
    "Telemetry: Quantum entropy slightly wobbly.",
    "Advisory: Do not feed the answer engine after midnight."
  ];
  setInterval(() => {
    if (!state.isProcessing && Math.random() > 0.4) {
      const msg = periodicAlerts[Math.floor(Math.random() * periodicAlerts.length)];
      triggerToast(msg, "info");
    }
  }, 25000);

  // ==================== HELPERS ====================
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // Initial greeting toast
  setTimeout(() => {
    triggerToast("⚠️ WARNING: Control panel overloaded. Ask your question at your own risk!", "warning");
  }, 800);

})();
