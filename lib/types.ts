export interface Expense {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  description: string;
  date: string; // ISO date string
  photoDataUrl?: string; // base64 image stored in IndexedDB
  receiptText?: string;
  paymentMethod: 'cash' | 'card' | 'other';
  createdAt: string;
}

export interface Budget {
  id: string;
  month: number; // 1-12
  year: number;
  amount: number;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Nourriture', emoji: '🍽️', color: '#FF7043' },
  { id: 'accommodation', name: 'Hébergement', emoji: '🏨', color: '#42A5F5' },
  { id: 'transport', name: 'Transport', emoji: '🚲', color: '#66BB6A' },
  { id: 'equipment', name: 'Équipement', emoji: '🔧', color: '#78909C' },
  { id: 'health', name: 'Santé', emoji: '💊', color: '#EF5350' },
  { id: 'leisure', name: 'Loisirs', emoji: '📸', color: '#AB47BC' },
  { id: 'other', name: 'Autre', emoji: '📌', color: '#26A69A' },
];

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CAD: 'CA$',
};

// ─── Savings / Provisions ────────────────────────────────────────────────────

export interface SavingsItem {
  key: string;
  label: string;
  defaultAmount: number;
  note?: string;
}

export interface SavingsSettings {
  tripMonths: number;
  currentSavings: number;
}

/** Privé (PV) – monthly provisions from Excel */
export const PV_SORTIES: SavingsItem[] = [
  { key: 'pv_pret_golf',         label: 'Prêt golf',                  defaultAmount: 419.78 },
  { key: 'pv_assurance_golf',    label: 'Assurance golf',              defaultAmount: 140.22 },
  { key: 'pv_assurance_caddy',   label: 'Assurance caddy',             defaultAmount: 104.36, note: 'supprimable 4 mois ?' },
  { key: 'pv_entretien_voit',    label: 'Entretien voitures',          defaultAmount: 100 },
  { key: 'pv_frais_bancaires',   label: 'Frais bancaires PV',          defaultAmount: 10 },
  { key: 'pv_credit_pv',         label: 'Crédit PV',                   defaultAmount: 1513.58 },
  { key: 'pv_revenu_cadastral',  label: 'Revenu cadastral (2/3)',       defaultAmount: 90 },
  { key: 'pv_taxe_golf',         label: 'Taxe golf',                   defaultAmount: 44.03,  note: 'supprimable 10 mois ?' },
  { key: 'pv_taxe_caddy',        label: 'Taxe caddy',                  defaultAmount: 42.60,  note: 'supprimable 4 mois ?' },
  { key: 'pv_mutuelle',          label: 'Mutuelle',                    defaultAmount: 140 },
  { key: 'pv_charges_loc',       label: 'Charges locataires',          defaultAmount: 0 },
  { key: 'pv_poubelles',         label: 'Poubelles PV',                defaultAmount: 16.70 },
  { key: 'pv_sel_adoucisseur',   label: 'Sel adoucisseur',             defaultAmount: 3.75 },
  { key: 'pv_alarme',            label: 'Alarme',                      defaultAmount: 12.33 },
  { key: 'pv_eau',               label: 'Eau',                         defaultAmount: 41.72 },
  { key: 'pv_elec',              label: 'Élec',                        defaultAmount: 96.62 },
  { key: 'pv_internet',          label: 'Internet',                    defaultAmount: 88 },
  { key: 'pv_pascal',            label: 'Pascal (facultatif)',          defaultAmount: 160 },
];

/** MoveLab (ML) – monthly provisions from Excel */
export const ML_SORTIES: SavingsItem[] = [
  { key: 'ml_proximus',          label: 'Proximus',                    defaultAmount: 72 },
  { key: 'ml_engie',             label: 'ENGIE',                       defaultAmount: 96.62 },
  { key: 'ml_office',            label: 'Office & antivirus',          defaultAmount: 15 },
  { key: 'ml_credit_pro',        label: 'Crédit partie pro',           defaultAmount: 886.18 },
  { key: 'ml_swde',              label: 'SWDE',                        defaultAmount: 41.72 },
  { key: 'ml_netflix',           label: 'Netflix',                     defaultAmount: 14.99 },
  { key: 'ml_qtop',              label: 'Qtop logiciel',               defaultAmount: 75.26 },
  { key: 'ml_assur_habitation',  label: 'Assurance habitation',        defaultAmount: 76.76 },
  { key: 'ml_revenu_garanti',    label: 'Revenu garanti',              defaultAmount: 45.04 },
  { key: 'ml_publication',       label: 'Publication comptes',         defaultAmount: 5.50 },
  { key: 'ml_compta',            label: 'Compta Daniel',               defaultAmount: 133 },
  { key: 'ml_wibbi',             label: 'Wibbi',                       defaultAmount: 38.50, note: 'pause ?' },
  { key: 'ml_imputation_frais',  label: 'Imputation frais trim.',      defaultAmount: 7.95 },
  { key: 'ml_plci',              label: 'PLCI mensuel',                defaultAmount: 103.45, note: 'supprimable ?' },
  { key: 'ml_poubelles',         label: 'Poubelles ML',                defaultAmount: 16.70 },
  { key: 'ml_coti_business',     label: 'Coti Business One',           defaultAmount: 7 },
  { key: 'ml_coti_partena',      label: 'Coti Partena Pro',            defaultAmount: 32.28 },
  { key: 'ml_entretien_alarme',  label: 'Entretien alarme ML',         defaultAmount: 12.33 },
  { key: 'ml_abo_cloud',         label: 'Abo Cloud (Google/Apple)',     defaultAmount: 5 },
  { key: 'ml_spotify',           label: 'Spotify',                     defaultAmount: 11.99 },
  { key: 'ml_revenu_cad_pro',    label: 'Revenu cadastral pro (1/3)',   defaultAmount: 43.20 },
  { key: 'ml_solde_annuel_1',    label: 'Solde annuel 1 (196,24 €/an)', defaultAmount: 16.35 },
  { key: 'ml_solde_annuel_2',    label: 'Solde annuel 2 (353,86 €/an)', defaultAmount: 29.49 },
  { key: 'ml_assur_prof',        label: 'Assurance prof. libérales',   defaultAmount: 4.45, note: 'supprimable ?' },
  { key: 'ml_loc_voitures',      label: 'Location voitures',           defaultAmount: 1440 },
];

/** Épargne voyage – sources de financement (totaux, non mensuels) */
export const VOYAGE_ITEMS: SavingsItem[] = [
  { key: 'voy_prime_inami_25',   label: 'Prime INAMI TM 2025',          defaultAmount: 800 },
  { key: 'voy_primes_inami_26',  label: 'Primes INAMI 2026',            defaultAmount: 3350 },
  { key: 'voy_prime_noel_26',    label: 'Prime Noël 2026',              defaultAmount: 1000 },
  { key: 'voy_prime_ete_26',     label: 'Prime été 2026',               defaultAmount: 3000 },
  { key: 'voy_epargne_vac',      label: 'Épargne vacances (6×250 €)',   defaultAmount: 1500 },
  { key: 'voy_vente_moto',       label: 'Vente moto',                   defaultAmount: 4000 },
  { key: 'voy_vente_velo_co',    label: 'Vente vélo CO',                defaultAmount: 2200 },
  { key: 'voy_vente_thule',      label: 'Vente Thule',                  defaultAmount: 0 },
  { key: 'voy_conge_co',         label: 'Congé parental CO (930 €/mois)', defaultAmount: 930 },
  { key: 'voy_conge_eve',        label: 'Congé parental Eve',           defaultAmount: 7440 },
  { key: 'voy_epargne_projet',   label: 'Épargne projet parascolaire',  defaultAmount: 2100 },
  { key: 'voy_bonus_sr_voyage',  label: 'Bonus SR pendant voyage',      defaultAmount: 3000 },
  { key: 'voy_conges_payes',     label: 'Congés payés 26 St Luc',       defaultAmount: 3675 },
  { key: 'voy_location_long',    label: 'Location Longueville',         defaultAmount: 1900 },
  { key: 'voy_alloc_fam',        label: 'Allocations fam. voyage',      defaultAmount: 3300 },
  { key: 'voy_extra_onem',       label: 'Extra ONEM erreur',            defaultAmount: 107 },
  { key: 'voy_appart_hiver',     label: 'Appartement hiver',            defaultAmount: 1200 },
  { key: 'voy_rempla_hiver',     label: 'Remplacements hiver kiné',     defaultAmount: 500 },
];
