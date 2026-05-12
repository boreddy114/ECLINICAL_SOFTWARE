export const providers = [
  { id: 'pr-1', name: 'Dr. Sarah Jenkins', specialty: 'Orthopedic Surgery', initials: 'SJ' },
  { id: 'pr-2', name: 'Dr. Michael Chen', specialty: 'Neurology', initials: 'MC' }
];

export const patients = [
  {
    id: "PT-001",
    name: "Eleanor Vance",
    dob: "1982-04-12",
    gender: "Female",
    mrn: "MRN-847291",
    phone: "(555) 123-4567",
    email: "eleanor.v@example.com",
    address: "123 Maple Street, Springfield, IL",
    vitalsHistory: [
      { date: "2023-01-10", sys: 125, dia: 82, hr: 75, temp: 98.4 },
      { date: "2023-04-15", sys: 128, dia: 85, hr: 74, temp: 98.6 },
      { date: "2023-07-22", sys: 122, dia: 80, hr: 72, temp: 98.5 },
      { date: "2023-10-15", sys: 120, dia: 80, hr: 72, temp: 98.6 }
    ],
    labHistory: [
      { date: "2023-01-10", a1c: 6.2, glucose: 105 },
      { date: "2023-04-15", a1c: 6.0, glucose: 98 },
      { date: "2023-07-22", a1c: 5.8, glucose: 95 },
      { date: "2023-10-15", a1c: 5.7, glucose: 92 }
    ],
    vitals: {
      bp: "120/80",
      hr: "72",
      temp: "98.6°F",
      weight: "145 lbs",
      bmi: "23.4",
      height: "5'6\""
    },
    conditions: [
      { name: "Type 2 Diabetes Mellitus", date: "2019-11-04", status: "Active" },
      { name: "Hypertension", date: "2020-05-12", status: "Active" },
      { name: "Chronic Back Pain", date: "2021-02-18", status: "Active" }
    ],
    medications: [
      { name: "Metformin 500mg", dosage: "Twice daily", status: "Active" },
      { name: "Lisinopril 10mg", dosage: "Once daily", status: "Active" },
      { name: "Ibuprofen 400mg", dosage: "As needed", status: "Active" }
    ],
    allergies: [
      { name: "Penicillin", reaction: "Hives" }
    ],
    encounters: [
      { date: "2023-10-15", type: "Follow-up", provider: "Dr. Sarah Jenkins", notes: "Patient reported slight lower back pain. BP is stable." },
      { date: "2023-06-22", type: "Annual Physical", provider: "Dr. Sarah Jenkins", notes: "All labs normal. Refilled Metformin." }
    ],
    imaging: [
      { id: "IMG-001", type: "MRI", region: "Lumbar Spine", date: "2023-02-18", status: "Reviewed", url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800" }
    ]
  },
  {
    id: "PT-002",
    name: "Marcus Johnson",
    dob: "1965-08-24",
    gender: "Male",
    mrn: "MRN-392011",
    phone: "(555) 987-6543",
    email: "mjohnson65@example.com",
    address: "88 Oak Avenue, Springfield, IL",
    vitalsHistory: [
      { date: "2023-02-14", sys: 140, dia: 90, hr: 82, temp: 98.1 },
      { date: "2023-06-11", sys: 138, dia: 88, hr: 80, temp: 98.3 },
      { date: "2023-11-02", sys: 135, dia: 88, hr: 84, temp: 98.2 }
    ],
    labHistory: [
      { date: "2023-02-14", a1c: 5.5, glucose: 92 },
      { date: "2023-06-11", a1c: 5.4, glucose: 89 },
      { date: "2023-11-02", a1c: 5.6, glucose: 95 }
    ],
    vitals: {
      bp: "135/88",
      hr: "84",
      temp: "98.2°F",
      weight: "210 lbs",
      bmi: "29.3",
      height: "5'11\""
    },
    conditions: [
      { name: "Hyperlipidemia", date: "2018-03-10", status: "Active" },
      { name: "Osteoarthritis", date: "2022-09-05", status: "Active" }
    ],
    medications: [
      { name: "Atorvastatin 20mg", dosage: "Once daily at bedtime", status: "Active" },
      { name: "Meloxicam 15mg", dosage: "Once daily", status: "Active" }
    ],
    allergies: [
      { name: "Sulfa Drugs", reaction: "Rash" }
    ],
    encounters: [
      { date: "2023-11-02", type: "Consultation", provider: "Dr. Alan Smith", notes: "Discussed joint pain in right knee. Recommended physical therapy." }
    ],
    imaging: [
      { id: "IMG-002", type: "X-Ray", region: "Right Knee", date: "2023-11-02", status: "Reviewed", url: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800" }
    ]
  },
  {
    id: "PT-003",
    name: "Sophia Martinez",
    dob: "1995-12-05",
    gender: "Female",
    mrn: "MRN-558293",
    phone: "(555) 456-7890",
    email: "smartinez@example.com",
    address: "442 Pine Lane, Springfield, IL",
    vitalsHistory: [
      { date: "2023-01-20", sys: 108, dia: 68, hr: 65, temp: 98.2 },
      { date: "2023-05-30", sys: 112, dia: 70, hr: 66, temp: 98.4 },
      { date: "2023-09-18", sys: 110, dia: 70, hr: 68, temp: 98.4 }
    ],
    labHistory: [
      { date: "2023-01-20", a1c: 4.8, glucose: 82 },
      { date: "2023-05-30", a1c: 4.9, glucose: 85 },
      { date: "2023-09-18", a1c: 4.9, glucose: 84 }
    ],
    vitals: {
      bp: "110/70",
      hr: "68",
      temp: "98.4°F",
      weight: "130 lbs",
      bmi: "22.3",
      height: "5'4\""
    },
    conditions: [
      { name: "Asthma", date: "2005-06-15", status: "Active" },
      { name: "Seasonal Allergies", date: "2010-04-20", status: "Active" }
    ],
    medications: [
      { name: "Albuterol Inhaler", dosage: "2 puffs every 4-6 hours PRN", status: "Active" },
      { name: "Cetirizine 10mg", dosage: "Once daily", status: "Active" }
    ],
    allergies: [
      { name: "Peanuts", reaction: "Anaphylaxis" }
    ],
    encounters: [
      { date: "2023-09-18", type: "Sick Visit", provider: "Dr. Emily Chen", notes: "Patient experiencing exacerbation of asthma symptoms due to pollen." }
    ],
    imaging: []
  }
];
