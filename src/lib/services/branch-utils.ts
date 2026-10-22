/**
 * Tamil Nadu Dealer Branches & Regional Classification Utilities
 * TVS Super Cup is focused on Tamil Nadu network dealerships.
 */

export const NON_TN_PATTERNS = [
  'ERNAKULAM', 'ERNAKULA', 'ERNKULAM', 'ERNAKULKAM', 'ERNAKUKLAM', 'ERENAKULAM', 'ERNAKUALM',
  'KOLLAM', 'THIRUVANANTHAPURAM', 'THIRUVANANTHAPURAMTR', 'THIRUVANATHAPURAM', 'TRIVANDRUM', 'ATTINGAL',
  'KOTTAYAM', 'KANNUR', 'MALAPPURAM', 'MALAPURAM', 'CALICUT', 'KOZHIKODE', 'KOZHIKKODE',
  'THRISSUR', 'PALAKKAD', 'WAYANAD', 'IDUKKI', 'ALAPPUZHA', 'NILAMBUR', 'KUTHUPARAMBA',
  'THALASSERY', 'KOCHI', 'PATHANAMTHITTA', 'KASARGOD', 'MATTANUR', 'MUVATTUPUZHA', 'MANKAVU',
  'PALARIVATOM', 'COCHIN',
  'K.V.RANGAREDDY', 'GUNTUR', 'KRISHNA', 'NALGONDA', 'VIZIANAGARAM', 'EAST GODAVARI', 'VISAKHAPATNAM',
  'WEST GODAVARI', 'CHITTOOR', 'MEDAK', 'KURNOOL', 'HYDERABAD', 'MAHABUB NAGAR', 'NIZAMABAD',
  'SRIKAKULAM', 'VIJAYAWADA',
  'BANGALORE', 'BANGLORE', 'MYSORE', '178157'
];

/**
 * Checks if a dealership city belongs to Tamil Nadu, filtering out out-of-state regions.
 */
export function isTamilNaduDealer(city?: string | null): boolean {
  if (!city) return false;
  const clean = city.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!clean || clean === 'NULL' || clean === 'UNDEFINED') return false;
  for (const nonTn of NON_TN_PATTERNS) {
    if (clean === nonTn || clean.includes(nonTn) || nonTn.includes(clean)) return false;
  }
  return true;
}

/**
 * Normalizes dealer cities into canonical Tamil Nadu branch clusters.
 */
export function getDealerBranch(city?: string | null): string {
  if (!city) return 'Tamil Nadu (Central)';
  const c = city.trim().toUpperCase();

  if (c.includes('CHENNAI') || c.includes('CHENANI') || c.includes('AMBATTUR') || c.includes('MATHAVARAM')) return 'Chennai';
  if (c.includes('COIMBATORE') || c.includes('POLLACHI')) return 'Coimbatore';
  if (c.includes('MADURAI')) return 'Madurai';
  if (c.includes('SALEM') || c.includes('ATTUR')) return 'Salem';
  if (c.includes('TIRUVALLUR') || c.includes('THIRUVALLUR')) return 'Tiruvallur';
  if (c.includes('KANCHIPURAM') || c.includes('CHENGALPATTU') || c.includes('CHENGALPATU')) return 'Kanchipuram';
  if (c.includes('ERODE')) return 'Erode';
  if (c.includes('THANJAVUR')) return 'Thanjavur';
  if (c.includes('DINDIGUL')) return 'Dindigul';
  if (c.includes('TIRUNELVELI') || c.includes('THIRUNELVELI')) return 'Tirunelveli';
  if (c.includes('VELLORE') || c.includes('RANIPET') || c.includes('ARCOT')) return 'Vellore';
  if (c.includes('TIRUCHIRAPPALLI') || c.includes('TRICHY') || c.includes('THIRUCHIRAPALI')) return 'Tiruchirappalli';
  if (c.includes('DHARAMAPURI') || c.includes('DHARMAPURI')) return 'Dharmapuri';
  if (c.includes('KRISHNAGIRI') || c.includes('HOSUR')) return 'Krishnagiri';
  if (c.includes('PUDUKKOTTAI') || c.includes('PUDUKOTTAI')) return 'Pudukkottai';
  if (c.includes('NAMAKKAL') || c.includes('TIRUCHENKODU')) return 'Namakkal';
  if (c.includes('THENKASI')) return 'Thenkasi';
  if (c.includes('THENI')) return 'Theni';
  if (c.includes('KANYAKUMARI') || c.includes('KANNIYAKUMARI') || c.includes('NAGERKOIL') || c.includes('NAGERCOIL')) return 'Kanyakumari';
  if (c.includes('TIRUPPUR') || c.includes('TIRUPUR')) return 'Tiruppur';
  if (c.includes('KARUR')) return 'Karur';
  if (c.includes('THIRUPATHUR')) return 'Tirupathur';
  if (c.includes('CUDDALORE') || c.includes('KUDULAR')) return 'Cuddalore';
  if (c.includes('TUTICORIN')) return 'Tuticorin';
  if (c.includes('TIRUVANNAMALAI') || c.includes('THIRUVANAMALAI')) return 'Tiruvannamalai';
  if (c.includes('VIRUDHUNAGAR') || c.includes('VIRUDUNAGAR') || c.includes('VIRUDHANAGAR') || c.includes('SIVAKASI')) return 'Virudhunagar';
  if (c.includes('VILLUPURAM')) return 'Villupuram';
  if (c.includes('RAMANATHAPURAM')) return 'Ramanathapuram';
  if (c.includes('NAGAPATTINAM')) return 'Nagapattinam';
  if (c.includes('PERAMBALUR')) return 'Perambalur';
  if (c.includes('SIVAGANGAI')) return 'Sivagangai';
  if (c.includes('TIRUVARUR')) return 'Tiruvarur';
  if (c.includes('NILGIRIS')) return 'Nilgiris';

  return 'Tamil Nadu (Central)';
}
