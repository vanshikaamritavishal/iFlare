// Curated list of Indian university/college email domains.
// A user can only register with a matching domain and will only see iFlares
// from other users in the SAME university (same email domain).

// Explicit whitelist of well-known Indian university/institute domains
export const INDIAN_UNIVERSITY_DOMAINS = {
  // IITs
  'iitb.ac.in': 'IIT Bombay',
  'iitd.ac.in': 'IIT Delhi',
  'iitk.ac.in': 'IIT Kanpur',
  'iitm.ac.in': 'IIT Madras',
  'iitkgp.ac.in': 'IIT Kharagpur',
  'kgpian.iitkgp.ac.in': 'IIT Kharagpur',
  'iitg.ac.in': 'IIT Guwahati',
  'iitr.ac.in': 'IIT Roorkee',
  'iith.ac.in': 'IIT Hyderabad',
  'iiti.ac.in': 'IIT Indore',
  'iitbhu.ac.in': 'IIT (BHU) Varanasi',
  'itbhu.ac.in': 'IIT (BHU) Varanasi',
  'iitmandi.ac.in': 'IIT Mandi',
  'iitp.ac.in': 'IIT Patna',
  'iitrpr.ac.in': 'IIT Ropar',
  'iitj.ac.in': 'IIT Jodhpur',
  'iitbbs.ac.in': 'IIT Bhubaneswar',
  'iitgn.ac.in': 'IIT Gandhinagar',
  'iitgoa.ac.in': 'IIT Goa',
  'iitpkd.ac.in': 'IIT Palakkad',
  'iittp.ac.in': 'IIT Tirupati',
  'iitdh.ac.in': 'IIT Dharwad',
  'iitjammu.ac.in': 'IIT Jammu',

  // NITs
  'nitk.edu.in': 'NIT Karnataka (Surathkal)',
  'nitt.edu': 'NIT Tiruchirappalli',
  'nitc.ac.in': 'NIT Calicut',
  'nitw.ac.in': 'NIT Warangal',
  'nitrkl.ac.in': 'NIT Rourkela',
  'nitsri.net': 'NIT Srinagar',
  'mnit.ac.in': 'MNIT Jaipur',
  'mnnit.ac.in': 'MNNIT Allahabad',
  'nitgoa.ac.in': 'NIT Goa',
  'nitp.ac.in': 'NIT Patna',
  'nitdgp.ac.in': 'NIT Durgapur',
  'nita.ac.in': 'NIT Agartala',
  'nith.ac.in': 'NIT Hamirpur',
  'nitmz.ac.in': 'NIT Mizoram',

  // IIITs
  'iiit.ac.in': 'IIIT Hyderabad',
  'iiith.ac.in': 'IIIT Hyderabad',
  'iiitd.ac.in': 'IIIT Delhi',
  'iiitb.ac.in': 'IIIT Bangalore',
  'iiit-b.ac.in': 'IIIT Bangalore',
  'iiitm.ac.in': 'IIITM Gwalior',
  'iiitdm.ac.in': 'IIITDM Kancheepuram',
  'iiita.ac.in': 'IIIT Allahabad',

  // IIMs
  'iima.ac.in': 'IIM Ahmedabad',
  'iimb.ac.in': 'IIM Bangalore',
  'iimc.ac.in': 'IIM Calcutta',
  'iiml.ac.in': 'IIM Lucknow',
  'iimidr.ac.in': 'IIM Indore',
  'iimk.ac.in': 'IIM Kozhikode',
  'iimshillong.ac.in': 'IIM Shillong',
  'iimu.ac.in': 'IIM Udaipur',
  'iimtrichy.ac.in': 'IIM Tiruchirappalli',
  'iimraipur.ac.in': 'IIM Raipur',
  'iimranchi.ac.in': 'IIM Ranchi',
  'iimrohtak.ac.in': 'IIM Rohtak',
  'iimkashipur.ac.in': 'IIM Kashipur',
  'iimnagpur.ac.in': 'IIM Nagpur',
  'iimv.ac.in': 'IIM Visakhapatnam',

  // Scaler
  'sst.scaler.com': 'Scaler School of Technology',
  'scaler.com': 'Scaler',

  // Popular private universities
  'vit.ac.in': 'VIT Vellore',
  'vitstudent.ac.in': 'VIT Vellore',
  'vitbhopal.ac.in': 'VIT Bhopal',
  'vitap.ac.in': 'VIT-AP',
  'bits-pilani.ac.in': 'BITS Pilani',
  'pilani.bits-pilani.ac.in': 'BITS Pilani',
  'goa.bits-pilani.ac.in': 'BITS Pilani Goa',
  'hyderabad.bits-pilani.ac.in': 'BITS Pilani Hyderabad',
  'srmist.edu.in': 'SRM Institute',
  'srmap.edu.in': 'SRM University AP',
  'manipal.edu': 'Manipal University',
  'learner.manipal.edu': 'Manipal University',
  'muj.manipal.edu': 'Manipal University Jaipur',
  'amity.edu': 'Amity University',
  's.amity.edu': 'Amity University',
  'ashoka.edu.in': 'Ashoka University',
  'snu.edu.in': 'Shiv Nadar University',
  'jgu.edu.in': 'O.P. Jindal Global University',
  'krea.edu.in': 'Krea University',
  'plaksha.edu.in': 'Plaksha University',
  'iiitb.org': 'IIIT Bangalore',
  'thapar.edu': 'Thapar Institute',
  'lpu.in': 'Lovely Professional University',
  'lpu.co.in': 'Lovely Professional University',
  'chitkara.edu.in': 'Chitkara University',
  'christuniversity.in': 'Christ University',
  'sharda.ac.in': 'Sharda University',
  'galgotiasuniversity.edu.in': 'Galgotias University',
  'bennett.edu.in': 'Bennett University',
  'nmims.edu': 'NMIMS',
  'nmims.edu.in': 'NMIMS',
  'sitpune.edu.in': 'Symbiosis Institute of Technology',
  'siu.edu.in': 'Symbiosis International University',
  'niituniversity.in': 'NIIT University',
  'jaipur.manipal.edu': 'Manipal University Jaipur',
  'iiitdmj.ac.in': 'IIITDM Jabalpur',
  'iiitn.ac.in': 'IIIT Nagpur',
  'iiitkota.ac.in': 'IIIT Kota',
  'iiitmanipur.ac.in': 'IIIT Manipur',
  'jaduniv.edu.in': 'Jadavpur University',
  'du.ac.in': 'Delhi University',
  'jnu.ac.in': 'Jawaharlal Nehru University',
  'bhu.ac.in': 'Banaras Hindu University',
  'jamiahamdard.edu': 'Jamia Hamdard',
  'jmi.ac.in': 'Jamia Millia Islamia',
  'anna.edu': 'Anna University',
  'annauniv.edu': 'Anna University',
  'mu.ac.in': 'University of Mumbai',
  'unipune.ac.in': 'Savitribai Phule Pune University',
  'coep.ac.in': 'COEP Pune',
  'pict.edu': 'PICT Pune',
  'iiitpune.ac.in': 'IIIT Pune',
  'aiims.edu': 'AIIMS',
  'aiimsonline.com': 'AIIMS',
  'iisc.ac.in': 'Indian Institute of Science',
  'iiserpune.ac.in': 'IISER Pune',
  'iiserb.ac.in': 'IISER Bhopal',
  'iiserkol.ac.in': 'IISER Kolkata',
  'iisertvm.ac.in': 'IISER Thiruvananthapuram',
  'iisermohali.ac.in': 'IISER Mohali',
  'iiit-bh.ac.in': 'IIIT Bhubaneswar',
  'nsut.ac.in': 'Netaji Subhas University of Technology',
  'dtu.ac.in': 'Delhi Technological University',
  'iiitl.ac.in': 'IIIT Lucknow',
  'srcc.du.ac.in': 'SRCC (Delhi University)',
  'lsr.edu.in': 'LSR (Delhi University)',
  'hindu.du.ac.in': 'Hindu College (Delhi University)',
  'hansraj.du.ac.in': 'Hansraj College (Delhi University)',
  'stephens.edu': 'St. Stephens College',
}

// Some legacy or previously-registered accounts that should still be allowed
// (used to grandfather in early testers). Empty by default in production.
const LEGACY_ALLOWED_DOMAINS = new Set([
  // Add specific legacy domains here if needed
])

// Explicitly blocked personal / consumer email providers. Even if the
// whitelist logic is ever loosened, these must never be treated as a
// valid university domain. Blocking is checked BEFORE any other rule.
const BLOCKED_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.in',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.in',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'zoho.com',
  'gmx.com',
  'rediffmail.com',
  'mail.com',
  'fastmail.com',
  'tutanota.com',
  'inbox.com',
])

/**
 * Extract the email domain (lowercase) from an email address.
 * Returns null if the email is not valid.
 */
export function getDomainFromEmail(email) {
  if (!email || typeof email !== 'string') return null
  const parts = email.trim().toLowerCase().split('@')
  if (parts.length !== 2 || !parts[1]) return null
  return parts[1]
}

/**
 * Look up the university name for a given email domain.
 * Returns { valid: boolean, name: string|null, domain: string|null, reason?: string }
 *
 * A domain is valid if:
 *  - It is present in the explicit INDIAN_UNIVERSITY_DOMAINS whitelist, OR
 *  - It ends with `.ac.in` or `.edu.in` (Indian academic TLDs), OR
 *  - It is present in LEGACY_ALLOWED_DOMAINS
 */
export function resolveUniversity(email) {
  const domain = getDomainFromEmail(email)
  if (!domain) {
    return { valid: false, name: null, domain: null, reason: 'Invalid email address' }
  }

  // Personal / consumer email providers are never accepted.
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valid: false,
      name: null,
      domain,
      reason: 'iFLARE is exclusive to Indian college students. Personal email providers (e.g. gmail.com, yahoo.com, outlook.com) are not allowed — please register with your official university email.'
    }
  }

  // Explicit whitelist
  if (INDIAN_UNIVERSITY_DOMAINS[domain]) {
    return { valid: true, name: INDIAN_UNIVERSITY_DOMAINS[domain], domain }
  }

  // Sub-domain of a known university (e.g. cse.iitb.ac.in)
  for (const knownDomain of Object.keys(INDIAN_UNIVERSITY_DOMAINS)) {
    if (domain.endsWith('.' + knownDomain)) {
      return { valid: true, name: INDIAN_UNIVERSITY_DOMAINS[knownDomain], domain }
    }
  }

  // Indian academic TLD suffix
  if (domain.endsWith('.ac.in') || domain.endsWith('.edu.in')) {
    // Pretty-print: take the second-level label and title-case it
    const label = domain.replace(/\.(ac|edu)\.in$/, '').split('.').slice(-1)[0]
    const pretty = label ? label.charAt(0).toUpperCase() + label.slice(1) + ' (India)' : 'Indian University'
    return { valid: true, name: pretty, domain }
  }

  // Legacy accounts
  if (LEGACY_ALLOWED_DOMAINS.has(domain)) {
    return { valid: true, name: 'Legacy Account', domain }
  }

  return {
    valid: false,
    name: null,
    domain,
    reason: 'iFLARE is currently open only to students of Indian universities. Please register with your official college email (e.g. @iitkgp.ac.in, @sst.scaler.com, @vit.ac.in).'
  }
}
