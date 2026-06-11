(function () {
  'use strict';

  var LANGUAGE_KEY = 'pokelike_apk_language';
  var currentLanguage = localStorage.getItem(LANGUAGE_KEY) || 'en';
  var originalTexts = new WeakMap();
  var originalAttributes = new WeakMap();
  var translationFrame = 0;
  var pokedexWarmupPending = false;

  var languageNames = {
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
    de: 'Deutsch',
    pt: 'Português'
  };

  var translations = {
    fr: {
      'Pokémon Roguelike': 'Roguelike Pokémon',
      'patch notes': 'notes de mise à jour',
      'Continue Run': 'Continuer la partie',
      'Continue Battle Tower': 'Continuer la Tour de Combat',
      'Normal Mode': 'Mode Normal',
      'Nuzlocke': 'Nuzlocke',
      'Battle Tower': 'Tour de Combat',
      'Pokédex': 'Pokédex',
      'Achievements': 'Succès',
      'Hall of Fame': 'Panthéon',
      'Patch Notes': 'Notes de mise à jour',
      'Settings': 'Paramètres',
      'Who are you?': 'Qui êtes-vous ?',
      'Choose Your Starter!': 'Choisissez votre starter !',
      'Choose a stage to begin': 'Choisissez une étape',
      'Your Team': 'Votre équipe',
      'Enemy': 'Adversaire',
      'Wild Battle!': 'Combat sauvage !',
      'Skip': 'Accélérer',
      'Continue': 'Continuer',
      'Back': 'Retour',
      'Restart run': 'Recommencer la partie',
      'TEAM': 'ÉQUIPE',
      'ITEMS': 'OBJETS',
      'BADGES': 'BADGES',
      'Items — click to use': 'Objets — touchez pour utiliser',
      'Your Team — drag to reorder': 'Votre équipe — faites glisser pour réorganiser',
      'Next Opponent’s Team': 'Équipe du prochain adversaire',
      "Next Opponent's Team": 'Équipe du prochain adversaire',
      'Wild Pokemon Appeared!': 'Un Pokémon sauvage apparaît !',
      'Choose one Pokemon to add to your team': 'Choisissez un Pokémon à ajouter à votre équipe',
      'Choose one item to keep': 'Choisissez un objet à garder',
      'Item Found!': 'Objet trouvé !',
      'Team Full!': 'Équipe complète !',
      'Keep team as-is': 'Garder l’équipe actuelle',
      'Add to team or keep team as-is:': 'Ajoutez-le ou gardez l’équipe actuelle :',
      'Choose a Pokémon to release:': 'Choisissez un Pokémon à libérer :',
      'Keep in Bag': 'Garder dans le sac',
      'Trade Offer': 'Offre d’échange',
      'Decline': 'Refuser',
      'Catch Pokemon': 'Attraper le Pokémon',
      'Skip (flee)': 'Fuir',
      'Final Battle!': 'Combat final !',
      'The Elite Four await!': 'Le Conseil 4 vous attend !',
      'Congratulations! You defeated the Elite Four!': 'Félicitations ! Vous avez vaincu le Conseil 4 !',
      'YOU ARE THE': 'VOUS ÊTES LE',
      'CHAMPION!': 'CHAMPION !',
      'Play Again': 'Rejouer',
      'Try Again': 'Réessayer',
      'GAME OVER': 'PARTIE TERMINÉE',
      'Stage Select': 'Sélection d’étape',
      'Climb the Tower': 'Gravir la Tour',
      'Region Cleared!': 'Région terminée !',
      'Display': 'Affichage',
      'Dark Mode': 'Mode sombre',
      'Auto-Skip': 'Passage automatique',
      'Regular Trainers': 'Dresseurs ordinaires',
      'All Fights': 'Tous les combats',
      'Evolutions': 'Évolutions',
      'Account': 'Compte',
      'Achievement Unlocked!': 'Succès débloqué !',
      'General': 'Général',
      'Challenges': 'Défis',
      'Classic': 'Classique',
      'Caught': 'Capturé',
      'Not found': 'Introuvable',
      'Toggle shiny': 'Afficher la version chromatique',
      'All Gens': 'Toutes les générations',
      'All': 'Tous',
      'Normal': 'Normal',
      'Shiny': 'Chromatique',
      'Back to main menu': 'Retour au menu principal',
      'Join Discord': 'Rejoindre Discord',
      'cloud save active': 'sauvegarde cloud active',
      'Beat the game first to unlock': 'Terminez le jeu pour débloquer',
      'Beat a stage to unlock buffs': 'Terminez une étape pour débloquer les bonus',
      'No Perma-Death': 'Pas de mort permanente',
      'Already in your Hall of Fame PC': 'Déjà dans le PC du Panthéon',
      'Click anywhere to dismiss': 'Touchez pour fermer',
      'Coming Soon': 'Bientôt disponible',
      'Coming Next': 'Prochainement',
      'Bug Fixes': 'Corrections',
      'Changes': 'Modifications',
      'New Content': 'Nouveau contenu',
      'Cloud Sync': 'Synchronisation cloud',
      'Battle Tower Update': 'Mise à jour de la Tour de Combat',
      'Quality of Life Patch': 'Améliorations de confort'
    },
    it: {
      'Pokémon Roguelike': 'Roguelike Pokémon',
      'patch notes': 'note della patch',
      'Continue Run': 'Continua run',
      'Continue Battle Tower': 'Continua Torre Lotta',
      'Normal Mode': 'Modalità Normale',
      'Nuzlocke': 'Nuzlocke',
      'Battle Tower': 'Torre Lotta',
      'Pokédex': 'Pokédex',
      'Achievements': 'Obiettivi',
      'Hall of Fame': 'Hall of Fame',
      'Patch Notes': 'Note della patch',
      'Settings': 'Impostazioni',
      'Who are you?': 'Chi sei?',
      'Choose Your Starter!': 'Scegli il tuo starter!',
      'Choose a stage to begin': 'Scegli uno stage',
      'Your Team': 'La tua squadra',
      'Enemy': 'Avversario',
      'Wild Battle!': 'Lotta selvatica!',
      'Skip': 'Accelera',
      'Continue': 'Continua',
      'Back': 'Indietro',
      'Restart run': 'Ricomincia la run',
      'TEAM': 'SQUADRA',
      'ITEMS': 'STRUMENTI',
      'BADGES': 'MEDAGLIE',
      'Items — click to use': 'Strumenti — tocca per usare',
      'Your Team — drag to reorder': 'La tua squadra — trascina per riordinare',
      'Next Opponent’s Team': 'Squadra del prossimo avversario',
      "Next Opponent's Team": 'Squadra del prossimo avversario',
      'Wild Pokemon Appeared!': 'È apparso un Pokémon selvatico!',
      'Choose one Pokemon to add to your team': 'Scegli un Pokémon da aggiungere alla squadra',
      'Choose one item to keep': 'Scegli uno strumento da tenere',
      'Item Found!': 'Strumento trovato!',
      'Team Full!': 'Squadra completa!',
      'Keep team as-is': 'Mantieni la squadra attuale',
      'Add to team or keep team as-is:': 'Aggiungilo o mantieni la squadra attuale:',
      'Choose a Pokémon to release:': 'Scegli un Pokémon da lasciare:',
      'Keep in Bag': 'Metti nella borsa',
      'Trade Offer': 'Offerta di scambio',
      'Decline': 'Rifiuta',
      'Catch Pokemon': 'Cattura Pokémon',
      'Skip (flee)': 'Fuggi',
      'Final Battle!': 'Lotta finale!',
      'The Elite Four await!': 'I Superquattro ti aspettano!',
      'Congratulations! You defeated the Elite Four!': 'Congratulazioni! Hai sconfitto i Superquattro!',
      'YOU ARE THE': 'SEI IL',
      'CHAMPION!': 'CAMPIONE!',
      'Play Again': 'Gioca ancora',
      'Try Again': 'Riprova',
      'GAME OVER': 'FINE PARTITA',
      'Stage Select': 'Selezione stage',
      'Climb the Tower': 'Scala la Torre',
      'Region Cleared!': 'Regione completata!',
      'Display': 'Schermo',
      'Dark Mode': 'Modalità scura',
      'Auto-Skip': 'Salto automatico',
      'Regular Trainers': 'Allenatori normali',
      'All Fights': 'Tutte le lotte',
      'Evolutions': 'Evoluzioni',
      'Account': 'Account',
      'Achievement Unlocked!': 'Obiettivo sbloccato!',
      'General': 'Generale',
      'Challenges': 'Sfide',
      'Classic': 'Classica',
      'Caught': 'Catturato',
      'Not found': 'Non trovato',
      'Toggle shiny': 'Mostra cromatico',
      'All Gens': 'Tutte le generazioni',
      'All': 'Tutti',
      'Normal': 'Normale',
      'Shiny': 'Cromatico',
      'Back to main menu': 'Torna al menu principale',
      'Join Discord': 'Entra su Discord',
      'cloud save active': 'salvataggio cloud attivo',
      'Beat the game first to unlock': 'Completa il gioco per sbloccare',
      'Beat a stage to unlock buffs': 'Completa uno stage per sbloccare i potenziamenti',
      'No Perma-Death': 'Nessuna morte permanente',
      'Already in your Hall of Fame PC': 'Già nel PC della Hall of Fame',
      'Click anywhere to dismiss': 'Tocca per chiudere',
      'Coming Soon': 'Prossimamente',
      'Coming Next': 'In arrivo',
      'Bug Fixes': 'Correzioni',
      'Changes': 'Modifiche',
      'New Content': 'Nuovi contenuti',
      'Cloud Sync': 'Sincronizzazione cloud',
      'Battle Tower Update': 'Aggiornamento Torre Lotta',
      'Quality of Life Patch': 'Miglioramenti alla qualità di gioco'
    },
    es: {
      'Pokémon Roguelike': 'Roguelike Pokémon',
      'patch notes': 'notas del parche',
      'Continue Run': 'Continuar partida',
      'Continue Battle Tower': 'Continuar Torre Batalla',
      'Normal Mode': 'Modo Normal',
      'Nuzlocke': 'Nuzlocke',
      'Battle Tower': 'Torre Batalla',
      'Pokédex': 'Pokédex',
      'Achievements': 'Logros',
      'Hall of Fame': 'Salón de la Fama',
      'Patch Notes': 'Notas del parche',
      'Settings': 'Ajustes',
      'Who are you?': '¿Quién eres?',
      'Choose Your Starter!': '¡Elige tu Pokémon inicial!',
      'Choose a stage to begin': 'Elige una etapa',
      'Your Team': 'Tu equipo',
      'Enemy': 'Rival',
      'Wild Battle!': '¡Combate salvaje!',
      'Skip': 'Acelerar',
      'Continue': 'Continuar',
      'Back': 'Atrás',
      'Restart run': 'Reiniciar partida',
      'TEAM': 'EQUIPO',
      'ITEMS': 'OBJETOS',
      'BADGES': 'MEDALLAS',
      'Items — click to use': 'Objetos — toca para usar',
      'Your Team — drag to reorder': 'Tu equipo — arrastra para ordenar',
      'Next Opponent’s Team': 'Equipo del próximo rival',
      "Next Opponent's Team": 'Equipo del próximo rival',
      'Wild Pokemon Appeared!': '¡Ha aparecido un Pokémon salvaje!',
      'Choose one Pokemon to add to your team': 'Elige un Pokémon para añadir al equipo',
      'Choose one item to keep': 'Elige un objeto',
      'Item Found!': '¡Objeto encontrado!',
      'Team Full!': '¡Equipo completo!',
      'Keep team as-is': 'Mantener el equipo actual',
      'Add to team or keep team as-is:': 'Añádelo o mantén el equipo actual:',
      'Choose a Pokémon to release:': 'Elige un Pokémon para liberar:',
      'Keep in Bag': 'Guardar en la mochila',
      'Trade Offer': 'Oferta de intercambio',
      'Decline': 'Rechazar',
      'Catch Pokemon': 'Capturar Pokémon',
      'Skip (flee)': 'Huir',
      'Final Battle!': '¡Combate final!',
      'The Elite Four await!': '¡El Alto Mando te espera!',
      'Congratulations! You defeated the Elite Four!': '¡Felicidades! ¡Has derrotado al Alto Mando!',
      'YOU ARE THE': 'ERES EL',
      'CHAMPION!': '¡CAMPEÓN!',
      'Play Again': 'Jugar otra vez',
      'Try Again': 'Reintentar',
      'GAME OVER': 'FIN DE LA PARTIDA',
      'Stage Select': 'Selección de etapa',
      'Climb the Tower': 'Subir la Torre',
      'Region Cleared!': '¡Región completada!',
      'Display': 'Pantalla',
      'Dark Mode': 'Modo oscuro',
      'Auto-Skip': 'Salto automático',
      'Regular Trainers': 'Entrenadores normales',
      'All Fights': 'Todos los combates',
      'Evolutions': 'Evoluciones',
      'Account': 'Cuenta',
      'Achievement Unlocked!': '¡Logro desbloqueado!',
      'General': 'General',
      'Challenges': 'Desafíos',
      'Classic': 'Clásico',
      'Caught': 'Capturado',
      'Not found': 'No encontrado',
      'Toggle shiny': 'Mostrar variocolor',
      'All Gens': 'Todas las generaciones',
      'All': 'Todos',
      'Normal': 'Normal',
      'Shiny': 'Variocolor',
      'Back to main menu': 'Volver al menú principal',
      'Join Discord': 'Únete a Discord',
      'cloud save active': 'guardado en la nube activo',
      'Beat the game first to unlock': 'Completa el juego para desbloquear',
      'Beat a stage to unlock buffs': 'Completa una etapa para desbloquear mejoras',
      'No Perma-Death': 'Sin muerte permanente',
      'Already in your Hall of Fame PC': 'Ya está en el PC del Salón de la Fama',
      'Click anywhere to dismiss': 'Toca para cerrar',
      'Coming Soon': 'Próximamente',
      'Coming Next': 'A continuación',
      'Bug Fixes': 'Correcciones',
      'Changes': 'Cambios',
      'New Content': 'Contenido nuevo',
      'Cloud Sync': 'Sincronización en la nube',
      'Battle Tower Update': 'Actualización de la Torre Batalla',
      'Quality of Life Patch': 'Mejoras de calidad de vida'
    },
    de: {
      'Pokémon Roguelike': 'Pokémon-Roguelike',
      'patch notes': 'Patchnotes',
      'Continue Run': 'Run fortsetzen',
      'Continue Battle Tower': 'Kampfturm fortsetzen',
      'Normal Mode': 'Normalmodus',
      'Nuzlocke': 'Nuzlocke',
      'Battle Tower': 'Kampfturm',
      'Pokédex': 'Pokédex',
      'Achievements': 'Erfolge',
      'Hall of Fame': 'Ruhmeshalle',
      'Patch Notes': 'Patchnotes',
      'Settings': 'Einstellungen',
      'Who are you?': 'Wer bist du?',
      'Choose Your Starter!': 'Wähle dein Starter-Pokémon!',
      'Choose a stage to begin': 'Wähle eine Stufe',
      'Your Team': 'Dein Team',
      'Enemy': 'Gegner',
      'Wild Battle!': 'Wilder Kampf!',
      'Skip': 'Beschleunigen',
      'Continue': 'Weiter',
      'Back': 'Zurück',
      'Restart run': 'Run neu starten',
      'TEAM': 'TEAM',
      'ITEMS': 'ITEMS',
      'BADGES': 'ORDEN',
      'Items — click to use': 'Items — zum Benutzen antippen',
      'Your Team — drag to reorder': 'Dein Team — zum Sortieren ziehen',
      'Next Opponent’s Team': 'Team des nächsten Gegners',
      "Next Opponent's Team": 'Team des nächsten Gegners',
      'Wild Pokemon Appeared!': 'Ein wildes Pokémon erscheint!',
      'Choose one Pokemon to add to your team': 'Wähle ein Pokémon für dein Team',
      'Choose one item to keep': 'Wähle ein Item',
      'Item Found!': 'Item gefunden!',
      'Team Full!': 'Team voll!',
      'Keep team as-is': 'Aktuelles Team behalten',
      'Add to team or keep team as-is:': 'Hinzufügen oder aktuelles Team behalten:',
      'Choose a Pokémon to release:': 'Wähle ein Pokémon zum Freilassen:',
      'Keep in Bag': 'Im Beutel behalten',
      'Trade Offer': 'Tauschangebot',
      'Decline': 'Ablehnen',
      'Catch Pokemon': 'Pokémon fangen',
      'Skip (flee)': 'Fliehen',
      'Final Battle!': 'Finaler Kampf!',
      'The Elite Four await!': 'Die Top Vier warten!',
      'Congratulations! You defeated the Elite Four!': 'Glückwunsch! Du hast die Top Vier besiegt!',
      'YOU ARE THE': 'DU BIST DER',
      'CHAMPION!': 'CHAMPION!',
      'Play Again': 'Erneut spielen',
      'Try Again': 'Erneut versuchen',
      'GAME OVER': 'SPIEL VORBEI',
      'Stage Select': 'Stufenauswahl',
      'Climb the Tower': 'Turm erklimmen',
      'Region Cleared!': 'Region abgeschlossen!',
      'Display': 'Anzeige',
      'Dark Mode': 'Dunkler Modus',
      'Auto-Skip': 'Automatisch überspringen',
      'Regular Trainers': 'Normale Trainer',
      'All Fights': 'Alle Kämpfe',
      'Evolutions': 'Entwicklungen',
      'Account': 'Konto',
      'Achievement Unlocked!': 'Erfolg freigeschaltet!',
      'General': 'Allgemein',
      'Challenges': 'Herausforderungen',
      'Classic': 'Klassisch',
      'Caught': 'Gefangen',
      'Not found': 'Nicht gefunden',
      'Toggle shiny': 'Schillernd anzeigen',
      'All Gens': 'Alle Generationen',
      'All': 'Alle',
      'Normal': 'Normal',
      'Shiny': 'Schillernd',
      'Back to main menu': 'Zurück zum Hauptmenü',
      'Join Discord': 'Discord beitreten',
      'cloud save active': 'Cloud-Speicher aktiv',
      'Beat the game first to unlock': 'Schließe das Spiel ab, um freizuschalten',
      'Beat a stage to unlock buffs': 'Schließe eine Stufe für Verbesserungen ab',
      'No Perma-Death': 'Kein permanenter Tod',
      'Already in your Hall of Fame PC': 'Bereits im Ruhmeshallen-PC',
      'Click anywhere to dismiss': 'Zum Schließen antippen',
      'Coming Soon': 'Demnächst',
      'Coming Next': 'Als Nächstes',
      'Bug Fixes': 'Fehlerbehebungen',
      'Changes': 'Änderungen',
      'New Content': 'Neue Inhalte',
      'Cloud Sync': 'Cloud-Synchronisierung',
      'Battle Tower Update': 'Kampfturm-Update',
      'Quality of Life Patch': 'Komfort-Update'
    },
    pt: {
      'Pokémon Roguelike': 'Roguelike Pokémon',
      'patch notes': 'notas da atualização',
      'Continue Run': 'Continuar partida',
      'Continue Battle Tower': 'Continuar Torre de Batalha',
      'Normal Mode': 'Modo Normal',
      'Nuzlocke': 'Nuzlocke',
      'Battle Tower': 'Torre de Batalha',
      'Pokédex': 'Pokédex',
      'Achievements': 'Conquistas',
      'Hall of Fame': 'Hall da Fama',
      'Patch Notes': 'Notas da atualização',
      'Settings': 'Configurações',
      'Who are you?': 'Quem é você?',
      'Choose Your Starter!': 'Escolha seu Pokémon inicial!',
      'Choose a stage to begin': 'Escolha uma etapa',
      'Your Team': 'Sua equipe',
      'Enemy': 'Adversário',
      'Wild Battle!': 'Batalha selvagem!',
      'Skip': 'Acelerar',
      'Continue': 'Continuar',
      'Back': 'Voltar',
      'Restart run': 'Reiniciar partida',
      'TEAM': 'EQUIPE',
      'ITEMS': 'ITENS',
      'BADGES': 'INSÍGNIAS',
      'Items — click to use': 'Itens — toque para usar',
      'Your Team — drag to reorder': 'Sua equipe — arraste para reorganizar',
      'Next Opponent’s Team': 'Equipe do próximo adversário',
      "Next Opponent's Team": 'Equipe do próximo adversário',
      'Wild Pokemon Appeared!': 'Um Pokémon selvagem apareceu!',
      'Choose one Pokemon to add to your team': 'Escolha um Pokémon para sua equipe',
      'Choose one item to keep': 'Escolha um item',
      'Item Found!': 'Item encontrado!',
      'Team Full!': 'Equipe completa!',
      'Keep team as-is': 'Manter a equipe atual',
      'Add to team or keep team as-is:': 'Adicione-o ou mantenha a equipe atual:',
      'Choose a Pokémon to release:': 'Escolha um Pokémon para liberar:',
      'Keep in Bag': 'Guardar na bolsa',
      'Trade Offer': 'Oferta de troca',
      'Decline': 'Recusar',
      'Catch Pokemon': 'Capturar Pokémon',
      'Skip (flee)': 'Fugir',
      'Final Battle!': 'Batalha final!',
      'The Elite Four await!': 'A Elite dos Quatro espera por você!',
      'Congratulations! You defeated the Elite Four!': 'Parabéns! Você derrotou a Elite dos Quatro!',
      'YOU ARE THE': 'VOCÊ É O',
      'CHAMPION!': 'CAMPEÃO!',
      'Play Again': 'Jogar novamente',
      'Try Again': 'Tentar novamente',
      'GAME OVER': 'FIM DE JOGO',
      'Stage Select': 'Seleção de etapa',
      'Climb the Tower': 'Subir a Torre',
      'Region Cleared!': 'Região concluída!',
      'Display': 'Tela',
      'Dark Mode': 'Modo escuro',
      'Auto-Skip': 'Pular automaticamente',
      'Regular Trainers': 'Treinadores normais',
      'All Fights': 'Todas as batalhas',
      'Evolutions': 'Evoluções',
      'Account': 'Conta',
      'Achievement Unlocked!': 'Conquista desbloqueada!',
      'General': 'Geral',
      'Challenges': 'Desafios',
      'Classic': 'Clássico',
      'Caught': 'Capturado',
      'Not found': 'Não encontrado',
      'Toggle shiny': 'Mostrar brilhante',
      'All Gens': 'Todas as gerações',
      'All': 'Todos',
      'Normal': 'Normal',
      'Shiny': 'Brilhante',
      'Back to main menu': 'Voltar ao menu principal',
      'Join Discord': 'Entrar no Discord',
      'cloud save active': 'salvamento na nuvem ativo',
      'Beat the game first to unlock': 'Conclua o jogo para desbloquear',
      'Beat a stage to unlock buffs': 'Conclua uma etapa para liberar melhorias',
      'No Perma-Death': 'Sem morte permanente',
      'Already in your Hall of Fame PC': 'Já está no PC do Hall da Fama',
      'Click anywhere to dismiss': 'Toque para fechar',
      'Coming Soon': 'Em breve',
      'Coming Next': 'A seguir',
      'Bug Fixes': 'Correções',
      'Changes': 'Alterações',
      'New Content': 'Novo conteúdo',
      'Cloud Sync': 'Sincronização na nuvem',
      'Battle Tower Update': 'Atualização da Torre de Batalha',
      'Quality of Life Patch': 'Melhorias de qualidade de vida'
    }
  };

  var patches = {
    en: [
      {
        version: '1.8',
        title: 'Hoenn Expansion',
        date: 'Coming Soon',
        entries: [
          'Generation 3 will be released with the Hoenn maps.',
          'Hoenn will be available in both Normal Mode and Nuzlocke Mode.'
        ]
      },
      {
        version: '1.7',
        title: 'Languages, Backup & Pokédex Update',
        date: '2026-06-10',
        entries: [
          'Added full interface support for English, French, Italian, Spanish, German, and Portuguese.',
          'Added the ability to back up and recover game saves.',
          'Updated the Pokédex and added all 1025 Pokémon.',
          'When Cloud Save is unavailable, the game remains playable and progress continues locally.',
          'Added Liga protection for players in Spain.',
          'Added Generations 6 through 9 to the Battle Tower, including their regions and Pokémon.'
        ]
      }
    ],
    fr: [
      {
        version: '1.8',
        title: 'Extension de Hoenn',
        date: 'Bientôt disponible',
        entries: [
          'La troisième génération arrivera avec les cartes de Hoenn.',
          'Hoenn sera disponible en Mode Normal et en Mode Nuzlocke.'
        ]
      },
      {
        version: '1.7',
        title: 'Langues, sauvegardes et mise à jour du Pokédex',
        date: '10/06/2026',
        entries: [
          'Ajout de la prise en charge complète de l’anglais, du français, de l’italien, de l’espagnol, de l’allemand et du portugais.',
          'Ajout de la sauvegarde et de la récupération des parties.',
          'Mise à jour du Pokédex avec les 1025 Pokémon.',
          'Si la sauvegarde cloud est indisponible, le jeu reste jouable et la progression continue localement.',
          'Ajout de la protection Liga pour les joueurs en Espagne.',
          'Ajout des générations 6 à 9 dans la Tour de Combat, avec leurs régions et leurs Pokémon.'
        ]
      }
    ],
    it: [
      {
        version: '1.8',
        title: 'Espansione di Hoenn',
        date: 'Prossimamente',
        entries: [
          'Sarà rilasciata la terza generazione con le mappe di Hoenn.',
          'Hoenn sarà disponibile sia in Modalità Normale sia in Modalità Nuzlocke.'
        ]
      },
      {
        version: '1.7',
        title: 'Lingue, backup e aggiornamento Pokédex',
        date: '10/06/2026',
        entries: [
          'Aggiunto il supporto completo per inglese, francese, italiano, spagnolo, tedesco e portoghese.',
          'Aggiunta la possibilità di eseguire il backup e il recupero dei salvataggi.',
          'Aggiornato il Pokédex e aggiunti tutti i 1025 Pokémon.',
          'Quando il Cloud Save non è disponibile, è comunque possibile giocare e i progressi continuano a essere salvati localmente.',
          'Aggiunta la protezione Liga per gli utenti in Spagna.',
          'Aggiunte alla Torre Lotta le generazioni dalla 6 alla 9, con le rispettive regioni e i rispettivi Pokémon.'
        ]
      }
    ],
    es: [
      {
        version: '1.8',
        title: 'Expansión de Hoenn',
        date: 'Próximamente',
        entries: [
          'La tercera generación llegará con los mapas de Hoenn.',
          'Hoenn estará disponible tanto en Modo Normal como en Modo Nuzlocke.'
        ]
      },
      {
        version: '1.7',
        title: 'Idiomas, copias de seguridad y actualización de la Pokédex',
        date: '10/06/2026',
        entries: [
          'Se añadió compatibilidad completa con inglés, francés, italiano, español, alemán y portugués.',
          'Se añadió la posibilidad de hacer copias de seguridad y recuperar partidas.',
          'Se actualizó la Pokédex y se añadieron los 1025 Pokémon.',
          'Cuando el guardado en la nube no está disponible, se puede seguir jugando y el progreso continúa guardándose localmente.',
          'Se añadió protección Liga para los jugadores de España.',
          'Se añadieron las generaciones 6 a 9 a la Torre Batalla, con sus respectivas regiones y Pokémon.'
        ]
      }
    ],
    de: [
      {
        version: '1.8',
        title: 'Hoenn-Erweiterung',
        date: 'Demnächst',
        entries: [
          'Die dritte Generation erscheint mit den Hoenn-Karten.',
          'Hoenn wird im Normalmodus und im Nuzlocke-Modus verfügbar sein.'
        ]
      },
      {
        version: '1.7',
        title: 'Sprachen, Backups und Pokédex-Update',
        date: '10.06.2026',
        entries: [
          'Vollständige Unterstützung für Englisch, Französisch, Italienisch, Spanisch, Deutsch und Portugiesisch hinzugefügt.',
          'Sicherung und Wiederherstellung von Spielständen hinzugefügt.',
          'Der Pokédex wurde aktualisiert und enthält jetzt alle 1025 Pokémon.',
          'Wenn der Cloud-Speicher nicht verfügbar ist, bleibt das Spiel spielbar und der Fortschritt wird lokal gespeichert.',
          'Liga-Schutz für Spieler in Spanien hinzugefügt.',
          'Die Generationen 6 bis 9 wurden mit ihren Regionen und Pokémon zum Kampfturm hinzugefügt.'
        ]
      }
    ],
    pt: [
      {
        version: '1.8',
        title: 'Expansão de Hoenn',
        date: 'Em breve',
        entries: [
          'A terceira geração será lançada com os mapas de Hoenn.',
          'Hoenn estará disponível no Modo Normal e no Modo Nuzlocke.'
        ]
      },
      {
        version: '1.7',
        title: 'Idiomas, backups e atualização da Pokédex',
        date: '10/06/2026',
        entries: [
          'Adicionado suporte completo para inglês, francês, italiano, espanhol, alemão e português.',
          'Adicionada a possibilidade de fazer backup e recuperar os salvamentos.',
          'A Pokédex foi atualizada e agora inclui todos os 1025 Pokémon.',
          'Quando o salvamento na nuvem não está disponível, ainda é possível jogar e o progresso continua sendo salvo localmente.',
          'Adicionada proteção Liga para jogadores na Espanha.',
          'As gerações 6 a 9 foram adicionadas à Torre de Batalha, com suas regiões e Pokémon.'
        ]
      }
    ]
  };

  Object.assign(translations.fr, {
    'Language': 'Langue',
    'Generation': 'Génération',
    'Stage': 'Étape',
    'Map': 'Carte',
    'Level': 'Niveau',
    'New Pokémon!': 'Nouveau Pokémon !',
    'Choose a Pokémon to release:': 'Choisissez un Pokémon à libérer :',
    'Critical!': 'Coup critique !',
    'Dodge!': 'Esquive !',
    'Fainted': 'K.O.',
    'Shiny!': 'Chromatique !',
    'Confusion!': 'Confusion !',
    'Struggle!': 'Lutte !',
    'Gym Leader': 'Champion d’Arène',
    'Trainer': 'Dresseur',
    'Regular Trainers': 'Dresseurs ordinaires',
    'Ace Trainer': 'Topdresseur',
    'Bug Catcher': 'Scout',
    'Bird Keeper': 'Ornithologue',
    'Fisherman': 'Pêcheur',
    'Hiker': 'Montagnard',
    'Scientist': 'Scientifique',
    'Schoolboy': 'Écolier',
    'Sailor': 'Marin',
    'Fire': 'Feu',
    'Water': 'Eau',
    'Grass': 'Plante',
    'Electric': 'Électrik',
    'Ice': 'Glace',
    'Fighting': 'Combat',
    'Poison': 'Poison',
    'Ground': 'Sol',
    'Flying': 'Vol',
    'Psychic': 'Psy',
    'Bug': 'Insecte',
    'Rock': 'Roche',
    'Ghost': 'Spectre',
    'Dragon': 'Dragon',
    'Dark': 'Ténèbres',
    'Steel': 'Acier',
    'Fairy': 'Fée'
  });

  Object.assign(translations.it, {
    'Language': 'Lingua',
    'Generation': 'Generazione',
    'Stage': 'Stage',
    'Map': 'Mappa',
    'Level': 'Livello',
    'New Pokémon!': 'Nuovo Pokémon!',
    'Choose a Pokémon to release:': 'Scegli un Pokémon da lasciare:',
    'Critical!': 'Brutto colpo!',
    'Dodge!': 'Schivato!',
    'Fainted': 'Esausto',
    'Shiny!': 'Cromatico!',
    'Confusion!': 'Confusione!',
    'Struggle!': 'Scontro!',
    'Gym Leader': 'Capopalestra',
    'Trainer': 'Allenatore',
    'Ace Trainer': 'Fantallenatore',
    'Bug Catcher': 'Pigliamosche',
    'Bird Keeper': 'Avicoltore',
    'Fisherman': 'Pescatore',
    'Hiker': 'Montanaro',
    'Scientist': 'Scienziato',
    'Schoolboy': 'Scolaro',
    'Sailor': 'Marinaio',
    'Fire': 'Fuoco',
    'Water': 'Acqua',
    'Grass': 'Erba',
    'Electric': 'Elettro',
    'Ice': 'Ghiaccio',
    'Fighting': 'Lotta',
    'Poison': 'Veleno',
    'Ground': 'Terra',
    'Flying': 'Volante',
    'Psychic': 'Psico',
    'Bug': 'Coleottero',
    'Rock': 'Roccia',
    'Ghost': 'Spettro',
    'Dragon': 'Drago',
    'Dark': 'Buio',
    'Steel': 'Acciaio',
    'Fairy': 'Folletto'
  });

  Object.assign(translations.es, {
    'Language': 'Idioma',
    'Generation': 'Generación',
    'Stage': 'Etapa',
    'Map': 'Mapa',
    'Level': 'Nivel',
    'New Pokémon!': '¡Nuevo Pokémon!',
    'Choose a Pokémon to release:': 'Elige un Pokémon para liberar:',
    'Critical!': '¡Golpe crítico!',
    'Dodge!': '¡Esquivado!',
    'Fainted': 'Debilitado',
    'Shiny!': '¡Variocolor!',
    'Confusion!': '¡Confusión!',
    'Struggle!': '¡Forcejeo!',
    'Gym Leader': 'Líder de Gimnasio',
    'Trainer': 'Entrenador',
    'Ace Trainer': 'Entrenador Guay',
    'Bug Catcher': 'Cazabichos',
    'Bird Keeper': 'Criapájaros',
    'Fisherman': 'Pescador',
    'Hiker': 'Montañero',
    'Scientist': 'Científico',
    'Schoolboy': 'Colegial',
    'Sailor': 'Marinero',
    'Fire': 'Fuego',
    'Water': 'Agua',
    'Grass': 'Planta',
    'Electric': 'Eléctrico',
    'Ice': 'Hielo',
    'Fighting': 'Lucha',
    'Poison': 'Veneno',
    'Ground': 'Tierra',
    'Flying': 'Volador',
    'Psychic': 'Psíquico',
    'Bug': 'Bicho',
    'Rock': 'Roca',
    'Ghost': 'Fantasma',
    'Dragon': 'Dragón',
    'Dark': 'Siniestro',
    'Steel': 'Acero',
    'Fairy': 'Hada'
  });

  Object.assign(translations.de, {
    'Language': 'Sprache',
    'Generation': 'Generation',
    'Stage': 'Stufe',
    'Map': 'Karte',
    'Level': 'Level',
    'New Pokémon!': 'Neues Pokémon!',
    'Choose a Pokémon to release:': 'Wähle ein Pokémon zum Freilassen:',
    'Critical!': 'Volltreffer!',
    'Dodge!': 'Ausgewichen!',
    'Fainted': 'Besiegt',
    'Shiny!': 'Schillernd!',
    'Confusion!': 'Verwirrung!',
    'Struggle!': 'Verzweifler!',
    'Gym Leader': 'Arenaleiter',
    'Trainer': 'Trainer',
    'Ace Trainer': 'Ass-Trainer',
    'Bug Catcher': 'Käfersammler',
    'Bird Keeper': 'Vogelfänger',
    'Fisherman': 'Angler',
    'Hiker': 'Wanderer',
    'Scientist': 'Forscher',
    'Schoolboy': 'Schüler',
    'Sailor': 'Matrose',
    'Fire': 'Feuer',
    'Water': 'Wasser',
    'Grass': 'Pflanze',
    'Electric': 'Elektro',
    'Ice': 'Eis',
    'Fighting': 'Kampf',
    'Poison': 'Gift',
    'Ground': 'Boden',
    'Flying': 'Flug',
    'Psychic': 'Psycho',
    'Bug': 'Käfer',
    'Rock': 'Gestein',
    'Ghost': 'Geist',
    'Dragon': 'Drache',
    'Dark': 'Unlicht',
    'Steel': 'Stahl',
    'Fairy': 'Fee'
  });

  Object.assign(translations.pt, {
    'Language': 'Idioma',
    'Generation': 'Geração',
    'Stage': 'Etapa',
    'Map': 'Mapa',
    'Level': 'Nível',
    'New Pokémon!': 'Novo Pokémon!',
    'Choose a Pokémon to release:': 'Escolha um Pokémon para liberar:',
    'Critical!': 'Golpe crítico!',
    'Dodge!': 'Desviou!',
    'Fainted': 'Derrotado',
    'Shiny!': 'Brilhante!',
    'Confusion!': 'Confusão!',
    'Struggle!': 'Desespero!',
    'Gym Leader': 'Líder de Ginásio',
    'Trainer': 'Treinador',
    'Ace Trainer': 'Treinador Ás',
    'Bug Catcher': 'Caçador de Insetos',
    'Bird Keeper': 'Criador de Aves',
    'Fisherman': 'Pescador',
    'Hiker': 'Montanhista',
    'Scientist': 'Cientista',
    'Schoolboy': 'Estudante',
    'Sailor': 'Marinheiro',
    'Fire': 'Fogo',
    'Water': 'Água',
    'Grass': 'Planta',
    'Electric': 'Elétrico',
    'Ice': 'Gelo',
    'Fighting': 'Lutador',
    'Poison': 'Veneno',
    'Ground': 'Terra',
    'Flying': 'Voador',
    'Psychic': 'Psíquico',
    'Bug': 'Inseto',
    'Rock': 'Pedra',
    'Ghost': 'Fantasma',
    'Dragon': 'Dragão',
    'Dark': 'Sombrio',
    'Steel': 'Aço',
    'Fairy': 'Fada'
  });

  Object.assign(translations.fr, {
    'API / Network Debug': 'Débogage API / Réseau',
    'Refresh': 'Actualiser',
    'Clear': 'Effacer',
    'No API, fetch or XHR calls recorded yet.': 'Aucun appel API, fetch ou XHR enregistré.'
  });
  Object.assign(translations.it, {
    'API / Network Debug': 'Debug API / Rete',
    'Refresh': 'Aggiorna',
    'Clear': 'Cancella',
    'No API, fetch or XHR calls recorded yet.': 'Nessuna chiamata API, fetch o XHR registrata.'
  });
  Object.assign(translations.es, {
    'API / Network Debug': 'Depuración API / Red',
    'Refresh': 'Actualizar',
    'Clear': 'Borrar',
    'No API, fetch or XHR calls recorded yet.': 'Todavía no hay llamadas API, fetch o XHR registradas.'
  });
  Object.assign(translations.de, {
    'API / Network Debug': 'API-/Netzwerk-Debug',
    'Refresh': 'Aktualisieren',
    'Clear': 'Löschen',
    'No API, fetch or XHR calls recorded yet.': 'Noch keine API-, Fetch- oder XHR-Aufrufe aufgezeichnet.'
  });
  Object.assign(translations.pt, {
    'API / Network Debug': 'Depuração de API / Rede',
    'Refresh': 'Atualizar',
    'Clear': 'Limpar',
    'No API, fetch or XHR calls recorded yet.': 'Nenhuma chamada API, fetch ou XHR registrada.'
  });

  Object.assign(translations.fr, {
    'Continue Run': 'Continuer',
    'Continue Battle Tower': 'Reprendre la Tour',
    'Normal Mode': 'Mode Normal',
    'Hall of Fame': 'Panthéon',
    'Patch Notes': 'Notes',
    'Settings': 'Options'
  });
  Object.assign(translations.it, {
    'Continue Run': 'Continua',
    'Continue Battle Tower': 'Continua Torre',
    'Normal Mode': 'Normale',
    'Patch Notes': 'Note',
    'Settings': 'Opzioni'
  });
  Object.assign(translations.es, {
    'Continue Run': 'Continuar',
    'Continue Battle Tower': 'Continuar Torre',
    'Normal Mode': 'Modo Normal',
    'Hall of Fame': 'Salón de Fama',
    'Patch Notes': 'Notas',
    'Settings': 'Ajustes'
  });
  Object.assign(translations.de, {
    'Continue Run': 'Fortsetzen',
    'Continue Battle Tower': 'Turm fortsetzen',
    'Normal Mode': 'Normalmodus',
    'Hall of Fame': 'Ruhmeshalle',
    'Patch Notes': 'Patchnotes',
    'Settings': 'Optionen'
  });
  Object.assign(translations.pt, {
    'Continue Run': 'Continuar',
    'Continue Battle Tower': 'Continuar Torre',
    'Normal Mode': 'Modo Normal',
    'Hall of Fame': 'Hall da Fama',
    'Patch Notes': 'Notas',
    'Settings': 'Opções'
  });

  function dictionary() {
    return translations[currentLanguage] || {};
  }

  function translateValue(value) {
    if (!value || currentLanguage === 'en') return value;
    var map = dictionary();
    var leading = value.match(/^\s*/)[0];
    var trailing = value.match(/\s*$/)[0];
    var core = value.trim();
    if (!core) return value;
    if (map[core]) return leading + map[core] + trailing;

    var translated = core;
    Object.keys(map)
      .sort(function (a, b) { return b.length - a.length; })
      .forEach(function (source) {
        var escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var pattern = new RegExp(
          '(^|[\\s(\\[{"“‘—:>])' + escaped + '(?=$|[\\s)\\]}"”’—:,!?.<])',
          'g'
        );
        translated = translated.replace(pattern, function (_, prefix) {
          return prefix + map[source];
        });
      });
    return leading + translated + trailing;
  }

  function translateNode(node) {
    if (!node || !node.nodeValue || !node.parentElement) return;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(node.parentElement.tagName)) return;
    if (node.parentElement.closest('#pokelike-language-picker')) return;
    if (node.parentElement.closest('#dex-grid-content')) return;

    var record = originalTexts.get(node);
    if (!record || node.nodeValue !== record.translated) {
      record = { source: node.nodeValue, translated: node.nodeValue };
    }
    var translated = translateValue(record.source);
    record.translated = translated;
    originalTexts.set(node, record);
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }

  function translateElementAttributes(element) {
    if (!element || element.nodeType !== 1) return;
    var record = originalAttributes.get(element) || {};
    ['title', 'aria-label', 'placeholder'].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var current = element.getAttribute(name);
      if (!record[name] || current !== record[name].translated) {
        record[name] = { source: current, translated: current };
      }
      var translated = translateValue(record[name].source);
      record[name].translated = translated;
      if (current !== translated) element.setAttribute(name, translated);
    });
    originalAttributes.set(element, record);
  }

  function translateInterface() {
    if (!document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) translateNode(node);
    document.querySelectorAll('[title], [aria-label], [placeholder]').forEach(
      translateElementAttributes
    );
    document.documentElement.lang = currentLanguage;
  }

  function setLanguage(language) {
    if (!languageNames[language]) return;
    currentLanguage = language;
    localStorage.setItem(LANGUAGE_KEY, language);
    var picker = document.getElementById('pokelike-language-select');
    if (picker) picker.value = language;
    var achievementsOpen = !!document.getElementById('achievements-modal');
    localizeAchievements();
    if (achievementsOpen && typeof openAchievementsModal === 'function') {
      document.getElementById('achievements-modal')?.remove();
      openAchievementsModal();
    }
    renderPatchNotes();
    translateInterface();
  }

  var achievementLocales = {
    fr: {
      champion: 'Champion de {region}',
      survivor: 'Survivant de {region} : {type}',
      typeMaster: 'Maître des types de {region}',
      shinySquad: 'Équipe chromatique de {region}',
      purist: 'Puriste de {region}',
      starterChampion: 'Champion {type}',
      professorChallenge: 'Défi du Professeur {name}',
      completionist: 'Expert de {region}',
      clearMap: 'Terminez la carte {map} et battez {boss}.',
      beatGame: 'Terminez le jeu',
      beatGen: 'Terminez la génération {gen}',
      withStarter: 'avec {pokemon} comme Pokémon de départ.',
      nuzlockeStarter: 'Terminez une partie Nuzlocke de génération {gen} avec {pokemon} comme Pokémon de départ.',
      nuzlockeClear: 'Terminez une partie Nuzlocke de génération {gen}.',
      towerClear: 'Battez {boss} et terminez l’étape {stage} de la Tour de Combat.',
      towerStarter: 'Remportez une partie de l’étape {stage} en commençant avec {pokemon}.',
      catchGen: 'Capturez tous les Pokémon de la génération {gen}, toutes parties confondues.',
      noCenter: ' sans utiliser de Centre Pokémon.',
      allType: ' avec une équipe dont tous les Pokémon partagent un même type.',
      allShiny: ' avec tous les Pokémon de l’équipe chromatiques.',
      neverEvolve: ' avec une équipe de Pokémon qui n’évoluent jamais.',
      titles: ['Briseur de Roche','Maître de la Cascade','Dominateur de la Foudre','Gardien de l’Arc-en-ciel','Briseur d’Âmes','Briseur d’Esprit','Vainqueur du Volcan','Secoueur de Terre','Maître Pokémon','Ligue des Champions','Champion Immortel','Un seul suffit','Vrai Maître','Gardien des Oiseaux','Sans répit','Minimaliste','Suprématie des Types','Équipe Chromatique','Sur une lancée','Coup du chapeau','Attrapez-les tous','Chasseur de Chromatiques','Chasseur Ultime','Premier Sommet','Double Sommet','Triple Sommet','Quadruple Sommet','Spécimen Parfait','Étincelle Chromatique','Éclair Chromatique','Brasier Chromatique','Tempête Chromatique','Légende Chromatique','Immortel Chromatique','Voyageur du Temps','Survivant Solitaire']
    },
    it: {
      champion: 'Campione di {region}',
      survivor: 'Sopravvissuto di {region}: {type}',
      typeMaster: 'Maestro dei tipi di {region}',
      shinySquad: 'Squadra cromatica di {region}',
      purist: 'Purista di {region}',
      starterChampion: 'Campione {type}',
      professorChallenge: 'Sfida del Professor {name}',
      completionist: 'Esperto di {region}',
      clearMap: 'Completa la mappa {map} e sconfiggi {boss}.',
      beatGame: 'Completa il gioco',
      beatGen: 'Completa la generazione {gen}',
      withStarter: 'con {pokemon} come Pokémon iniziale.',
      nuzlockeStarter: 'Completa una run Nuzlocke di generazione {gen} con {pokemon} come Pokémon iniziale.',
      nuzlockeClear: 'Completa una run Nuzlocke di generazione {gen}.',
      towerClear: 'Sconfiggi {boss} e completa lo stage {stage} della Torre Lotta.',
      towerStarter: 'Vinci una run dello stage {stage} iniziando con {pokemon}.',
      catchGen: 'Cattura tutti i Pokémon della generazione {gen} nel corso delle tue run.',
      noCenter: ' senza usare un Centro Pokémon.',
      allType: ' con una squadra in cui tutti i Pokémon condividono lo stesso tipo.',
      allShiny: ' con tutti i Pokémon della squadra cromatici.',
      neverEvolve: ' con una squadra di Pokémon che non si evolvono mai.',
      titles: ['Spaccaroccia','Distruttore della Cascata','Domatore di Fulmini','Guardiano dell’Arcobaleno','Spezzanime','Spezzamente','Vincitore del Vulcano','Scuotiterra','Maestro Pokémon','Lega dei Campioni','Campione Immortale','Ne basta uno','Vero Maestro','Custode degli Uccelli','Nessun Riposo','Minimalista','Supremazia dei Tipi','Squadra Cromatica','Momento d’Oro','Tripletta','Acchiappali Tutti','Cacciatore di Cromatici','Cacciatore Supremo','Prima Vetta','Doppia Vetta','Tripla Vetta','Quadrupla Vetta','Esemplare Perfetto','Scintilla Cromatica','Lampo Cromatico','Fiamma Cromatica','Tempesta Cromatica','Leggenda Cromatica','Immortale Cromatico','Viaggiatore nel Tempo','Sopravvissuto Solitario']
    },
    es: {
      champion: 'Campeón de {region}',
      survivor: 'Superviviente de {region}: {type}',
      typeMaster: 'Maestro de tipos de {region}',
      shinySquad: 'Equipo variocolor de {region}',
      purist: 'Purista de {region}',
      starterChampion: 'Campeón de tipo {type}',
      professorChallenge: 'Desafío del Profesor {name}',
      completionist: 'Experto de {region}',
      clearMap: 'Completa el mapa {map} y derrota a {boss}.',
      beatGame: 'Completa el juego',
      beatGen: 'Completa la generación {gen}',
      withStarter: 'con {pokemon} como Pokémon inicial.',
      nuzlockeStarter: 'Completa una partida Nuzlocke de generación {gen} con {pokemon} como Pokémon inicial.',
      nuzlockeClear: 'Completa una partida Nuzlocke de generación {gen}.',
      towerClear: 'Derrota a {boss} y completa la etapa {stage} de la Torre Batalla.',
      towerStarter: 'Gana una partida de la etapa {stage} comenzando con {pokemon}.',
      catchGen: 'Captura todos los Pokémon de la generación {gen} a lo largo de tus partidas.',
      noCenter: ' sin usar un Centro Pokémon.',
      allType: ' con un equipo cuyos Pokémon compartan un mismo tipo.',
      allShiny: ' con todos los Pokémon del equipo variocolor.',
      neverEvolve: ' con un equipo de Pokémon que nunca evolucionan.',
      titles: ['Romperrocas','Destructor de la Cascada','Domador del Trueno','Guardián del Arcoíris','Rompealmas','Rompementes','Vencedor del Volcán','Sacudidor de Tierra','Maestro Pokémon','Liga de Campeones','Campeón Inmortal','Uno es Suficiente','Verdadero Maestro','Guardián de Aves','Sin Descanso','Minimalista','Supremacía de Tipos','Equipo Variocolor','En Racha','Triplete','Hazte con Todos','Cazador Variocolor','Cazador Supremo','Primera Cima','Doble Cima','Triple Cima','Cuádruple Cima','Ejemplar Perfecto','Chispa Variocolor','Destello Variocolor','Llama Variocolor','Tormenta Variocolor','Leyenda Variocolor','Inmortal Variocolor','Viajero del Tiempo','Superviviente Solitario']
    },
    de: {
      champion: '{region}-Champion',
      survivor: '{region}-Überlebender: {type}',
      typeMaster: '{region}-Typenmeister',
      shinySquad: '{region}-Shiny-Team',
      purist: '{region}-Purist',
      starterChampion: '{type}-Champion',
      professorChallenge: 'Professor {name}s Herausforderung',
      completionist: '{region}-Experte',
      clearMap: 'Schließe Karte {map} ab und besiege {boss}.',
      beatGame: 'Schließe das Spiel ab',
      beatGen: 'Schließe Generation {gen} ab',
      withStarter: 'mit {pokemon} als Starter-Pokémon.',
      nuzlockeStarter: 'Schließe einen Nuzlocke-Lauf der Generation {gen} mit {pokemon} als Starter ab.',
      nuzlockeClear: 'Schließe einen Nuzlocke-Lauf der Generation {gen} ab.',
      towerClear: 'Besiege {boss} und schließe Stufe {stage} des Kampfturms ab.',
      towerStarter: 'Gewinne einen Lauf der Stufe {stage} mit {pokemon} als Starter.',
      catchGen: 'Fange alle Pokémon der Generation {gen} über beliebig viele Läufe hinweg.',
      noCenter: ' ohne ein Pokémon-Center zu benutzen.',
      allType: ' mit einem Team, dessen Pokémon alle denselben Typ teilen.',
      allShiny: ' mit einem vollständig schillernden Team.',
      neverEvolve: ' mit einem Team aus Pokémon, die sich nie entwickeln.',
      titles: ['Felsbrecher','Kaskadenbezwinger','Donnerbändiger','Regenbogenwächter','Seelenbrecher','Gedankenbrecher','Vulkanbezwinger','Erschütterer','Pokémon-Meister','Champions-Liga','Unsterblicher Champion','Einer genügt','Wahrer Meister','Vogelhüter','Keine Rast','Minimalist','Typenübermacht','Shiny-Team','Siegesserie','Hattrick','Schnapp sie dir alle','Shiny-Jäger','Ultimativer Shiny-Jäger','Erster Gipfel','Doppelgipfel','Dreifachgipfel','Vierfachgipfel','Perfektes Exemplar','Shiny-Funke','Shiny-Blitz','Shiny-Flamme','Shiny-Sturm','Shiny-Legende','Shiny-Unsterblicher','Zeitreisender','Einsamer Überlebender']
    },
    pt: {
      champion: 'Campeão de {region}',
      survivor: 'Sobrevivente de {region}: {type}',
      typeMaster: 'Mestre de tipos de {region}',
      shinySquad: 'Equipe brilhante de {region}',
      purist: 'Purista de {region}',
      starterChampion: 'Campeão de {type}',
      professorChallenge: 'Desafio do Professor {name}',
      completionist: 'Especialista de {region}',
      clearMap: 'Conclua o mapa {map} e derrote {boss}.',
      beatGame: 'Conclua o jogo',
      beatGen: 'Conclua a geração {gen}',
      withStarter: 'com {pokemon} como Pokémon inicial.',
      nuzlockeStarter: 'Conclua uma partida Nuzlocke da geração {gen} com {pokemon} como Pokémon inicial.',
      nuzlockeClear: 'Conclua uma partida Nuzlocke da geração {gen}.',
      towerClear: 'Derrote {boss} e conclua a etapa {stage} da Torre de Batalha.',
      towerStarter: 'Vença uma partida da etapa {stage} começando com {pokemon}.',
      catchGen: 'Capture todos os Pokémon da geração {gen} ao longo das suas partidas.',
      noCenter: ' sem usar um Centro Pokémon.',
      allType: ' com uma equipe cujos Pokémon compartilham o mesmo tipo.',
      allShiny: ' com todos os Pokémon da equipe brilhantes.',
      neverEvolve: ' com uma equipe de Pokémon que nunca evoluem.',
      titles: ['Quebra-Rochas','Destruidor da Cascata','Domador do Trovão','Guardião do Arco-Íris','Quebra-Almas','Quebra-Mentes','Vencedor do Vulcão','Abalador da Terra','Mestre Pokémon','Liga dos Campeões','Campeão Imortal','Um é Suficiente','Verdadeiro Mestre','Guardião de Aves','Sem Descanso','Minimalista','Supremacia de Tipos','Equipe Brilhante','Em Boa Fase','Trinca','Pegue Todos','Caçador de Brilhantes','Caçador Supremo','Primeiro Pico','Pico Duplo','Pico Triplo','Pico Quádruplo','Espécime Perfeito','Faísca Brilhante','Clarão Brilhante','Chama Brilhante','Tempestade Brilhante','Lenda Brilhante','Imortal Brilhante','Viajante do Tempo','Sobrevivente Solitário']
    }
  };

  function fillTemplate(value, values) {
    return String(value || '').replace(/\{(\w+)\}/g, function (_, key) {
      return values[key] ?? '';
    });
  }

  function localizeAchievements() {
    if (typeof ACHIEVEMENTS === 'undefined' || !Array.isArray(ACHIEVEMENTS)) return;
    ACHIEVEMENTS.forEach(function (achievement) {
      achievement.__apkName ||= achievement.name;
      achievement.__apkDesc ||= achievement.desc;
      achievement.name = achievement.__apkName;
      achievement.desc = achievement.__apkDesc;
    });
    if (currentLanguage === 'en') return;

    var locale = achievementLocales[currentLanguage];
    if (!locale) return;
    var typeNames = {
      fr: { Grass:'Plante', Fire:'Feu', Water:'Eau' },
      it: { Grass:'Erba', Fire:'Fuoco', Water:'Acqua' },
      es: { Grass:'Planta', Fire:'Fuego', Water:'Agua' },
      de: { Grass:'Pflanze', Fire:'Feuer', Water:'Wasser' },
      pt: { Grass:'Planta', Fire:'Fogo', Water:'Água' }
    }[currentLanguage];
    var customIds = [
      'gym_0','gym_1','gym_2','gym_3','gym_4','gym_5','gym_6','gym_7',
      'elite_four','elite_10','elite_100','solo_run','nuzlocke_win','three_birds',
      'no_pokecenter','no_items','type_quartet','all_shiny_win','back_to_back',
      'back_3_back','pokedex_complete','shinydex_complete','shinydex_all',
      'max_stats_1','max_stats_2','max_stats_3','max_stats_4','max_stats_all',
      'shinydex_100','shinydex_200','shinydex_300','shinydex_400',
      'shinydex_500','shinydex_600','g2_no_gen2','g2_norival'
    ];
    customIds.forEach(function (id, index) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === id; });
      if (achievement) achievement.name = locale.titles[index];
    });

    var gymBosses = ['Brock','Misty','Lt. Surge','Erika','Koga','Sabrina','Blaine','Giovanni'];
    gymBosses.forEach(function (boss, index) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === 'gym_' + index; });
      if (achievement) achievement.desc = fillTemplate(locale.clearMap, { map:index + 1, boss:boss });
    });

    var regions = { 1:'Kanto', 2:'Johto', 3:'Hoenn', 4:'Sinnoh', 5:'Unova' };
    var bosses = { 1:'Ash Ketchum', 2:'Lance', 3:'Steven Stone', 4:'Cynthia', 5:'N' };
    var professors = { 1:'Oak', 2:'Elm', 3:'Birch', 4:'Rowan', 5:'Juniper' };
    var starters = {
      1:'Bulbasaur / Charmander / Squirtle',
      2:'Chikorita / Cyndaquil / Totodile',
      3:'Treecko / Torchic / Mudkip',
      4:'Turtwig / Chimchar / Piplup',
      5:'Snivy / Tepig / Oshawott'
    };
    for (var stage = 1; stage <= 5; stage++) {
      var tower = ACHIEVEMENTS.find(function (item) { return item.id === 'endless_stage_' + stage; });
      if (tower) {
        tower.name = fillTemplate(locale.champion, { region:regions[stage] });
        tower.desc = fillTemplate(locale.towerClear, { boss:bosses[stage], stage:stage });
      }
      var challenge = ACHIEVEMENTS.find(function (item) { return item.id === 'starters_stage_' + stage; });
      if (challenge) {
        challenge.name = fillTemplate(locale.professorChallenge, { name:professors[stage] });
        challenge.desc = fillTemplate(locale.towerStarter, { stage:stage, pokemon:starters[stage] });
      }
    }

    [2,3,4,5].forEach(function (gen) {
      var dex = ACHIEVEMENTS.find(function (item) { return item.id === 'pokedex_gen' + gen; });
      if (dex) {
        dex.name = fillTemplate(locale.completionist, { region:regions[gen] });
        dex.desc = fillTemplate(locale.catchGen, { gen:gen });
      }
    });

    var structured = [
      ['g1_nuz_grass',1,'Bulbasaur','Grass'], ['g1_nuz_fire',1,'Charmander','Fire'],
      ['g1_nuz_water',1,'Squirtle','Water'], ['g2_nuz_grass',2,'Chikorita','Grass'],
      ['g2_nuz_fire',2,'Cyndaquil','Fire'], ['g2_nuz_water',2,'Totodile','Water']
    ];
    structured.forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (!achievement) return;
      achievement.name = fillTemplate(locale.survivor, {
        region:regions[entry[1]], type:typeNames[entry[3]]
      });
      achievement.desc = fillTemplate(locale.nuzlockeStarter, {
        gen:entry[1], pokemon:entry[2]
      });
    });

    [['starter_1','Bulbasaur','Grass'],['starter_4','Charmander','Fire'],
     ['starter_7','Squirtle','Water'],['g2_grass','Chikorita','Grass'],
     ['g2_fire','Cyndaquil','Fire'],['g2_water','Totodile','Water']].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (!achievement) return;
      achievement.name = (entry[0].startsWith('g2_') ? 'Johto ' : '') +
        fillTemplate(locale.starterChampion, { type:typeNames[entry[2]] });
      achievement.desc = locale.beatGen.replace('{gen}', entry[0].startsWith('g2_') ? '2' : '1') +
        ' ' + fillTemplate(locale.withStarter, { pokemon:entry[1] });
    });

    [['g1_nuz_clear',1],['g2_nuz_clear',2]].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (achievement) achievement.desc = fillTemplate(locale.nuzlockeClear, { gen:entry[1] });
    });
    [['g1_monotype',1],['g2_monotype',2]].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (achievement) {
        achievement.name = fillTemplate(locale.typeMaster, { region:regions[entry[1]] });
        achievement.desc = fillTemplate(locale.beatGen, { gen:entry[1] }) + locale.allType;
      }
    });
    [['g1_shiny_squad',1],['g2_shiny_squad',2]].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (achievement) {
        achievement.name = fillTemplate(locale.shinySquad, { region:regions[entry[1]] });
        achievement.desc = fillTemplate(locale.beatGen, { gen:entry[1] }) + locale.allShiny;
      }
    });
    [['g1_single_stage',1],['g2_single_stage',2]].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (achievement) {
        achievement.name = fillTemplate(locale.purist, { region:regions[entry[1]] });
        achievement.desc = fillTemplate(locale.beatGen, { gen:entry[1] }) + locale.neverEvolve;
      }
    });
    [['g1_nuz_nocenter',1],['g2_nocenter',2]].forEach(function (entry) {
      var achievement = ACHIEVEMENTS.find(function (item) { return item.id === entry[0]; });
      if (achievement) achievement.desc = fillTemplate(locale.beatGen, { gen:entry[1] }) + locale.noCenter;
    });
  }

  function ensureLanguagePicker() {
    var existing = document.getElementById('pokelike-language-picker');
    if (existing) {
      updateLanguagePickerVisibility();
      return;
    }
    var wrapper = document.createElement('label');
    wrapper.id = 'pokelike-language-picker';
    wrapper.setAttribute('aria-label', 'Language');
    wrapper.innerHTML =
      '<span aria-hidden="true">🌐</span>' +
      '<select id="pokelike-language-select">' +
      Object.keys(languageNames).map(function (code) {
        return '<option value="' + code + '">' + languageNames[code] + '</option>';
      }).join('') +
      '</select>';
    document.body.appendChild(wrapper);
    var select = wrapper.querySelector('select');
    select.value = currentLanguage;
    select.addEventListener('change', function () {
      setLanguage(select.value);
    });
    updateLanguagePickerVisibility();
  }

  function updateLanguagePickerVisibility() {
    var picker = document.getElementById('pokelike-language-picker');
    if (!picker) return;
    var titleScreen = document.getElementById('title-screen');
    picker.hidden = !titleScreen?.classList.contains('active');
  }

  function replaceTelegramWithDiscord() {
    document.querySelectorAll('.telegram-link, a[href*="t.me/pokemin1"]').forEach(
      function (link) {
        if (link.dataset.discordReady === '1') return;
        link.dataset.discordReady = '1';
        link.href = 'https://discord.gg/YsakfWStYq';
        link.classList.add('pokelike-discord-link');
        link.innerHTML =
          '<img src="https://cdn.simpleicons.org/discord/ffffff" alt="" ' +
          'width="20" height="20" class="pokelike-discord-icon">' +
          '<span>Join Discord</span>';
      }
    );
  }

  function removeWelcome() {
    try {
      localStorage.setItem('min_project_welcome_seen', '1');
    } catch (error) {}
    var modal = document.getElementById('min-welcome-modal');
    if (!modal) return;
    var checkbox = modal.querySelector('#min-welcome-check');
    var continueButton = modal.querySelector('#min-welcome-continue');
    if (checkbox && continueButton) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      continueButton.click();
    }
    modal.remove();
  }

  function applyBranding() {
    document.title = 'PokeLike';
    var logo = document.querySelector('#title-screen .game-logo');
    if (logo && logo.textContent !== 'POKELIKE') logo.textContent = 'POKELIKE';
    var version = document.querySelector('.title-patch-version');
    if (version && version.textContent !== 'v1.6') version.textContent = 'v1.6';
    document.querySelectorAll('.title-patch-link span').forEach(function (span) {
      if (span.textContent.trim().toUpperCase() === 'MIN') span.remove();
    });
  }

  function removeInstallPrompts() {
    document.querySelectorAll('[data-pwa-install-button]').forEach(function (el) {
      var row = el.closest('.settings-action-row');
      el.remove();
      if (row && !row.children.length) {
        var title = row.previousElementSibling;
        row.remove();
        if (title && title.classList.contains('settings-section-title')) title.remove();
      }
    });
  }

  function removePrivacyLinks() {
    document.querySelectorAll(
      'a[href*="privacy" i], [aria-label*="privacy" i], [title*="privacy" i], iframe[src*="privacy" i], iframe[title*="privacy" i]'
    ).forEach(function (el) {
      if (el.id === 'pokelike-privacy-link') return;
      el.remove();
    });
    document.querySelectorAll('a, button, span, p, div').forEach(function (el) {
      if (el.id === 'pokelike-privacy-link' || el.closest('#pokelike-privacy-link')) return;
      if (el.children.length) return;
      var text = el.textContent.trim().toLowerCase();
      if (
        text === 'privacy policy' ||
        text === 'privacy' ||
        text === 'informativa privacy' ||
        text === 'politique de confidentialité' ||
        text === 'política de privacidad' ||
        text === 'datenschutzerklärung' ||
        text === 'política de privacidade'
      ) {
        el.remove();
      }
    });
  }

  function ensurePrivacyPolicy() {
    if (document.getElementById('pokelike-privacy-link')) return;
    var titleScreen = document.getElementById('title-screen');
    var disclaimer = titleScreen?.querySelector(
      'div[style*="max-width:340px"], div[style*="max-width: 340px"]'
    );
    if (!titleScreen || !disclaimer) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'pokelike-privacy-row';
    wrapper.innerHTML =
      '<a id="pokelike-privacy-link" href="https://pokelike.xyz/privacy.html" ' +
      'target="_blank" rel="noopener">Privacy Policy</a>';
    disclaimer.parentNode.insertBefore(wrapper, disclaimer);
  }

  function disablePlaytimeTelemetry() {
    try {
      localStorage.removeItem('poke_playtime_ms');
      localStorage.removeItem('poke_firestore_stats_dirty');
      localStorage.setItem(
        'poke_firestore_stats_last_write',
        String(Number.MAX_SAFE_INTEGER)
      );
    } catch (error) {}

    try {
      if (
        typeof window.queuePlayerStatsToFirestore === 'function' &&
        !window.queuePlayerStatsToFirestore.__pokelikeDisabled
      ) {
        var disabledQueue = function () {};
        disabledQueue.__pokelikeDisabled = true;
        window.queuePlayerStatsToFirestore = disabledQueue;
      }
    } catch (error) {}
  }

  function removeUnsupportedAchievements() {
    var blocked = new Set([
      'endless_stage_6', 'endless_stage_7', 'endless_stage_8', 'endless_stage_9',
      'starters_stage_6', 'starters_stage_7', 'starters_stage_8', 'starters_stage_9',
      'pokedex_gen6', 'pokedex_gen7', 'pokedex_gen8', 'pokedex_gen9'
    ]);

    try {
      if (typeof ACHIEVEMENTS !== 'undefined' && Array.isArray(ACHIEVEMENTS)) {
        for (var index = ACHIEVEMENTS.length - 1; index >= 0; index--) {
          if (blocked.has(ACHIEVEMENTS[index]?.id)) ACHIEVEMENTS.splice(index, 1);
        }
      }
    } catch (error) {}

    try {
      var unlocked = JSON.parse(localStorage.getItem('poke_achievements') || '[]');
      if (Array.isArray(unlocked)) {
        localStorage.setItem(
          'poke_achievements',
          JSON.stringify(unlocked.filter(function (id) { return !blocked.has(id); }))
        );
      }
    } catch (error) {}
  }

  function removePokeKeyPresentation() {
    try {
      if (typeof _showPokeKeyModal === 'function' && !_showPokeKeyModal.__apkHidden) {
        _showPokeKeyModal = function () {};
        _showPokeKeyModal.__apkHidden = true;
      }
      if (
        typeof _alertSavedPokeKeyForServerDown === 'function' &&
        !_alertSavedPokeKeyForServerDown.__apkHidden
      ) {
        _alertSavedPokeKeyForServerDown = function () {};
        _alertSavedPokeKeyForServerDown.__apkHidden = true;
      }
    } catch (error) {}

    document.getElementById('poke-key-modal')?.remove();
    document.getElementById('account-poke-key-btn')?.remove();

    var authPassword = document.getElementById('auth-password');
    if (authPassword && authPassword.placeholder !== 'Password') {
      authPassword.placeholder = 'Password';
    }

    document.querySelectorAll(
      '#settings-poke-key-reveal, #settings-poke-key-btn'
    ).forEach(function (element) {
      var row = element.closest('.settings-action-row');
      element.remove();
      if (row && !row.children.length) {
        var title = row.previousElementSibling;
        row.remove();
        if (
          title &&
          title.classList.contains('settings-section-title') &&
          title.textContent.trim() === 'Account'
        ) {
          title.remove();
        }
      }
    });

    document.querySelectorAll(
      '#save-auth-modal div, #auth-error, #settings-modal span, #settings-modal button'
    ).forEach(function (element) {
      if (element.children.length) return;
      var text = element.textContent || '';
      if (/puoi usare la tua poke_key|you can use your poke_key/i.test(text)) {
        element.remove();
      } else if (/poke_key/i.test(text)) {
        element.textContent = text
          .replace(/Password\s*\/\s*Poke_key\s*\/\s*Cloud password/gi, 'Password')
          .replace(/Puoi provare con la tua Poke_key\.?/gi, '')
          .replace(/Poke_key/gi, 'password');
      }
    });
  }

  function installPokeKeyAlertFilter() {
    if (window.__pokelikeOriginalAlert) return;
    window.__pokelikeOriginalAlert = window.alert.bind(window);
    window.alert = function (message) {
      if (/poke[\s_-]*key/i.test(String(message || ''))) return;
      return window.__pokelikeOriginalAlert(message);
    };
  }

  function renderPatchNotes() {
    var modal = document.getElementById('patch-notes-modal');
    if (!modal || !modal.firstElementChild) return;
    var content = modal.firstElementChild.lastElementChild;
    if (!content) return;

    content.querySelector('#pokelike-apk-patches')?.remove();

    var reachedVersion16 = false;
    Array.prototype.slice.call(content.children).forEach(function (child) {
      var text = child.textContent;
      if (text.indexOf('v1.6') !== -1) reachedVersion16 = true;
      if (!reachedVersion16 || text.trim() === 'Legacy Patch Notes') {
        child.remove();
      }
    });
  }

  function removeUnsupportedGenerationUi() {
    var gen3Button = document.querySelector('#gen-toggle .gen-btn[data-gen="3"]');
    if (gen3Button) {
      if (
        gen3Button.classList.contains('gen-btn--active') ||
        localStorage.getItem('poke_selected_gen') === '3'
      ) {
        localStorage.setItem('poke_selected_gen', '1');
        document.querySelector('#gen-toggle .gen-btn[data-gen="1"]')?.click();
      }
      gen3Button.remove();
    }
    document.getElementById('gen3-coming-soon-modal')?.remove();

    var stageList = document.getElementById('stage-select-list');
    if (stageList) {
      Array.prototype.slice.call(stageList.children, 5).forEach(function (child) {
        child.remove();
      });
    }

    document.querySelectorAll(
      '#stage-select-list button, #endless-region-panel *, .region-stage-row'
    ).forEach(function (element) {
      if (/\b(Kalos|Alola|Galar|Paldea|Gen\s*[6-9])\b/i.test(element.textContent || '')) {
        element.remove();
      }
    });

    try {
      var endless = JSON.parse(localStorage.getItem('poke_endless_state') || 'null');
      if (Number(endless?.stageNumber || 0) > 5) {
        var continueButton = document.getElementById('btn-continue-endless');
        if (continueButton) continueButton.style.display = 'none';
      }
    } catch (error) {}
  }

  function installGenerationGuards() {
    try {
      if (
        typeof openPokedexModal === 'function' &&
        !openPokedexModal.__pokelike649
      ) {
        var pokedexSource = openPokedexModal.toString().replace(
          'const DEX_MAX_ID = 1025;',
          'const DEX_MAX_ID = 649;'
        );
        var fastPokedex = eval('(' + pokedexSource + ')');
        openPokedexModal = function (initialTab) {
          var warmed = document.querySelector(
            '#pokedex-modal[data-pokelike-warmed="1"]'
          );
          if (warmed) {
            warmed.removeAttribute('data-pokelike-warmed');
            warmed.style.removeProperty('visibility');
            warmed.style.removeProperty('pointer-events');
            warmed.style.removeProperty('z-index');
            return Promise.resolve();
          }
          return fastPokedex(initialTab);
        };
        openPokedexModal.__pokelike649 = true;
        openPokedexModal.__pokelikeOriginal = fastPokedex;
      }

      if (
        typeof getCatchChoices === 'function' &&
        !getCatchChoices.__pokelike649
      ) {
        var originalGetCatchChoices = getCatchChoices;
        getCatchChoices = async function () {
          var args = Array.prototype.slice.call(arguments);
          args[2] = Math.min(Number(args[2] || 649), 649);
          var result = await originalGetCatchChoices.apply(this, args);
          return Array.isArray(result)
            ? result.filter(function (species) {
                return Number(species?.id ?? species?.speciesId ?? 0) <= 649;
              })
            : result;
        };
        getCatchChoices.__pokelike649 = true;
      }

      if (
        typeof getStageGenRange === 'function' &&
        !getStageGenRange.__pokelike649
      ) {
        var originalGetStageGenRange = getStageGenRange;
        getStageGenRange = function (stage) {
          if (Number(stage) > 5) return { minGenId: 494, maxGenId: 649 };
          var range = originalGetStageGenRange(stage);
          return {
            minGenId: Math.min(Number(range.minGenId || 1), 649),
            maxGenId: Math.min(Number(range.maxGenId || 649), 649)
          };
        };
        getStageGenRange.__pokelike649 = true;
      }

      if (
        typeof getEndlessMaxGenId === 'function' &&
        !getEndlessMaxGenId.__pokelike649
      ) {
        var originalGetEndlessMaxGenId = getEndlessMaxGenId;
        getEndlessMaxGenId = function (stage) {
          return Math.min(originalGetEndlessMaxGenId(stage), 649);
        };
        getEndlessMaxGenId.__pokelike649 = true;
      }

      if (
        typeof startEndlessRun === 'function' &&
        !startEndlessRun.__pokelike649
      ) {
        var originalStartEndlessRun = startEndlessRun;
        startEndlessRun = function (stage) {
          if (Number(stage || 1) > 5) return;
          return originalStartEndlessRun.apply(this, arguments);
        };
        startEndlessRun.__pokelike649 = true;
      }

      if (
        typeof continueEndlessRun === 'function' &&
        !continueEndlessRun.__pokelike649
      ) {
        var originalContinueEndlessRun = continueEndlessRun;
        continueEndlessRun = function () {
          try {
            var saved = JSON.parse(localStorage.getItem('poke_endless_state') || 'null');
            if (Number(saved?.stageNumber || 0) > 5) return;
          } catch (error) {}
          return originalContinueEndlessRun.apply(this, arguments);
        };
        continueEndlessRun.__pokelike649 = true;
      }

      if (typeof loadRun === 'function' && !loadRun.__pokelike649) {
        var originalLoadRun = loadRun;
        loadRun = function () {
          var loaded = originalLoadRun.apply(this, arguments);
          if (loaded && typeof state !== 'undefined' && Array.isArray(state.team)) {
            state.team = state.team.filter(function (pokemon) {
              return Number(pokemon?.speciesId ?? pokemon?.id ?? 0) <= 649;
            });
            if (state.isEndlessMode && Number(endlessState?.stageNumber || 0) > 5) {
              return false;
            }
          }
          return loaded;
        };
        loadRun.__pokelike649 = true;
      }
    } catch (error) {}
  }

  function warmPokedexModal() {
    if (pokedexWarmupPending || document.getElementById('pokedex-modal')) return;
    if (typeof isPlayerLoggedIn === 'function' && !isPlayerLoggedIn()) return;
    if (
      typeof openPokedexModal !== 'function' ||
      typeof openPokedexModal.__pokelikeOriginal !== 'function'
    ) {
      return;
    }

    pokedexWarmupPending = true;
    Promise.resolve(openPokedexModal.__pokelikeOriginal('normal'))
      .then(function () {
        var modal = document.getElementById('pokedex-modal');
        if (!modal) return;
        modal.dataset.pokelikeWarmed = '1';
        modal.style.visibility = 'hidden';
        modal.style.pointerEvents = 'none';
        modal.style.zIndex = '-1';
      })
      .catch(function () {})
      .finally(function () {
        pokedexWarmupPending = false;
      });
  }

  function preparePokedexSkeletons() {
    var modal = document.getElementById('pokedex-modal');
    if (!modal) return;
    modal.querySelectorAll('.dex-sprite').forEach(function (image) {
      if (image.dataset.pokelikeSkeleton === '1') return;
      image.dataset.pokelikeSkeleton = '1';
      image.classList.add('pokelike-dex-loading');
      function reveal() {
        image.classList.remove('pokelike-dex-loading');
        image.classList.add('pokelike-dex-loaded');
      }
      if (image.complete && image.naturalWidth > 0) reveal();
      else {
        image.addEventListener('load', reveal, { once:true });
        image.addEventListener('error', reveal, { once:true });
      }
    });
  }

  var runBackupTimer = 0;
  var lastRunBackupPayload = '';
  var runRestoreUuid = '';

  function scheduleRunBackup(force) {
    if (runBackupTimer && !force) return;
    clearTimeout(runBackupTimer);
    runBackupTimer = setTimeout(function () {
      runBackupTimer = 0;
      var uuid = localStorage.getItem('poke_save_uuid');
      var currentRun = localStorage.getItem('poke_current_run');
      var backupApi = window.pokeFirestoreRunBackup;
      if (!uuid || !currentRun || typeof backupApi?.save !== 'function') return;
      var endlessState = localStorage.getItem('poke_endless_state');
      var payload = currentRun + '\n' + (endlessState || '');
      if (!force && payload === lastRunBackupPayload) return;
      lastRunBackupPayload = payload;
      backupApi.save(uuid, currentRun, endlessState).catch(function (error) {
        console.warn('Run backup failed:', error);
      });
    }, force ? 0 : 12000);
  }

  function refreshContinueRunButtons() {
    var currentRun = localStorage.getItem('poke_current_run');
    var endless = localStorage.getItem('poke_endless_state');
    var normalButton = document.getElementById('btn-continue-run');
    var endlessButton = document.getElementById('btn-continue-endless');

    if (normalButton) {
      normalButton.style.display = currentRun && !endless ? '' : 'none';
      if (currentRun && !endless) {
        normalButton.onclick = async function () {
          if (typeof requireLoginToPlay === 'function' && !requireLoginToPlay()) return;
          if (typeof loadRun !== 'function' || !loadRun()) return;
          if (state.currentNode && !state.currentNode.visited) {
            await onNodeClick(state.currentNode);
          } else {
            showMapScreen();
          }
        };
      }
    }
    if (endlessButton) {
      endlessButton.style.display = currentRun && endless ? '' : 'none';
      if (currentRun && endless) {
        endlessButton.onclick = function () {
          if (typeof requireLoginToPlay === 'function' && !requireLoginToPlay()) return;
          continueEndlessRun();
        };
      }
    }
  }

  async function restoreRunBackupIfNeeded() {
    var uuid = localStorage.getItem('poke_save_uuid');
    var backupApi = window.pokeFirestoreRunBackup;
    if (!uuid || uuid === runRestoreUuid || localStorage.getItem('poke_current_run')) {
      refreshContinueRunButtons();
      return;
    }
    if (typeof backupApi?.load !== 'function') return;

    runRestoreUuid = uuid;
    try {
      var backup = await backupApi.load(uuid);
      if (!backup?.currentRun || localStorage.getItem('poke_current_run')) return;
      JSON.parse(backup.currentRun);
      localStorage.setItem('poke_current_run', backup.currentRun);
      if (backup.endlessState) {
        JSON.parse(backup.endlessState);
        localStorage.setItem('poke_endless_state', backup.endlessState);
      }
      refreshContinueRunButtons();
    } catch (error) {
      console.warn('Run restore failed:', error);
      runRestoreUuid = '';
    }
  }

  function installRunBackup() {
    try {
      if (typeof saveRun === 'function' && !saveRun.__pokelikeBackup) {
        var originalSaveRun = saveRun;
        saveRun = function () {
          var result = originalSaveRun.apply(this, arguments);
          scheduleRunBackup(false);
          return result;
        };
        saveRun.__pokelikeBackup = true;
      }
      if (typeof clearSavedRun === 'function' && !clearSavedRun.__pokelikeBackup) {
        var originalClearSavedRun = clearSavedRun;
        clearSavedRun = function () {
          var uuid = localStorage.getItem('poke_save_uuid');
          var result = originalClearSavedRun.apply(this, arguments);
          localStorage.removeItem('poke_endless_state');
          lastRunBackupPayload = '';
          if (uuid && typeof window.pokeFirestoreRunBackup?.clear === 'function') {
            window.pokeFirestoreRunBackup.clear(uuid).catch(function () {});
          }
          refreshContinueRunButtons();
          return result;
        };
        clearSavedRun.__pokelikeBackup = true;
      }
    } catch (error) {}
    restoreRunBackupIfNeeded();
  }

  function repairMapUi() {
    var mapScreen = document.getElementById('map-screen');
    if (!mapScreen?.classList.contains('active')) return;
    try {
      if (typeof state === 'undefined' || !state?.map) return;
      var teamBar = document.getElementById('team-bar');
      if (teamBar && !teamBar.children.length && typeof renderTeamBar === 'function') {
        renderTeamBar(state.team || []);
      }
      if (typeof renderItemBadges === 'function') renderItemBadges(state.items || []);

      var mapContainer = document.getElementById('map-container');
      if (
        mapContainer &&
        !mapContainer.querySelector('svg') &&
        typeof renderMap === 'function'
      ) {
        var handler = state.isEndlessMode &&
          typeof onEndlessNodeClick === 'function' ? onEndlessNodeClick : onNodeClick;
        renderMap(state.map, mapContainer, handler);
      }
      if (state.isEndlessMode) {
        if (typeof renderEndlessTraitPanel === 'function') renderEndlessTraitPanel(state.team || []);
        if (
          typeof endlessState !== 'undefined' &&
          endlessState?.currentRegion &&
          typeof renderEndlessRegionPanel === 'function'
        ) {
          renderEndlessRegionPanel(
            endlessState.currentRegion,
            endlessState.mapIndexInRegion || 0
          );
        }
      }
    } catch (error) {
      console.warn('Map UI repair failed:', error);
    }
  }

  function scheduleMapUiRepair() {
    [0, 120, 450].forEach(function (delay) {
      setTimeout(repairMapUi, delay);
    });
  }

  function installMapUiWatchdog() {
    try {
      if (typeof showMapScreen === 'function' && !showMapScreen.__pokelikeRepair) {
        var originalShowMapScreen = showMapScreen;
        showMapScreen = function () {
          var result = originalShowMapScreen.apply(this, arguments);
          scheduleMapUiRepair();
          return result;
        };
        showMapScreen.__pokelikeRepair = true;
      }
      if (
        typeof showEndlessMapScreen === 'function' &&
        !showEndlessMapScreen.__pokelikeRepair
      ) {
        var originalShowEndlessMapScreen = showEndlessMapScreen;
        showEndlessMapScreen = function () {
          var result = originalShowEndlessMapScreen.apply(this, arguments);
          scheduleMapUiRepair();
          return result;
        };
        showEndlessMapScreen.__pokelikeRepair = true;
      }
    } catch (error) {}
  }

  function capPokedexAt649() {
    var modal = document.getElementById('pokedex-modal');
    if (!modal) return;

    modal.querySelectorAll('.dex-card').forEach(function (card) {
      var id = Number(
        card.querySelector('.dex-num')?.textContent.replace(/\D/g, '') || 0
      );
      if (id > 649) card.remove();
    });

    modal.querySelectorAll('.dex-gen-header').forEach(function (header) {
      if (/Generation\s+(VI|VII|VIII|IX)/i.test(header.textContent || '')) {
        header.remove();
      }
    });

    var shiny = !!modal.querySelector('.shiny-dex-box');
    var dex = shiny && typeof getShinyDex === 'function'
      ? getShinyDex()
      : typeof getPokedex === 'function'
      ? getPokedex()
      : {};
    var caught = 0;
    for (var id = 1; id <= 649; id++) {
      var value = dex?.[id];
      if (shiny ? !!value : (
        typeof _isDexCaught === 'function' ? _isDexCaught(value) : !!value
      )) {
        caught++;
      }
    }
    var percentage = Math.floor(caught / 649 * 100);
    var countLabel = document.getElementById('dex-count-label');
    var countText = caught + ' / 649';
    if (countLabel && countLabel.textContent !== countText) {
      countLabel.textContent = countText;
    }
    var allBar = document.getElementById('dex-progress-bar-all');
    if (allBar && allBar.style.width !== percentage + '%') {
      allBar.style.width = percentage + '%';
    }
    var allLabel = document.getElementById('dex-progress-label-all');
    var progressText = translateValue('All Gens') + ' — ' + percentage + '%';
    if (allLabel && allLabel.textContent !== progressText) {
      allLabel.textContent = progressText;
    }
  }

  function recordNetworkLog(type, method, url, status, duration, error) {
    if (!/https?:\/\/(?:[^/]+\.)?pokelike\.xyz(?:\/|$)/i.test(String(url || ''))) {
      return;
    }
    try {
      if (window.PokeLikeDebug?.addClientLog) {
        window.PokeLikeDebug.addClientLog(
          String(type || ''),
          String(method || ''),
          String(url || ''),
          String(status ?? ''),
          String(duration ?? ''),
          String(error || '')
        );
      }
    } catch (ignored) {}
  }

  function installNetworkMonitor() {
    if (window.__pokelikeNetworkMonitorInstalled) return;
    window.__pokelikeNetworkMonitorInstalled = true;

    if (typeof window.fetch === 'function') {
      var originalFetch = window.fetch.bind(window);
      window.fetch = async function (input, options) {
        var method = String(options?.method || 'GET').toUpperCase();
        var url = typeof input === 'string' ? input : input?.url || String(input);
        var started = performance.now();
        try {
          var response = await originalFetch(input, options);
          recordNetworkLog(
            'FETCH',
            method,
            url,
            response.status,
            Math.round(performance.now() - started),
            ''
          );
          return response;
        } catch (error) {
          recordNetworkLog(
            'FETCH',
            method,
            url,
            '',
            Math.round(performance.now() - started),
            error?.message || String(error)
          );
          throw error;
        }
      };
    }

    if (window.XMLHttpRequest) {
      var originalOpen = XMLHttpRequest.prototype.open;
      var originalSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (method, url) {
        this.__pokelikeDebugMethod = String(method || 'GET').toUpperCase();
        this.__pokelikeDebugUrl = String(url || '');
        return originalOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function () {
        var xhr = this;
        var started = performance.now();
        xhr.addEventListener('loadend', function () {
          recordNetworkLog(
            'XHR',
            xhr.__pokelikeDebugMethod || 'GET',
            xhr.__pokelikeDebugUrl || '',
            xhr.status || '',
            Math.round(performance.now() - started),
            xhr.status === 0 ? 'Network error or request cancelled' : ''
          );
        }, { once: true });
        return originalSend.apply(this, arguments);
      };
    }
  }

  function getNetworkLogs() {
    try {
      return JSON.parse(window.PokeLikeDebug?.getLogs?.() || '[]').filter(
        function (entry) {
          return /https?:\/\/(?:[^/]+\.)?pokelike\.xyz(?:\/|$)/i.test(
            String(entry?.url || '')
          );
        }
      );
    } catch (error) {
      return [];
    }
  }

  function renderNetworkLogs() {
    var list = document.getElementById('pokelike-debug-list');
    if (!list) return;
    var logs = getNetworkLogs().slice().reverse();
    if (!logs.length) {
      list.textContent = 'No API, fetch or XHR calls recorded yet.';
      return;
    }
    list.innerHTML = '';
    logs.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'pokelike-debug-entry';

      var summary = document.createElement('div');
      summary.className = 'pokelike-debug-summary';
      var time = new Date(Number(entry.time || Date.now())).toLocaleTimeString();
      summary.textContent = [
        time,
        entry.type || 'NETWORK',
        entry.method || 'GET',
        entry.status || '…',
        entry.duration ? entry.duration + ' ms' : ''
      ].filter(Boolean).join(' · ');

      var url = document.createElement('div');
      url.className = 'pokelike-debug-url';
      url.textContent = entry.url || '';

      row.appendChild(summary);
      row.appendChild(url);
      if (entry.error) {
        var error = document.createElement('div');
        error.className = 'pokelike-debug-error';
        error.textContent = entry.error;
        row.appendChild(error);
      }
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.addEventListener('click', function () {
        openNetworkEntryDetail(entry);
      });
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openNetworkEntryDetail(entry);
        }
      });
      list.appendChild(row);
    });
  }

  function openNetworkEntryDetail(entry) {
    document.getElementById('pokelike-debug-detail')?.remove();
    var detail = document.createElement('div');
    detail.id = 'pokelike-debug-detail';
    detail.innerHTML =
      '<div class="pokelike-debug-detail-box">' +
        '<div class="pokelike-debug-header">' +
          '<span>Request details</span>' +
          '<button class="ach-modal-close" type="button">✕</button>' +
        '</div>' +
        '<div class="pokelike-debug-detail-body"></div>' +
      '</div>';
    var body = detail.querySelector('.pokelike-debug-detail-body');
    [
      ['Date', new Date(Number(entry.time || Date.now())).toLocaleString()],
      ['Type', entry.type || 'NETWORK'],
      ['Method', entry.method || 'GET'],
      ['Status', entry.status || 'Pending / not available'],
      ['Duration', entry.duration ? entry.duration + ' ms' : 'Not available'],
      ['URL', entry.url || ''],
      ['Error', entry.error || 'None']
    ].forEach(function (field) {
      var row = document.createElement('div');
      row.className = 'pokelike-debug-detail-row';
      var label = document.createElement('strong');
      label.textContent = field[0];
      var value = document.createElement('span');
      value.textContent = field[1];
      row.appendChild(label);
      row.appendChild(value);
      body.appendChild(row);
    });
    function close() { detail.remove(); }
    detail.querySelector('button').onclick = close;
    detail.addEventListener('click', function (event) {
      if (event.target === detail) close();
    });
    document.body.appendChild(detail);
  }

  function openNetworkDebugModal() {
    document.getElementById('pokelike-debug-modal')?.remove();
    var modal = document.createElement('div');
    modal.id = 'pokelike-debug-modal';
    modal.innerHTML =
      '<div class="pokelike-debug-box">' +
        '<div class="pokelike-debug-header">' +
          '<span>API / Network Debug</span>' +
          '<button id="pokelike-debug-close" class="ach-modal-close">✕</button>' +
        '</div>' +
        '<div class="pokelike-debug-actions">' +
          '<button id="pokelike-debug-refresh" class="btn-secondary">Refresh</button>' +
          '<button id="pokelike-debug-clear" class="btn-secondary">Clear</button>' +
        '</div>' +
        '<div id="pokelike-debug-list"></div>' +
      '</div>';
    document.body.appendChild(modal);
    renderNetworkLogs();

    var timer = setInterval(renderNetworkLogs, 800);
    function close() {
      clearInterval(timer);
      modal.remove();
    }
    modal.querySelector('#pokelike-debug-close').onclick = close;
    modal.querySelector('#pokelike-debug-refresh').onclick = renderNetworkLogs;
    modal.querySelector('#pokelike-debug-clear').onclick = function () {
      try { window.PokeLikeDebug?.clearLogs?.(); } catch (error) {}
      renderNetworkLogs();
    };
    modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });
  }

  function addDebugButtonToSettings() {
    var modal = document.getElementById('settings-modal');
    var box = modal?.querySelector('.settings-modal-box');
    if (!box || document.getElementById('settings-network-debug-btn')) return;

    var title = document.createElement('div');
    title.className = 'settings-section-title pokelike-debug-settings';
    title.textContent = 'Debug';

    var row = document.createElement('div');
    row.className = 'settings-action-row pokelike-debug-settings';
    row.innerHTML =
      '<button type="button" id="settings-network-debug-btn" ' +
      'class="btn-secondary" style="width:100%;">API / Network Debug</button>';
    box.appendChild(title);
    box.appendChild(row);
    row.querySelector('button').onclick = openNetworkDebugModal;
  }

  function removeDebugSettingsAccess() {
    document.querySelectorAll('.pokelike-debug-settings').forEach(function (element) {
      element.remove();
    });
  }

  function installNfcDebugAccess() {
    if (window.handlePokeLikeNfcTag?.__pokelikeInstalled) return;
    var handler = async function (tagValue) {
      try {
        var verifier = window.pokeFirestoreDebugAccess?.verifyTag;
        if (typeof verifier !== 'function') return;
        if (await verifier(tagValue)) openNetworkDebugModal();
      } catch (error) {
        console.warn('NFC debug verification failed:', error);
      }
    };
    handler.__pokelikeInstalled = true;
    window.handlePokeLikeNfcTag = handler;
  }

  function ensureBackButton() {
    var button = document.getElementById('pokelike-apk-back');
    if (!button) {
      button = document.createElement('button');
      button.id = 'pokelike-apk-back';
      button.type = 'button';
      button.setAttribute('aria-label', 'Back to main menu');
      button.setAttribute('title', 'Back to main menu');
      button.textContent = '\u2190';
      button.addEventListener('click', function () {
        try {
          if (typeof saveRun === 'function') saveRun();
        } catch (error) {}
        try {
          if (typeof cleanupTransientUI === 'function') cleanupTransientUI();
          if (typeof applyDarkMode === 'function') applyDarkMode();
          if (typeof showScreen === 'function') showScreen('title-screen');
          if (typeof applyDarkMode === 'function') applyDarkMode();
        } catch (error) {
          window.location.reload();
        }
      });
      document.body.appendChild(button);
    }
    var activeScreen = document.querySelector('.screen.active');
    button.classList.toggle(
      'pokelike-apk-back-visible',
      !!activeScreen && activeScreen.id !== 'title-screen'
    );
  }

  function ensureStyles() {
    if (document.getElementById('pokelike-apk-styles')) return;
    var style = document.createElement('style');
    style.id = 'pokelike-apk-styles';
    style.textContent =
      '[data-pwa-install-button]{display:none!important}' +
      '#pokelike-language-picker{' +
        'position:fixed;top:calc(7px + env(safe-area-inset-top));right:7px;z-index:280;' +
        'display:flex;align-items:center;gap:3px;padding:2px 4px;' +
        'border:1px solid rgba(255,255,255,.72);border-radius:4px;' +
        'background:rgba(7,16,23,.9);box-shadow:2px 2px 0 rgba(0,0,0,.7);' +
        'font:8px/1 sans-serif' +
      '}' +
      '#pokelike-language-picker[hidden]{display:none!important}' +
      '#pokelike-language-select{' +
        'width:70px;border:0;outline:0;background:#132c3d;color:#fff;' +
        'font:7px/1.2 "Press Start 2P",monospace;padding:3px 2px;' +
        '-webkit-appearance:none;appearance:none;background-image:none' +
      '}' +
      '.pokelike-discord-link{' +
        'background:linear-gradient(180deg,#7289da,#5865f2)!important;' +
        'border-color:#fff!important;color:#fff!important' +
      '}' +
      '.pokelike-discord-icon{display:block;object-fit:contain}' +
      '#title-screen.active{' +
        'box-sizing:border-box;padding-top:calc(18px + env(safe-area-inset-top));' +
        'padding-bottom:calc(8px + env(safe-area-inset-bottom));zoom:.96' +
      '}' +
      '#title-screen .btn-primary{' +
        'box-sizing:border-box;width:220px;height:42px;padding:8px 12px;' +
        'display:inline-flex;align-items:center;justify-content:center;' +
        'white-space:nowrap;font-size:10px;line-height:1.2' +
      '}' +
      '#title-screen .btn-secondary{' +
        'box-sizing:border-box;height:38px;padding:8px 13px;white-space:nowrap;' +
        'font-size:12px;line-height:1.15' +
      '}' +
      '#pokelike-privacy-row{margin-top:5px;text-align:center}' +
      '#pokelike-privacy-link{' +
        'color:#252525;font:4px/1.45 "Press Start 2P",monospace;' +
        'text-decoration:none;opacity:.9;text-shadow:0 1px rgba(255,255,255,.72)' +
      '}' +
      '#title-screen>div[style*="max-width:340px"],' +
      '#title-screen>div[style*="max-width: 340px"]{' +
        'color:#292929!important;opacity:.88!important;text-shadow:0 1px rgba(255,255,255,.78)' +
      '}' +
      'body.dark-mode #pokelike-privacy-link{' +
        'color:#ececec;opacity:.84;text-shadow:0 1px #000' +
      '}' +
      'body.dark-mode #title-screen>div[style*="max-width:340px"],' +
      'body.dark-mode #title-screen>div[style*="max-width: 340px"]{' +
        'color:#ededed!important;opacity:.78!important;text-shadow:0 1px #000' +
      '}' +
      '#pokelike-apk-back{' +
        'position:fixed;left:10px;bottom:calc(12px + env(safe-area-inset-bottom));' +
        'z-index:250;width:36px;height:36px;padding:0;display:none;' +
        'align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.72);' +
        'border-radius:6px;background:rgba(7,16,23,.84);color:#fff;' +
        'font:700 22px/1 sans-serif;box-shadow:2px 2px 0 rgba(0,0,0,.72);' +
        '-webkit-tap-highlight-color:transparent' +
      '}' +
      '#pokelike-apk-back.pokelike-apk-back-visible{display:flex}' +
      '#pokelike-apk-back:active{transform:translate(1px,1px);box-shadow:1px 1px 0 rgba(0,0,0,.72)}' +
      '.pokelike-apk-patch{' +
        'margin-bottom:18px;padding:12px;border:2px solid #72d6ff;border-radius:8px;' +
        'background:rgba(8,22,32,.9);box-shadow:3px 3px 0 #000' +
      '}' +
      '.pokelike-apk-patch-header{' +
        'display:flex;align-items:baseline;gap:10px;margin-bottom:10px;' +
        'padding-bottom:8px;border-bottom:1px solid #2f6f8f' +
      '}' +
      '.pokelike-apk-patch-version{font-size:12px;color:#ffd84a;text-shadow:1px 1px #000}' +
      '.pokelike-apk-patch-title{font-size:9px;line-height:1.5;color:#fff;text-shadow:1px 1px #000}' +
      '.pokelike-apk-patch-date{margin-left:auto;font-size:7px;color:#d8d8d0;white-space:nowrap}' +
      '.pokelike-apk-patch ul{margin:0;padding-left:16px}' +
      '.pokelike-apk-patch li{font-size:8px;line-height:1.7;color:#f2f2ea;margin-bottom:6px}' +
      '#pokelike-debug-modal{' +
        'position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.88);' +
        'display:flex;align-items:center;justify-content:center;padding:10px' +
      '}' +
      '.pokelike-debug-box{' +
        'width:min(96vw,680px);height:min(88vh,760px);display:flex;flex-direction:column;' +
        'background:#071017;border:2px solid #72d6ff;border-radius:8px;' +
        'box-shadow:4px 4px 0 #000;font-family:monospace;color:#f2f2ea' +
      '}' +
      '.pokelike-debug-header{' +
        'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;' +
        'border-bottom:1px solid #2f6f8f;font-family:"Press Start 2P",monospace;' +
        'font-size:9px;color:#ffd84a' +
      '}' +
      '.pokelike-debug-actions{display:flex;gap:8px;padding:8px;border-bottom:1px solid #2f6f8f}' +
      '.pokelike-debug-actions button{flex:1;font-size:8px}' +
      '#pokelike-debug-list{overflow:auto;padding:8px;font-size:10px;line-height:1.45}' +
      '.pokelike-debug-entry{' +
        'padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.12);' +
        'cursor:pointer;outline:none' +
      '}' +
      '.pokelike-debug-entry:active,.pokelike-debug-entry:focus{' +
        'background:rgba(114,214,255,.13)' +
      '}' +
      '.pokelike-debug-summary{color:#7fd3ff;font-weight:bold}' +
      '.pokelike-debug-url{color:#f2f2ea;word-break:break-all;margin-top:3px}' +
      '.pokelike-debug-error{color:#ff7777;margin-top:3px}' +
      '#pokelike-debug-detail{' +
        'position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.86);' +
        'display:flex;align-items:center;justify-content:center;padding:14px' +
      '}' +
      '.pokelike-debug-detail-box{' +
        'width:min(94vw,620px);max-height:82vh;overflow:auto;background:#071017;' +
        'border:2px solid #72d6ff;border-radius:8px;box-shadow:4px 4px 0 #000;' +
        'font-family:monospace;color:#f2f2ea' +
      '}' +
      '.pokelike-debug-detail-body{padding:10px}' +
      '.pokelike-debug-detail-row{' +
        'display:grid;grid-template-columns:90px minmax(0,1fr);gap:8px;' +
        'padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.12);font-size:10px' +
      '}' +
      '.pokelike-debug-detail-row strong{color:#ffd84a}' +
      '.pokelike-debug-detail-row span{word-break:break-all;user-select:text}' +
      '.dex-sprite.pokelike-dex-loading{' +
        'opacity:.12;background:linear-gradient(100deg,#2b2b2b 20%,#666 45%,#2b2b2b 70%);' +
        'background-size:220% 100%;animation:pokelikeDexSkeleton 1.1s linear infinite' +
      '}' +
      '.dex-sprite.pokelike-dex-loaded{opacity:1;transition:opacity .16s ease}' +
      '@keyframes pokelikeDexSkeleton{to{background-position:-220% 0}}';
    document.head.appendChild(style);
  }

  function scheduleTranslation() {
    if (translationFrame) return;
    translationFrame = requestAnimationFrame(function () {
      translationFrame = 0;
      translateInterface();
    });
  }

  function applyAll() {
    if (!document.body || !document.head) return;
    disablePlaytimeTelemetry();
    removeWelcome();
    ensureStyles();
    installPokeKeyAlertFilter();
    installNetworkMonitor();
    installNfcDebugAccess();
    installGenerationGuards();
    installRunBackup();
    installMapUiWatchdog();
    ensureLanguagePicker();
    applyBranding();
    replaceTelegramWithDiscord();
    removeInstallPrompts();
    removePrivacyLinks();
    ensurePrivacyPolicy();
    removePokeKeyPresentation();
    removeUnsupportedGenerationUi();
    removeUnsupportedAchievements();
    localizeAchievements();
    renderPatchNotes();
    capPokedexAt649();
    preparePokedexSkeletons();
    removeDebugSettingsAccess();
    ensureBackButton();
    updateLanguagePickerVisibility();
    scheduleTranslation();
  }

  if (!window.__pokelikeApkObserver) {
    window.__pokelikeApkObserver = new MutationObserver(function (mutations) {
      ensureBackButton();
      updateLanguagePickerVisibility();
      var dexOnly = mutations.length > 0 && mutations.every(function (mutation) {
        var target = mutation.target?.nodeType === 1
          ? mutation.target
          : mutation.target?.parentElement;
        if (target?.closest?.('#pokedex-modal')) return true;
        return Array.prototype.every.call(mutation.addedNodes || [], function (node) {
          return node.nodeType === 1 &&
            (node.id === 'pokedex-modal' || node.closest?.('#pokedex-modal'));
        });
      });
      if (dexOnly) {
        capPokedexAt649();
        preparePokedexSkeletons();
      } else if (mutations.some(function (mutation) {
        return mutation.type === 'childList' || mutation.type === 'characterData';
      })) {
        applyAll();
      }
    });
    var observe = function () {
      if (!document.body) return;
      window.__pokelikeApkObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class']
      });
      applyAll();
      if (typeof loadStaticPokedex === 'function') {
        var preload = function () {
          loadStaticPokedex()
            .catch(function () {})
            .finally(function () {
              setTimeout(warmPokedexModal, 250);
            });
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(preload, { timeout: 1500 });
        } else {
          setTimeout(preload, 250);
        }
      }
      if (!window.__pokelikePokedexWarmup) {
        window.__pokelikePokedexWarmup = setInterval(warmPokedexModal, 2500);
      }
      if (!window.__pokelikeRunBackupLoop) {
        window.__pokelikeRunBackupLoop = setInterval(function () {
          installRunBackup();
          if (localStorage.getItem('poke_current_run')) scheduleRunBackup(false);
        }, 5000);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden') scheduleRunBackup(true);
        });
      }
      if (!window.__pokelikeTelemetryGuard) {
        window.__pokelikeTelemetryGuard = setInterval(disablePlaytimeTelemetry, 1000);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observe, { once: true });
    } else {
      observe();
    }
  } else {
    applyAll();
  }
})();
