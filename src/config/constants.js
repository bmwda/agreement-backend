const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const PUBLIC_DIR = path.join(__dirname, '../../public');

const CITY_OPTIONS = [
    { name: "Aligarh", code: "ALG" },
    { name: "Mathura", code: "MTR" },
    { name: "Sambhal", code: "SML" },
    { name: "Hathras", code: "HRS" },
    { name: "Badaun", code: "BDN" },
    { name: "Kasganj", code: "KSG" },
    { name: "Narora", code: "BLNSHR" },
    { name: "Agra", code: "AGR" },
    { name: "Amroha", code: "AMR" },
    { name: "Baanda", code: "BND" },
    { name: "Bareilly", code: "BRL" },
    { name: "Chitrakoot", code: "CTRK" },
    { name: "Etah", code: "ETH" },
    { name: "Etawah", code: "ETWH" },
    { name: "Farrukhabad", code: "FRKBD" },
    { name: "Gautam Buddh Nagar", code: "GBNGR" },
    { name: "Ghaziabad", code: "GZBD" },
    { name: "Hamirpur", code: "HMPR" },
    { name: "Hapur", code: "HPR" },
    { name: "Hardoi", code: "HRD" },
    { name: "Kannauj", code: "KNJ" },
    { name: "Lalitpur", code: "LLP" },
    { name: "Manipur", code: "MNPR" },
    { name: "Moradabad", code: "MRBD" },
    { name: "Muzaffarnagar", code: "MZFNGR" },
    { name: "Pilibhit", code: "PBT" },
    { name: "Rampur", code: "RMP" },
    { name: "Saharanpur", code: "SRNPR" },
    { name: "Shahjahanpur", code: "SHJHP" },
    { name: "Shamli", code: "SHM" },
    { name: "Jhansi", code: "ZNS" },
];

const REQUIRED_FIELDS = [
    'facility_code',
    'name',
    'facility_name',
    'facility_address',
    'city',
    'doctor_name',
    'hospital',
    'count',
    'charge',
    'mob'
];

module.exports = {
    TEMPLATES_DIR,
    PUBLIC_DIR,
    CITY_OPTIONS,
    REQUIRED_FIELDS
}; 