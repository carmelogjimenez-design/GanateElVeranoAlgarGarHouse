// Contenido de estudio curado (offline) por asignatura y nivel.
// Detecta la materia por palabras clave del nombre y la banda por el nivel.
export type Quiz = { q: string; options: string[]; answer: number };
export type StudyContent = { topics: string[]; quiz: Quiz[] };

type Band = "primaria" | "eso" | "bach";
type Group = "matematicas" | "lengua" | "ingles" | "sociales" | "ciencias" | "general";

function detectGroup(name: string): Group {
  const n = (name || "").toLowerCase();
  if (/mate|álgebra|algebra|geometr|cálculo|calculo/.test(n)) return "matematicas";
  if (/lengua|castellano|literatura|español|espanol/.test(n)) return "lengua";
  if (/ingl|english/.test(n)) return "ingles";
  if (/histori|geograf|social/.test(n)) return "sociales";
  if (/cienc|natural|biolog|f[íi]sica|fisica|qu[íi]mica|quimica/.test(n)) return "ciencias";
  return "general";
}
function detectBand(level: string): Band {
  const l = (level || "").toLowerCase();
  if (/primaria/.test(l)) return "primaria";
  if (/bachill|bach/.test(l)) return "bach";
  return "eso";
}

const BANK: Record<Group, Partial<Record<Band, StudyContent>>> = {
  matematicas: {
    primaria: {
      topics: ["Sumas y restas llevando", "Tablas de multiplicar", "La división", "Fracciones sencillas", "Perímetro y área", "Problemas con dinero"],
      quiz: [
        { q: "7 × 8 = ?", options: ["54", "56", "58", "49"], answer: 1 },
        { q: "¿Cuánto es 1/2 de 10?", options: ["2", "5", "10", "20"], answer: 1 },
        { q: "El perímetro de un cuadrado de lado 3 cm es…", options: ["6 cm", "9 cm", "12 cm", "3 cm"], answer: 2 },
        { q: "144 ÷ 12 = ?", options: ["11", "12", "14", "24"], answer: 1 },
        { q: "¿Cuántos minutos hay en 2 horas?", options: ["100", "120", "60", "90"], answer: 1 },
      ],
    },
    eso: {
      topics: ["Números enteros y operaciones", "Fracciones y decimales", "Ecuaciones de primer grado", "Proporcionalidad y porcentajes", "Áreas y volúmenes", "Funciones lineales"],
      quiz: [
        { q: "Resuelve 2x + 3 = 11. x = ?", options: ["4", "5", "3", "7"], answer: 0 },
        { q: "¿Cuánto es el 25% de 80?", options: ["16", "20", "25", "40"], answer: 1 },
        { q: "(−3) × (−4) = ?", options: ["−12", "12", "−7", "7"], answer: 1 },
        { q: "Área de un triángulo de base 6 y altura 4", options: ["10", "12", "24", "20"], answer: 1 },
        { q: "0,75 como fracción es…", options: ["3/4", "1/2", "7/5", "2/3"], answer: 0 },
      ],
    },
    bach: {
      topics: ["Límites y continuidad", "Derivadas", "Integrales", "Probabilidad", "Matrices y determinantes", "Logaritmos"],
      quiz: [
        { q: "La derivada de x² es…", options: ["2x", "x", "x²/2", "2"], answer: 0 },
        { q: "log₁₀(1000) = ?", options: ["2", "3", "10", "100"], answer: 1 },
        { q: "∫ 2x dx = ?", options: ["x² + C", "2 + C", "x + C", "2x² + C"], answer: 0 },
        { q: "Probabilidad de sacar par en un dado", options: ["1/2", "1/3", "1/6", "2/3"], answer: 0 },
        { q: "La derivada de una constante es…", options: ["0", "1", "la constante", "x"], answer: 0 },
      ],
    },
  },
  lengua: {
    primaria: {
      topics: ["El abecedario y las sílabas", "Sustantivos y adjetivos", "Singular y plural", "Signos de puntuación", "Lectura comprensiva", "La mayúscula"],
      quiz: [
        { q: "¿Cuál es un sustantivo?", options: ["correr", "mesa", "rápido", "muy"], answer: 1 },
        { q: "El plural de 'lápiz' es…", options: ["lápizes", "lápices", "lápizs", "lapices"], answer: 1 },
        { q: "¿Qué signo cierra una pregunta?", options: [".", "?", "!", ","], answer: 1 },
        { q: "'Bonito' es un…", options: ["verbo", "adjetivo", "sustantivo", "adverbio"], answer: 1 },
        { q: "Se escribe con mayúscula…", options: ["los nombres propios", "los verbos", "los adjetivos", "todo"], answer: 0 },
      ],
    },
    eso: {
      topics: ["Categorías gramaticales", "Sujeto y predicado", "Tipos de texto", "Tildes y acentuación", "Géneros literarios", "Figuras literarias"],
      quiz: [
        { q: "En 'El niño corre', el sujeto es…", options: ["corre", "El niño", "niño corre", "El"], answer: 1 },
        { q: "Una metáfora es…", options: ["comparar sin 'como'", "repetir sonidos", "exagerar", "preguntar"], answer: 0 },
        { q: "'Rápidamente' es un…", options: ["adjetivo", "adverbio", "sustantivo", "verbo"], answer: 1 },
        { q: "Las agudas llevan tilde si acaban en…", options: ["n, s o vocal", "cualquier consonante", "siempre", "nunca"], answer: 0 },
        { q: "El género lírico expresa sobre todo…", options: ["sentimientos", "una historia con diálogo", "hechos históricos", "noticias"], answer: 0 },
      ],
    },
    bach: {
      topics: ["Coherencia y cohesión", "La oración compuesta", "Generación del 27", "El comentario de texto", "Variedades de la lengua", "Tópicos literarios"],
      quiz: [
        { q: "'Carpe diem' significa…", options: ["aprovecha el momento", "recuerda que morirás", "vive con esfuerzo", "ama la patria"], answer: 0 },
        { q: "Una oración subordinada…", options: ["depende de otra", "es independiente", "no tiene verbo", "es una pregunta"], answer: 0 },
        { q: "García Lorca pertenece a la…", options: ["Generación del 98", "Generación del 27", "Romanticismo", "Barroco"], answer: 1 },
        { q: "La cohesión se logra con…", options: ["conectores y referencias", "solo el tema", "la longitud", "los dibujos"], answer: 0 },
        { q: "'Tempus fugit' se refiere a…", options: ["el tiempo huye", "el miedo", "la guerra", "el amor"], answer: 0 },
      ],
    },
  },
  ingles: {
    primaria: {
      topics: ["The alphabet and numbers", "Colours and animals", "Verb to be", "Days and months", "Simple present", "Family vocabulary"],
      quiz: [
        { q: "'Dog' en español es…", options: ["gato", "perro", "pájaro", "pez"], answer: 1 },
        { q: "I ___ a student.", options: ["am", "is", "are", "be"], answer: 0 },
        { q: "¿Cómo se dice 'rojo'?", options: ["blue", "green", "red", "black"], answer: 2 },
        { q: "The day after Monday is…", options: ["Sunday", "Tuesday", "Friday", "Wednesday"], answer: 1 },
        { q: "She ___ happy.", options: ["am", "is", "are", "be"], answer: 1 },
      ],
    },
    eso: {
      topics: ["Present simple vs continuous", "Past simple", "Comparatives & superlatives", "Future: will / going to", "Modal verbs", "Phrasal verbs"],
      quiz: [
        { q: "Past simple of 'go' is…", options: ["goed", "went", "gone", "going"], answer: 1 },
        { q: "She is taller ___ me.", options: ["that", "than", "then", "as"], answer: 1 },
        { q: "I ___ TV now.", options: ["watch", "watching", "am watching", "watches"], answer: 2 },
        { q: "The comparative of 'good' is…", options: ["gooder", "more good", "better", "best"], answer: 2 },
        { q: "They ___ to Paris last year.", options: ["go", "went", "gone", "going"], answer: 1 },
      ],
    },
    bach: {
      topics: ["Present perfect vs past simple", "Conditionals", "Passive voice", "Reported speech", "Relative clauses", "Used to / would"],
      quiz: [
        { q: "If I were rich, I ___ travel.", options: ["will", "would", "can", "am"], answer: 1 },
        { q: "Passive: 'They built it' → 'It ___ built.'", options: ["is", "was", "were", "has"], answer: 1 },
        { q: "Present perfect uses…", options: ["have/has + past participle", "will + verb", "was + ing", "did + verb"], answer: 0 },
        { q: "Reported: He said he ___ tired.", options: ["is", "was", "are", "be"], answer: 1 },
        { q: "I ___ live in Madrid (but not now).", options: ["use to", "used to", "using to", "uses to"], answer: 1 },
      ],
    },
  },
  sociales: {
    primaria: {
      topics: ["Continentes y océanos", "El relieve: montañas y ríos", "Las estaciones", "Paisajes de España", "La prehistoria", "Localidad y comunidad"],
      quiz: [
        { q: "¿Cuál es el océano más grande?", options: ["Atlántico", "Pacífico", "Índico", "Ártico"], answer: 1 },
        { q: "La capital de España es…", options: ["Barcelona", "Madrid", "Sevilla", "Valencia"], answer: 1 },
        { q: "¿En qué estación caen las hojas?", options: ["verano", "otoño", "invierno", "primavera"], answer: 1 },
        { q: "El río más largo de España es…", options: ["Ebro", "Tajo", "Duero", "Guadalquivir"], answer: 1 },
        { q: "Un río desemboca en…", options: ["una montaña", "el mar", "el cielo", "un bosque"], answer: 1 },
      ],
    },
    eso: {
      topics: ["La Edad Media", "Climas de Europa", "Población y migraciones", "El Imperio Romano", "Sectores económicos", "La Unión Europea"],
      quiz: [
        { q: "El Imperio Romano tenía su capital en…", options: ["Atenas", "Roma", "París", "El Cairo"], answer: 1 },
        { q: "La agricultura pertenece al sector…", options: ["primario", "secundario", "terciario", "cuaternario"], answer: 0 },
        { q: "La Edad Media empieza con la caída de Roma de…", options: ["Oriente", "Occidente", "China", "Egipto"], answer: 1 },
        { q: "El río Danubio está en…", options: ["América", "Europa", "África", "Asia"], answer: 1 },
        { q: "La moneda de la mayoría de la UE es…", options: ["el dólar", "el euro", "la libra", "el franco"], answer: 1 },
      ],
    },
    bach: {
      topics: ["La Revolución Industrial", "Las Guerras Mundiales", "La Guerra Civil española", "La Transición", "Clima y relieve de España", "Globalización"],
      quiz: [
        { q: "La Primera Guerra Mundial empezó en…", options: ["1914", "1939", "1900", "1918"], answer: 0 },
        { q: "La Constitución española vigente es de…", options: ["1931", "1975", "1978", "1812"], answer: 2 },
        { q: "La Revolución Industrial comenzó en…", options: ["Francia", "Reino Unido", "Alemania", "EE. UU."], answer: 1 },
        { q: "La Guerra Civil española fue en…", options: ["1936-1939", "1914-1918", "1939-1945", "1898-1900"], answer: 0 },
        { q: "El clima mediterráneo tiene…", options: ["veranos secos y calurosos", "lluvia todo el año", "frío extremo", "sin estaciones"], answer: 0 },
      ],
    },
  },
  ciencias: {
    primaria: {
      topics: ["Los seres vivos", "Las plantas y la fotosíntesis", "El cuerpo humano", "Los estados del agua", "Vertebrados e invertebrados", "El sistema solar"],
      quiz: [
        { q: "Las plantas fabrican su alimento mediante…", options: ["la respiración", "la fotosíntesis", "la digestión", "el sueño"], answer: 1 },
        { q: "El agua se convierte en hielo al…", options: ["calentarse", "congelarse", "evaporarse", "hervir"], answer: 1 },
        { q: "¿Cuántos planetas tiene el sistema solar?", options: ["7", "8", "9", "10"], answer: 1 },
        { q: "Los mamíferos son animales…", options: ["vertebrados", "invertebrados", "plantas", "minerales"], answer: 0 },
        { q: "El órgano que bombea la sangre es…", options: ["el pulmón", "el corazón", "el hígado", "el riñón"], answer: 1 },
      ],
    },
    eso: {
      topics: ["La célula", "Aparatos y sistemas del cuerpo", "La materia y sus estados", "La energía", "Ecosistemas", "La tabla periódica"],
      quiz: [
        { q: "La unidad básica de los seres vivos es…", options: ["el átomo", "la célula", "el órgano", "el tejido"], answer: 1 },
        { q: "El símbolo químico del oxígeno es…", options: ["Ox", "O", "Og", "Oz"], answer: 1 },
        { q: "El agua está formada por hidrógeno y…", options: ["oxígeno", "nitrógeno", "carbono", "helio"], answer: 0 },
        { q: "La energía que nos llega del Sol es…", options: ["eólica", "solar", "nuclear", "química"], answer: 1 },
        { q: "Un ecosistema incluye seres vivos y…", options: ["solo plantas", "el medio físico", "solo animales", "máquinas"], answer: 1 },
      ],
    },
    bach: {
      topics: ["Biomoléculas", "Genética y ADN", "Leyes de Newton", "Reacciones químicas", "Termodinámica", "La evolución"],
      quiz: [
        { q: "El ADN contiene la información…", options: ["genética", "muscular", "energética", "mineral"], answer: 0 },
        { q: "La 2ª ley de Newton es…", options: ["F = m·a", "E = m·c²", "V = I·R", "P = m·g"], answer: 0 },
        { q: "La teoría de la evolución se asocia a…", options: ["Newton", "Darwin", "Mendel", "Einstein"], answer: 1 },
        { q: "El pH mide…", options: ["la acidez", "la temperatura", "la masa", "la velocidad"], answer: 0 },
        { q: "Las proteínas están formadas por…", options: ["aminoácidos", "glucosa", "lípidos", "agua"], answer: 0 },
      ],
    },
  },
  general: {
    eso: {
      topics: ["Técnicas de estudio", "Organización del tiempo", "Lectura comprensiva", "Toma de apuntes", "Repaso activo", "Mapas mentales"],
      quiz: [
        { q: "Una buena técnica de estudio es…", options: ["repasar poco a poco", "dejarlo para el final", "no dormir", "copiar"], answer: 0 },
        { q: "La técnica Pomodoro consiste en…", options: ["bloques con descansos", "estudiar sin parar", "no estudiar", "comer tomates"], answer: 0 },
        { q: "Un mapa mental sirve para…", options: ["organizar ideas", "dibujar sin más", "perder tiempo", "jugar"], answer: 0 },
        { q: "Para memorizar mejor conviene…", options: ["repasar varios días", "leer una sola vez", "no dormir", "estudiar con ruido"], answer: 0 },
        { q: "Subrayar ayuda a…", options: ["destacar lo importante", "ensuciar", "copiar", "nada"], answer: 0 },
      ],
    },
  },
};

export function getStudyContent(name: string, level: string): StudyContent {
  const g = detectGroup(name);
  const b = detectBand(level);
  return BANK[g][b] || BANK[g].eso || BANK.general.eso!;
}

// =====================================================================
// MOTOR DE PREGUNTAS: infinitas (mates, procedurales) + banco sin repetir
// Cada pregunta lleva una firma (sig) para no repetirse por alumno.
// =====================================================================
export type QQ = { q: string; options: string[]; answer: number; sig: string };

export function sig(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return "q" + (h >>> 0).toString(36);
}

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = <T,>(arr: T[]) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

function build(q: string, answer: number | string, distractors: (number | string)[]): QQ {
  const set = [String(answer), ...distractors.map(String)];
  const uniq: string[] = [];
  for (const o of set) if (!uniq.includes(o)) uniq.push(o);
  let guard = 0;
  while (uniq.length < 4 && guard++ < 50) { const c = String(rnd(0, 99)); if (!uniq.includes(c)) uniq.push(c); }
  const four = uniq.slice(0, 4);
  if (!four.includes(String(answer))) four[3] = String(answer);
  shuffle(four);
  return { q, options: four, answer: four.indexOf(String(answer)), sig: sig("m|" + q) };
}

// Generador procedural de matemáticas (infinito y siempre nuevo)
function mathGen(band: Band): QQ {
  if (band === "primaria") {
    switch (rnd(1, 5)) {
      case 1: { const a = rnd(2, 9), b = rnd(2, 9); return build(`${a} × ${b} = ?`, a * b, [a * b + b, a * b - a, a * (b + 1)]); }
      case 2: { const a = rnd(15, 89), b = rnd(10, 60); return build(`${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 1, a + b + 9]); }
      case 3: { const a = rnd(40, 99), b = rnd(10, 39); return build(`${a} − ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 1]); }
      case 4: { const n = rnd(2, 24) * 2; return build(`¿Cuánto es la mitad de ${n}?`, n / 2, [n / 2 + 1, n / 2 - 1, n]); }
      default: { const h = rnd(1, 5); return build(`¿Cuántos minutos hay en ${h} ${h === 1 ? "hora" : "horas"}?`, h * 60, [h * 60 + 10, h * 60 - 10, h * 100]); }
    }
  }
  if (band === "eso") {
    switch (rnd(1, 4)) {
      case 1: { const p = [10, 20, 25, 50][rnd(0, 3)]; const base = rnd(2, 20) * 20; return build(`¿Cuánto es el ${p}% de ${base}?`, (base * p) / 100, [(base * p) / 100 + 5, (base * p) / 100 - 5, base / 2]); }
      case 2: { const x = rnd(2, 12), b = rnd(1, 9), c = 2 * x + b; return build(`Resuelve 2x + ${b} = ${c}. x = ?`, x, [x + 1, x - 1, c - b]); }
      case 3: { const a = rnd(2, 9), b = rnd(2, 9); return build(`(−${a}) × (−${b}) = ?`, a * b, [-(a * b), a * b - 1, -(a + b)]); }
      default: { const w = rnd(3, 12), h = rnd(2, 9); return build(`Área de un rectángulo de ${w} × ${h}`, w * h, [2 * (w + h), w + h, w * h + w]); }
    }
  }
  // bachillerato
  switch (rnd(1, 4)) {
    case 1: { const k = rnd(1, 5); return build(`log₁₀(10^${k}) = ?`, k, [k + 1, k - 1, 10 * k]); }
    case 2: { const k = rnd(2, 6); return build(`2^${k} = ?`, 2 ** k, [2 ** k + 2, 2 ** k - 2, 2 * k]); }
    case 3: { const p = [15, 30, 40, 75][rnd(0, 3)]; const base = rnd(2, 20) * 20; return build(`¿Cuánto es el ${p}% de ${base}?`, (base * p) / 100, [(base * p) / 100 + 10, (base * p) / 100 - 10, base / 2]); }
    default: { const a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 8); const m = (a + b + c) / 3; const mm = Number.isInteger(m) ? m : Math.round(m); return build(`Media de ${a}, ${b} y ${c} (redondea)`, mm, [mm + 1, mm - 1, a + b + c]); }
  }
}

// Devuelve n preguntas evitando las ya vistas (sig en `seen`)
export function getQuizQuestions(name: string, level: string, seen: Set<string>, n = 5): QQ[] {
  const g = detectGroup(name), b = detectBand(level);
  if (g === "matematicas") {
    const out: QQ[] = []; const used = new Set<string>(); let guard = 0;
    while (out.length < n && guard++ < 300) { const q = mathGen(b); if (seen.has(q.sig) || used.has(q.sig)) continue; used.add(q.sig); out.push(q); }
    return out;
  }
  const bank = (BANK[g][b] || BANK[g].eso || BANK.general.eso!).quiz;
  const pool: QQ[] = bank.map((qz) => ({ q: qz.q, options: qz.options, answer: qz.answer, sig: sig(g + b + "|" + qz.q) }));
  const unseen = shuffle(pool.filter((p) => !seen.has(p.sig)));
  let res = unseen.slice(0, n);
  if (res.length < n) {
    const extra = shuffle(pool.filter((p) => !res.find((r) => r.sig === p.sig)));
    res = res.concat(extra.slice(0, n - res.length));
  }
  return res;
}
