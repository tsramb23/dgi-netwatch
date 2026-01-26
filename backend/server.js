import express from 'express';
import cors from 'cors';
import { promisify } from 'util';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const execAsync = promisify(exec);

// Middleware CORS pour autoriser les requêtes du frontend
app.use(cors());
app.use(express.json());

// Équipements à surveiller - Configuration en dur comme spécifié
const equipements = [
  { nom: "Serveur de Fichiers DGI", ip: "192.168.1.10", emplacement: "Datacenter Principal" },
  { nom: "Routeur MikroTik RB4011", ip: "192.168.1.1", emplacement: "Division Système et Réseau" },
  { nom: "Firewall Cisco ASA 5510", ip: "192.168.1.2", emplacement: "Périmètre de Sécurité" },
  { nom: "Switch D-Link 16 ports", ip: "192.168.1.3", emplacement: "Couche d'Accès" }
];

/**
 * Fonction asynchrone pour vérifier la disponibilité d'une adresse IP via ping ICMP
 * @param {string} ip - Adresse IP à vérifier
 * @returns {Promise<boolean>} - true si l'équipement répond, false sinon
 */
async function verifierDisponibilite(ip) {
  try {
    // Commande ping avec timeout de 2 secondes et 1 seul paquet
    const commande = process.platform === 'win32' 
      ? `ping -n 1 -w 2000 ${ip}`
      : `ping -c 1 -W 2 ${ip}`;
    
    await execAsync(commande);
    return true;
  } catch (erreur) {
    // Si la commande échoue, l'équipement est hors ligne
    return false;
  }
}

/**
 * Route GET /api/status
 * Retourne le statut de tous les équipements surveillés
 * Structure : { equipements: [...], horodatage: timestamp }
 */
app.get('/api/status', async (req, res) => {
  try {
    console.log(`[${new Date().toLocaleString('fr-FR')}] Requête de statut reçue`);
    
    // Vérifier la disponibilité de chaque équipement en parallèle
    const promessesVerification = equipements.map(async (equipement) => {
      const enLigne = await verifierDisponibilite(equipement.ip);
      return {
        ...equipement,
        statut: enLigne ? 'EN LIGNE' : 'HORS LIGNE',
        enLigne: enLigne,
        horodatage: new Date().toISOString()
      };
    });

    // Attendre que toutes les vérifications soient complètes
    const resultats = await Promise.all(promessesVerification);

    // Retourner la réponse JSON avec les résultats
    res.json({
      equipements: resultats,
      horodatage: new Date().toISOString(),
      nombre_total: equipements.length,
      nombre_en_ligne: resultats.filter(e => e.enLigne).length
    });

  } catch (erreur) {
    // Gestion des erreurs serveur
    console.error('Erreur lors de la vérification du statut :', erreur);
    res.status(500).json({
      erreur: 'Impossible de récupérer le statut des équipements',
      message: erreur.message
    });
  }
});

/**
 * Route GET /api/equipements
 * Retourne la liste des équipements configurés
 */
app.get('/api/equipements', (req, res) => {
  res.json({
    equipements: equipements,
    nombre: equipements.length
  });
});

/**
 * Route de santé pour vérifier que le serveur fonctionne
 */
app.get('/api/sante', (req, res) => {
  res.json({
    statut: 'OK',
    message: 'Le serveur DGI-NetWatch fonctionne correctement',
    horodatage: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`DGI-NetWatch Backend`);
  console.log(`========================================`);
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  console.log(`✓ API disponible à http://localhost:${PORT}`);
  console.log(`✓ Équipements surveillés : ${equipements.length}`);
  console.log(`========================================\n`);
});

app.get('/api/info', (req, res) => {
  res.json({
    hostname: process.env.HOSTNAME,
  });
});


// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('Signal SIGTERM reçu. Arrêt du serveur...');
  process.exit(0);
});


