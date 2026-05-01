require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for SRV resolution
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const medicineService = require('../src/modules/medicines/services/medicine.service');

const MOCK_USER = {
  id: 'system-seeder',
  role: 'admin',
  name: 'System Seeder',
  email: 'system@medicore.com'
};

const MEDICINES_DATA = [
  // Antibiotics
  {
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    category: 'Antibiotics',
    strength: '500mg',
    dosageForm: 'Capsule',
    manufacturer: 'GSK',
    supplier: 'State Pharmaceuticals Corporation',
    unitPrice: 15.50,
    stockQty: 500,
    batchNumber: 'AMX-2026-001',
    manufactureDate: '2025-10-15',
    expiryDate: '2027-10-15',
    description: 'Broad-spectrum penicillin antibiotic used to treat various bacterial infections.',
    barcode: 'AMX500CPS'
  },
  {
    name: 'Azithromycin 250mg',
    genericName: 'Azithromycin',
    brandName: 'Zithromax',
    category: 'Antibiotics',
    strength: '250mg',
    dosageForm: 'Tablet',
    manufacturer: 'Pfizer',
    supplier: 'Sunshine Healthcare',
    unitPrice: 85.00,
    stockQty: 200,
    batchNumber: 'AZI-B992',
    manufactureDate: '2026-01-20',
    expiryDate: '2028-01-20',
    description: 'Macrolide antibiotic used for respiratory and skin infections.',
    barcode: 'AZI250TBL'
  },
  // Analgesics
  {
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brandName: 'Panadol',
    category: 'Analgesics',
    strength: '500mg',
    dosageForm: 'Tablet',
    manufacturer: 'GSK',
    supplier: 'George Steuarts Health',
    unitPrice: 3.50,
    stockQty: 2500,
    batchNumber: 'PAR-P005',
    manufactureDate: '2026-03-01',
    expiryDate: '2029-03-01',
    description: 'Common pain reliever and fever reducer.',
    barcode: 'PAR500STD'
  },
  {
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    category: 'Analgesics',
    strength: '400mg',
    dosageForm: 'Tablet',
    manufacturer: 'Pfizer',
    supplier: 'Hemas Pharmaceuticals',
    unitPrice: 12.00,
    stockQty: 800,
    batchNumber: 'IBU-400X',
    manufactureDate: '2026-02-10',
    expiryDate: '2028-02-10',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID) used for pain and inflammation.',
    barcode: 'IBU400ADV'
  },
  // Cardiovascular
  {
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin',
    brandName: 'Lipitor',
    category: 'Cardiovascular',
    strength: '20mg',
    dosageForm: 'Tablet',
    manufacturer: 'Pfizer',
    supplier: 'A. Baur & Co.',
    unitPrice: 45.00,
    stockQty: 300,
    batchNumber: 'ATO-C211',
    manufactureDate: '2025-12-05',
    expiryDate: '2027-12-05',
    description: 'Statin medication used to lower cholesterol and prevent heart disease.',
    barcode: 'ATO20LIP'
  },
  {
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine',
    brandName: 'Norvasc',
    category: 'Cardiovascular',
    strength: '5mg',
    dosageForm: 'Tablet',
    manufacturer: 'Pfizer',
    supplier: 'George Steuarts Health',
    unitPrice: 18.00,
    stockQty: 600,
    batchNumber: 'AML-N883',
    manufactureDate: '2026-01-15',
    expiryDate: '2028-01-15',
    description: 'Calcium channel blocker used to treat high blood pressure and chest pain.',
    barcode: 'AML5NOR'
  },
  // Vitamins
  {
    name: 'Vitamin C 500mg',
    genericName: 'Ascorbic Acid',
    brandName: 'Cee-Vit',
    category: 'Vitamins',
    strength: '500mg',
    dosageForm: 'Chewable Tablet',
    manufacturer: 'Ceylon Pharma',
    supplier: 'Internal',
    unitPrice: 5.00,
    stockQty: 1500,
    batchNumber: 'VIT-C009',
    manufactureDate: '2026-04-01',
    expiryDate: '2028-04-01',
    description: 'Essential nutrient and antioxidant supplement.',
    barcode: 'VITC500CHW'
  },
  {
    name: 'Multivitamin B-Complex',
    genericName: 'Vitamin B1, B6, B12',
    brandName: 'Neurobion',
    category: 'Vitamins',
    strength: 'Standard',
    dosageForm: 'Tablet',
    manufacturer: 'P&G',
    supplier: 'George Steuarts Health',
    unitPrice: 22.00,
    stockQty: 400,
    batchNumber: 'BCO-N123',
    manufactureDate: '2026-02-25',
    expiryDate: '2028-02-25',
    description: 'Support for nerve health and metabolism.',
    barcode: 'BCOMPLEX'
  },
  // Antidiabetic
  {
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glucophage',
    category: 'Antidiabetic',
    strength: '500mg',
    dosageForm: 'Tablet',
    manufacturer: 'Merck',
    supplier: 'Sunshine Healthcare',
    unitPrice: 8.50,
    stockQty: 1200,
    batchNumber: 'MET-G550',
    manufactureDate: '2026-03-10',
    expiryDate: '2029-03-10',
    description: 'First-line medication for the treatment of type 2 diabetes.',
    barcode: 'MET500GLU'
  },
  // Gastrointestinal
  {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brandName: 'Losec',
    category: 'Gastrointestinal',
    strength: '20mg',
    dosageForm: 'Capsule',
    manufacturer: 'AstraZeneca',
    supplier: 'Hemas Pharmaceuticals',
    unitPrice: 25.00,
    stockQty: 500,
    batchNumber: 'OME-L020',
    manufactureDate: '2026-01-05',
    expiryDate: '2028-01-05',
    description: 'Proton pump inhibitor used to treat acid reflux and ulcers.',
    barcode: 'OME20LOS'
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully.');

    for (const data of MEDICINES_DATA) {
      try {
        console.log(`Seeding: ${data.name}...`);
        await medicineService.createMedicine(data, MOCK_USER);
        console.log(`Successfully added ${data.name}`);
      } catch (err) {
        if (err.statusCode === 409) {
          console.log(`Skipping ${data.name}: Already exists.`);
        } else {
          console.error(`Error adding ${data.name}:`, err.message);
        }
      }
    }

    console.log('Seeding completed.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
