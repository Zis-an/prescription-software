/**
 * Clinical OS — Demo clinical database (local)
 * Seeds IndexedDB-compatible localStorage store on first run.
 * Replace with sync API + SQLite later; same shape.
 */
(function (global) {
  const DB_KEY = "clinicalos.demo.v1";
  const META_KEY = "clinicalos.demo.meta";

  const seed = {
    doctor: {
      id: "DOC-001",
      name: "Dr. Ayesha Rahman",
      qualification: "MBBS, FCPS (Medicine)",
      bmdc: "A-54321",
      phone: "+8801711000000",
      email: "ayesha.rahman@clinicalos.demo",
      specialty: "Internal Medicine",
    },
    chambers: [
      {
        id: "CH-01",
        name: "Green Life Chamber",
        address: "House 12, Road 4, Dhanmondi, Dhaka-1209",
        phone: "+8802-55000000",
        hours: "Sat–Thu 18:00–21:00",
        fee: 800,
        active: true,
      },
      {
        id: "CH-02",
        name: "City Heart Clinic",
        address: "Plot 7, Agrabad C/A, Chattogram",
        phone: "+88031-710000",
        hours: "Fri 10:00–13:00",
        fee: 1000,
        active: false,
      },
    ],
    patients: [
      {
        id: "P-10088",
        name: "Karim Hossain",
        nameBn: "করিম হোসেন",
        ageYears: 42,
        sex: "male",
        weightKg: 72,
        heightCm: 168,
        phone: "+8801811000001",
        nid: "1985123456789",
        address: "Mirpur-10, Dhaka",
        bloodGroup: "B+",
        allergies: ["Penicillin"],
        conditions: ["Type 2 Diabetes Mellitus", "Hypertension"],
        lastVisit: "2026-11-23",
        chronicMeds: ["Metformin 500 mg BID", "Amlodipine 5 mg OD"],
      },
      {
        id: "P-10091",
        name: "Salma Akter",
        nameBn: "সালমা আক্তার",
        ageYears: 29,
        sex: "female",
        weightKg: 58,
        heightCm: 156,
        phone: "+8801711000002",
        address: "Mohammadpur, Dhaka",
        bloodGroup: "O+",
        allergies: [],
        conditions: ["Pregnancy — G2P1, 28 weeks"],
        lastVisit: "2026-11-20",
        chronicMeds: ["Iron + Folic acid OD", "Calcium OD"],
      },
      {
        id: "P-10094",
        name: "Rafiq Uddin",
        nameBn: "রফিক উদ্দিন",
        ageYears: 61,
        sex: "male",
        weightKg: 78,
        heightCm: 170,
        phone: "+8801911000003",
        address: "Uttara Sector 7, Dhaka",
        bloodGroup: "A+",
        allergies: ["Sulfa drugs"],
        conditions: ["COPD", "Ischemic heart disease"],
        lastVisit: "2026-11-18",
        chronicMeds: ["Tiotropium inhaler OD", "Aspirin 75 mg OD", "Atorvastatin 20 mg OD"],
      },
      {
        id: "P-10102",
        name: "Nusrat Jahan",
        nameBn: "নুসরাত জাহান",
        ageYears: 8,
        sex: "female",
        weightKg: 24,
        heightCm: 128,
        phone: "+8801611000004",
        address: "Bashundhara R/A, Dhaka",
        bloodGroup: "AB+",
        allergies: [],
        conditions: [],
        lastVisit: "2026-11-15",
        chronicMeds: [],
        guardian: "Fatema Begum (Mother)",
      },
      {
        id: "P-10108",
        name: "Abdul Mannan",
        nameBn: "আব্দুল মান্নান",
        ageYears: 55,
        sex: "male",
        weightKg: 81,
        heightCm: 172,
        phone: "+8801511000005",
        address: "Sylhet Sadar",
        bloodGroup: "B-",
        allergies: ["NSAID — gastric bleed history"],
        conditions: ["Osteoarthritis", "Dyslipidemia"],
        lastVisit: "2026-11-10",
        chronicMeds: ["Paracetamol PRN", "Rosuvastatin 10 mg OD"],
      },
      {
        id: "P-10115",
        name: "Fahmida Islam",
        nameBn: "ফাহমিদা ইসলাম",
        ageYears: 34,
        sex: "female",
        weightKg: 64,
        heightCm: 160,
        phone: "+8801311000006",
        address: "Rajshahi City",
        bloodGroup: "O-",
        allergies: [],
        conditions: ["Migraine", "Hypothyroidism"],
        lastVisit: "2026-11-22",
        chronicMeds: ["Levothyroxine 50 mcg OD", "Propranolol 20 mg PRN"],
      },
      {
        id: "P-10122",
        name: "Imran Chowdhury",
        nameBn: "ইমরান চৌধুরী",
        ageYears: 19,
        sex: "male",
        weightKg: 68,
        heightCm: 175,
        phone: "+8801811000007",
        address: "Comilla Cantonment",
        bloodGroup: "A-",
        allergies: [],
        conditions: ["Seasonal allergic rhinitis"],
        lastVisit: "2026-11-12",
        chronicMeds: [],
      },
      {
        id: "P-10130",
        name: "Begum Rokeya",
        nameBn: "বেগম রোকেয়া",
        ageYears: 72,
        sex: "female",
        weightKg: 55,
        heightCm: 152,
        phone: "+8801711000008",
        address: "Old Dhaka, Lalbagh",
        bloodGroup: "B+",
        allergies: ["Codeine"],
        conditions: ["Heart failure NYHA II", "CKD stage 3", "Anemia"],
        lastVisit: "2026-11-21",
        chronicMeds: ["Furosemide 40 mg OD", "Bisoprolol 2.5 mg OD", "Iron sucrose protocol"],
      },
      {
        id: "P-10138",
        name: "Tanvir Ahmed",
        nameBn: "তানভীর আহমেদ",
        ageYears: 45,
        sex: "male",
        weightKg: 88,
        heightCm: 174,
        phone: "+8801911000009",
        address: "Gulshan-2, Dhaka",
        bloodGroup: "O+",
        allergies: [],
        conditions: ["Obesity", "Prediabetes", "GERD"],
        lastVisit: "2026-11-19",
        chronicMeds: ["Pantoprazole 40 mg OD"],
      },
      {
        id: "P-10145",
        name: "Mitu Rani Das",
        nameBn: "মিতু রানী দাস",
        ageYears: 38,
        sex: "female",
        weightKg: 61,
        heightCm: 158,
        phone: "+8801611000010",
        address: "Khulna Sadar",
        bloodGroup: "A+",
        allergies: ["Latex"],
        conditions: ["Asthma"],
        lastVisit: "2026-11-17",
        chronicMeds: ["Salbutamol inhaler PRN", "Budesonide inhaler BID"],
      },
      {
        id: "P-10152",
        name: "Shahidul Islam",
        nameBn: "শাহিদুল ইসলাম",
        ageYears: 50,
        sex: "male",
        weightKg: 76,
        heightCm: 169,
        phone: "+8801511000011",
        address: "Bogura",
        bloodGroup: "AB-",
        allergies: [],
        conditions: ["Benign prostatic hyperplasia"],
        lastVisit: "2026-11-08",
        chronicMeds: ["Tamsulosin 0.4 mg OD"],
      },
      {
        id: "P-10160",
        name: "Anika Sultana",
        nameBn: "আনিকা সুলতানা",
        ageYears: 23,
        sex: "female",
        weightKg: 52,
        heightCm: 162,
        phone: "+8801311000012",
        address: "Barishal",
        bloodGroup: "B+",
        allergies: [],
        conditions: ["Anxiety disorder"],
        lastVisit: "2026-11-14",
        chronicMeds: ["Sertraline 50 mg OD"],
      },
    ],
    drugs: [
      { id: "D-001", brand: "Azithrocin", generic: "Azithromycin", strength: "500 mg", form: "Tablet", company: "Square", tags: ["antibiotic"] },
      { id: "D-002", brand: "Napa", generic: "Paracetamol", strength: "500 mg", form: "Tablet", company: "Beximco", tags: ["analgesic", "antipyretic"] },
      { id: "D-003", brand: "Comet", generic: "Metformin", strength: "500 mg", form: "Tablet", company: "Square", tags: ["antidiabetic"] },
      { id: "D-004", brand: "Amlocard", generic: "Amlodipine", strength: "5 mg", form: "Tablet", company: "Incepta", tags: ["antihypertensive"] },
      { id: "D-005", brand: "Seclo", generic: "Omeprazole", strength: "20 mg", form: "Capsule", company: "Square", tags: ["ppi"] },
      { id: "D-006", brand: "Pantonix", generic: "Pantoprazole", strength: "40 mg", form: "Tablet", company: "Incepta", tags: ["ppi"] },
      { id: "D-007", brand: "Ciprocin", generic: "Ciprofloxacin", strength: "500 mg", form: "Tablet", company: "Square", tags: ["antibiotic"] },
      { id: "D-008", brand: "Amoxicil", generic: "Amoxicillin", strength: "500 mg", form: "Capsule", company: "Renata", tags: ["antibiotic", "penicillin"] },
      { id: "D-009", brand: "Fexo", generic: "Fexofenadine", strength: "120 mg", form: "Tablet", company: "Square", tags: ["antihistamine"] },
      { id: "D-010", brand: "Montair", generic: "Montelukast", strength: "10 mg", form: "Tablet", company: "Incepta", tags: ["asthma"] },
      { id: "D-011", brand: "Thyrox", generic: "Levothyroxine", strength: "50 mcg", form: "Tablet", company: "Renata", tags: ["thyroid"] },
      { id: "D-012", brand: "Atorva", generic: "Atorvastatin", strength: "20 mg", form: "Tablet", company: "Beximco", tags: ["statin"] },
      { id: "D-013", brand: "Losectil", generic: "Omeprazole", strength: "40 mg", form: "Capsule", company: "Eskayef", tags: ["ppi"] },
      { id: "D-014", brand: "Maxpro", generic: "Esomeprazole", strength: "40 mg", form: "Capsule", company: "Renata", tags: ["ppi"] },
      { id: "D-015", brand: "Napa Extend", generic: "Paracetamol", strength: "665 mg", form: "Tablet", company: "Beximco", tags: ["analgesic"] },
      { id: "D-016", brand: "Oradin", generic: "Loratadine", strength: "10 mg", form: "Tablet", company: "Incepta", tags: ["antihistamine"] },
      { id: "D-017", brand: "Flazo", generic: "Flucloxacillin", strength: "500 mg", form: "Capsule", company: "Square", tags: ["antibiotic", "penicillin"] },
      { id: "D-018", brand: "Zimax", generic: "Azithromycin", strength: "250 mg", form: "Tablet", company: "Beximco", tags: ["antibiotic"] },
      { id: "D-019", brand: "Diamicron", generic: "Gliclazide", strength: "80 mg", form: "Tablet", company: "Servier", tags: ["antidiabetic"] },
      { id: "D-020", brand: "Concor", generic: "Bisoprolol", strength: "2.5 mg", form: "Tablet", company: "Merck", tags: ["beta-blocker"] },
      { id: "D-021", brand: "Lasix", generic: "Furosemide", strength: "40 mg", form: "Tablet", company: "Sanofi", tags: ["diuretic"] },
      { id: "D-022", brand: "Ventolin", generic: "Salbutamol", strength: "100 mcg", form: "Inhaler", company: "GSK", tags: ["asthma"] },
      { id: "D-023", brand: "Seretide", generic: "Fluticasone + Salmeterol", strength: "250/50", form: "Inhaler", company: "GSK", tags: ["asthma"] },
      { id: "D-024", brand: "Ecosprin", generic: "Aspirin", strength: "75 mg", form: "Tablet", company: "USV", tags: ["antiplatelet"] },
    ],
    queue: [
      { serial: 44, patientId: "P-10115", status: "done", checkedInAt: "17:42", vitals: { bp: "118/76", pulse: 78, tempC: 36.8, spo2: 99 } },
      { serial: 45, patientId: "P-10108", status: "done", checkedInAt: "17:55", vitals: { bp: "132/84", pulse: 80, tempC: 36.9, spo2: 98 } },
      { serial: 46, patientId: "P-10091", status: "done", checkedInAt: "18:10", vitals: { bp: "110/70", pulse: 88, tempC: 36.7, spo2: 99 } },
      { serial: 47, patientId: "P-10088", status: "current", checkedInAt: "18:28", vitals: { bp: "128/82", pulse: 84, tempC: 37.8, spo2: 98 } },
      { serial: 48, patientId: "P-10094", status: "waiting", checkedInAt: "18:35", vitals: { bp: "138/88", pulse: 92, tempC: 36.9, spo2: 96 } },
      { serial: 49, patientId: "P-10130", status: "waiting", checkedInAt: "18:41", vitals: { bp: "122/78", pulse: 70, tempC: 36.6, spo2: 97 } },
      { serial: 50, patientId: "P-10138", status: "waiting", checkedInAt: "18:50", vitals: null },
      { serial: 51, patientId: "P-10145", status: "waiting", checkedInAt: "18:58", vitals: null },
      { serial: 52, patientId: "P-10102", status: "waiting", checkedInAt: "19:05", vitals: { bp: null, pulse: 96, tempC: 38.2, spo2: 98 } },
    ],
    prescriptions: [
      {
        id: "RX-2026-000148",
        patientId: "P-10088",
        chamberId: "CH-01",
        version: 1,
        status: "draft",
        authoredOn: "2026-11-24T18:30:00+06:00",
        chiefComplaint: "Sore throat, mild fever for 2 days",
        diagnosis: "Acute pharyngitis; Type 2 DM (controlled)",
        advice: "Warm saline gargle. Continue metformin. Return earlier if fever >102°F or difficulty swallowing.",
        adviceBn: "গলা গরম লবণ পানি দিয়ে কুলি করুন। মেটফরমিন চালিয়ে যান। জ্বর বা গিলতে কষ্ট হলে আগে ফিরে আসুন।",
        followUpDate: "2026-12-07",
        medications: [
          {
            drugId: "D-001",
            dose: "1 tablet",
            frequency: "OD",
            durationDays: 3,
            instruction: "1 hour before meal",
            instructionBn: "খাবারের ১ ঘণ্টা আগে",
          },
          {
            drugId: "D-002",
            dose: "1 tablet",
            frequency: "q6h PRN",
            durationDays: 3,
            instruction: "After food · max 4 g/day",
            instructionBn: "খাবারের পরে",
          },
          {
            drugId: "D-003",
            dose: "1 tablet",
            frequency: "BID",
            durationDays: 30,
            instruction: "With meals — continue",
            instructionBn: "খাবারের সাথে — চালিয়ে যান",
          },
        ],
      },
      {
        id: "RX-2026-000140",
        patientId: "P-10088",
        chamberId: "CH-01",
        version: 1,
        status: "signed",
        authoredOn: "2026-10-12T19:05:00+06:00",
        chiefComplaint: "Routine diabetes follow-up",
        diagnosis: "T2DM — stable",
        advice: "Diet control. Walk 30 minutes daily.",
        adviceBn: "খাদ্য নিয়ন্ত্রণ করুন। প্রতিদিন ৩০ মিনিট হাঁটুন।",
        followUpDate: "2026-11-12",
        medications: [
          { drugId: "D-003", dose: "1 tablet", frequency: "BID", durationDays: 30, instruction: "With meals", instructionBn: "খাবারের সাথে" },
          { drugId: "D-004", dose: "1 tablet", frequency: "OD", durationDays: 30, instruction: "Morning", instructionBn: "সকালে" },
        ],
      },
      {
        id: "RX-2026-000136",
        patientId: "P-10091",
        chamberId: "CH-01",
        version: 1,
        status: "signed",
        authoredOn: "2026-11-20T18:40:00+06:00",
        chiefComplaint: "ANC visit — 28 weeks",
        diagnosis: "Pregnancy G2P1 @ 28 weeks — routine ANC",
        advice: "Iron after meal. Report reduced fetal movement.",
        adviceBn: "খাবারের পরে আয়রন খান। গর্ভের নড়াচড়া কমলে জানান।",
        followUpDate: "2026-12-04",
        medications: [],
      },
    ],
    session: {
      activePatientId: "P-10088",
      activeChamberId: "CH-01",
      locale: "en",
      paper: "a5",
      syncState: "online",
      pendingOps: 0,
      lastSyncedAt: new Date().toISOString(),
    },
  };

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ seededAt: db._seededAt, updatedAt: new Date().toISOString(), version: 1 })
    );
  }

  function ensure() {
    let db = load();
    if (!db) {
      db = structuredClone(seed);
      db._seededAt = new Date().toISOString();
      save(db);
    }
    return db;
  }

  function reset() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(META_KEY);
    return ensure();
  }

  function patientById(id) {
    return ensure().patients.find((p) => p.id === id) || null;
  }

  function drugById(id) {
    const local = ensure().drugs.find((d) => d.id === id);
    if (local) return local;
    if (global.ClinicalOSDrugAPI && global.ClinicalOSDrugAPI.ready()) {
      return global.ClinicalOSDrugAPI.byId(id);
    }
    return null;
  }

  function activeChamber() {
    const db = ensure();
    return db.chambers.find((c) => c.id === db.session.activeChamberId) || db.chambers[0];
  }

  function activePatient() {
    const db = ensure();
    return patientById(db.session.activePatientId);
  }

  function setActivePatient(id) {
    const db = ensure();
    if (!patientById(id)) return null;
    db.session.activePatientId = id;
    save(db);
    return patientById(id);
  }

  function searchPatients(query) {
    const q = (query || "").trim().toLowerCase();
    const list = ensure().patients;
    if (!q) return list.slice().sort((a, b) => (b.lastVisit || "").localeCompare(a.lastVisit || ""));
    return list.filter((p) => {
      const hay = [p.name, p.nameBn, p.phone, p.id, ...(p.conditions || []), ...(p.allergies || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q) || p.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
    });
  }

  function searchDrugs(query, opts) {
    const options = opts || {};
    if (global.ClinicalOSDrugAPI && global.ClinicalOSDrugAPI.ready()) {
      return global.ClinicalOSDrugAPI.search(query, {
        limit: options.limit || 12,
        system: options.system || "Allopathic",
      });
    }
    const q = (query || "").trim().toLowerCase();
    const list = ensure().drugs;
    if (!q) return list.slice(0, 8);
    return list
      .filter((d) =>
        [d.brand, d.generic, d.strength, d.form, d.company, ...(d.tags || [])].join(" ").toLowerCase().includes(q)
      )
      .slice(0, options.limit || 12);
  }

  async function searchDrugsAsync(query, opts) {
    const options = opts || {};
    if (global.ClinicalOSDrugAPI && global.ClinicalOSDrugAPI.searchAsync) {
      return global.ClinicalOSDrugAPI.searchAsync(query, {
        limit: options.limit || 12,
        system: options.system || "Allopathic",
      });
    }
    return searchDrugs(query, opts);
  }

  function queueToday() {
    const db = ensure();
    return db.queue.map((row) => ({
      ...row,
      patient: patientById(row.patientId),
    }));
  }

  function prescriptionsFor(patientId) {
    return ensure()
      .prescriptions.filter((r) => r.patientId === patientId)
      .sort((a, b) => b.authoredOn.localeCompare(a.authoredOn));
  }

  function draftFor(patientId) {
    return (
      ensure().prescriptions.find((r) => r.patientId === patientId && r.status === "draft") || null
    );
  }

  function enrichMeds(meds) {
    return (meds || []).map((m, i) => {
      const drug = drugById(m.drugId);
      return {
        lineNo: i + 1,
        ...m,
        brand: drug?.brand || "—",
        generic: drug?.generic || "—",
        strength: drug?.strength || "",
        form: drug?.form || "",
        tags: drug?.tags || [],
      };
    });
  }

  function stats() {
    const db = ensure();
    const q = db.queue;
    const kbCount =
      global.ClinicalOSDrugAPI && global.ClinicalOSDrugAPI.ready()
        ? global.ClinicalOSDrugAPI.meta().count
        : db.drugs.length;
    return {
      patients: db.patients.length,
      drugs: kbCount,
      waiting: q.filter((x) => x.status === "waiting").length,
      done: q.filter((x) => x.status === "done").length,
      current: q.find((x) => x.status === "current") || null,
      prescriptions: db.prescriptions.length,
    };
  }

  global.ClinicalOSDB = {
    ensure,
    reset,
    save,
    load,
    patientById,
    drugById,
    activeChamber,
    activePatient,
    setActivePatient,
    searchPatients,
    searchDrugs,
    searchDrugsAsync,
    queueToday,
    prescriptionsFor,
    draftFor,
    enrichMeds,
    stats,
    seed,
  };
})(window);
