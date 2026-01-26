import { useState, useEffect } from 'react'
import axios from 'axios'

// URL de l'API backend - peut être modifiée via variable d'environnement
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const API_URL = import.meta.env.VITE_API_URL || ""


/**
 * Composant principal App
 * Affiche le statut de tous les équipements surveillés
 * Rafraîchit les données toutes les 30 secondes
 */
function App() {
  // État pour stocker les équipements et leur statut
  const [equipements, setEquipements] = useState([])
  
  // État pour gérer le chargement des données
  const [chargement, setChargement] = useState(true)
  
  // État pour gérer les erreurs
  const [erreur, setErreur] = useState(null)
  
  // État pour afficher l'horodatage de la dernière mise à jour
  const [horodatage, setHorodatage] = useState(null)
  
  // État pour afficher les statistiques globales
  const [statistiques, setStatistiques] = useState({ total: 0, enLigne: 0 })

  const [backendInfo, setBackendInfo] = useState(null);


  /**
   * Fonction pour récupérer le statut des équipements depuis l'API
   */
  const recupererStatut = async () => {
    try {
      setChargement(true)
      setErreur(null)
      
      // Appel à l'API backend pour obtenir le statut
      const reponse = await axios.get(`${API_URL}/api/status`)
      
      // Mise à jour des états avec les données reçues
      setEquipements(reponse.data.equipements)
      setHorodatage(new Date().toLocaleString('fr-FR'))
      setStatistiques({
        total: reponse.data.nombre_total,
        enLigne: reponse.data.nombre_en_ligne
      })
      
      console.log('Statut mis à jour avec succès')
    } catch (err) {
      // Gestion des erreurs de connexion ou de requête
      console.error('Erreur lors de la récupération du statut :', err)
      setErreur('Impossible de se connecter au serveur de monitoring. Vérifiez que le backend est actif.')
    } finally {
      setChargement(false)
    }
  }

  /**
   * Hook useEffect pour initialiser et gérer le rafraîchissement automatique
   * Récupère les données au montage du composant
   * Configure un intervalle de 30 secondes pour rafraîchir les données
   * Nettoie l'intervalle au démontage du composant
   */
  const recupererBackendInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/info`, { timeout: 5000 });
      setBackendInfo(res.data);
    } catch (e) {
      console.error("Erreur /info:", e);
    }
  };

  useEffect(() => {
    recupererBackendInfo();
    // Récupération initiale des données
    recupererStatut();

    // Configuration du rafraîchissement automatique toutes les 30 secondes
    const intervalle = setInterval(() => {
      recupererStatut()
    }, 30000)

    // Nettoyage : arrêt de l'intervalle lors du démontage du composant
    return () => clearInterval(intervalle)
  }, [])

  return (
    <div className="conteneur-principal">
      {/* En-tête de l'application */}
      <header className="en-tete">
        <div className="en-tete-contenu">
          <h1 className="titre">DGI-NetWatch</h1>
          <p className="sous-titre">Surveillance d'Infrastructure Test 15</p>
        </div>

        <div className="backend-info">
          <small>
            Backend pod :{" "}
            <strong>{backendInfo?.pod}</strong>
            {" "} | IP :{" "}
            <strong>{backendInfo?.ip || "..."}</strong>
          </small>
        </div>
        

        <div className="statistiques-globales">
          <div className="stat">
            <span className="label">Total</span>
            <span className="valeur">{statistiques.total}</span>
          </div>
          <div className="stat en-ligne">
            <span className="label">En ligne</span>
            <span className="valeur">{statistiques.enLigne}</span>
          </div>
          <div className="stat hors-ligne">
            <span className="label">Hors ligne</span>
            <span className="valeur">{statistiques.total - statistiques.enLigne}</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="contenu-principal">
        {/* Affichage du message d'erreur si applicable */}
        {erreur && (
          <div className="message-erreur">
            <span className="icone-erreur">⚠️</span>
            <p>{erreur}</p>
            <button onClick={recupererStatut} className="bouton-reessayer">
              Réessayer
            </button>
          </div>
        )}

        {/* Affichage du chargement */}
        {chargement && equipements.length === 0 && (
          <div className="indicateur-chargement">
            <div className="spinner"></div>
            <p>Chargement des données...</p>
          </div>
        )}

        {/* Grille des cartes d'équipements */}
        {!erreur && equipements.length > 0 && (
          <>
            <div className="grille-equipements">
              {equipements.map((equipement, index) => (
                <div key={index} className={`carte-equipement ${equipement.enLigne ? 'en-ligne' : 'hors-ligne'}`}>
                  <div className="entete-carte">
                    <h2 className="nom-equipement">{equipement.nom}</h2>
                    <div className={`indicateur-statut ${equipement.enLigne ? 'en-ligne' : 'hors-ligne'}`}>
                      <span className="point-statut"></span>
                      <span className="texte-statut">{equipement.statut}</span>
                    </div>
                  </div>

                  <div className="contenu-carte">
                    <div className="ligne-info">
                      <span className="label-info">Adresse IP :</span>
                      <span className="valeur-info">{equipement.ip}</span>
                    </div>
                    <div className="ligne-info">
                      <span className="label-info">Emplacement :</span>
                      <span className="valeur-info">{equipement.emplacement}</span>
                    </div>
                  </div>

                  <div className="pied-carte">
                    <span className="horodatage-equipement">
                      {new Date(equipement.horodatage).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Affichage de l'horodatage de la dernière mise à jour */}
            <div className="pied-page">
              <p className="texte-mise-a-jour">
                Dernière mise à jour : {horodatage}
              </p>
              <p className="texte-rafraichissement">
                Rafraîchissement automatique toutes les 30 secondes
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
