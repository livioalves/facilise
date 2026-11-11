// Authenticated software-request workspace.
const workspace = document.querySelector('#workspace');
const workspaceList = document.querySelector('#requestList');
const workspaceNotice = document.querySelector('#workspaceNotice');
const requestForm = document.querySelector('#requestForm');
const profileFormElement = document.querySelector('#workspaceProfileForm');
profileFormElement?.querySelector('.profile-address-section')?.insertAdjacentHTML('beforebegin','<label><span id="genderIdentityLabel">Identidade de gênero (opcional)</span><select name="gender_identity"></select></label><label data-gender-details hidden><span id="genderIdentityDetailsLabel">Como você se identifica?</span><input name="gender_identity_details" maxlength="80"></label>');
const genderFieldLabels={'pt-BR':['Identidade de gênero (opcional)','Como você se identifica?'],en:['Gender identity (optional)','How do you identify?'],es:['Identidad de género (opcional)','¿Cómo te identificas?'],it:['Identità di genere (facoltativa)','Come ti identifichi?'],fr:['Identité de genre (facultative)','Comment vous identifiez-vous ?'],de:['Geschlechtsidentität (optional)','Wie identifizieren Sie sich?']};
const sexualIdentityTranslations = {
  'pt-BR':[['woman','Mulher'],['man','Homem'],['non_binary','Pessoa não binária'],['self_describe','Prefiro me autodescrever'],['prefer_not_answer','Prefiro não responder']],
  en:[['woman','Woman'],['man','Man'],['non_binary','Non-binary person'],['self_describe','Prefer to self-describe'],['prefer_not_answer','Prefer not to answer']],
  es:[['woman','Mujer'],['man','Hombre'],['non_binary','Persona no binaria'],['self_describe','Prefiero autodescribirme'],['prefer_not_answer','Prefiero no responder']],
  it:[['woman','Donna'],['man','Uomo'],['non_binary','Persona non binaria'],['self_describe','Preferisco descrivermi'],['prefer_not_answer','Preferisco non rispondere']],
  fr:[['woman','Femme'],['man','Homme'],['non_binary','Personne non binaire'],['self_describe','Je préfère me décrire'],['prefer_not_answer','Je préfère ne pas répondre']],
  de:[['woman','Frau'],['man','Mann'],['non_binary','Nichtbinäre Person'],['self_describe','Ich beschreibe mich lieber selbst'],['prefer_not_answer','Ich möchte nicht antworten']]
};
function populateSexualIdentitySelect(select, includeAny=false){if(!select)return;const value=select.value,options=sexualIdentityTranslations[workspaceLocale()]||sexualIdentityTranslations.en;select.innerHTML=(includeAny?`<option value="">${workspaceLocale()==='pt-BR'?'Qualquer identidade':'Any identity'}</option>`:'')+options.filter(([v])=>!includeAny||v).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');select.value=value;}
function renderOfferGenderGrid(selected){const grid=document.querySelector('[data-offer-gender-grid]');if(!grid)return;const values=new Set(selected||[...grid.querySelectorAll('input:checked')].map(x=>x.value)),options=sexualIdentityTranslations[workspaceLocale()]||sexualIdentityTranslations.en;grid.innerHTML=options.map(([value,label])=>`<div class="offer-gender-option"><label><input type="checkbox" name="target_gender_identities" value="${value}" ${values.has(value)?'checked':''}><span>${escapeHtml(label)}</span></label></div>`).join('');}
function toggleGenderDetails(){const form=document.querySelector('#workspaceProfileForm'),details=form?.querySelector('[data-gender-details]');if(details)details.hidden=form.elements.gender_identity.value!=='self_describe';}
profileFormElement?.elements.gender_identity?.addEventListener('change',toggleGenderDetails);
let workspaceUser = null;
let workspaceRequests = [];
let workspaceEvents = new Map();
let workspaceDevelopers = [];
let workspaceFilter = 'active';
let workspacePage = 1;
let workspacePagination = { page:1, total_pages:1, total:0 };
let workspaceCompanies = [];
let workspaceOffers = [];
let offerPage = 1;
let offerSearch = '';
let offerPagination = { page:1, total_pages:1, total:0 };
let surveyResultPage = 1;
let surveyResultPagination = { page:1, total_pages:1, total:0 };
let editingCompanyId = null;
const openConversations = new Set();
const requestMessages = new Map();
const conversationHasMore = new Map();
let conversationPolling = false;

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const closedStatuses = new Set(['approved', 'rejected', 'cancelled']);
const decisionDialog = document.querySelector('#decisionDialog');
const decisionForm = document.querySelector('#decisionForm');
let pendingDecision = null;
const deliveryDialog = document.querySelector('#deliveryDialog');
const deliveryForm = document.querySelector('#deliveryForm');
let pendingDeliveryId = null;
const cancelDialog = document.querySelector('#cancelDialog');
const cancelForm = document.querySelector('#cancelForm');
let pendingCancelId = null;
const workspaceTranslations = {
  'pt-BR': { eyebrow:'Entrega de software',title:'Solicitações',intro:'Descreva o que precisa, defina uma data desejada se quiser e acompanhe a entrega.',newRequest:'Nova solicitação',descriptionLabel:'O que você quer que a gente desenvolva?',descriptionPlaceholder:'Descreva o resultado, os usuários, o problema atual e tudo o que devemos saber.',dueDateLabel:'Data desejada (opcional)',cancel:'Cancelar',submit:'Enviar solicitação',active:'Ativas',closed:'Encerradas',all:'Todas',empty:'Nenhuma solicitação nesta visualização.',due:'Prazo',noDue:'Sem prazo',requestedBy:'Solicitado por',developer:'Desenvolvedor',unassigned:'Não atribuída',deliveryNote:'Nota da entrega',feedback:'Retorno do assinante',assignPlaceholder:'Atribuir a um desenvolvedor…',assign:'Atribuir',start:'Iniciar trabalho',done:'Marcar como concluída',approve:'Aprovar',reject:'Rejeitar',submittedMessage:'Solicitação enviada.',assignedMessage:'Desenvolvedor atribuído.',deliveryPrompt:'Adicione uma nota ou link da entrega (opcional):',approvalPrompt:'Nota de aprovação (opcional):',rejectionPrompt:'Por que você está rejeitando esta entrega?',roles:{subscriber:'assinante',developer:'desenvolvedor',admin:'administrador'},statuses:{submitted:'Enviada',assigned:'Atribuída',in_progress:'Em andamento',awaiting_approval:'Aguardando aprovação',approved:'Aprovada',rejected:'Rejeitada',cancelled:'Cancelada'} },
  en: { eyebrow:'Software delivery',title:'Requests',intro:'Describe what you need, optionally set a desired due date, and track delivery.',newRequest:'New request',descriptionLabel:'What do you want us to build?',descriptionPlaceholder:'Describe the outcome, users, current problem, and anything we should know.',dueDateLabel:'Desired due date (optional)',cancel:'Cancel',submit:'Submit request',active:'Active',closed:'Closed',all:'All',empty:'No requests in this view.',due:'Due',noDue:'No due date',requestedBy:'Requested by',developer:'Developer',unassigned:'Unassigned',deliveryNote:'Delivery note',feedback:'Subscriber feedback',assignPlaceholder:'Assign a developer…',assign:'Assign',start:'Start work',done:'Mark as done',approve:'Approve',reject:'Reject',submittedMessage:'Request submitted.',assignedMessage:'Developer assigned.',deliveryPrompt:'Add a delivery note or link (optional):',approvalPrompt:'Approval note (optional):',rejectionPrompt:'Why are you rejecting this delivery?',roles:{subscriber:'subscriber',developer:'developer',admin:'administrator'},statuses:{submitted:'Submitted',assigned:'Assigned',in_progress:'In progress',awaiting_approval:'Awaiting approval',approved:'Approved',rejected:'Rejected',cancelled:'Cancelled'} },
  es: { eyebrow:'Entrega de software',title:'Solicitudes',intro:'Describe lo que necesitas, añade una fecha deseada si quieres y sigue la entrega.',newRequest:'Nueva solicitud',descriptionLabel:'¿Qué quieres que desarrollemos?',descriptionPlaceholder:'Describe el resultado, los usuarios, el problema actual y todo lo que debamos saber.',dueDateLabel:'Fecha deseada (opcional)',cancel:'Cancelar',submit:'Enviar solicitud',active:'Activas',closed:'Cerradas',all:'Todas',empty:'No hay solicitudes en esta vista.',due:'Fecha límite',noDue:'Sin fecha límite',requestedBy:'Solicitada por',developer:'Desarrollador',unassigned:'Sin asignar',deliveryNote:'Nota de entrega',feedback:'Comentarios del suscriptor',assignPlaceholder:'Asignar un desarrollador…',assign:'Asignar',start:'Iniciar trabajo',done:'Marcar como terminada',approve:'Aprobar',reject:'Rechazar',submittedMessage:'Solicitud enviada.',assignedMessage:'Desarrollador asignado.',deliveryPrompt:'Añade una nota o enlace de entrega (opcional):',approvalPrompt:'Nota de aprobación (opcional):',rejectionPrompt:'¿Por qué rechazas esta entrega?',roles:{subscriber:'suscriptor',developer:'desarrollador',admin:'administrador'},statuses:{submitted:'Enviada',assigned:'Asignada',in_progress:'En curso',awaiting_approval:'Pendiente de aprobación',approved:'Aprobada',rejected:'Rechazada',cancelled:'Cancelada'} },
  it: { eyebrow:'Consegna software',title:'Richieste',intro:'Descrivi ciò che ti serve, indica facoltativamente una data desiderata e segui la consegna.',newRequest:'Nuova richiesta',descriptionLabel:'Cosa vuoi che sviluppiamo?',descriptionPlaceholder:'Descrivi il risultato, gli utenti, il problema attuale e tutto ciò che dovremmo sapere.',dueDateLabel:'Data desiderata (facoltativa)',cancel:'Annulla',submit:'Invia richiesta',active:'Attive',closed:'Chiuse',all:'Tutte',empty:'Nessuna richiesta in questa vista.',due:'Scadenza',noDue:'Nessuna scadenza',requestedBy:'Richiesta da',developer:'Sviluppatore',unassigned:'Non assegnata',deliveryNote:'Nota di consegna',feedback:'Feedback dell’abbonato',assignPlaceholder:'Assegna uno sviluppatore…',assign:'Assegna',start:'Inizia il lavoro',done:'Segna come completata',approve:'Approva',reject:'Rifiuta',submittedMessage:'Richiesta inviata.',assignedMessage:'Sviluppatore assegnato.',deliveryPrompt:'Aggiungi una nota o un link di consegna (facoltativo):',approvalPrompt:'Nota di approvazione (facoltativa):',rejectionPrompt:'Perché rifiuti questa consegna?',roles:{subscriber:'abbonato',developer:'sviluppatore',admin:'amministratore'},statuses:{submitted:'Inviata',assigned:'Assegnata',in_progress:'In lavorazione',awaiting_approval:'In attesa di approvazione',approved:'Approvata',rejected:'Rifiutata',cancelled:'Annullata'} },
  fr: { eyebrow:'Livraison logicielle',title:'Demandes',intro:'Décrivez votre besoin, indiquez éventuellement une date souhaitée et suivez la livraison.',newRequest:'Nouvelle demande',descriptionLabel:'Que souhaitez-vous nous voir développer ?',descriptionPlaceholder:'Décrivez le résultat, les utilisateurs, le problème actuel et tout ce que nous devons savoir.',dueDateLabel:'Date souhaitée (facultative)',cancel:'Annuler',submit:'Envoyer la demande',active:'Actives',closed:'Clôturées',all:'Toutes',empty:'Aucune demande dans cette vue.',due:'Échéance',noDue:'Sans échéance',requestedBy:'Demandée par',developer:'Développeur',unassigned:'Non attribuée',deliveryNote:'Note de livraison',feedback:'Retour de l’abonné',assignPlaceholder:'Attribuer un développeur…',assign:'Attribuer',start:'Commencer le travail',done:'Marquer comme terminée',approve:'Approuver',reject:'Rejeter',submittedMessage:'Demande envoyée.',assignedMessage:'Développeur attribué.',deliveryPrompt:'Ajoutez une note ou un lien de livraison (facultatif) :',approvalPrompt:'Note d’approbation (facultative) :',rejectionPrompt:'Pourquoi rejetez-vous cette livraison ?',roles:{subscriber:'abonné',developer:'développeur',admin:'administrateur'},statuses:{submitted:'Envoyée',assigned:'Attribuée',in_progress:'En cours',awaiting_approval:'En attente d’approbation',approved:'Approuvée',rejected:'Rejetée',cancelled:'Annulée'} },
  de: { eyebrow:'Softwarebereitstellung',title:'Anfragen',intro:'Beschreiben Sie Ihren Bedarf, geben Sie optional einen Wunschtermin an und verfolgen Sie die Lieferung.',newRequest:'Neue Anfrage',descriptionLabel:'Was sollen wir für Sie entwickeln?',descriptionPlaceholder:'Beschreiben Sie das Ergebnis, die Nutzer, das aktuelle Problem und alles, was wir wissen sollten.',dueDateLabel:'Wunschtermin (optional)',cancel:'Abbrechen',submit:'Anfrage senden',active:'Aktiv',closed:'Abgeschlossen',all:'Alle',empty:'Keine Anfragen in dieser Ansicht.',due:'Fällig',noDue:'Kein Termin',requestedBy:'Angefragt von',developer:'Entwickler',unassigned:'Nicht zugewiesen',deliveryNote:'Lieferhinweis',feedback:'Kundenfeedback',assignPlaceholder:'Entwickler zuweisen…',assign:'Zuweisen',start:'Arbeit beginnen',done:'Als erledigt markieren',approve:'Genehmigen',reject:'Ablehnen',submittedMessage:'Anfrage gesendet.',assignedMessage:'Entwickler zugewiesen.',deliveryPrompt:'Lieferhinweis oder Link hinzufügen (optional):',approvalPrompt:'Freigabehinweis (optional):',rejectionPrompt:'Warum lehnen Sie diese Lieferung ab?',roles:{subscriber:'Abonnent',developer:'Entwickler',admin:'Administrator'},statuses:{submitted:'Gesendet',assigned:'Zugewiesen',in_progress:'In Bearbeitung',awaiting_approval:'Wartet auf Freigabe',approved:'Genehmigt',rejected:'Abgelehnt',cancelled:'Storniert'} }
};
const workspaceLocale = () => workspaceTranslations[document.documentElement.lang] ? document.documentElement.lang : 'en';
const workspaceText = () => workspaceTranslations[workspaceLocale()];
const decisionTranslations = {
  'pt-BR': { approveTitle:'Aprovar entrega',rejectTitle:'Solicitar alterações',approvePlaceholder:'Escreva seus comentários sobre a aprovação (opcional).',rejectPlaceholder:'Descreva com detalhes o que precisa ser corrigido ou alterado.',cancel:'Cancelar',approve:'Aprovar entrega',reject:'Solicitar alterações' },
  en: { approveTitle:'Approve delivery',rejectTitle:'Request changes',approvePlaceholder:'Write your approval comments (optional).',rejectPlaceholder:'Describe in detail what needs to be fixed or changed.',cancel:'Cancel',approve:'Approve delivery',reject:'Request changes' },
  es: { approveTitle:'Aprobar entrega',rejectTitle:'Solicitar cambios',approvePlaceholder:'Escribe tus comentarios de aprobación (opcional).',rejectPlaceholder:'Describe detalladamente qué debe corregirse o cambiarse.',cancel:'Cancelar',approve:'Aprobar entrega',reject:'Solicitar cambios' },
  it: { approveTitle:'Approva consegna',rejectTitle:'Richiedi modifiche',approvePlaceholder:'Scrivi i commenti di approvazione (facoltativo).',rejectPlaceholder:'Descrivi nel dettaglio cosa deve essere corretto o modificato.',cancel:'Annulla',approve:'Approva consegna',reject:'Richiedi modifiche' },
  fr: { approveTitle:'Approuver la livraison',rejectTitle:'Demander des modifications',approvePlaceholder:'Ajoutez vos commentaires d’approbation (facultatif).',rejectPlaceholder:'Décrivez précisément ce qui doit être corrigé ou modifié.',cancel:'Annuler',approve:'Approuver la livraison',reject:'Demander des modifications' },
  de: { approveTitle:'Lieferung freigeben',rejectTitle:'Änderungen anfordern',approvePlaceholder:'Schreiben Sie Ihre Freigabekommentare (optional).',rejectPlaceholder:'Beschreiben Sie ausführlich, was korrigiert oder geändert werden muss.',cancel:'Abbrechen',approve:'Lieferung freigeben',reject:'Änderungen anfordern' }
};
const deliveryTranslations = {
  'pt-BR': { title:'Concluir entrega',note:'Nota ou link da entrega (opcional)',placeholder:'Descreva o que foi entregue, instruções para teste e links relevantes.',file:'Anexo (opcional, até 10 MB)',cancel:'Cancelar',submit:'Enviar para aprovação',attachment:'Baixar anexo' },
  en: { title:'Complete delivery',note:'Delivery note or link (optional)',placeholder:'Describe what was delivered, testing instructions, and relevant links.',file:'Attachment (optional, up to 10 MB)',cancel:'Cancel',submit:'Send for approval',attachment:'Download attachment' },
  es: { title:'Completar entrega',note:'Nota o enlace de entrega (opcional)',placeholder:'Describe lo entregado, instrucciones de prueba y enlaces relevantes.',file:'Adjunto (opcional, hasta 10 MB)',cancel:'Cancelar',submit:'Enviar para aprobación',attachment:'Descargar adjunto' },
  it: { title:'Completa consegna',note:'Nota o link di consegna (facoltativo)',placeholder:'Descrivi ciò che è stato consegnato, le istruzioni di test e i link utili.',file:'Allegato (facoltativo, massimo 10 MB)',cancel:'Annulla',submit:'Invia per approvazione',attachment:'Scarica allegato' },
  fr: { title:'Terminer la livraison',note:'Note ou lien de livraison (facultatif)',placeholder:'Décrivez la livraison, les instructions de test et les liens utiles.',file:'Pièce jointe (facultative, 10 Mo maximum)',cancel:'Annuler',submit:'Envoyer pour approbation',attachment:'Télécharger la pièce jointe' },
  de: { title:'Lieferung abschließen',note:'Lieferhinweis oder Link (optional)',placeholder:'Beschreiben Sie die Lieferung, Testhinweise und relevante Links.',file:'Anhang (optional, maximal 10 MB)',cancel:'Abbrechen',submit:'Zur Freigabe senden',attachment:'Anhang herunterladen' }
};
const operationTranslations = {
  'pt-BR': { message:'Mensagem enviada com sucesso.',status:'Status atualizado com sucesso.',delivery:'Entrega enviada com sucesso.',decision:'Decisão registrada com sucesso.' },
  en: { message:'Message sent successfully.',status:'Status updated successfully.',delivery:'Delivery submitted successfully.',decision:'Decision recorded successfully.' },
  es: { message:'Mensaje enviado correctamente.',status:'Estado actualizado correctamente.',delivery:'Entrega enviada correctamente.',decision:'Decisión registrada correctamente.' },
  it: { message:'Messaggio inviato correttamente.',status:'Stato aggiornato correttamente.',delivery:'Consegna inviata correttamente.',decision:'Decisione registrata correttamente.' },
  fr: { message:'Message envoyé avec succès.',status:'Statut mis à jour avec succès.',delivery:'Livraison envoyée avec succès.',decision:'Décision enregistrée avec succès.' },
  de: { message:'Nachricht erfolgreich gesendet.',status:'Status erfolgreich aktualisiert.',delivery:'Lieferung erfolgreich gesendet.',decision:'Entscheidung erfolgreich gespeichert.' }
};
const operationText = () => operationTranslations[workspaceLocale()] || operationTranslations.en;
const navTranslations = {
  'pt-BR':['Pra mim','Perfil','Segurança','Sair','Fechar','Anexo da solicitação (opcional, até 10 MB)','Digite pelo menos 3 letras','Escolha um desenvolvedor da lista.'],en:['For me','Profile','Security','Sign out','Close','Request attachment (optional, up to 10 MB)','Type at least 3 letters','Choose a developer from the list.'],es:['Para mí','Perfil','Seguridad','Salir','Cerrar','Adjunto de la solicitud (opcional, hasta 10 MB)','Escribe al menos 3 letras','Elige un desarrollador de la lista.'],it:['Per me','Profilo','Sicurezza','Esci','Chiudi','Allegato della richiesta (facoltativo, massimo 10 MB)','Digita almeno 3 lettere','Scegli uno sviluppatore dalla lista.'],fr:['Pour moi','Profil','Sécurité','Déconnexion','Fermer','Pièce jointe à la demande (facultative, 10 Mo maximum)','Saisissez au moins 3 lettres','Choisissez un développeur dans la liste.'],de:['Für mich','Profil','Sicherheit','Abmelden','Schließen','Anfrageanhang (optional, maximal 10 MB)','Mindestens 3 Buchstaben eingeben','Wählen Sie einen Entwickler aus der Liste.']
};
const companyNavTranslations = { 'pt-BR':'Empresas',en:'Companies',es:'Empresas',it:'Aziende',fr:'Entreprises',de:'Unternehmen' };
Object.entries(navTranslations).forEach(([locale, values]) => values.splice(1, 0, companyNavTranslations[locale]));
const offerNavTranslations = { 'pt-BR':'Ofertas',en:'Offers',es:'Ofertas',it:'Offerte',fr:'Offres',de:'Angebote' };
Object.entries(navTranslations).forEach(([locale, values]) => values.splice(2, 0, offerNavTranslations[locale]));
const companyTranslations = {
  'pt-BR': { eyebrow:'Cadastro',title:'Empresas',copy:'Cadastre e gerencie empresas de qualquer país.',newCompany:'Nova empresa',name:'Nome comercial',legalName:'Razão social',taxId:'Identificação fiscal',website:'Site',email:'E-mail',phone:'Telefone',description:'Descrição',address:'Endereço (opcional)',publicLabel:'Permitir exibição em pesquisas públicas',publicHelp:'A empresa poderá aparecer em pesquisas fora da área logada. Desativado por padrão.',cancel:'Cancelar',save:'Salvar empresa',empty:'Nenhuma empresa cadastrada.',unnamed:'Empresa sem nome',noLocation:'Localização não informada',noDescription:'Sem descrição',public:'Pública',private:'Privada',edit:'Editar',delete:'Excluir',deleteConfirm:'Excluir esta empresa?',saved:'Empresa salva.',deleted:'Empresa excluída.' },
  en: { eyebrow:'Registration',title:'Companies',copy:'Register and manage companies from any country.',newCompany:'New company',name:'Trading name',legalName:'Legal name',taxId:'Tax identification',website:'Website',email:'Email',phone:'Phone',description:'Description',address:'Address (optional)',publicLabel:'Allow display in public searches',publicHelp:'The company may appear in searches outside the signed-in area. Disabled by default.',cancel:'Cancel',save:'Save company',empty:'No companies registered.',unnamed:'Unnamed company',noLocation:'Location not provided',noDescription:'No description',public:'Public',private:'Private',edit:'Edit',delete:'Delete',deleteConfirm:'Delete this company?',saved:'Company saved.',deleted:'Company deleted.' },
  es: { eyebrow:'Registro',title:'Empresas',copy:'Registra y gestiona empresas de cualquier país.',newCompany:'Nueva empresa',name:'Nombre comercial',legalName:'Razón social',taxId:'Identificación fiscal',website:'Sitio web',email:'Correo electrónico',phone:'Teléfono',description:'Descripción',address:'Dirección (opcional)',publicLabel:'Permitir que aparezca en búsquedas públicas',publicHelp:'La empresa podrá aparecer en búsquedas fuera del área privada. Desactivado por defecto.',cancel:'Cancelar',save:'Guardar empresa',empty:'No hay empresas registradas.',unnamed:'Empresa sin nombre',noLocation:'Ubicación no informada',noDescription:'Sin descripción',public:'Pública',private:'Privada',edit:'Editar',delete:'Eliminar',deleteConfirm:'¿Eliminar esta empresa?',saved:'Empresa guardada.',deleted:'Empresa eliminada.' },
  it: { eyebrow:'Registrazione',title:'Aziende',copy:'Registra e gestisci aziende di qualsiasi paese.',newCompany:'Nuova azienda',name:'Nome commerciale',legalName:'Ragione sociale',taxId:'Identificazione fiscale',website:'Sito web',email:'E-mail',phone:'Telefono',description:'Descrizione',address:'Indirizzo (facoltativo)',publicLabel:'Consenti la visualizzazione nelle ricerche pubbliche',publicHelp:'L’azienda potrà apparire nelle ricerche fuori dall’area riservata. Disattivato per impostazione predefinita.',cancel:'Annulla',save:'Salva azienda',empty:'Nessuna azienda registrata.',unnamed:'Azienda senza nome',noLocation:'Località non indicata',noDescription:'Nessuna descrizione',public:'Pubblica',private:'Privata',edit:'Modifica',delete:'Elimina',deleteConfirm:'Eliminare questa azienda?',saved:'Azienda salvata.',deleted:'Azienda eliminata.' },
  fr: { eyebrow:'Enregistrement',title:'Entreprises',copy:'Enregistrez et gérez des entreprises de tous pays.',newCompany:'Nouvelle entreprise',name:'Nom commercial',legalName:'Raison sociale',taxId:'Identification fiscale',website:'Site web',email:'E-mail',phone:'Téléphone',description:'Description',address:'Adresse (facultative)',publicLabel:'Autoriser l’affichage dans les recherches publiques',publicHelp:'L’entreprise pourra apparaître dans les recherches hors de l’espace connecté. Désactivé par défaut.',cancel:'Annuler',save:'Enregistrer l’entreprise',empty:'Aucune entreprise enregistrée.',unnamed:'Entreprise sans nom',noLocation:'Localisation non renseignée',noDescription:'Aucune description',public:'Publique',private:'Privée',edit:'Modifier',delete:'Supprimer',deleteConfirm:'Supprimer cette entreprise ?',saved:'Entreprise enregistrée.',deleted:'Entreprise supprimée.' },
  de: { eyebrow:'Registrierung',title:'Unternehmen',copy:'Erfassen und verwalten Sie Unternehmen aus jedem Land.',newCompany:'Neues Unternehmen',name:'Handelsname',legalName:'Rechtlicher Name',taxId:'Steueridentifikation',website:'Website',email:'E-Mail',phone:'Telefon',description:'Beschreibung',address:'Adresse (optional)',publicLabel:'Anzeige in öffentlichen Suchen erlauben',publicHelp:'Das Unternehmen kann in Suchen außerhalb des angemeldeten Bereichs erscheinen. Standardmäßig deaktiviert.',cancel:'Abbrechen',save:'Unternehmen speichern',empty:'Keine Unternehmen erfasst.',unnamed:'Unternehmen ohne Namen',noLocation:'Standort nicht angegeben',noDescription:'Keine Beschreibung',public:'Öffentlich',private:'Privat',edit:'Bearbeiten',delete:'Löschen',deleteConfirm:'Dieses Unternehmen löschen?',saved:'Unternehmen gespeichert.',deleted:'Unternehmen gelöscht.' }
};
const companyText = () => companyTranslations[workspaceLocale()] || companyTranslations.en;
const settingsTranslations = {
  'pt-BR':['Conta','Perfil','Atualize como você aparece e seus dados de contato.','Nick','E-mail','Telefone','Documento alfanumérico','Salvar perfil','Segurança','Altere sua senha de acesso.','Senha atual','Nova senha','Alterar senha'],
  en:['Account','Profile','Update how you appear and your contact details.','Nick','Email','Phone','Alphanumeric document','Save profile','Security','Change your access password.','Current password','New password','Change password'],
  es:['Cuenta','Perfil','Actualiza cómo apareces y tus datos de contacto.','Nick','Correo','Teléfono','Documento alfanumérico','Guardar perfil','Seguridad','Cambia tu contraseña de acceso.','Contraseña actual','Nueva contraseña','Cambiar contraseña'],
  it:['Account','Profilo','Aggiorna il tuo nome pubblico e i dati di contatto.','Nick','E-mail','Telefono','Documento alfanumerico','Salva profilo','Sicurezza','Modifica la password di accesso.','Password attuale','Nuova password','Cambia password'],
  fr:['Compte','Profil','Mettez à jour votre nom public et vos coordonnées.','Pseudo','E-mail','Téléphone','Document alphanumérique','Enregistrer','Sécurité','Modifiez votre mot de passe.','Mot de passe actuel','Nouveau mot de passe','Modifier le mot de passe'],
  de:['Konto','Profil','Aktualisieren Sie Ihren öffentlichen Namen und Ihre Kontaktdaten.','Nick','E-Mail','Telefon','Alphanumerisches Dokument','Profil speichern','Sicherheit','Ändern Sie Ihr Zugangspasswort.','Aktuelles Passwort','Neues Passwort','Passwort ändern']
};
const conversationTranslations = {
  'pt-BR':['Conversa','Fechar conversa','Nenhuma mensagem ainda. Comece a conversa.','Escreva uma mensagem…','Enviar','mensagem','Carregar mensagens anteriores'],en:['Conversation','Close conversation','No messages yet. Start the conversation.','Write a message…','Send','message','Load previous messages'],es:['Conversación','Cerrar conversación','Aún no hay mensajes. Inicia la conversación.','Escribe un mensaje…','Enviar','mensaje','Cargar mensajes anteriores'],it:['Conversazione','Chiudi conversazione','Nessun messaggio. Inizia la conversazione.','Scrivi un messaggio…','Invia','messaggio','Carica messaggi precedenti'],fr:['Conversation','Fermer la conversation','Aucun message. Commencez la conversation.','Écrivez un message…','Envoyer','message','Charger les messages précédents'],de:['Unterhaltung','Unterhaltung schließen','Noch keine Nachrichten. Beginnen Sie die Unterhaltung.','Nachricht schreiben…','Senden','Nachricht','Frühere Nachrichten laden']
};
const filterTranslations = {
  'pt-BR':['Aguardando início','Aguardando aprovação','Rejeitadas'],en:['Waiting to start','Awaiting approval','Rejected'],es:['Esperando inicio','Pendientes de aprobación','Rechazadas'],it:['In attesa di iniziare','In attesa di approvazione','Rifiutate'],fr:['En attente de démarrage','En attente d’approbation','Rejetées'],de:['Wartet auf Start','Wartet auf Freigabe','Abgelehnt']
};
const cancellationTranslations = {
  'pt-BR':['Cancelar solicitação','Tem certeza de que deseja cancelar esta solicitação? Essa ação encerra o fluxo, mas mantém o histórico.','Solicitação cancelada.','Voltar'],en:['Cancel request','Are you sure you want to cancel this request? This ends the workflow but preserves its history.','Request cancelled.','Go back'],es:['Cancelar solicitud','¿Seguro que quieres cancelar esta solicitud? El flujo terminará, pero se conservará el historial.','Solicitud cancelada.','Volver'],it:['Annulla richiesta','Vuoi davvero annullare questa richiesta? Il flusso terminerà, ma lo storico verrà conservato.','Richiesta annullata.','Indietro'],fr:['Annuler la demande','Voulez-vous vraiment annuler cette demande ? Le flux sera terminé, mais son historique sera conservé.','Demande annulée.','Retour'],de:['Anfrage stornieren','Möchten Sie diese Anfrage wirklich stornieren? Der Ablauf endet, der Verlauf bleibt erhalten.','Anfrage storniert.','Zurück']
};
const timelineTranslations = {
  'pt-BR':{submitted:'Solicitação enviada',assigned:'Desenvolvedor atribuído',started:'Trabalho iniciado',completed:'Entrega concluída',rejected:'Entrega reprovada',approved:'Entrega aprovada',cancelled:'Solicitação cancelada'},
  en:{submitted:'Request submitted',assigned:'Developer assigned',started:'Work started',completed:'Delivery completed',rejected:'Delivery rejected',approved:'Delivery approved',cancelled:'Request cancelled'},
  es:{submitted:'Solicitud enviada',assigned:'Desarrollador asignado',started:'Trabajo iniciado',completed:'Entrega completada',rejected:'Entrega rechazada',approved:'Entrega aprobada',cancelled:'Solicitud cancelada'},
  it:{submitted:'Richiesta inviata',assigned:'Sviluppatore assegnato',started:'Lavoro iniziato',completed:'Consegna completata',rejected:'Consegna rifiutata',approved:'Consegna approvata',cancelled:'Richiesta annullata'},
  fr:{submitted:'Demande envoyée',assigned:'Développeur attribué',started:'Travail commencé',completed:'Livraison terminée',rejected:'Livraison rejetée',approved:'Livraison approuvée',cancelled:'Demande annulée'},
  de:{submitted:'Anfrage gesendet',assigned:'Entwickler zugewiesen',started:'Arbeit begonnen',completed:'Lieferung abgeschlossen',rejected:'Lieferung abgelehnt',approved:'Lieferung genehmigt',cancelled:'Anfrage storniert'}
};

function applyWorkspaceLanguage() {
  const text = workspaceText();
  document.querySelectorAll('[data-workspace-i18n]').forEach(element => { element.textContent = text[element.dataset.workspaceI18n]; });
  const description = document.querySelector('#requestDescription');
  if (description) description.placeholder = text.descriptionPlaceholder;
  if (workspaceUser) document.querySelector('#workspaceRole').textContent = text.roles[workspaceUser.role] || workspaceUser.role;
  if (!decisionDialog.hidden && pendingDecision) configureDecisionDialog();
  if (!deliveryDialog.hidden && pendingDeliveryId) configureDeliveryDialog();
  const nav = navTranslations[workspaceLocale()] || navTranslations.en;
  const pageLabels = { 'survey-admin':'Pesquisa', profile:nav[3], security:nav[4] };
  document.querySelectorAll('[data-workspace-page-link]').forEach(button => { button.textContent = pageLabels[button.dataset.workspacePageLink]; });
  document.querySelector('#workspaceOpen').textContent = nav[3];
  document.querySelector('#workspaceLogout').textContent = nav[5]; document.querySelector('#workspaceClose').textContent = nav[6]; document.querySelector('#requestFileLabel').textContent = nav[7];
  const settings = settingsTranslations[workspaceLocale()] || settingsTranslations.en;
  ['profileEyebrow','profileTitle','profileCopy','profileNickLabel','profileEmailLabel','profilePhoneLabel','profileDocumentLabel','profileSubmit','securityTitle','securityCopy','currentPasswordLabel','newPasswordLabel','securitySubmit'].forEach((id,index) => { document.querySelector(`#${id}`).textContent = settings[index]; });
  document.querySelector('#securityEyebrow').textContent = settings[0];
  const company = companyText();
  populateSexualIdentitySelect(document.querySelector('#workspaceProfileForm [name="gender_identity"]'));
  renderOfferGenderGrid();
  const genderLabels=genderFieldLabels[workspaceLocale()]||genderFieldLabels.en;document.querySelector('#genderIdentityLabel').textContent=genderLabels[0];document.querySelector('#genderIdentityDetailsLabel').textContent=genderLabels[1];
  [['companiesEyebrow','eyebrow'],['companiesTitle','title'],['companiesCopy','copy'],['newCompanyOpen','newCompany'],['companyNameLabel','name'],['companyLegalNameLabel','legalName'],['companyTaxIdLabel','taxId'],['companyWebsiteLabel','website'],['companyEmailLabel','email'],['companyPhoneLabel','phone'],['companyDescriptionLabel','description'],['companyAddressTitle','address'],['companyPublicLabel','publicLabel'],['companyPublicHelp','publicHelp'],['companyCancel','cancel'],['companySubmit','save']].forEach(([id,key]) => { document.querySelector(`#${id}`).textContent = company[key]; });
  updateProfileAddressForm(document.querySelector('#companyForm'));
  updateProfileAddressForm(document.querySelector('#workspaceProfileForm'));
  const filters = filterTranslations[workspaceLocale()] || filterTranslations.en;
  document.querySelector('#filterAssigned').textContent = filters[0]; document.querySelector('#filterAwaitingApproval').textContent = filters[1]; document.querySelector('#filterRejected').textContent = filters[2];
  if (!cancelDialog.hidden) configureCancelDialog();
  applySurveyAdminLanguage();
  const surveyAdminPage=document.querySelector('[data-workspace-page="survey-admin"]');if(workspaceUser?.role==='admin'&&!surveyAdminPage.hidden)refreshSurveyAdmin().catch(error=>workspaceFlash(error.message,true));
  renderCompanies();
  renderRequests();
}

function configureDeliveryDialog() {
  const text = deliveryTranslations[workspaceLocale()] || deliveryTranslations.en;
  document.querySelector('#deliveryTitle').textContent = text.title;
  document.querySelector('#deliveryNoteLabel').textContent = text.note;
  document.querySelector('#deliveryNote').placeholder = text.placeholder;
  document.querySelector('#deliveryFileLabel').textContent = text.file;
  document.querySelector('[data-cancel-delivery]').textContent = text.cancel;
  document.querySelector('#deliverySubmit').textContent = text.submit;
}

function openDeliveryDialog(id) {
  pendingDeliveryId = id;
  deliveryForm.reset();
  configureDeliveryDialog();
  deliveryDialog.hidden = false;
  requestAnimationFrame(() => document.querySelector('#deliveryNote').focus());
}

function closeDeliveryDialog() { deliveryDialog.hidden = true; pendingDeliveryId = null; }

function configureCancelDialog() {
  const text = cancellationTranslations[workspaceLocale()] || cancellationTranslations.en;
  document.querySelector('#cancelTitle').textContent = text[0]; document.querySelector('#cancelCopy').textContent = text[1]; document.querySelector('#cancelSubmit').textContent = text[0]; document.querySelector('[data-dismiss-cancel]').textContent = text[3];
}
function openCancelDialog(id) { pendingCancelId = id; configureCancelDialog(); cancelDialog.hidden = false; requestAnimationFrame(() => document.querySelector('[data-dismiss-cancel]').focus()); }
function closeCancelDialog() { pendingCancelId = null; cancelDialog.hidden = true; }

function configureDecisionDialog() {
  const text = decisionTranslations[workspaceLocale()] || decisionTranslations.en;
  const rejecting = pendingDecision?.decision === 'rejected';
  document.querySelector('#decisionTitle').textContent = rejecting ? text.rejectTitle : text.approveTitle;
  document.querySelector('#decisionFeedback').placeholder = rejecting ? text.rejectPlaceholder : text.approvePlaceholder;
  document.querySelector('#decisionFeedback').required = rejecting;
  document.querySelector('[data-cancel-decision]').textContent = text.cancel;
  document.querySelector('#decisionSubmit').textContent = rejecting ? text.reject : text.approve;
  document.querySelector('#decisionSubmit').classList.toggle('reject', rejecting);
}

function openDecisionDialog(id, decision) {
  pendingDecision = { id, decision };
  decisionForm.reset();
  configureDecisionDialog();
  decisionDialog.hidden = false;
  requestAnimationFrame(() => document.querySelector('#decisionFeedback').focus());
}

function closeDecisionDialog() {
  decisionDialog.hidden = true;
  pendingDecision = null;
}

function workspaceFlash(message, error = false) {
  window.appFlash?.(message, error);
  workspaceNotice.textContent = message;
  workspaceNotice.classList.toggle('error', error);
  workspaceNotice.hidden = false;
  window.setTimeout(() => { workspaceNotice.hidden = true; }, 5000);
}

async function openWorkspace(initialUser = null) {
  try {
    workspaceUser = initialUser || await authRequest('/api/oauth/me');
    document.querySelectorAll('[data-admin-only]').forEach(element => { element.hidden = workspaceUser.role !== 'admin'; });
    document.querySelector('#workspaceRole').textContent = workspaceText().roles[workspaceUser.role] || workspaceUser.role;
    workspace.hidden = false;
    document.body.classList.add('workspace-open');
    document.querySelector('#authModal').hidden = true;
    document.body.classList.remove('auth-open');
    document.querySelectorAll('[data-workspace-page]').forEach(section => { section.hidden = section.dataset.workspacePage !== 'profile'; });
    document.querySelectorAll('[data-workspace-page-link]').forEach(button => button.classList.toggle('active', button.dataset.workspacePageLink === 'profile'));
    requestForm.hidden = true;
    const profile = document.querySelector('#workspaceProfileForm');
    profile.elements.nickname.value = workspaceUser.nickname || '';
    profile.elements.email.value = workspaceUser.email || '';
    profile.elements.phone_number.value = workspaceUser.phone_number || '';
    profile.elements.document_alpha.value = workspaceUser.document_alpha || '';
    const identity = await authRequest('/api/profile/identity'); profile.elements.gender_identity.value = identity.gender_identity || 'prefer_not_answer'; profile.elements.gender_identity_details.value = identity.gender_identity_details || ''; toggleGenderDetails();
    ['postal_code','street_address','address_number','address_complement','neighborhood','city','state']
      .forEach(field => { profile.elements[field].value = workspaceUser[field] || ''; });
    setCountryValue(profile, workspaceUser.country || '');
    profile.querySelector('.profile-address-section').open = ['postal_code','street_address','address_number','address_complement','neighborhood','city','state','country'].some(field => workspaceUser[field]);
    updateProfileAddressForm(profile);
    await refreshAddressManager(profile);
  } catch (error) { authFlash(error.message, true); }
}

async function refreshWorkspace() {
  const result = await authRequest(`/api/requests?page=${workspacePage}&filter=${encodeURIComponent(workspaceFilter)}`);
  workspaceRequests = result.items;
  workspaceEvents = new Map();
  (result.events || []).forEach(event => {
    const events = workspaceEvents.get(event.request_id) || [];
    events.push(event);
    workspaceEvents.set(event.request_id, events);
  });
  workspacePagination = result;
  workspacePage = result.page;
  renderRequests();
}

const surveyLabels = {
  google_photos:'Google Fotos',icloud:'iCloud',other_none:'Outro / nenhum',no:'Não',up_to_15:'Até R$ 15',
  '16_to_30':'R$ 16–30',above_30:'Acima de R$ 30',no_space:'Falta de espaço',monthly_cost:'Mensalidade',
  duplicates:'Fotos duplicadas',hard_to_find:'Dificuldade para encontrar',fear_of_loss:'Medo de perder arquivos',none:'Nenhum',
  deleted_files:'Apagou arquivos',upgraded_plan:'Aumentou o plano',cleaner_app:'Aplicativo de limpeza',transferred:'Transferiu arquivos',
  not_solved:'Não resolveu',yes:'Sim',maybe:'Talvez',zero:'Não pagaria',up_to_19_90:'Até R$ 19,90',
  '20_to_49_90':'R$ 20–49,90','50_to_99_90':'R$ 50–99,90','100_plus':'R$ 100 ou mais'
};
const surveyAdminTranslations = {
  'pt-BR':{nav:'Pesquisa',eyebrow:'Pesquisa',title:'Resultados',copy:'Acompanhe respostas, interesse e intenção de compra da pesquisa sobre fotos.',total:'Total de respostas',contact:'Com contato',last24:'Últimas 24 horas',devices:'Envios por dispositivo',other:'Outros',responses:'Respostas recebidas',loading:'Carregando…',refresh:'Atualizar',columns:['Data','Dispositivo','Serviços','Problemas','Interesse','Valor','Contato'],charts:['Dispositivos','Serviços utilizados','Armazenamento adicional','Principais problemas','Soluções tentadas','Interesse na solução','Quanto pagaria'],empty:'Nenhuma resposta recebida.',answer:['resposta','respostas'],page:'Página',of:'de',previous:'Anterior',next:'Próxima'},
  en:{nav:'Survey',eyebrow:'Survey',title:'Results',copy:'Track responses, interest, and purchase intent from the photo survey.',total:'Total responses',contact:'With contact details',last24:'Last 24 hours',devices:'Submissions by device',other:'Other',responses:'Responses received',loading:'Loading…',refresh:'Refresh',columns:['Date','Device','Services','Problems','Interest','Value','Contact'],charts:['Devices','Services used','Additional storage','Main problems','Solutions attempted','Interest in the solution','Willingness to pay'],empty:'No responses received.',answer:['response','responses'],page:'Page',of:'of',previous:'Previous',next:'Next'},
  es:{nav:'Encuesta',eyebrow:'Encuesta',title:'Resultados',copy:'Consulta las respuestas, el interés y la intención de compra de la encuesta sobre fotos.',total:'Total de respuestas',contact:'Con contacto',last24:'Últimas 24 horas',devices:'Envíos por dispositivo',other:'Otros',responses:'Respuestas recibidas',loading:'Cargando…',refresh:'Actualizar',columns:['Fecha','Dispositivo','Servicios','Problemas','Interés','Valor','Contacto'],charts:['Dispositivos','Servicios utilizados','Almacenamiento adicional','Problemas principales','Soluciones intentadas','Interés en la solución','Cuánto pagaría'],empty:'No se recibieron respuestas.',answer:['respuesta','respuestas'],page:'Página',of:'de',previous:'Anterior',next:'Siguiente'},
  it:{nav:'Sondaggio',eyebrow:'Sondaggio',title:'Risultati',copy:'Monitora risposte, interesse e intenzione di acquisto del sondaggio sulle foto.',total:'Risposte totali',contact:'Con contatto',last24:'Ultime 24 ore',devices:'Invii per dispositivo',other:'Altri',responses:'Risposte ricevute',loading:'Caricamento…',refresh:'Aggiorna',columns:['Data','Dispositivo','Servizi','Problemi','Interesse','Valore','Contatto'],charts:['Dispositivi','Servizi utilizzati','Spazio aggiuntivo','Problemi principali','Soluzioni tentate','Interesse nella soluzione','Quanto pagherebbe'],empty:'Nessuna risposta ricevuta.',answer:['risposta','risposte'],page:'Pagina',of:'di',previous:'Precedente',next:'Successiva'},
  fr:{nav:'Sondage',eyebrow:'Sondage',title:'Résultats',copy:'Suivez les réponses, l’intérêt et l’intention d’achat du sondage photo.',total:'Total des réponses',contact:'Avec coordonnées',last24:'Dernières 24 heures',devices:'Envois par appareil',other:'Autres',responses:'Réponses reçues',loading:'Chargement…',refresh:'Actualiser',columns:['Date','Appareil','Services','Problèmes','Intérêt','Valeur','Contact'],charts:['Appareils','Services utilisés','Stockage supplémentaire','Principaux problèmes','Solutions essayées','Intérêt pour la solution','Montant envisagé'],empty:'Aucune réponse reçue.',answer:['réponse','réponses'],page:'Page',of:'sur',previous:'Précédente',next:'Suivante'},
  de:{nav:'Umfrage',eyebrow:'Umfrage',title:'Ergebnisse',copy:'Verfolgen Sie Antworten, Interesse und Kaufabsicht der Foto-Umfrage.',total:'Antworten insgesamt',contact:'Mit Kontaktdaten',last24:'Letzte 24 Stunden',devices:'Einsendungen nach Gerät',other:'Andere',responses:'Eingegangene Antworten',loading:'Wird geladen…',refresh:'Aktualisieren',columns:['Datum','Gerät','Dienste','Probleme','Interesse','Wert','Kontakt'],charts:['Geräte','Genutzte Dienste','Zusätzlicher Speicher','Hauptprobleme','Versuchte Lösungen','Interesse an der Lösung','Zahlungsbereitschaft'],empty:'Keine Antworten eingegangen.',answer:['Antwort','Antworten'],page:'Seite',of:'von',previous:'Zurück',next:'Weiter'}
};
const surveyAdminText=()=>surveyAdminTranslations[workspaceLocale()]||surveyAdminTranslations.en;
const surveyChoicePosition={google_photos:[0,0],icloud:[0,1],other_none:[0,2],no:[1,0],up_to_15:[1,1],'16_to_30':[1,2],above_30:[1,3],no_space:[2,0],monthly_cost:[2,1],duplicates:[2,2],hard_to_find:[2,3],fear_of_loss:[2,4],none:[2,5],deleted_files:[3,0],upgraded_plan:[3,1],cleaner_app:[3,2],transferred:[3,3],not_solved:[3,4],yes:[4,0],maybe:[4,1],zero:[5,0],up_to_19_90:[5,1],'20_to_49_90':[5,2],'50_to_99_90':[5,3],'100_plus':[5,4]};
const surveyLabel = value => {
  const position=surveyChoicePosition[value],translations=typeof surveyTranslations!=='undefined'?(surveyTranslations[workspaceLocale()]||surveyTranslations.en):null;
  if(position&&translations)return translations.questions[position[0]][2][position[1]];
  return surveyLabels[value] || value;
};
function applySurveyAdminLanguage(){const text=surveyAdminText();const nav=document.querySelector('[data-workspace-page-link="survey-admin"]');if(nav)nav.textContent=text.nav;document.querySelector('#surveyAdminEyebrow').textContent=text.eyebrow;document.querySelector('#surveyAdminTitle').textContent=text.title;document.querySelector('#surveyAdminCopy').textContent=text.copy;['total','contact','last24'].forEach(key=>document.querySelector(`[data-survey-admin="${key}"]`).textContent=text[key]);document.querySelector('#surveyDeviceTitle').textContent=text.devices;document.querySelector('[data-device-key="Other"]').textContent=text.other;document.querySelector('#surveyResponsesTitle').textContent=text.responses;document.querySelector('#surveyRefresh').textContent=text.refresh;document.querySelectorAll('[data-survey-column]').forEach((column,index)=>column.textContent=text.columns[index]);if(document.querySelector('#surveyResultCount').textContent.includes('…'))document.querySelector('#surveyResultCount').textContent=text.loading;}
function renderSurveyMetrics(title, metrics) {
  const max = Math.max(1,...metrics.map(item=>item.count));
  return `<article class="survey-chart"><h3>${escapeHtml(title)}</h3>${metrics.length?metrics.map(item=>`<div class="survey-bar"><div><span>${escapeHtml(surveyLabel(item.key))}</span><strong>${item.count}</strong></div><i><b style="width:${Math.round(item.count/max*100)}%"></b></i></div>`).join(''):'<p class="request-empty">Sem respostas.</p>'}</article>`;
}
async function refreshSurveyAdmin() {
  const [stats,page] = await Promise.all([authRequest('/api/admin/photo-survey/stats'),authRequest(`/api/admin/photo-survey/results?page=${surveyResultPage}`)]);
  surveyResultPagination=page;surveyResultPage=page.page;
  const values=[stats.total,stats.with_contact,stats.last_24_hours];document.querySelectorAll('#surveyStats strong').forEach((element,index)=>{element.textContent=values[index];});
  const deviceCounts=Object.fromEntries(stats.devices.map(item=>[item.key,item.count]));document.querySelectorAll('#surveyDeviceStats article').forEach(article=>{const label=article.querySelector('span'),key=label.dataset.deviceKey||label.textContent;article.querySelector('strong').textContent=deviceCounts[key]||0;});
  const text=surveyAdminText();document.querySelector('#surveyCharts').innerHTML=[[text.charts[0],stats.devices],[text.charts[1],stats.storage_services],[text.charts[2],stats.additional_storage],[text.charts[3],stats.recent_problems],[text.charts[4],stats.actions_taken],[text.charts[5],stats.interest],[text.charts[6],stats.willingness_to_pay]].map(([title,items])=>renderSurveyMetrics(title,items)).join('');
  document.querySelector('#surveyResultCount').textContent=`${page.total} ${text.answer[page.total===1?0:1]}`;
  document.querySelector('#surveyResultRows').innerHTML=page.items.length?page.items.map(item=>`<tr><td>${new Intl.DateTimeFormat(workspaceLocale(),{dateStyle:'short',timeStyle:'short'}).format(new Date(item.created_at))}</td><td><code>${escapeHtml(item.ip_address)}</code></td><td><strong>${escapeHtml(item.device_platform)}</strong>${item.user_agent?`<small class="survey-user-agent" title="${escapeHtml(item.user_agent)}">${escapeHtml(item.user_agent)}</small>`:''}</td><td>${item.storage_services.map(surveyLabel).map(escapeHtml).join(', ')}</td><td>${item.recent_problems.map(surveyLabel).map(escapeHtml).join(', ')}</td><td>${escapeHtml(surveyLabel(item.interest))}</td><td>${escapeHtml(surveyLabel(item.willingness_to_pay))}</td><td>${item.contact_email?`<a href="mailto:${escapeHtml(item.contact_email)}">${escapeHtml(item.contact_email)}</a>`:''}${item.contact_email&&item.contact_phone?'<br>':''}${item.contact_phone?escapeHtml(item.contact_phone):'—'}</td></tr>`).join(''):`<tr><td colspan="8">${escapeHtml(text.empty)}</td></tr>`;
  const pagination=document.querySelector('#surveyPagination');pagination.hidden=page.total_pages<=1;pagination.innerHTML=page.total_pages<=1?'':`<button type="button" data-survey-page="${page.page-1}" ${page.page<=1?'disabled':''}>← ${text.previous}</button><span>${text.page} <strong>${page.page}</strong> ${text.of} <strong>${page.total_pages}</strong></span><button type="button" data-survey-page="${page.page+1}" ${page.page>=page.total_pages?'disabled':''}>${text.next} →</button>`;
}

async function refreshCompanies() {
  workspaceCompanies = await authRequest('/api/companies');
  renderCompanies();
}

const addressFieldNames = ['country','postal_code','street_address','address_number','address_complement','neighborhood','city','state'];
function addressEndpoint(form) { return form.id === 'workspaceProfileForm' ? '/api/profile/addresses' : editingCompanyId ? `/api/companies/${editingCompanyId}/addresses` : null; }
function clearAddressEditor(form) {
  form.elements.address_id.value = ''; form.elements.address_label.value = '';
  form.elements.address_type.value = form.id === 'workspaceProfileForm' ? 'other' : 'branch';
  addressFieldNames.forEach(name => { form.elements[name].value = ''; });
  setCountryValue(form, ''); updateProfileAddressForm(form);
}
function addressSummary(address) { return [address.street_address,address.address_number,address.city,address.state,address.country].filter(Boolean).join(', ') || 'Endereço sem dados'; }
async function refreshAddressManager(form) {
  const endpoint = addressEndpoint(form), list = form.querySelector('[data-address-list]');
  if (!endpoint) { list.innerHTML = '<p class="request-empty">Salve a empresa antes de adicionar endereços.</p>'; return; }
  const addresses = await authRequest(endpoint); form._addresses = addresses;
  list.innerHTML = addresses.map(address => `<div class="address-item"><span><strong>${escapeHtml(address.label || ({headquarters:'Matriz',branch:'Filial',correspondence:'Correspondência',other:'Outro'}[address.address_type]))}</strong><small>${escapeHtml(addressSummary(address))}</small></span><div class="address-item-actions"><button type="button" data-address-edit="${address.id}">Editar</button><button class="danger" type="button" data-address-delete="${address.id}">Excluir</button></div></div>`).join('');
}
function editAddress(form,address) {
  form.elements.address_id.value=address.id; form.elements.address_type.value=address.address_type; form.elements.address_label.value=address.label||'';
  addressFieldNames.forEach(name=>{form.elements[name].value=address[name]||'';}); setCountryValue(form,address.country||''); updateProfileAddressForm(form); form.querySelector('.profile-address-section').open=true;
}
async function saveAddress(form) {
  const endpoint=addressEndpoint(form); if(!endpoint){workspaceFlash('Salve a empresa antes de adicionar endereços.',true);return;}
  const id=form.elements.address_id.value, data={address_type:form.elements.address_type.value,label:form.elements.address_label.value}; addressFieldNames.forEach(name=>{data[name]=form.elements[name].value;});
  await authRequest(id?`${endpoint}/${id}`:endpoint,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); clearAddressEditor(form); await refreshAddressManager(form); workspaceFlash('Endereço salvo.');
}
function bindAddressManager(form) {
  form.querySelector('[data-address-new]')?.addEventListener('click',()=>clearAddressEditor(form));
  form.querySelector('[data-address-save]')?.addEventListener('click',()=>saveAddress(form).catch(error=>workspaceFlash(error.message,true)));
  form.querySelector('[data-address-list]')?.addEventListener('click',async event=>{const edit=event.target.closest('[data-address-edit]');if(edit){editAddress(form,form._addresses.find(item=>item.id===edit.dataset.addressEdit));return;}const remove=event.target.closest('[data-address-delete]');if(!remove||!confirm('Excluir este endereço?'))return;try{await authRequest(`${addressEndpoint(form)}/${remove.dataset.addressDelete}`,{method:'DELETE'});await refreshAddressManager(form);workspaceFlash('Endereço excluído com sucesso.');}catch(error){workspaceFlash(error.message,true);}});
}

function companyDisplayName(company) { return company.name || company.legal_name || companyText().unnamed; }
function companyLocation(company) { return [company.city, company.state, company.country].filter(Boolean).join(' · ') || companyText().noLocation; }
function renderCompanies() {
  const list = document.querySelector('#companyList');
  const text = companyText();
  if (!workspaceCompanies.length) { list.innerHTML = `<p class="request-empty">${text.empty}</p>`; return; }
  list.innerHTML = workspaceCompanies.map(company => `<article class="company-card">
    <div><span class="company-visibility ${company.is_public ? 'public' : ''}">${company.is_public ? text.public : text.private}</span><h2>${escapeHtml(companyDisplayName(company))}</h2><p>${escapeHtml(company.description || company.legal_name || text.noDescription)}</p><small>${escapeHtml(companyLocation(company))}</small></div>
    <div class="company-card-actions"><button type="button" data-company-edit="${company.id}">${text.edit}</button><button class="danger" type="button" data-company-delete="${company.id}">${text.delete}</button></div>
  </article>`).join('');
}

async function refreshOffers(){
  if(!workspaceCompanies.length) await refreshCompanies();
  const result=await authRequest(`/api/offers?page=${offerPage}&q=${encodeURIComponent(offerSearch)}`);workspaceOffers=result.items;offerPage=result.page;offerPagination=result;
  const list=document.querySelector('#offerList');
  list.innerHTML=workspaceOffers.length?workspaceOffers.map(o=>`<article class="company-card offer-card" data-offer-open="${o.id}" role="button" tabindex="0"><div><span class="company-visibility ${o.is_active?'public':''}">${o.is_active?'Ativa':'Inativa'}</span><h2>${escapeHtml(o.title||'Oferta sem título')}</h2><p>${escapeHtml(o.description||'Sem descrição')}</p>${o.link?`<small class="offer-link-preview">${escapeHtml(o.link)}</small>`:''}<small>${o.starts_on?formatLocalDate(o.starts_on):'sem início'} — ${o.ends_on?formatLocalDate(o.ends_on):'sem fim'}</small></div><div class="company-card-actions"><button data-offer-edit="${o.id}" type="button">Editar</button><button data-offer-delete="${o.id}" class="danger" type="button">Excluir</button></div></article>`).join(''):'<p class="request-empty">Nenhuma oferta cadastrada.</p>';
  renderOfferPagination();
}
function renderOfferPagination(){const nav=document.querySelector('#offerPagination');if(offerPagination.total_pages<=1){nav.hidden=true;nav.innerHTML='';return;}nav.hidden=false;nav.innerHTML=`<button type="button" data-offer-page="${offerPage-1}" ${offerPage<=1?'disabled':''}>← Anterior</button><span>Página <strong>${offerPage}</strong> de <strong>${offerPagination.total_pages}</strong> · ${offerPagination.total} ofertas</span><button type="button" data-offer-page="${offerPage+1}" ${offerPage>=offerPagination.total_pages?'disabled':''}>Próxima →</button>`;}
function formatLocalDate(iso){if(!iso)return'';const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat(workspaceLocale(),{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(y,m-1,d));}
function parseLocalDate(value){if(!value.trim())return null;const p=value.trim().split(/[^0-9]+/).map(Number);if(p.length!==3)throw new Error('Data inválida.');const us=workspaceLocale()==='en';const [a,b,y]=p;const m=us?a:b,d=us?b:a;if(y<1000||m<1||m>12||d<1||d>31)throw new Error('Data inválida.');return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
async function refreshOfferAssets(id){
  const filterList=document.querySelector('#offerFilterList'),imageList=document.querySelector('#offerImageList');
  (imageList._objectUrls||[]).forEach(url=>URL.revokeObjectURL(url));imageList._objectUrls=[];
  if(!id){filterList.innerHTML='<p class="request-empty">Salve a oferta para adicionar filtros.</p>';imageList.innerHTML='';return;}
  const [filters,images]=await Promise.all([authRequest(`/api/offers/${id}/address-filters`),authRequest(`/api/offers/${id}/images`)]);document.querySelector('#offerForm')._filters=filters;
  filterList.innerHTML=filters.map(f=>`<div class="address-item"><span><strong>${escapeHtml(f.label||'Filtro de endereço')}</strong><small>${escapeHtml([f.country_code,...f.states,...f.cities].filter(Boolean).join(', '))}</small></span><div class="address-item-actions"><button data-filter-edit="${f.id}" type="button">Editar</button><button data-filter-delete="${f.id}" class="danger" type="button">Excluir</button></div></div>`).join('');
  const loaded=await Promise.all(images.map(async image=>({image,url:URL.createObjectURL(await authRequest(`/api/offers/${id}/images/${image.id}`,{responseType:'blob'}))})));imageList._objectUrls=loaded.map(item=>item.url);imageList.innerHTML=loaded.map(({image,url})=>`<div class="offer-image" data-image-id="${image.id}" draggable="true"><span class="offer-image-drag" aria-hidden="true">⠿</span><img src="${url}" alt="${escapeHtml(image.file_name)}"><button data-image-delete="${image.id}" type="button">Excluir</button></div>`).join('');
}
async function saveOfferImageOrder(offerId){const list=document.querySelector('#offerImageList'),image_ids=[...list.querySelectorAll('[data-image-id]')].map(card=>card.dataset.imageId);if(!offerId||!image_ids.length)return;await authRequest(`/api/offers/${offerId}/images/order`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_ids})});}
const offerFilterFields=['label','country_code','postal_range_start','postal_range_end','excluded_postal_range_start','excluded_postal_range_end','number_range_start','number_range_end','excluded_number_range_start','excluded_number_range_end'];
function renderOfferRules(kind){const f=document.querySelector('#offerForm'),rules=f[kind==='postal'?'_postalRules':'_numberRules']||[],grid=f.querySelector(`[data-${kind}-rule-grid]`);grid.innerHTML=rules.length?`<div class="offer-rule-row offer-rule-head"><span>Regra</span><span>Valor</span><span></span></div>`+rules.map((rule,index)=>`<div class="offer-rule-row"><span>${rule.type==='include'?'Incluir':'Excluir'}</span><strong>${escapeHtml(rule.value)}</strong><button type="button" data-${kind}-rule-remove="${index}" aria-label="Remover">×</button></div>`).join(''):'<p class="request-empty">Nenhuma regra adicionada.</p>';}
function addOfferRule(kind){const f=document.querySelector('#offerForm'),type=f.elements[`filter_${kind}_rule_type`].value,input=f.elements[`filter_${kind}_rule_value`],value=input.value.trim();if(!value)return;const key=kind==='postal'?'_postalRules':'_numberRules';if(!f[key].some(x=>x.type===type&&x.value===value))f[key].push({type,value});input.value='';renderOfferRules(kind);}
function renderOfferPeople(){const f=document.querySelector('#offerForm'),grid=f.querySelector('[data-person-grid]'),people=f._targetPeople||[];grid.innerHTML=people.length?`<div class="offer-rule-row offer-rule-head"><span>Tipo</span><span>Pessoa</span><span></span></div>`+people.map((person,index)=>`<div class="offer-rule-row"><span>${escapeHtml(person.identifier_type||'Cadastro')}</span><strong>${escapeHtml(person.nickname||person.id)}</strong><button type="button" data-person-remove="${index}" aria-label="Remover">×</button></div>`).join(''):'<p class="request-empty">Nenhuma pessoa adicionada.</p>';}
function renderFilterChips(){const f=document.querySelector('#offerForm');[['state',f._filterStates||[]],['city',f._filterCities||[]]].forEach(([kind,items])=>{f.querySelector(`[data-filter-${kind}-chips]`).innerHTML=items.map((item,index)=>`<span>${escapeHtml(item)}<button type="button" data-filter-remove-${kind}="${index}" aria-label="Remover ${escapeHtml(item)}">×</button></span>`).join('');});}
function setFilterDependent(){const f=document.querySelector('#offerForm'),active=Boolean(f.elements.filter_country_code.value);f.querySelector('[data-offer-filter-dependent]').hidden=!active;}
async function locationRequest(path,body){return authRequest(`/api/locations/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
function offerCountryName(code){return new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code;}
async function loadOfferStates(){const f=document.querySelector('#offerForm'),code=f.elements.filter_country_code.value;if(!code)return;const country=offerCountryName(code),status=f.querySelector('[data-filter-state-status]');status.textContent='Carregando estados…';try{const data=await locationRequest('states',{country});f._availableStates=(data.items||[]).sort((a,b)=>a.localeCompare(b));document.querySelector('#offerStateOptions').innerHTML=f._availableStates.map(x=>`<option value="${escapeHtml(x)}"></option>`).join('');status.textContent=`${f._availableStates.length} estados ou regiões disponíveis.`;}catch(error){status.textContent='Lista indisponível. Você ainda pode digitar o estado manualmente.';}}
async function loadOfferCities(){const f=document.querySelector('#offerForm'),code=f.elements.filter_country_code.value;if(!code)return;const country=offerCountryName(code),status=f.querySelector('[data-filter-city-status]');status.textContent='Carregando cidades…';try{let cities=[];if(f._filterStates.length){const groups=await Promise.all(f._filterStates.map(state=>locationRequest('cities',{country,state})));cities=groups.flatMap(group=>group.items||[]);}else cities=(await locationRequest('cities',{country})).items||[];f._availableCities=[...new Set(cities)].sort((a,b)=>a.localeCompare(b));document.querySelector('#offerCityOptions').innerHTML=f._availableCities.map(x=>`<option value="${escapeHtml(x)}"></option>`).join('');status.textContent=`${f._availableCities.length} cidades disponíveis.`;}catch(error){status.textContent='Lista indisponível. Você ainda pode digitar a cidade manualmente.';}}
function addFilterLocation(kind){const f=document.querySelector('#offerForm'),input=f.elements[`filter_${kind}_search`],value=input.value.trim();if(!value)return;const key=kind==='state'?'_filterStates':'_filterCities';if(!f[key].includes(value))f[key].push(value);input.value='';renderFilterChips();if(kind==='state')loadOfferCities();}
function clearOfferFilter(){const f=document.querySelector('#offerForm');f.elements.filter_id.value='';offerFilterFields.forEach(n=>f.elements[`filter_${n}`].value='');f.elements.filter_state_search.value='';f.elements.filter_city_search.value='';f._filterStates=[];f._filterCities=[];f._postalRules=[];f._numberRules=[];document.querySelector('#offerStateOptions').innerHTML='';document.querySelector('#offerCityOptions').innerHTML='';renderFilterChips();renderOfferRules('postal');renderOfferRules('number');setFilterDependent();}
function openOfferForm(offer=null){
  const form=document.querySelector('#offerForm');form.noValidate=true;form.reset();form.elements.id.value=offer?.id||'';
  form.elements.company_id.innerHTML=workspaceCompanies.map(c=>`<option value="${c.id}">${escapeHtml(companyDisplayName(c))}</option>`).join('');
  ['company_id','title','description','link'].forEach(n=>{if(offer)form.elements[n].value=offer[n]||'';});renderOfferGenderGrid(offer?.target_gender_identities||[]);
  const datePlaceholder=workspaceLocale()==='en'?'MM/DD/YYYY':workspaceLocale()==='de'?'DD.MM.YYYY':'DD/MM/YYYY';form.querySelectorAll('[data-local-date]').forEach(input=>input.placeholder=datePlaceholder);form.elements.starts_on.value=formatLocalDate(offer?.starts_on);form.elements.ends_on.value=formatLocalDate(offer?.ends_on);
  const source=document.querySelector('#workspaceProfileForm [name="country"]');if(source)form.elements.filter_country_code.innerHTML=source.innerHTML;
  form._targetPeople=(offer?.target_user_ids||[]).map(id=>({id}));renderOfferPeople();form.elements.is_active.checked=Boolean(offer?.is_active);form.hidden=false;clearOfferFilter();refreshOfferAssets(offer?.id).catch(e=>workspaceFlash(e.message,true));
}
function closeOfferForm(){document.querySelector('#offerForm').hidden=true;}

function openCompanyForm(company = null) {
  const form = document.querySelector('#companyForm');
  editingCompanyId = company?.id || null;
  form.reset();
  ['name','legal_name','tax_id','website','email','phone','description','postal_code','street_address','address_number','address_complement','neighborhood','city','state']
    .forEach(field => { form.elements[field].value = company?.[field] || ''; });
  setCountryValue(form, company?.country || '');
  form.elements.is_public.checked = Boolean(company?.is_public);
  form.querySelector('.profile-address-section').open = Boolean(company?.country);
  updateProfileAddressForm(form);
  form.hidden = false;
  refreshAddressManager(form).catch(error => workspaceFlash(error.message, true));
  form.elements.name.focus();
}

function closeCompanyForm() {
  const form = document.querySelector('#companyForm');
  editingCompanyId = null;
  form.reset();
  form.hidden = true;
  updateProfileAddressForm(form);
}

function visibleRequests() {
  return workspaceRequests;
}

function renderPagination() {
  const pagination = document.querySelector('#requestPagination');
  if (workspacePagination.total_pages <= 1) { pagination.hidden = true; pagination.innerHTML = ''; return; }
  const labels = {
    'pt-BR':['Anterior','Página','de','Próxima'],en:['Previous','Page','of','Next'],es:['Anterior','Página','de','Siguiente'],it:['Precedente','Pagina','di','Successiva'],fr:['Précédente','Page','sur','Suivante'],de:['Zurück','Seite','von','Weiter']
  }[workspaceLocale()] || ['Previous','Page','of','Next'];
  pagination.hidden = false;
  pagination.innerHTML = `<button type="button" data-page="${workspacePage - 1}" ${workspacePage <= 1 ? 'disabled' : ''}>← ${labels[0]}</button><span>${labels[1]} <strong>${workspacePage}</strong> ${labels[2]} <strong>${workspacePagination.total_pages}</strong></span><button type="button" data-page="${workspacePage + 1}" ${workspacePage >= workspacePagination.total_pages ? 'disabled' : ''}>${labels[3]} →</button>`;
}

function renderActions(request) {
  const text = workspaceText();
  const cancellation = cancellationTranslations[workspaceLocale()] || cancellationTranslations.en;
  const cancelAction = !closedStatuses.has(request.status) && (workspaceUser.role === 'admin' || request.subscriber_id === workspaceUser.id) ? `<button class="request-action cancel-request" type="button" data-cancel-id="${request.id}">${cancellation[0]}</button>` : '';
  let adminAssignment = '';
  if (workspaceUser.role === 'admin' && !closedStatuses.has(request.status)) {
    adminAssignment = `<form class="assign-form" data-id="${request.id}"><div class="developer-autocomplete"><input class="developer-search" type="text" value="${escapeHtml(request.developer_name || '')}" placeholder="${text.assignPlaceholder}" list="developer-options-${request.id}" autocomplete="off"><input name="developer_id" type="hidden" value="${request.developer_id || ''}"><datalist id="developer-options-${request.id}"></datalist><small class="developer-search-hint">${navTranslations[workspaceLocale()][8]}</small></div><button class="request-action assign-button" type="submit">${text.assign}</button></form>`;
  }
  if (workspaceUser.role === 'admin' && !closedStatuses.has(request.status) && request.status !== 'awaiting_approval') {
    const statusAction = request.status === 'assigned'
      ? `<button class="request-action" data-developer-status="in_progress" data-id="${request.id}">${text.start}</button>`
      : `<button class="request-action primary" data-developer-status="awaiting_approval" data-id="${request.id}">${text.done}</button>`;
    return `${adminAssignment}${statusAction}${cancelAction}`;
  }
  if ((workspaceUser.role === 'developer' || workspaceUser.role === 'admin') && request.developer_id === workspaceUser.id) {
    if (request.status === 'assigned') return `<button class="request-action" data-developer-status="in_progress" data-id="${request.id}">${text.start}</button>${cancelAction}`;
    if (request.status === 'in_progress') return `<button class="request-action primary" data-developer-status="awaiting_approval" data-id="${request.id}">${text.done}</button>${cancelAction}`;
  }
  if (request.subscriber_id === workspaceUser.id && request.status === 'awaiting_approval') {
    return `${adminAssignment}<div class="decision-actions"><button class="request-action approve" data-decision="approved" data-id="${request.id}">${text.approve}</button><button class="request-action reject" data-decision="rejected" data-id="${request.id}">${text.reject}</button></div>${cancelAction}`;
  }
  return `${adminAssignment}${cancelAction}`;
}

function conversationMessagesHtml(messages, requestId) {
  const conversationText = conversationTranslations[workspaceLocale()] || conversationTranslations.en;
  const text = workspaceText();
  const loadMore = conversationHasMore.get(requestId) ? `<button class="load-older-messages" type="button" data-load-older="${requestId}">${conversationText[6]}</button>` : '';
  if (!messages.length) return `${loadMore}<p class="conversation-empty">${conversationText[2]}</p>`;
  return `${loadMore}${messages.map(message => `<article class="conversation-message ${message.author_id === workspaceUser.id ? 'own-message' : ''}"><header><strong>${escapeHtml(message.author_name)}</strong><span>${escapeHtml(text.roles[message.author_role] || message.author_role)} · ${new Intl.DateTimeFormat(workspaceLocale(), { dateStyle:'short',timeStyle:'short' }).format(new Date(message.created_at))}</span></header><p>${escapeHtml(message.body)}</p></article>`).join('')}`;
}

async function pollOpenConversations() {
  if (conversationPolling || document.hidden || workspace.hidden || !openConversations.size) return;
  conversationPolling = true;
  try {
    await Promise.all([...openConversations].map(async id => {
      const page = await authRequest(`/api/requests/${id}/messages`);
      const messages = page.items;
      const previous = requestMessages.get(id) || [];
      if (messages.at(-1)?.id === previous.at(-1)?.id) return;
      const merged = [...previous, ...messages].filter((message,index,array) => array.findIndex(item => item.id === message.id) === index).sort((left,right) => new Date(left.created_at) - new Date(right.created_at) || left.id.localeCompare(right.id));
      requestMessages.set(id, merged);
      const form = document.querySelector(`.conversation-form[data-request-id="${id}"]`);
      const container = form?.closest('.request-conversation')?.querySelector('.conversation-messages');
      if (container) { container.innerHTML = conversationMessagesHtml(merged, id); container.scrollTop = container.scrollHeight; }
    }));
  } catch (error) { console.warn('Conversation update failed', error); }
  finally { conversationPolling = false; }
}

function renderRequests() {
  const text = workspaceText();
  const requests = visibleRequests();
  if (!requests.length) { workspaceList.innerHTML = `<p class="request-empty">${text.empty}</p>`; renderPagination(); return; }
  workspaceList.innerHTML = requests.map(request => {
    const createdLabel = { 'pt-BR':'Criada em',en:'Created',es:'Creada',it:'Creata',fr:'Créée',de:'Erstellt' }[workspaceLocale()] || 'Created';
    const dueDate = request.due_date ? new Intl.DateTimeFormat(workspaceLocale(), { dateStyle:'medium', timeZone:'UTC' }).format(new Date(`${request.due_date}T00:00:00Z`)) : text.noDue;
    const createdDate = new Intl.DateTimeFormat(workspaceLocale(), { dateStyle:'medium' }).format(new Date(request.created_at));
    const timelineLabels = timelineTranslations[workspaceLocale()] || timelineTranslations.en;
    const timelineItems = workspaceEvents.get(request.id) || [];
    const timeline = timelineItems.length ? `<div class="request-timeline">${timelineItems.map(event => {
      const person = event.event_type === 'assigned' ? event.developer_name : event.actor_name;
      return `<div class="timeline-item timeline-${event.event_type}"><i></i><span>${escapeHtml(timelineLabels[event.event_type] || event.event_type)}</span><strong>${new Intl.DateTimeFormat(workspaceLocale(), { dateStyle:'medium',timeStyle:'short' }).format(new Date(event.created_at))}</strong>${person ? `<small>${escapeHtml(person)}</small>` : ''}</div>`;
    }).join('')}</div>` : '';
    const actions = renderActions(request);
    const conversationText = conversationTranslations[workspaceLocale()] || conversationTranslations.en;
    const conversationOpen = openConversations.has(request.id);
    const messages = requestMessages.get(request.id) || [];
    const conversation = conversationOpen ? `<section class="request-conversation"><div class="conversation-messages">${conversationMessagesHtml(messages, request.id)}</div><form class="conversation-form" data-request-id="${request.id}"><textarea name="body" maxlength="5000" required placeholder="${conversationText[3]}"></textarea><button type="submit">${conversationText[4]}</button></form></section>` : '';
    const attachments = `${request.request_attachment_name ? `<button class="attachment-link" data-attachment-id="${request.id}" data-attachment-kind="request" data-attachment-name="${escapeHtml(request.request_attachment_name)}"><span>↓</span><span>${escapeHtml(request.request_attachment_name)}</span></button>` : ''}${request.delivery_attachment_name ? `<button class="attachment-link delivery-attachment" data-attachment-id="${request.id}" data-attachment-kind="delivery" data-attachment-name="${escapeHtml(request.delivery_attachment_name)}"><span>↓</span><span>${escapeHtml(request.delivery_attachment_name)}</span></button>` : ''}`;
    return `<article class="request-row">
      <header class="request-card-header"><div class="request-status status-${request.status}"><i></i>${escapeHtml(text.statuses[request.status] || request.status)}</div><span class="request-reference">#${request.id.slice(0,8).toUpperCase()}</span></header>
      <div class="request-content">
        <p class="request-description">${escapeHtml(request.description)}</p>
        <div class="request-meta"><div><span>${text.due}</span><strong>${escapeHtml(dueDate)}</strong></div><div><span>${text.requestedBy}</span><strong>${escapeHtml(request.subscriber_name)}</strong></div><div><span>${text.developer}</span><strong>${request.developer_name ? escapeHtml(request.developer_name) : text.unassigned}</strong></div><div><span>${createdLabel}</span><strong>${escapeHtml(createdDate)}</strong></div></div>
        ${timeline}
        ${attachments ? `<div class="request-attachments">${attachments}</div>` : ''}
        ${request.developer_note ? `<div class="request-note delivery-note"><span>${text.deliveryNote}</span><p>${escapeHtml(request.developer_note)}</p></div>` : ''}
        ${request.subscriber_feedback ? `<div class="request-note feedback-note"><span>${text.feedback}</span><p>${escapeHtml(request.subscriber_feedback)}</p></div>` : ''}
        ${conversation}
      </div>
      <footer class="request-actions"><button class="conversation-toggle ${conversationOpen ? 'active' : ''}" type="button" data-conversation-id="${request.id}">${conversationOpen ? conversationText[1] : conversationText[0]}</button><div class="request-workflow-actions">${actions}</div></footer>
    </article>`;
  }).join('');
  renderPagination();
}

document.querySelector('#workspaceOpen')?.addEventListener('click', openWorkspace);
document.querySelector('#workspaceClose')?.addEventListener('click', () => { workspace.hidden = true; document.body.classList.remove('workspace-open'); });
document.querySelectorAll('[data-workspace-page-link]').forEach(button => button.addEventListener('click', () => {
  const page = button.dataset.workspacePageLink;
  document.querySelectorAll('[data-workspace-page]').forEach(section => { section.hidden = section.dataset.workspacePage !== page; });
  document.querySelectorAll('[data-workspace-page-link]').forEach(item => item.classList.toggle('active', item === button));
  history.replaceState({}, '', `#app/${page}`);
  if (page === 'companies') refreshCompanies().catch(error => workspaceFlash(error.message, true));
  if (page === 'offers') refreshOffers().catch(error => workspaceFlash(error.message, true));
  if (page === 'survey-admin') refreshSurveyAdmin().catch(error => workspaceFlash(error.message, true));
}));
document.querySelector('#surveyRefresh')?.addEventListener('click',event=>{event.currentTarget.disabled=true;refreshSurveyAdmin().catch(error=>workspaceFlash(error.message,true)).finally(()=>{event.currentTarget.disabled=false;});});
document.querySelector('#surveyPagination')?.addEventListener('click',event=>{const button=event.target.closest('[data-survey-page]');if(!button||button.disabled)return;surveyResultPage=Number(button.dataset.surveyPage);refreshSurveyAdmin().catch(error=>workspaceFlash(error.message,true));});
document.querySelector('#newCompanyOpen')?.addEventListener('click', () => openCompanyForm());
document.querySelector('#newOfferOpen')?.addEventListener('click',async()=>{if(!workspaceCompanies.length)await refreshCompanies();if(!workspaceCompanies.length){workspaceFlash('Cadastre uma empresa antes de criar ofertas.',true);return;}openOfferForm();});
document.querySelector('#offerCancel')?.addEventListener('click',closeOfferForm);
document.querySelector('#offerForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,id=form.elements.id.value,data=Object.fromEntries(new FormData(form));delete data.id;data.is_active=form.elements.is_active.checked;data.target_gender_identities=[...form.querySelectorAll('[name="target_gender_identities"]:checked')].map(x=>x.value);data.target_user_ids=(form._targetPeople||[]).map(x=>x.id);data.starts_on=parseLocalDate(data.starts_on);data.ends_on=parseLocalDate(data.ends_on);offerFilterFields.forEach(n=>delete data[`filter_${n}`]);['filter_postal_rule_type','filter_postal_rule_value','filter_number_rule_type','filter_number_rule_value','person_identifier_type','person_identifier_value'].forEach(n=>delete data[n]);delete data.filter_id;try{const saved=await authRequest(id?`/api/offers/${id}`:'/api/offers',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});form.elements.id.value=saved.id;await saveOfferImageOrder(saved.id);await refreshOffers();await refreshOfferAssets(saved.id);workspaceFlash('Oferta salva. Agora você pode gerenciar filtros e imagens.');}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('#offerList')?.addEventListener('click',async event=>{const remove=event.target.closest('[data-offer-delete]');if(remove){if(confirm('Excluir esta oferta?')){try{await authRequest(`/api/offers/${remove.dataset.offerDelete}`,{method:'DELETE'});await refreshOffers();workspaceFlash('Oferta excluída com sucesso.');}catch(error){workspaceFlash(error.message,true);}}return;}const target=event.target.closest('[data-offer-edit],[data-offer-open]');if(target){const id=target.dataset.offerEdit||target.dataset.offerOpen;openOfferForm(workspaceOffers.find(o=>o.id===id));}});
document.querySelector('#offerList')?.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-offer-open]')){event.preventDefault();openOfferForm(workspaceOffers.find(o=>o.id===event.target.dataset.offerOpen));}});
document.querySelector('#offerSearchForm')?.addEventListener('submit',async event=>{event.preventDefault();offerSearch=event.currentTarget.elements.q.value.trim();offerPage=1;try{await refreshOffers();}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('[data-offer-search-clear]')?.addEventListener('click',async event=>{const form=event.currentTarget.form;form.reset();offerSearch='';offerPage=1;try{await refreshOffers();}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('#offerPagination')?.addEventListener('click',async event=>{const button=event.target.closest('[data-offer-page]');if(!button||button.disabled)return;offerPage=Number(button.dataset.offerPage);try{await refreshOffers();document.querySelector('#offerList').scrollIntoView({behavior:'smooth',block:'start'});}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('[data-filter-new]')?.addEventListener('click',clearOfferFilter);
document.querySelector('#offerForm [name="filter_country_code"]')?.addEventListener('change',async event=>{const form=event.currentTarget.form;form._filterStates=[];form._filterCities=[];renderFilterChips();setFilterDependent();if(event.currentTarget.value){await loadOfferStates();await loadOfferCities();}});
document.querySelector('[data-filter-add-state]')?.addEventListener('click',()=>addFilterLocation('state'));
document.querySelector('[data-filter-add-city]')?.addEventListener('click',()=>addFilterLocation('city'));
document.querySelector('[data-postal-rule-add]')?.addEventListener('click',()=>addOfferRule('postal'));
document.querySelector('[data-number-rule-add]')?.addEventListener('click',()=>addOfferRule('number'));
document.querySelector('[data-postal-rule-grid]')?.addEventListener('click',event=>{const button=event.target.closest('[data-postal-rule-remove]');if(button){button.form._postalRules.splice(Number(button.dataset.postalRuleRemove),1);renderOfferRules('postal');}});
document.querySelector('[data-number-rule-grid]')?.addEventListener('click',event=>{const button=event.target.closest('[data-number-rule-remove]');if(button){button.form._numberRules.splice(Number(button.dataset.numberRuleRemove),1);renderOfferRules('number');}});
document.querySelector('[data-person-add]')?.addEventListener('click',async event=>{const form=event.currentTarget.form,type=form.elements.person_identifier_type.value,input=form.elements.person_identifier_value,value=input.value.trim();if(!value)return;try{const person=await authRequest('/api/offers/people/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier_type:type,value})});if(!form._targetPeople.some(x=>x.id===person.id))form._targetPeople.push({...person,identifier_type:type});input.value='';renderOfferPeople();}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('[data-person-grid]')?.addEventListener('click',event=>{const button=event.target.closest('[data-person-remove]');if(button){button.form._targetPeople.splice(Number(button.dataset.personRemove),1);renderOfferPeople();}});
document.querySelector('[data-filter-state-chips]')?.addEventListener('click',event=>{const button=event.target.closest('[data-filter-remove-state]');if(!button)return;const form=button.form;form._filterStates.splice(Number(button.dataset.filterRemoveState),1);renderFilterChips();loadOfferCities();});
document.querySelector('[data-filter-city-chips]')?.addEventListener('click',event=>{const button=event.target.closest('[data-filter-remove-city]');if(!button)return;const form=button.form;form._filterCities.splice(Number(button.dataset.filterRemoveCity),1);renderFilterChips();});
document.querySelector('[data-filter-save]')?.addEventListener('click',async()=>{const form=document.querySelector('#offerForm'),oid=form.elements.id.value;if(!oid){workspaceFlash('Salve a oferta antes de adicionar filtros.',true);return;}if(!form.elements.filter_country_code.value){workspaceFlash('Selecione o país do filtro.',true);return;}const id=form.elements.filter_id.value,data={states:form._filterStates,cities:form._filterCities,included_postal_codes:form._postalRules.filter(x=>x.type==='include').map(x=>x.value),excluded_postal_codes:form._postalRules.filter(x=>x.type==='exclude').map(x=>x.value),included_numbers:form._numberRules.filter(x=>x.type==='include').map(x=>x.value),excluded_numbers:form._numberRules.filter(x=>x.type==='exclude').map(x=>x.value)};offerFilterFields.forEach(n=>data[n]=form.elements[`filter_${n}`].value);try{await authRequest(id?`/api/offers/${oid}/address-filters/${id}`:`/api/offers/${oid}/address-filters`,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});clearOfferFilter();await refreshOfferAssets(oid);workspaceFlash(id?'Filtro atualizado com sucesso.':'Filtro cadastrado com sucesso.');}catch(e){workspaceFlash(e.message,true);}});
document.querySelector('#offerFilterList')?.addEventListener('click',async event=>{const form=document.querySelector('#offerForm'),oid=form.elements.id.value,edit=event.target.closest('[data-filter-edit]');if(edit){const f=form._filters.find(x=>x.id===edit.dataset.filterEdit);form.elements.filter_id.value=f.id;offerFilterFields.forEach(n=>form.elements[`filter_${n}`].value=f[n]||'');form._filterStates=[...f.states];form._filterCities=[...f.cities];form._postalRules=[...(f.included_postal_codes||[]).map(value=>({type:'include',value})),...(f.excluded_postal_codes||[]).map(value=>({type:'exclude',value}))];form._numberRules=[...(f.included_numbers||[]).map(value=>({type:'include',value})),...(f.excluded_numbers||[]).map(value=>({type:'exclude',value}))];renderFilterChips();renderOfferRules('postal');renderOfferRules('number');setFilterDependent();await loadOfferStates();await loadOfferCities();return;}const del=event.target.closest('[data-filter-delete]');if(del&&confirm('Excluir este filtro?')){try{await authRequest(`/api/offers/${oid}/address-filters/${del.dataset.filterDelete}`,{method:'DELETE'});await refreshOfferAssets(oid);workspaceFlash('Filtro excluído com sucesso.');}catch(error){workspaceFlash(error.message,true);}}});
document.querySelector('[data-image-upload]')?.addEventListener('click',async event=>{const button=event.currentTarget,form=document.querySelector('#offerForm'),oid=form.elements.id.value,input=document.querySelector('#offerImages'),files=[...input.files];if(!oid){workspaceFlash('Salve a oferta antes de enviar imagens.',true);return;}if(!files.length){workspaceFlash('Selecione pelo menos uma imagem.',true);return;}button.disabled=true;try{for(const file of files){const data=new FormData();data.append('image',file);await authRequest(`/api/offers/${oid}/images`,{method:'POST',body:data});}await refreshOfferAssets(oid);input.value='';workspaceFlash(files.length===1?'Imagem enviada.':`${files.length} imagens enviadas.`);}catch(e){workspaceFlash(`A imagem pode ter sido salva, mas a atualização falhou: ${e.message}`,true);}finally{button.disabled=false;}});
document.querySelector('#offerImageList')?.addEventListener('click',async event=>{const del=event.target.closest('[data-image-delete]');if(!del||!confirm('Excluir esta imagem?'))return;const oid=document.querySelector('#offerForm').elements.id.value;try{await authRequest(`/api/offers/${oid}/images/${del.dataset.imageDelete}`,{method:'DELETE'});await refreshOfferAssets(oid);workspaceFlash('Imagem excluída com sucesso.');}catch(error){workspaceFlash(error.message,true);}});
document.querySelector('#offerImageList')?.addEventListener('dragstart',event=>{const list=event.currentTarget,card=event.target.closest('[data-image-id]');if(!card)return;list._dragging=card;list._dropHandled=false;list._dragStartOrder=[...list.querySelectorAll('[data-image-id]')].map(item=>item.dataset.imageId).join(',');card.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',card.dataset.imageId);});
document.querySelector('#offerImageList')?.addEventListener('dragover',event=>{const list=event.currentTarget,dragging=list._dragging;if(!dragging)return;event.preventDefault();event.dataTransfer.dropEffect='move';const target=event.target.closest('[data-image-id]');if(!target||target===dragging)return;const box=target.getBoundingClientRect(),after=event.clientY>box.top+box.height/2||(Math.abs(event.clientY-(box.top+box.height/2))<box.height/3&&event.clientX>box.left+box.width/2);list.insertBefore(dragging,after?target.nextSibling:target);});
document.querySelector('#offerImageList')?.addEventListener('drop',async event=>{event.preventDefault();const list=event.currentTarget,dragging=list._dragging;if(!dragging)return;list._dropHandled=true;dragging.classList.remove('dragging');const oid=document.querySelector('#offerForm').elements.id.value;try{await saveOfferImageOrder(oid);workspaceFlash('Ordem das imagens salva.');}catch(error){workspaceFlash(error.message,true);await refreshOfferAssets(oid);}finally{list._dragging=null;}});
document.querySelector('#offerImageList')?.addEventListener('dragend',async event=>{const list=event.currentTarget;event.target.closest('[data-image-id]')?.classList.remove('dragging');const current=[...list.querySelectorAll('[data-image-id]')].map(item=>item.dataset.imageId).join(','),changed=current!==list._dragStartOrder,handled=list._dropHandled;list._dragging=null;if(!changed||handled)return;const oid=document.querySelector('#offerForm').elements.id.value;try{await saveOfferImageOrder(oid);workspaceFlash('Ordem das imagens salva.');}catch(error){workspaceFlash(error.message,true);await refreshOfferAssets(oid);}});
bindAddressManager(document.querySelector('#workspaceProfileForm'));
bindAddressManager(document.querySelector('#companyForm'));
document.querySelector('#companyCancel')?.addEventListener('click', closeCompanyForm);
document.querySelector('#companyForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = event.submitter;
  const data = Object.fromEntries(new FormData(form));
  delete data.id;
  data.is_public = form.elements.is_public.checked;
  button.disabled = true;
  try {
    const savedCompany = await authRequest(editingCompanyId ? `/api/companies/${editingCompanyId}` : '/api/companies', {
      method: editingCompanyId ? 'PUT' : 'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data)
    });
    if (!editingCompanyId && addressFieldNames.some(name => form.elements[name].value) ) {
      editingCompanyId = savedCompany.id;
      const address = { address_type:form.elements.address_type.value, label:form.elements.address_label.value };
      addressFieldNames.forEach(name => { address[name] = form.elements[name].value; });
      await authRequest(`/api/companies/${savedCompany.id}/addresses`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(address) });
    }
    closeCompanyForm();
    workspaceFlash(companyText().saved);
    await refreshCompanies();
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});
document.querySelector('#companyList')?.addEventListener('click', async event => {
  const edit = event.target.closest('[data-company-edit]');
  if (edit) { openCompanyForm(workspaceCompanies.find(company => company.id === edit.dataset.companyEdit)); return; }
  const remove = event.target.closest('[data-company-delete]');
  if (!remove || !confirm(companyText().deleteConfirm)) return;
  remove.disabled = true;
  try { await authRequest(`/api/companies/${remove.dataset.companyDelete}`, { method:'DELETE' }); await refreshCompanies(); workspaceFlash(companyText().deleted); }
  catch (error) { workspaceFlash(error.message, true); remove.disabled = false; }
});
document.querySelector('#workspaceLogout')?.addEventListener('click', async () => { workspace.hidden = true; document.body.classList.remove('workspace-open'); await signOutAuth(); });
document.querySelector('#newRequestOpen')?.addEventListener('click', () => { requestForm.hidden = false; document.querySelector('#requestDescription').focus(); });
document.querySelector('[data-cancel-request]')?.addEventListener('click', () => { requestForm.hidden = true; requestForm.reset(); });
document.querySelector('#requestDueDate').min = new Date().toISOString().slice(0, 10);

requestForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = requestForm.querySelector('[type="submit"]'); button.disabled = true;
  try {
    const attachment = document.querySelector('#requestAttachment').files[0];
    if (attachment && attachment.size > 10 * 1024 * 1024) throw new Error('Attachment must be at most 10 MB.');
    await authRequest('/api/requests/create', { method: 'POST', body: new FormData(requestForm) });
    requestForm.reset(); requestForm.hidden = true; workspaceFlash(workspaceText().submittedMessage); await refreshWorkspace();
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelectorAll('[data-request-filter]').forEach(button => button.addEventListener('click', async () => {
  workspaceFilter = button.dataset.requestFilter;
  workspacePage = 1;
  document.querySelectorAll('[data-request-filter]').forEach(item => item.classList.toggle('active', item === button));
  try { await refreshWorkspace(); } catch (error) { workspaceFlash(error.message, true); }
}));

document.querySelector('#requestPagination')?.addEventListener('click', async event => {
  const button = event.target.closest('[data-page]'); if (!button || button.disabled) return;
  workspacePage = Number(button.dataset.page);
  button.disabled = true;
  try { await refreshWorkspace(); document.querySelector('#requestList').scrollIntoView({ behavior:'smooth', block:'start' }); }
  catch (error) { workspaceFlash(error.message, true); }
});

workspaceList?.addEventListener('submit', async event => {
  const messageForm = event.target.closest('.conversation-form');
  if (messageForm) {
    event.preventDefault();
    const button = messageForm.querySelector('button'); button.disabled = true;
    try {
      const body = messageForm.elements.body.value.trim();
      const message = await authRequest(`/api/requests/${messageForm.dataset.requestId}/messages`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ body }) });
      requestMessages.set(messageForm.dataset.requestId, [...(requestMessages.get(messageForm.dataset.requestId) || []), message]);
      const requestId = messageForm.dataset.requestId;
      renderRequests();
      workspaceFlash(operationText().message);
      requestAnimationFrame(() => {
        const form = document.querySelector(`.conversation-form[data-request-id="${requestId}"]`);
        const container = form?.closest('.request-conversation')?.querySelector('.conversation-messages');
        if (container) container.scrollTop = container.scrollHeight;
        form?.querySelector('textarea')?.focus();
      });
    } catch (error) { workspaceFlash(error.message, true); button.disabled = false; }
    return;
  }
  const form = event.target.closest('.assign-form'); if (!form) return;
  event.preventDefault();
  if (!form.elements.developer_id.value) { workspaceFlash(navTranslations[workspaceLocale()][9], true); return; }
  try { await authRequest(`/api/requests/${form.dataset.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); workspaceFlash(workspaceText().assignedMessage); await refreshWorkspace(); }
  catch (error) { workspaceFlash(error.message, true); }
});

workspaceList?.addEventListener('input', event => {
  const input = event.target.closest('.developer-search'); if (!input) return;
  const form = input.closest('.assign-form');
  const hidden = form.elements.developer_id;
  const exact = (form._developerResults || []).find(item => item.name.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase());
  hidden.value = exact?.id || '';
  window.clearTimeout(form._developerTimer);
  if (input.value.trim().length < 3) { form.querySelector('datalist').innerHTML = ''; return; }
  form._developerTimer = window.setTimeout(async () => {
    try {
      const results = await authRequest(`/api/requests/developers?q=${encodeURIComponent(input.value.trim())}`);
      form._developerResults = results;
      form.querySelector('datalist').innerHTML = results.map(item => `<option value="${escapeHtml(item.name)}"></option>`).join('');
      const selected = results.find(item => item.name.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase());
      hidden.value = selected?.id || '';
    } catch (error) { workspaceFlash(error.message, true); }
  }, 300);
});

workspaceList?.addEventListener('click', async event => {
  const cancelButton = event.target.closest('[data-cancel-id]');
  if (cancelButton) {
    openCancelDialog(cancelButton.dataset.cancelId);
    return;
  }
  const olderButton = event.target.closest('[data-load-older]');
  if (olderButton) {
    const id = olderButton.dataset.loadOlder;
    const current = requestMessages.get(id) || [];
    if (!current.length) return;
    const container = olderButton.closest('.conversation-messages');
    const previousHeight = container.scrollHeight;
    olderButton.disabled = true;
    try {
      const page = await authRequest(`/api/requests/${id}/messages?before=${current[0].id}`);
      requestMessages.set(id, [...page.items, ...current]);
      conversationHasMore.set(id, page.has_more);
      container.innerHTML = conversationMessagesHtml(requestMessages.get(id), id);
      container.scrollTop = container.scrollHeight - previousHeight;
    } catch (error) { workspaceFlash(error.message, true); olderButton.disabled = false; }
    return;
  }
  const conversationButton = event.target.closest('[data-conversation-id]');
  if (conversationButton) {
    const id = conversationButton.dataset.conversationId;
    if (openConversations.has(id)) { openConversations.delete(id); renderRequests(); return; }
    conversationButton.disabled = true;
    try { const page = await authRequest(`/api/requests/${id}/messages`); requestMessages.set(id, page.items); conversationHasMore.set(id, page.has_more); openConversations.add(id); renderRequests(); requestAnimationFrame(() => { const container = document.querySelector(`.conversation-form[data-request-id="${id}"]`)?.closest('.request-conversation')?.querySelector('.conversation-messages'); if (container) container.scrollTop = container.scrollHeight; }); }
    catch (error) { workspaceFlash(error.message, true); conversationButton.disabled = false; }
    return;
  }
  const attachmentButton = event.target.closest('[data-attachment-id]');
  if (attachmentButton) { await downloadAttachment(attachmentButton); return; }
  const button = event.target.closest('[data-developer-status],[data-decision]'); if (!button) return;
  if (button.dataset.decision) { openDecisionDialog(button.dataset.id, button.dataset.decision); return; }
  if (button.dataset.developerStatus === 'awaiting_approval') { openDeliveryDialog(button.dataset.id); return; }
  button.disabled = true;
  try {
    if (button.dataset.developerStatus) {
      await authRequest(`/api/requests/${button.dataset.id}/developer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: button.dataset.developerStatus }) });
    }
    await refreshWorkspace();
    workspaceFlash(operationText().status);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

async function downloadAttachment(button) {
  button.disabled = true;
  try {
    await authRequest('/api/oauth/me');
    const endpoint = button.dataset.attachmentKind === 'request' ? 'request-attachment' : 'attachment';
    const response = await fetch(faciliseApiUrl(`/api/requests/${button.dataset.attachmentId}/${endpoint}`), { credentials:'include', headers:{ Authorization:`Bearer ${authTokens.access_token}` } });
    if (!response.ok) throw new Error(`${workspaceText().requestFailed || 'Download failed'} (${response.status})`);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = button.dataset.attachmentName; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
}

document.querySelector('[data-cancel-delivery]')?.addEventListener('click', closeDeliveryDialog);
deliveryDialog?.addEventListener('click', event => { if (event.target === deliveryDialog) closeDeliveryDialog(); });
deliveryForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!pendingDeliveryId) return;
  const file = document.querySelector('#deliveryAttachment').files[0];
  if (file && file.size > 10 * 1024 * 1024) { workspaceFlash((deliveryTranslations[workspaceLocale()] || deliveryTranslations.en).file, true); return; }
  const button = document.querySelector('#deliverySubmit'); button.disabled = true;
  try {
    await authRequest(`/api/requests/${pendingDeliveryId}/delivery`, { method:'POST', body:new FormData(deliveryForm) });
    closeDeliveryDialog();
    await refreshWorkspace();
    workspaceFlash(operationText().delivery);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelector('[data-dismiss-cancel]')?.addEventListener('click', closeCancelDialog);
cancelDialog?.addEventListener('click', event => { if (event.target === cancelDialog) closeCancelDialog(); });
cancelForm?.addEventListener('submit', async event => {
  event.preventDefault(); if (!pendingCancelId) return;
  const cancellation = cancellationTranslations[workspaceLocale()] || cancellationTranslations.en;
  const button = document.querySelector('#cancelSubmit'); button.disabled = true;
  try { await authRequest(`/api/requests/${pendingCancelId}/cancel`, { method:'POST' }); closeCancelDialog(); workspaceFlash(cancellation[2]); await refreshWorkspace(); }
  catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelector('#workspaceProfileForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter; button.disabled = true;
  try {
    const profileData=Object.fromEntries(new FormData(event.currentTarget));
    workspaceUser = await authRequest('/api/oauth/me', { method:'PUT', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(profileData) });
    await authRequest('/api/profile/identity',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({gender_identity:profileData.gender_identity,gender_identity_details:profileData.gender_identity_details})});
    workspaceFlash(currentAuthText().profileUpdated);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelector('#workspaceSecurityForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter; button.disabled = true;
  try {
    await authRequest('/api/oauth/change-password', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    workspace.hidden = true; document.body.classList.remove('workspace-open'); await signOutAuth(); authFlash(currentAuthText().passwordChanged);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelector('[data-cancel-decision]')?.addEventListener('click', closeDecisionDialog);
decisionDialog?.addEventListener('click', event => { if (event.target === decisionDialog) closeDecisionDialog(); });
decisionForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!pendingDecision) return;
  const button = document.querySelector('#decisionSubmit');
  button.disabled = true;
  try {
    const feedback = document.querySelector('#decisionFeedback').value.trim() || null;
    await authRequest(`/api/requests/${pendingDecision.id}/decision`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ decision:pendingDecision.decision, feedback }) });
    closeDecisionDialog();
    await refreshWorkspace();
    workspaceFlash(operationText().decision);
  } catch (error) { workspaceFlash(error.message, true); }
  finally { button.disabled = false; }
});

window.addEventListener('facilise:languagechange', applyWorkspaceLanguage);
window.setInterval(pollOpenConversations, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pollOpenConversations(); });
applyWorkspaceLanguage();
