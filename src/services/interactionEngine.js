import { INTERACTIONS, MEDICINE_DATA } from '../data/mockData';

/**
 * Analyzes a list of medicine names and returns potential interactions, 
 * therapeutic duplications, and safety warnings.
 * 
 * @param {string[]} medicineNames - Array of medicine names to check.
 * @returns {Object} Analysis results including status, reasons, and recommendations.
 */
export const analyzeInteractions = (medicineNames) => {
  if (!medicineNames || medicineNames.length === 0) {
    return {
      status: 'Safe',
      reason: 'No medicines selected for analysis.',
      findings: []
    };
  }

  const normalizedNames = medicineNames.map(name => name.trim().toLowerCase());
  const foundMeds = [];
  const unknownMeds = [];

  normalizedNames.forEach(name => {
    const med = MEDICINE_DATA.find(m => m.name.toLowerCase() === name);
    if (med) {
      foundMeds.push(med);
    } else {
      unknownMeds.push(name);
    }
  });

  const findings = [];
  let overallStatus = 'Safe';

  // 1. Check for unknown medicines - STRICT RULE: Unknown = Needs Review
  if (unknownMeds.length > 0) {
    overallStatus = 'Needs Review';
    findings.push({
      status: 'Needs Review',
      reason: `Reliable interaction data NOT found for: ${unknownMeds.join(', ')}.`,
      recommendation: 'Consult a pharmacist or doctor for verification. Do not assume unidentified medicines are safe.',
      alternatives: []
    });
  }

  if (foundMeds.length < 2 && unknownMeds.length === 0) {
    return {
      status: 'Safe',
      reason: 'Single medicine analyzed. No known self-interactions.',
      findings: [{ status: 'Safe', reason: 'No interactions found.', recommendation: 'Follow prescribed dosage.', alternatives: [] }]
    };
  }

  // 2. Check Explicit INTERACTIONS array (from mockData)
  INTERACTIONS.forEach(rule => {
    const matched = rule.drugs.every(ruleDrug => 
      normalizedNames.includes(ruleDrug.toLowerCase())
    );
    
    if (matched) {
      findings.push({
        status: rule.status,
        reason: rule.reason,
        recommendation: getRecommendation(rule.status, rule.reason),
        alternatives: findAlternatives(rule.drugs[0]) // Suggest alternatives for the first drug in the rule
      });
      updateOverallStatus(rule.status);
    }
  });

  // 3. Rule-based interaction logic
  for (let i = 0; i < foundMeds.length; i++) {
    for (let j = i + 1; j < foundMeds.length; j++) {
      const medA = foundMeds[i];
      const medB = foundMeds[j];

      // Rule: Duplicate same-salt (same active ingredient)
      const saltA = getSalt(medA);
      const saltB = getSalt(medB);
      if (saltA === saltB && saltA !== 'generic' && saltA !== 'api') {
        findings.push({
          status: 'Avoid',
          reason: `Same-Salt Duplication: Both ${medA.name} and ${medB.name} contain ${saltA}.`,
          recommendation: 'Do NOT take both brands. This leads to double-dosing and potential toxicity.',
          alternatives: []
        });
        updateOverallStatus('Avoid');
      }

      // Rule: NSAID + NSAID (Avoid)
      const isNSAIDA = isNSAID(medA);
      const isNSAIDB = isNSAID(medB);
      if (isNSAIDA && isNSAIDB) {
        let specificReason = `NSAID Combination: ${medA.name} and ${medB.name} are both NSAIDs.`;
        
        // High-impact specific warnings
        const salts = [getSalt(medA), getSalt(medB)];
        if (salts.includes('ibuprofen') && (salts.includes('diclofenac') || salts.includes('aceclofenac'))) {
            specificReason = `CRITICAL HAZARD: Ibuprofen + ${salts.includes('diclofenac') ? 'Diclofenac' : 'Aceclofenac'} combination is medically contraindicated.`;
        }

        findings.push({
          status: 'Avoid',
          reason: specificReason,
          recommendation: 'Avoid this combination. It drastically increases risk of gastric bleeding, ulcers, and kidney strain.',
          alternatives: findAlternatives(medA.name)
        });
        updateOverallStatus('Avoid');
      }

      // Rule: Steroid + NSAID (Caution)
      if ((isSteroid(medA) && isNSAIDB) || (isNSAIDA && isSteroid(medB))) {
        findings.push({
          status: 'Use with Caution',
          reason: `Steroid + NSAID: Taking ${medA.name} and ${medB.name} together increases the risk of peptic ulcers.`,
          recommendation: 'Monitor for stomach pain. Take with food and consult a doctor about using a PPI (gastric protector).',
          alternatives: []
        });
        updateOverallStatus('Use with Caution');
      }

      // Rule: Antibiotic + Antacid (Caution/Timing)
      if ((isAntibiotic(medA) && isAntacid(medB)) || (isAntacid(medA) && isAntibiotic(medB))) {
        findings.push({
          status: 'Use with Caution',
          reason: `Antibiotic + Antacid: ${isAntacid(medA) ? medA.name : medB.name} can interfere with the absorption of ${isAntibiotic(medA) ? medA.name : medB.name}.`,
          recommendation: 'Wait at least 2 hours between taking the antacid and the antibiotic.',
          alternatives: []
        });
        updateOverallStatus('Use with Caution');
      }

      // Rule: Cough/Cold Duplication (Caution)
      if (medA.category.includes('Cough') && medB.category.includes('Cough')) {
        findings.push({
          status: 'Use with Caution',
          reason: `Therapeutic Overlap: Both ${medA.name} and ${medB.name} are for cough/cold symptoms.`,
          recommendation: 'Check if both are necessary. Taking multiple multi-symptom cold medicines can lead to accidental overdose of ingredients like paracetamol or antihistamines.',
          alternatives: []
        });
        updateOverallStatus('Use with Caution');
      }

      // Rule: Same Therapeutic Class Duplication (other than NSAIDs already handled)
      if (medA.category === medB.category && !isNSAIDA && !isNSAIDB && !medA.category.includes('Cough') && !medA.category.includes('General')) {
        findings.push({
          status: 'Avoid',
          reason: `Category Duplication: Both ${medA.name} and ${medB.name} are in category '${medA.category}'.`,
          recommendation: 'Taking two medicines for the same condition is usually unnecessary. Consult a healthcare professional.',
          alternatives: findAlternatives(medA.name)
        });
        updateOverallStatus('Avoid');
      }
    }
  }

  function updateOverallStatus(status) {
    const priority = { 'Avoid': 4, 'Use with Caution': 3, 'Needs Review': 2, 'Safe': 1 };
    if (priority[status] > priority[overallStatus]) {
      overallStatus = status;
    }
  }

  return {
    status: overallStatus,
    reason: findings.length > 0 ? (findings.find(f => f.status === overallStatus)?.reason || findings[0].reason) : 'Analyzed combination is safe for general use.',
    findings
  };
};

const getRecommendation = (status, reason) => {
  if (status === 'Avoid') return 'CRITICAL: Do NOT consume these together. This combination is medically contraindicated.';
  if (status === 'Use with Caution') return 'Consult a healthcare professional. Adjust dosage or maintain a strict time gap between these medicines.';
  if (status === 'Needs Review') return 'Verify data with a qualified pharmacist before consumption. Do not proceed until verified.';
  return 'Follow prescribed dosage as per your physician.';
};

const getSalt = (med) => {
    if (!med || !med.composition || med.composition.length === 0) return 'unknown';
    // Match the first salt name, ignoring generic placeholders
    const salt = med.composition[0].split(' ')[0].toLowerCase();
    if (['generic', 'api', 'extract', 'unknown'].includes(salt)) return 'unknown';
    return salt;
};

const findAlternatives = (medName) => {
    const med = MEDICINE_DATA.find(m => m.name.toLowerCase() === medName.toLowerCase());
    if (!med || !med.alternatives) return [];
    return med.alternatives.map(altId => {
        const alt = MEDICINE_DATA.find(m => m.id === altId);
        return alt ? alt.name : null;
    }).filter(Boolean);
};

const isNSAID = (med) => {
    const cat = med.category.toLowerCase();
    const comp = med.composition.map(c => c.toLowerCase());
    return cat.includes('nsaid') || cat.includes('analgesic') || 
           comp.some(c => ['ibuprofen', 'diclofenac', 'aspirin', 'aceclofenac', 'naproxen', 'mefenamic'].some(n => c.includes(n)));
};

const isSteroid = (med) => {
    const cat = med.category.toLowerCase();
    const comp = med.composition.map(c => c.toLowerCase());
    return cat.includes('steroid') || 
           comp.some(c => ['prednisolone', 'dexamethasone', 'betamethasone', 'decatrolin', 'hydrocortisone'].some(s => c.includes(s)));
};

const isAntibiotic = (med) => {
    const cat = med.category.toLowerCase();
    const comp = med.composition.map(c => c.toLowerCase());
    return cat.includes('antibiotic') || 
           comp.some(c => ['amoxicillin', 'cefixime', 'ofloxacin', 'azithromycin', 'ciprofloxacin', 'cefpodoxime'].some(a => c.includes(a)));
};

const isAntacid = (med) => {
    const cat = med.category.toLowerCase();
    const comp = med.composition.map(c => c.toLowerCase());
    return cat.includes('antacid') || cat.includes('enzyme') || cat.includes('proton pump') ||
           comp.some(c => ['aluminum', 'magnesium', 'pantoprazole', 'omeprazole', 'ranitidine', 'gelusil', 'famotidine'].some(a => c.includes(a)));
};
