import fs from 'fs';

const medNames = [
  "ALKASOL SY", "MYCOMIN Z SY", "MAHASHAKTI SF GOLD SY", "BETADINE OINTMENT", "BETADINE SOLUTION",
  "ZANDU PANCHARISHTA", "ZERODOL SP TAB", "DECATROLIN 100MG INJ", "HEPP FORTE", "OPTI L SYRUP",
  "LUPIZYME PLUS", "MANFORCE CONDOM", "MEFBREAK P FORTE", "DENTAFLAM TAB", "MANMOHAN JADU MALHAM",
  "BECOSULES CAP", "GELUSIL MPS", "NEOPEPTINE DROP", "ORASORE GEL", "SKINSHINE CREAM",
  "DICLOWIN PLUS", "METRO IV", "DICLOTAL AQ INJ", "NEOWAL POWDER", "LIVRO SYRUP",
  "LIVONZYME DS", "CHERI SYRUP", "ELDERVIT AMP", "ENO", "IODEX OINTMENT",
  "DIGEGEL MPS", "CIPLADINE", "IBUGESIC PLUS", "DISPO SYRINGE 10ML", "DISPO SYRINGE 5ML",
  "DISPO SYRINGE 3ML", "DISPO SYRINGE 2ML", "ZEDEX SYRUP", "VITCOFOL INJ", "DEXORANGE SYRUP",
  "MVI INFUSION", "CEFIX OF TAB", "RABHICO OINT", "C ONE SB INJ", "PANTOBERT INJ",
  "ND JET INJ", "NS SODIUM CHLORIDE", "ALMOX 500MG", "ALZYME", "FLUMONT LC",
  "ARISTOZYME DROP", "ARISTOZYME SYRUP", "DULCOFLEX", "NOCOLD SYRUP", "NICIP PLUS",
  "CIPCAL 500", "REXCOF LS", 
  "Dolo 650", "Crocin Advance", "Calpol 500", "Amoxicillin 250mg", "Novamox 500",
  "Paracetamol 500mg", "Aspirin 75mg", "Ibuprofen 400mg", "Diclofenac 50mg", "Montelukast 10mg"
];

// Deduplicate names
const uniqueMedNames = [...new Set(medNames)];

const medicines = uniqueMedNames.map((name, index) => {
  const id = `m${index + 1}`;
  let type = 'tablet';
  if (name.includes('SY') || name.includes('SYRUP')) type = 'syrup';
  else if (name.includes('INJ') || name.includes('IV') || name.includes('AMP') || name.includes('INFUSION')) type = 'injection';
  else if (name.includes('OINT') || name.includes('CREAM') || name.includes('MALHAM') || name.includes('GEL')) type = 'ointment';
  else if (name.includes('DROP')) type = 'drop';
  else if (name.includes('POWDER') || name.includes('ENO')) type = 'powder';
  else if (name.includes('CONDOM') || name.includes('SYRINGE') || name.includes('CHLORIDE')) type = 'device';
  else if (name.includes('SOLUTION')) type = 'solution';

  let category = 'General';
  let composition = ['Generic API'];
  let uses = ['General relief'];
  if (type === 'syrup') { category = 'Supplement/Cough'; uses = ['Cough', 'Nutritional deficiency']; }
  if (type === 'tablet' && name.includes('PLUS')) { category = 'NSAID/Analgesic'; composition = ['Diclofenac', 'Paracetamol']; }
  if (name.includes('BETADINE') || name.includes('CIPLADINE')) { category = 'Antiseptic'; composition = ['Povidone Iodine']; uses = ['First aid']; }
  if (name.includes('ALMOX') || name.includes('CEFIX') || name.includes('METRO')) { category = 'Antibiotic'; composition = ['Amoxicillin/Cefixime']; uses = ['Bacterial infection']; }
  if (name.includes('ZYME') || name.includes('GELUSIL') || name.includes('ENO')) { category = 'Antacid/Enzyme'; }
  if (name.includes('Dolo') || name.includes('Crocin') || name.includes('Paracetamol')) { category = 'Analgesic/Antipyretic'; composition = ['Paracetamol 500mg']; uses=['Fever']; }
  if (name.includes('Amoxicillin') || name.includes('Novamox')) { category = 'Antibiotic'; composition=['Amoxicillin 500mg']; uses=['Bacterial infections']; }
  
  return {
    id,
    name,
    type,
    category,
    composition,
    uses,
    sideEffects: ['Nausea', 'Dizziness', 'Mild allergy risk'],
    contraindications: ['Hypersensitivity', 'Pregnancy (consult doctor)'],
    alternatives: [],
    price: Math.floor(Math.random() * 200) + 20,
    prescriptionRequired: category === 'Antibiotic' || type === 'injection'
  };
});

// Setup Alternatives correctly
const findId = (str) => {
    const med = medicines.find(m => m.name.toLowerCase().includes(str.toLowerCase()));
    return med ? med.id : null;
};
medicines.forEach(m => {
    if (m.name.includes('Paracetamol') || m.name.includes('Dolo')) { m.alternatives = [findId('Crocin'), findId('Calpol')].filter(Boolean); }
    if (m.name.includes('Amoxicillin') || m.name.includes('ALMOX')) { m.alternatives = [findId('Novamox')].filter(Boolean); }
    if (m.category === 'Antacid/Enzyme') { m.alternatives = [findId('ENO'), findId('GELUSIL')].filter(Boolean); }
});

const chhattisgarhLocations = [
  { lat: 21.2514, lng: 81.6296, loc: 'GE Road, Raipur, Chhattisgarh', name: 'Apollo Pharmacy' },
  { lat: 21.2408, lng: 81.6672, loc: 'Shankar Nagar, Raipur, Chhattisgarh', name: 'CareWell Pharmacy' },
  { lat: 21.2067, lng: 81.3733, loc: 'Supela, Bhilai, Chhattisgarh', name: 'Janta Medical Store' },
  { lat: 21.2186, lng: 81.4285, loc: 'Nehru Nagar, Bhilai, Chhattisgarh', name: 'Bhilai Medicos' },
  { lat: 21.1904, lng: 81.2849, loc: 'Station Road, Durg, Chhattisgarh', name: 'Lifeline Pharmacy' },
  { lat: 22.0797, lng: 82.1391, loc: 'Link Road, Bilaspur, Chhattisgarh', name: 'City Medical Hall' },
  { lat: 22.3595, lng: 82.7501, loc: 'Transport Nagar, Korba, Chhattisgarh', name: 'Korba Wellness' },
];

const pharmacies = Array.from({ length: 30 }).map((_, i) => {
  const template = chhattisgarhLocations[i % chhattisgarhLocations.length];
  
  // Random shift lat/lng to spread them out nearby
  const shiftedLat = template.lat + (Math.random() - 0.5) * 0.05;
  const shiftedLng = template.lng + (Math.random() - 0.5) * 0.05;
  
  // Assign a random subset of medicines
  const stockCount = Math.floor(Math.random() * 30) + 10;
  const shuffledIds = [...medicines].sort(() => 0.5 - Math.random()).slice(0, stockCount).map(m => m.id);

  return {
    id: 'p' + (i + 1),
    name: template.name + (i > 6 ? ' - Branch ' + (Math.floor(i/7) + 1) : ''),
    address: template.loc,
    phone: '+91 9' + Math.floor(10000000 + Math.random() * 90000000),
    distance: (Math.random() * 4.5 + 0.5).toFixed(1) + ' km',
    lat: shiftedLat,
    lng: shiftedLng,
    availableMedicines: shuffledIds,
    stockLevel: Math.random() > 0.3 ? 'High' : 'Low'
  };
});

const adr_rules = [
  { symptom: 'Bleeding', severity: 'Severe', riskLevel: 'High', recommendation: 'Seek immediate emergency medical attention.' },
  { symptom: 'Severe rash', severity: 'Severe', riskLevel: 'High', recommendation: 'Stop medication immediately and consult a doctor.' },
  { symptom: 'Breathing difficulty', severity: 'Severe', riskLevel: 'High', recommendation: 'Call emergency services immediately. Possible anaphylaxis.' },
  { symptom: 'Nausea', severity: 'Mild', riskLevel: 'Low', recommendation: 'Take with food. Consult doctor if persistent.' },
  { symptom: 'Stomach ulcer', severity: 'Moderate', riskLevel: 'Medium', recommendation: 'Stop NSAID use and consult physician.' }
];

const interactions = [
  { drugs: ['IBUGESIC PLUS', 'Aspirin 75mg'], status: 'Avoid', reason: 'High risk of GI bleeding and ulceration when compounding NSAIDs.' },
  { drugs: ['Paracetamol 500mg', 'Ibuprofen 400mg'], status: 'Warning', reason: 'May increase hepatic and renal strain if taken continuously.' },
  { drugs: ['Diclofenac 50mg', 'Ibuprofen 400mg'], status: 'Avoid', reason: 'Duplicate NSAID therapy strongly contraindicated; risk of fatal bleeding.' },
  { drugs: ['DECATROLIN 100MG INJ', 'ZERODOL SP TAB'], status: 'Warning', reason: 'Steroid + NSAID combination can significantly increase risk of peptic ulcers.' },
  { drugs: ['ALMOX 500MG', 'GELUSIL MPS'], status: 'Warning', reason: 'Antacids may decrease the absorption of antibiotics. Leave a 2-hour gap.' },
  { drugs: ['FLUMONT LC', 'Aspirin 75mg'], status: 'Safe', reason: 'Montelukast combinations generally do not have severe interactions with low-dose aspirin.' }
];

const counterfeit_db = [
  { medicineName: 'Dolo 650', manufacturer: 'Micro Labs', batchNumber: 'BATCH123', mfgDate: '01/2025', expDate: '12/2027', status: 'Verified' },
  { medicineName: 'ALMOX 500MG', manufacturer: 'Alkem', batchNumber: 'ALM99X', mfgDate: '06/2024', expDate: '05/2026', status: 'Verified' },
  { medicineName: 'BETADINE OINTMENT', manufacturer: 'Win-Medicare', batchNumber: 'FAKE001', mfgDate: '01/2025', expDate: '01/2026', status: 'Recalled' },
  { medicineName: 'ZERODOL SP TAB', manufacturer: 'Ipca', batchNumber: 'ZSP888', mfgDate: '11/2021', expDate: '10/2023', status: 'Expired' },
];

const brand_substitution = {
  'Paracetamol': ['Dolo 650', 'Crocin Advance', 'Calpol 500'],
  'Amoxicillin': ['ALMOX 500MG', 'Novamox 500'],
  'Antacid': ['ENO', 'GELUSIL MPS', 'DIGEGEL MPS'],
  'Ibuprofen': ['IBUGESIC PLUS'],
  'Cough Syrup': ['ZEDEX SYRUP', 'NOCOLD SYRUP', 'REXCOF LS']
};

const inventory_dataset = medicines.map((m, i) => {
  const stockCount = Math.floor(Math.random() * 500) + 10;
  const reorderLevel = Math.floor(Math.random() * 50) + 20;
  let status = 'Healthy';
  if (stockCount < reorderLevel) status = 'Critical';
  else if (stockCount < reorderLevel + 20) status = 'Low Stock';
  
  return {
    id: `inv_${i+1}`,
    medicineId: m.id,
    medicineName: m.name,
    category: m.category,
    batchNumber: `BATCH${Math.floor(1000 + Math.random() * 9000)}`,
    stockCount,
    reorderLevel,
    status
  };
});

const sales_dataset = Array.from({ length: 300 }).map((_, i) => {
  const randomMedicine = medicines[Math.floor(Math.random() * medicines.length)];
  const quantitySold = Math.floor(Math.random() * 10) + 1;
  const price = randomMedicine.price || 50;
  
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 180));
  
  return {
    id: `txn_${1001 + i}`,
    date: date.toISOString().split('T')[0],
    medicineId: randomMedicine.id,
    medicineName: randomMedicine.name,
    category: randomMedicine.category,
    quantitySold,
    totalAmount: quantitySold * price,
    discount: Math.floor(Math.random() * 5),
    paymentMethod: ['Cash', 'UPI', 'Credit Card'][Math.floor(Math.random() * 3)]
  };
}).sort((a,b) => new Date(a.date) - new Date(b.date));

const purchase_dataset = Array.from({ length: 100 }).map((_, i) => {
  const randomMedicine = medicines[Math.floor(Math.random() * medicines.length)];
  const quantityPurchased = Math.floor(Math.random() * 500) + 50;
  const costPrice = Math.floor((randomMedicine.price || 50) * 0.7);
  
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 180));
  
  return {
    id: `pur_${2001 + i}`,
    date: date.toISOString().split('T')[0],
    supplierName: ['MediCorp Supplies', 'HealthWell Distributors', 'PharmaLink', 'CareMax Logistics'][Math.floor(Math.random() * 4)],
    medicineId: randomMedicine.id,
    medicineName: randomMedicine.name,
    quantityPurchased,
    costPrice,
    totalCost: quantityPurchased * costPrice,
    status: Math.random() > 0.1 ? 'Received' : 'Pending'
  };
}).sort((a,b) => new Date(b.date) - new Date(a.date));

const expiry_dataset = Array.from({ length: 50 }).map((_, i) => {
  const randomMedicine = medicines[Math.floor(Math.random() * medicines.length)];
  const daysToExpiry = Math.floor(Math.random() * 180) - 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysToExpiry);

  let status = 'Safe';
  if (daysToExpiry < 0) status = 'Expired';
  else if (daysToExpiry < 60) status = 'Warning';

  return {
    id: `exp_${i+1}`,
    medicineId: randomMedicine.id,
    medicineName: randomMedicine.name,
    batchNumber: `EXP${Math.floor(1000 + Math.random() * 9000)}`,
    stockLeft: Math.floor(Math.random() * 100) + 5,
    expiryDate: expiryDate.toISOString().split('T')[0],
    daysToExpiry,
    status
  };
}).sort((a,b) => a.daysToExpiry - b.daysToExpiry);

const seasons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const categories = ['Cough/Cold', 'Allergies', 'Fever', 'Digestive', 'General Vitamins'];

const seasonal_demand_dataset = [];
seasons.forEach((month, idx) => {
  categories.forEach(category => {
    let baseMultiplier = 1;
    if (category === 'Cough/Cold' && (idx < 2 || idx > 9)) baseMultiplier = 2.5;
    if (category === 'Allergies' && (idx >= 2 && idx <= 4)) baseMultiplier = 2.0;
    if (category === 'Fever' && (idx >= 5 && idx <= 8)) baseMultiplier = 1.8;

    const unitsSold = Math.floor((Math.random() * 500 + 200) * baseMultiplier);
    
    seasonal_demand_dataset.push({
      month,
      diseaseCategory: category,
      unitsSold,
      expectedDemand: Math.floor(unitsSold * (1 + (Math.random() * 0.2 - 0.1)))
    });
  });
});

const output = "export const MEDICINE_DATA = " + JSON.stringify(medicines, null, 2) + ";\n\n" +
"export const PHARMACY_INVENTORY = " + JSON.stringify(pharmacies, null, 2) + ";\n\n" +
"export const ADR_RULES = " + JSON.stringify(adr_rules, null, 2) + ";\n\n" +
"export const INTERACTION_RULES = " + JSON.stringify(interactions, null, 2) + ";\n\n" +
"export const COUNTERFEIT_BATCH_REGISTRY = " + JSON.stringify(counterfeit_db, null, 2) + ";\n\n" +
"export const BRAND_SUBSTITUTION = " + JSON.stringify(brand_substitution, null, 2) + ";\n\n" +
"export const ANALYTICS_INVENTORY = " + JSON.stringify(inventory_dataset, null, 2) + ";\n\n" +
"export const ANALYTICS_SALES = " + JSON.stringify(sales_dataset, null, 2) + ";\n\n" +
"export const ANALYTICS_PURCHASES = " + JSON.stringify(purchase_dataset, null, 2) + ";\n\n" +
"export const ANALYTICS_EXPIRY = " + JSON.stringify(expiry_dataset, null, 2) + ";\n\n" +
"export const ANALYTICS_SEASONAL = " + JSON.stringify(seasonal_demand_dataset, null, 2) + ";\n\n" +
"// Alias exports for backwards compatibility with existing pages\n" +
"export const INTERACTIONS = INTERACTION_RULES;\n" +
"export const PHARMACIES = PHARMACY_INVENTORY;\n" +
"export const COUNTERFEIT_DB = COUNTERFEIT_BATCH_REGISTRY;\n";

fs.writeFileSync('src/data/mockData.js', output.trim());
console.log("Mock data generated in src/data/mockData.js");
