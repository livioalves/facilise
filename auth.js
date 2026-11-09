// OAuth 2.0 Authorization Code + PKCE account integration.
const authModal = document.querySelector('#authModal');
const authOpen = document.querySelector('#authOpen');
const authClose = document.querySelector('#authClose');
const authViews = authModal.querySelectorAll('[data-auth-view]');
const authNotice = document.querySelector('#authNotice');
const appToast = document.querySelector('#appToast');
let appToastTimer = null;
function appFlash(message, error = false) {
  if (!appToast) return;
  window.clearTimeout(appToastTimer);
  appToast.querySelector('[data-app-toast-message]').textContent = message;
  appToast.classList.toggle('error', error);
  appToast.setAttribute('aria-live', error ? 'assertive' : 'polite');
  appToast.hidden = false;
  appToastTimer = window.setTimeout(() => { appToast.hidden = true; }, error ? 8000 : 5000);
}
window.appFlash = appFlash;
document.querySelector('[data-app-toast-close]')?.addEventListener('click', () => { appToast.hidden = true; window.clearTimeout(appToastTimer); });
const authTranslations = {
  en: {
    titles: {
      login: ['Welcome back', 'Sign in to continue', 'Use your email, document, or phone number.'],
      register: ['Get started', 'Create your account', 'A secure account takes less than a minute.'],
      forgot: ['Account recovery', 'Forgot your password?', 'We will send a one-time recovery link if the account exists.'],
      reset: ['Choose a new password', 'Reset your password', 'Use at least 8 characters for your new password.'],
      account: ['Protected area', 'Your account', 'This information came from an authenticated API request.']
    },
    identifier: 'EMAIL, DOCUMENT OR PHONE', password: 'PASSWORD', forgot: 'Forgot password?', signIn: 'Sign in',
    newAccount: 'New to Facilise?', createAccount: 'Create an account', email: 'EMAIL', phone: 'PHONE',
    document: 'ALPHANUMERIC DOCUMENT', already: 'Already registered?', sendRecovery: 'Send recovery email',
    back: '← Back to sign in', newPassword: 'NEW PASSWORD', confirmPassword: 'CONFIRM PASSWORD',
    resetPassword: 'Reset password', currentPassword: 'CURRENT PASSWORD', changePassword: 'Change password',
    updatePassword: 'Update password', profileData: 'Profile data', updateProfile: 'Update profile', saveProfile: 'Save profile', signOut: 'Sign out', accountMenu: 'Account actions', active: 'Active', close: 'Close account dialog', showPassword: 'Show password', hidePassword: 'Hide password',
    identifierPlaceholder: 'you@example.com', passwordPlaceholder: 'At least 8 characters',
    documentPlaceholder: 'ABC123456', accountIdentifierPlaceholder: 'Account identifier', atLeastOneIdentifier: 'Provide at least one: email, document, or phone.',
    passwordRange: '8–128 characters', repeatPassword: 'Repeat your password', documentDetail: 'Document', phoneDetail: 'Phone',
    accountCreated: 'Account created. You can sign in now.', passwordsMismatch: 'The passwords do not match.',
    resetComplete: 'Password reset. Sign in with your new password.', authorizationFailed: 'Authorization failed',
    stateFailed: 'OAuth state validation failed. Start sign-in again.', requestFailed: 'Request failed',
    recoverySent: 'If the account exists, a recovery email will be sent.', passwordChanged: 'Password changed. Existing sessions were revoked.', profileUpdated: 'Profile updated.',
    errors: { invalid_credentials: 'Invalid credentials.', temporarily_unavailable: 'Too many attempts. Try again in one minute.', conflict: 'An account already uses this information.', invalid_grant: 'This authorization or recovery token is invalid or expired.', invalid_token: 'Your session is invalid or expired.', insufficient_scope: 'This session does not have permission for that operation.', invalid_client: 'Invalid OAuth client.', unsupported_grant_type: 'Unsupported OAuth grant type.', server_error: 'The server could not complete the request.' }
  },
  es: {
    titles: {
      login: ['Bienvenido de nuevo', 'Inicia sesión para continuar', 'Usa tu correo, documento o teléfono.'],
      register: ['Comienza ahora', 'Crea tu cuenta', 'Una cuenta segura toma menos de un minuto.'],
      forgot: ['Recuperación de cuenta', '¿Olvidaste tu contraseña?', 'Enviaremos un enlace de recuperación si la cuenta existe.'],
      reset: ['Elige una nueva contraseña', 'Restablece tu contraseña', 'Usa al menos 8 caracteres para tu nueva contraseña.'],
      account: ['Área protegida', 'Tu cuenta', 'Esta información proviene de una solicitud autenticada a la API.']
    },
    identifier: 'CORREO, DOCUMENTO O TELÉFONO', password: 'CONTRASEÑA', forgot: '¿Olvidaste tu contraseña?', signIn: 'Iniciar sesión',
    newAccount: '¿Nuevo en Facilise?', createAccount: 'Crear una cuenta', email: 'CORREO', phone: 'TELÉFONO',
    document: 'DOCUMENTO ALFANUMÉRICO', already: '¿Ya estás registrado?', sendRecovery: 'Enviar correo de recuperación',
    back: '← Volver al inicio de sesión', newPassword: 'NUEVA CONTRASEÑA', confirmPassword: 'CONFIRMAR CONTRASEÑA',
    resetPassword: 'Restablecer contraseña', currentPassword: 'CONTRASEÑA ACTUAL', changePassword: 'Cambiar contraseña',
    updatePassword: 'Actualizar contraseña', profileData: 'Datos del perfil', updateProfile: 'Actualizar perfil', saveProfile: 'Guardar perfil', signOut: 'Cerrar sesión', accountMenu: 'Acciones de la cuenta', active: 'Activa', close: 'Cerrar diálogo de cuenta', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña',
    identifierPlaceholder: 'tu@ejemplo.com', passwordPlaceholder: 'Al menos 8 caracteres',
    documentPlaceholder: 'ABC123456', accountIdentifierPlaceholder: 'Identificador de cuenta', atLeastOneIdentifier: 'Proporciona al menos uno: correo, documento o teléfono.',
    passwordRange: '8–128 caracteres', repeatPassword: 'Repite tu contraseña', documentDetail: 'Documento', phoneDetail: 'Teléfono',
    accountCreated: 'Cuenta creada. Ya puedes iniciar sesión.', passwordsMismatch: 'Las contraseñas no coinciden.',
    resetComplete: 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.', authorizationFailed: 'Autorización fallida',
    stateFailed: 'Falló la validación del estado OAuth. Inicia sesión nuevamente.', requestFailed: 'Solicitud fallida',
    recoverySent: 'Si la cuenta existe, se enviará un correo de recuperación.', passwordChanged: 'Contraseña actualizada. Las sesiones existentes fueron revocadas.', profileUpdated: 'Perfil actualizado.',
    errors: { invalid_credentials: 'Credenciales inválidas.', temporarily_unavailable: 'Demasiados intentos. Inténtalo de nuevo en un minuto.', conflict: 'Ya existe una cuenta con esta información.', invalid_grant: 'El token de autorización o recuperación es inválido o expiró.', invalid_token: 'Tu sesión es inválida o expiró.', insufficient_scope: 'Esta sesión no tiene permiso para esa operación.', invalid_client: 'Cliente OAuth inválido.', unsupported_grant_type: 'Tipo de concesión OAuth no compatible.', server_error: 'El servidor no pudo completar la solicitud.' }
  },
  'pt-BR': {
    titles: {
      login: ['Bem-vindo de volta', 'Entre para continuar', 'Use seu e-mail, documento ou telefone.'],
      register: ['Comece agora', 'Crie sua conta', 'Uma conta segura leva menos de um minuto.'],
      forgot: ['Recuperação de conta', 'Esqueceu sua senha?', 'Enviaremos um link de recuperação se a conta existir.'],
      reset: ['Escolha uma nova senha', 'Redefina sua senha', 'Use pelo menos 8 caracteres na nova senha.'],
      account: ['Área protegida', 'Sua conta', 'Estas informações vieram de uma solicitação autenticada à API.']
    },
    identifier: 'E-MAIL, DOCUMENTO OU TELEFONE', password: 'SENHA', forgot: 'Esqueceu a senha?', signIn: 'Entrar',
    newAccount: 'Novo na Facilise?', createAccount: 'Criar uma conta', email: 'E-MAIL', phone: 'TELEFONE',
    document: 'DOCUMENTO ALFANUMÉRICO', already: 'Já possui cadastro?', sendRecovery: 'Enviar e-mail de recuperação',
    back: '← Voltar para entrar', newPassword: 'NOVA SENHA', confirmPassword: 'CONFIRMAR SENHA',
    resetPassword: 'Redefinir senha', currentPassword: 'SENHA ATUAL', changePassword: 'Alterar senha',
    updatePassword: 'Atualizar senha', profileData: 'Dados do perfil', updateProfile: 'Atualizar perfil', saveProfile: 'Salvar perfil', signOut: 'Sair', accountMenu: 'Ações da conta', active: 'Ativa', close: 'Fechar diálogo da conta', showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha',
    identifierPlaceholder: 'voce@exemplo.com', passwordPlaceholder: 'Pelo menos 8 caracteres',
    documentPlaceholder: 'ABC123456', accountIdentifierPlaceholder: 'Identificador da conta', atLeastOneIdentifier: 'Informe pelo menos um: e-mail, documento ou telefone.',
    passwordRange: '8–128 caracteres', repeatPassword: 'Repita sua senha', documentDetail: 'Documento', phoneDetail: 'Telefone',
    accountCreated: 'Conta criada. Você já pode entrar.', passwordsMismatch: 'As senhas não coincidem.',
    resetComplete: 'Senha redefinida. Entre com sua nova senha.', authorizationFailed: 'Falha na autorização',
    stateFailed: 'A validação do estado OAuth falhou. Inicie novamente.', requestFailed: 'Falha na solicitação',
    recoverySent: 'Se a conta existir, um e-mail de recuperação será enviado.', passwordChanged: 'Senha alterada. As sessões existentes foram revogadas.', profileUpdated: 'Perfil atualizado.',
    errors: { invalid_credentials: 'Credenciais inválidas.', temporarily_unavailable: 'Muitas tentativas. Tente novamente em um minuto.', conflict: 'Já existe uma conta com estas informações.', invalid_grant: 'O token de autorização ou recuperação é inválido ou expirou.', invalid_token: 'Sua sessão é inválida ou expirou.', insufficient_scope: 'Esta sessão não tem permissão para esta operação.', invalid_client: 'Cliente OAuth inválido.', unsupported_grant_type: 'Tipo de concessão OAuth não suportado.', server_error: 'O servidor não conseguiu concluir a solicitação.' }
  }
};

authTranslations.it = {
  ...authTranslations.en,
  titles: {
    login: ['Bentornato', 'Accedi per continuare', 'Usa e-mail, documento o telefono.'],
    register: ['Inizia ora', 'Crea il tuo account', 'Creare un account sicuro richiede meno di un minuto.'],
    forgot: ['Recupero account', 'Hai dimenticato la password?', "Invieremo un link di recupero monouso se l'account esiste."],
    reset: ['Scegli una nuova password', 'Reimposta la password', 'Usa almeno 8 caratteri per la nuova password.'],
    account: ['Area protetta', 'Il tuo account', 'Queste informazioni provengono da una richiesta API autenticata.']
  },
  identifier: 'E-MAIL, DOCUMENTO O TELEFONO', password: 'PASSWORD', forgot: 'Password dimenticata?', signIn: 'Accedi',
  newAccount: 'Nuovo su Facilise?', createAccount: 'Crea un account', email: 'E-MAIL', phone: 'TELEFONO', document: 'DOCUMENTO ALFANUMERICO', already: 'Hai già un account?', sendRecovery: 'Invia e-mail di recupero', back: '← Torna all’accesso',
  newPassword: 'NUOVA PASSWORD', confirmPassword: 'CONFERMA PASSWORD', resetPassword: 'Reimposta password', currentPassword: 'PASSWORD ATTUALE', changePassword: 'Cambia password', updatePassword: 'Aggiorna password', profileData: 'Dati del profilo', updateProfile: 'Aggiorna profilo', saveProfile: 'Salva profilo', signOut: 'Esci', accountMenu: 'Azioni account', active: 'Attivo', close: 'Chiudi finestra account', showPassword: 'Mostra password', hidePassword: 'Nascondi password',
  identifierPlaceholder: 'tu@esempio.com', accountIdentifierPlaceholder: 'Identificativo account', atLeastOneIdentifier: 'Inserisci almeno uno tra e-mail, documento o telefono.', passwordRange: '8–128 caratteri', repeatPassword: 'Ripeti la password', documentDetail: 'Documento', phoneDetail: 'Telefono',
  accountCreated: 'Account creato. Ora puoi accedere.', passwordsMismatch: 'Le password non corrispondono.', resetComplete: 'Password reimpostata. Accedi con la nuova password.', authorizationFailed: 'Autorizzazione non riuscita', stateFailed: 'Convalida OAuth non riuscita. Riprova.', requestFailed: 'Richiesta non riuscita', recoverySent: "Se l'account esiste, verrà inviata un'e-mail di recupero.", passwordChanged: 'Password modificata. Le sessioni esistenti sono state revocate.', profileUpdated: 'Profilo aggiornato.',
  errors: { invalid_credentials: 'Credenziali non valide.', temporarily_unavailable: 'Troppi tentativi. Riprova tra un minuto.', conflict: 'Esiste già un account con questi dati.', invalid_grant: 'Il token non è valido o è scaduto.', invalid_token: 'La sessione non è valida o è scaduta.', insufficient_scope: 'La sessione non dispone dei permessi necessari.', invalid_client: 'Client OAuth non valido.', unsupported_grant_type: 'Tipo di autorizzazione non supportato.', server_error: 'Impossibile completare la richiesta.' }
};

authTranslations.fr = {
  ...authTranslations.en,
  titles: {
    login: ['Bon retour', 'Connectez-vous pour continuer', 'Utilisez votre e-mail, document ou téléphone.'],
    register: ['Commencez maintenant', 'Créez votre compte', 'Créer un compte sécurisé prend moins d’une minute.'],
    forgot: ['Récupération du compte', 'Mot de passe oublié ?', 'Nous enverrons un lien de récupération si le compte existe.'],
    reset: ['Choisissez un nouveau mot de passe', 'Réinitialisez votre mot de passe', 'Utilisez au moins 8 caractères.'],
    account: ['Zone protégée', 'Votre compte', 'Ces informations proviennent d’une requête API authentifiée.']
  },
  identifier: 'E-MAIL, DOCUMENT OU TÉLÉPHONE', password: 'MOT DE PASSE', forgot: 'Mot de passe oublié ?', signIn: 'Connexion',
  newAccount: 'Nouveau sur Facilise ?', createAccount: 'Créer un compte', email: 'E-MAIL', phone: 'TÉLÉPHONE', document: 'DOCUMENT ALPHANUMÉRIQUE', already: 'Déjà inscrit ?', sendRecovery: 'Envoyer l’e-mail de récupération', back: '← Retour à la connexion',
  newPassword: 'NOUVEAU MOT DE PASSE', confirmPassword: 'CONFIRMER LE MOT DE PASSE', resetPassword: 'Réinitialiser', currentPassword: 'MOT DE PASSE ACTUEL', changePassword: 'Modifier le mot de passe', updatePassword: 'Mettre à jour', profileData: 'Données du profil', updateProfile: 'Mettre à jour le profil', saveProfile: 'Enregistrer', signOut: 'Déconnexion', accountMenu: 'Actions du compte', active: 'Actif', close: 'Fermer la fenêtre du compte', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe',
  identifierPlaceholder: 'vous@exemple.com', accountIdentifierPlaceholder: 'Identifiant du compte', atLeastOneIdentifier: 'Indiquez au moins un e-mail, document ou téléphone.', passwordRange: '8 à 128 caractères', repeatPassword: 'Répétez le mot de passe', documentDetail: 'Document', phoneDetail: 'Téléphone',
  accountCreated: 'Compte créé. Vous pouvez vous connecter.', passwordsMismatch: 'Les mots de passe ne correspondent pas.', resetComplete: 'Mot de passe réinitialisé. Connectez-vous avec le nouveau mot de passe.', authorizationFailed: 'Échec de l’autorisation', stateFailed: 'Échec de la validation OAuth. Recommencez.', requestFailed: 'Échec de la requête', recoverySent: 'Si le compte existe, un e-mail de récupération sera envoyé.', passwordChanged: 'Mot de passe modifié. Les sessions existantes ont été révoquées.', profileUpdated: 'Profil mis à jour.',
  errors: { invalid_credentials: 'Identifiants incorrects.', temporarily_unavailable: 'Trop de tentatives. Réessayez dans une minute.', conflict: 'Un compte utilise déjà ces informations.', invalid_grant: 'Le jeton est invalide ou expiré.', invalid_token: 'Votre session est invalide ou expirée.', insufficient_scope: 'Cette session ne dispose pas des autorisations nécessaires.', invalid_client: 'Client OAuth invalide.', unsupported_grant_type: 'Type d’autorisation non pris en charge.', server_error: 'Le serveur n’a pas pu terminer la requête.' }
};

authTranslations.de = {
  ...authTranslations.en,
  titles: {
    login: ['Willkommen zurück', 'Zum Fortfahren anmelden', 'Verwenden Sie E-Mail, Dokument oder Telefonnummer.'],
    register: ['Jetzt starten', 'Konto erstellen', 'Ein sicheres Konto ist in weniger als einer Minute erstellt.'],
    forgot: ['Kontowiederherstellung', 'Passwort vergessen?', 'Wenn das Konto existiert, senden wir einen einmaligen Wiederherstellungslink.'],
    reset: ['Neues Passwort wählen', 'Passwort zurücksetzen', 'Verwenden Sie mindestens 8 Zeichen.'],
    account: ['Geschützter Bereich', 'Ihr Konto', 'Diese Daten stammen aus einer authentifizierten API-Anfrage.']
  },
  identifier: 'E-MAIL, DOKUMENT ODER TELEFON', password: 'PASSWORT', forgot: 'Passwort vergessen?', signIn: 'Anmelden',
  newAccount: 'Neu bei Facilise?', createAccount: 'Konto erstellen', email: 'E-MAIL', phone: 'TELEFON', document: 'ALPHANUMERISCHES DOKUMENT', already: 'Bereits registriert?', sendRecovery: 'Wiederherstellungs-E-Mail senden', back: '← Zurück zur Anmeldung',
  newPassword: 'NEUES PASSWORT', confirmPassword: 'PASSWORT BESTÄTIGEN', resetPassword: 'Passwort zurücksetzen', currentPassword: 'AKTUELLES PASSWORT', changePassword: 'Passwort ändern', updatePassword: 'Passwort aktualisieren', profileData: 'Profildaten', updateProfile: 'Profil aktualisieren', saveProfile: 'Profil speichern', signOut: 'Abmelden', accountMenu: 'Kontoaktionen', active: 'Aktiv', close: 'Kontofenster schließen', showPassword: 'Passwort anzeigen', hidePassword: 'Passwort ausblenden',
  identifierPlaceholder: 'sie@beispiel.de', accountIdentifierPlaceholder: 'Konto-ID', atLeastOneIdentifier: 'Geben Sie mindestens E-Mail, Dokument oder Telefon an.', passwordRange: '8–128 Zeichen', repeatPassword: 'Passwort wiederholen', documentDetail: 'Dokument', phoneDetail: 'Telefon',
  accountCreated: 'Konto erstellt. Sie können sich jetzt anmelden.', passwordsMismatch: 'Die Passwörter stimmen nicht überein.', resetComplete: 'Passwort zurückgesetzt. Melden Sie sich mit dem neuen Passwort an.', authorizationFailed: 'Autorisierung fehlgeschlagen', stateFailed: 'OAuth-Prüfung fehlgeschlagen. Starten Sie erneut.', requestFailed: 'Anfrage fehlgeschlagen', recoverySent: 'Wenn das Konto existiert, wird eine Wiederherstellungs-E-Mail gesendet.', passwordChanged: 'Passwort geändert. Bestehende Sitzungen wurden widerrufen.', profileUpdated: 'Profil aktualisiert.',
  errors: { invalid_credentials: 'Ungültige Anmeldedaten.', temporarily_unavailable: 'Zu viele Versuche. Bitte warten Sie eine Minute.', conflict: 'Ein Konto verwendet diese Daten bereits.', invalid_grant: 'Das Token ist ungültig oder abgelaufen.', invalid_token: 'Ihre Sitzung ist ungültig oder abgelaufen.', insufficient_scope: 'Diese Sitzung hat nicht die erforderliche Berechtigung.', invalid_client: 'Ungültiger OAuth-Client.', unsupported_grant_type: 'Nicht unterstützter Autorisierungstyp.', server_error: 'Der Server konnte die Anfrage nicht abschließen.' }
};

const profileAddressTranslations = {
  'pt-BR':['Endereço (opcional)','País','CEP','Logradouro','Número','Complemento','Bairro','Cidade','Estado'],
  en:['Address (optional)','Country','Postal code','Street','Number','Complement','Neighborhood','City','State'],
  es:['Dirección (opcional)','País','Código postal','Calle','Número','Complemento','Barrio','Ciudad','Estado'],
  it:['Indirizzo (facoltativo)','Paese','CAP','Via','Numero','Complemento','Quartiere','Città','Stato'],
  fr:['Adresse (facultative)','Pays','Code postal','Rue','Numéro','Complément','Quartier','Ville','Région'],
  de:['Adresse (optional)','Land','Postleitzahl','Straße','Nummer','Adresszusatz','Stadtteil','Stadt','Bundesland']
};
const genericAddressTranslations = {
  'pt-BR':{postalCode:'Código postal',street:'Linha de endereço 1',number:'Linha de endereço 2',complement:'Linha de endereço 3',neighborhood:'Distrito / área',city:'Cidade / localidade',state:'Estado / província / região'},
  en:{postalCode:'Postal code',street:'Address line 1',number:'Address line 2',complement:'Address line 3',neighborhood:'District / area',city:'City / locality',state:'State / province / region'},
  es:{postalCode:'Código postal',street:'Dirección línea 1',number:'Dirección línea 2',complement:'Dirección línea 3',neighborhood:'Distrito / zona',city:'Ciudad / localidad',state:'Estado / provincia / región'},
  it:{postalCode:'Codice postale',street:'Indirizzo riga 1',number:'Indirizzo riga 2',complement:'Indirizzo riga 3',neighborhood:'Distretto / zona',city:'Città / località',state:'Stato / provincia / regione'},
  fr:{postalCode:'Code postal',street:'Adresse ligne 1',number:'Adresse ligne 2',complement:'Adresse ligne 3',neighborhood:'Quartier / zone',city:'Ville / localité',state:'État / province / région'},
  de:{postalCode:'Postleitzahl',street:'Adresszeile 1',number:'Adresszeile 2',complement:'Adresszeile 3',neighborhood:'Bezirk / Gebiet',city:'Stadt / Ort',state:'Bundesland / Provinz / Region'}
};
const postalCodeMessages = {
  'pt-BR':['Consultando CEP…','Endereço preenchido pelo CEP.','CEP não encontrado.','Informe um CEP brasileiro com 8 dígitos.','Não foi possível consultar o CEP.'],
  en:['Looking up postal code…','Address filled from postal code.','Postal code not found.','Enter an 8-digit Brazilian postal code.','Postal-code lookup failed.'],
  es:['Consultando código postal…','Dirección completada.','Código postal no encontrado.','Ingresa un CEP brasileño de 8 dígitos.','No se pudo consultar el código postal.']
};
const countrySelectPlaceholders = { 'pt-BR':'Selecione o país',en:'Select country',es:'Selecciona el país',it:'Seleziona il paese',fr:'Sélectionnez le pays',de:'Land auswählen' };
const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');

function populateCountrySelect(form) {
  const select = form?.elements.country;
  if (!select) return;
  const locale = profileAddressLocale();
  const current = select.value;
  if (select.dataset.locale === locale && select.options.length > 1) return;
  let names;
  try { names = new Intl.DisplayNames([locale], { type:'region' }); }
  catch (_) { names = { of: code => code }; }
  const countries = countryCodes.map(code => ({ code, name:names.of(code) || code }))
    .sort((left,right) => left.name.localeCompare(right.name, locale));
  select.replaceChildren(new Option(countrySelectPlaceholders[locale] || countrySelectPlaceholders.en, ''));
  countries.forEach(country => select.add(new Option(country.name, country.code)));
  if (current) setCountryValue(form, current);
  select.dataset.locale = locale;
}
function setCountryValue(form, value) {
  const select = form.elements.country;
  if (!value) { select.value = ''; return; }
  const aliases = { brasil:'BR',brazil:'BR',brésil:'BR',brasile:'BR' };
  const normalized = value.trim().toLocaleLowerCase();
  const code = value.length === 2 ? value.toUpperCase() : aliases[normalized];
  if (code && countryCodes.includes(code)) { select.value = code; return; }
  const matching = [...select.options].find(option => option.textContent.toLocaleLowerCase() === normalized);
  if (matching) { select.value = matching.value; return; }
  select.add(new Option(value, value, true, true));
}

function profileAddressLocale() {
  return document.querySelector('#languageSelect')?.value || document.documentElement.lang || 'pt-BR';
}
function isBrazilCountry(value) {
  return ['br','brasil','brazil','brésil','brasile'].includes((value || '').trim().toLocaleLowerCase());
}
function setAddressFieldLabel(element, value) {
  if (element.matches('label')) setLeadingText(element, value);
  else element.textContent = value;
}
function updateProfileAddressForm(form) {
  if (!form) return;
  populateCountrySelect(form);
  const locale = profileAddressLocale();
  const standard = profileAddressTranslations[locale] || profileAddressTranslations.en;
  const generic = genericAddressTranslations[locale] || genericAddressTranslations.en;
  const brazil = isBrazilCountry(form.elements.country.value);
  const countrySelected = Boolean(form.elements.country.value);
  const brazilLabels = { country:standard[1],postalCode:standard[2],street:standard[3],number:standard[4],complement:standard[5],neighborhood:standard[6],city:standard[7],state:standard[8] };
  form.querySelectorAll('[data-address-label]').forEach(element => {
    const field = element.dataset.addressLabel;
    setAddressFieldLabel(element, field === 'country' ? standard[1] : (brazil ? brazilLabels[field] : generic[field]));
  });
  form.elements.postal_code.inputMode = brazil ? 'numeric' : 'text';
  form.elements.postal_code.placeholder = brazil ? '00000-000' : '';
  form.querySelector('.profile-address-title').textContent = standard[0];
  form.querySelectorAll('[data-address-dependent]').forEach(element => { element.hidden = !countrySelected; });
  if (!brazil) {
    const status = form.querySelector('.postal-code-status');
    status.textContent = '';
    status.classList.remove('error');
  }
}
async function lookupBrazilianPostalCode(form) {
  if (!isBrazilCountry(form.elements.country.value)) return;
  const digits = form.elements.postal_code.value.replace(/\D/g, '');
  const status = form.querySelector('.postal-code-status');
  const messages = postalCodeMessages[profileAddressLocale()] || postalCodeMessages.en;
  status.classList.remove('error');
  if (!digits) { status.textContent = ''; return; }
  if (digits.length !== 8) { status.textContent = messages[3]; status.classList.add('error'); return; }
  status.textContent = messages[0];
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) throw new Error('postal lookup failed');
    const address = await response.json();
    if (address.erro) { status.textContent = messages[2]; status.classList.add('error'); return; }
    form.elements.postal_code.value = address.cep || form.elements.postal_code.value;
    form.elements.street_address.value = address.logradouro || '';
    form.elements.neighborhood.value = address.bairro || '';
    form.elements.city.value = address.localidade || '';
    form.elements.state.value = address.uf || '';
    status.textContent = messages[1];
    form.elements.address_number.focus();
  } catch (_) {
    status.textContent = messages[4];
    status.classList.add('error');
  }
}
function attachProfileAddressForm(form) {
  if (!form || form.dataset.addressReady) return;
  form.dataset.addressReady = 'true';
  form.elements.country.addEventListener('change', () => updateProfileAddressForm(form));
  form.elements.postal_code.addEventListener('blur', () => lookupBrazilianPostalCode(form));
  updateProfileAddressForm(form);
}

let currentAuthView = 'login';
function currentAuthText() {
  const selectedLanguage = document.querySelector('#languageSelect')?.value;
  const pageLanguage = document.documentElement.lang;
  return authTranslations[selectedLanguage || pageLanguage] || authTranslations['pt-BR'];
}

function updateAuthEntry() {
  const locale = document.querySelector('#languageSelect')?.value || document.documentElement.lang;
  const labels = { 'pt-BR':'Acessar área logada',en:'Open workspace',es:'Acceder al área privada',it:'Accedi all’area riservata',fr:'Accéder à l’espace privé',de:'Zum Arbeitsbereich' };
  if (authTokens) {
    authOpen.textContent = labels[locale] || labels.en;
    authOpen.classList.add('is-authenticated');
  } else {
    const signIn = { 'pt-BR':'Entrar',en:'Sign in',es:'Entrar',it:'Accedi',fr:'Connexion',de:'Anmelden' };
    authOpen.textContent = signIn[locale] || signIn.en;
    authOpen.classList.remove('is-authenticated');
  }
}

const authParams = new URLSearchParams(location.search);
const OAUTH_CLIENT_ID = 'facilise-web';
const OAUTH_REDIRECT_URI = `${location.origin}/callback`;
const OAUTH_SCOPE = 'profile account:write';
let authTokens = JSON.parse(sessionStorage.getItem('facilise.tokens') || 'null');

function showAuth(view) {
  currentAuthView = view;
  authViews.forEach(element => element.hidden = element.dataset.authView !== view);
  const [kicker, title, copy] = currentAuthText().titles[view];
  document.querySelector('#authKicker').textContent = kicker;
  document.querySelector('#authTitle').textContent = title;
  document.querySelector('#authCopy').textContent = copy;
  authNotice.hidden = true;
  authNotice.classList.remove('error');
  authModal.hidden = false;
  document.body.classList.add('auth-open');
  if (view === 'account') showAccountPanel('profile');
  requestAnimationFrame(() => authModal.querySelector('[data-auth-view]:not([hidden]) input:not([type="hidden"])')?.focus());
}

function showAccountPanel(panel) {
  document.querySelectorAll('[data-auth-account-content]').forEach(content => {
    content.hidden = content.dataset.authAccountContent !== panel;
  });
  document.querySelectorAll('[data-auth-account-panel]').forEach(button => {
    const active = button.dataset.authAccountPanel === panel;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  authNotice.hidden = true;
  requestAnimationFrame(() => document.querySelector(`[data-auth-account-content="${panel}"] input`)?.focus());
}

function closeAuth() {
  authModal.hidden = true;
  document.body.classList.remove('auth-open');
  authOpen.focus({ preventScroll: true });
}

function authFlash(message, error = false) {
  appFlash(message, error);
  authNotice.textContent = message;
  authNotice.classList.toggle('error', error);
  authNotice.hidden = false;
}

function authPayload(form) { return Object.fromEntries(new FormData(form)); }
const apiMessageTranslations = {
  'correspondence address already exists': {
    'pt-BR':'Já existe um endereço de correspondência cadastrado.',
    en:'A correspondence address is already registered.',
    es:'Ya existe una dirección de correspondencia registrada.',
    it:'È già registrato un indirizzo per la corrispondenza.',
    fr:'Une adresse de correspondance est déjà enregistrée.',
    de:'Eine Korrespondenzadresse ist bereits registriert.'
  },
  'could not save address': {
    'pt-BR':'Não foi possível salvar o endereço.',
    en:'The address could not be saved.',
    es:'No se pudo guardar la dirección.',
    it:'Non è stato possibile salvare l’indirizzo.',
    fr:'L’adresse n’a pas pu être enregistrée.',
    de:'Die Adresse konnte nicht gespeichert werden.'
  },
  'invalid address type': {
    'pt-BR':'O tipo de endereço é inválido.',
    en:'The address type is invalid.',
    es:'El tipo de dirección no es válido.',
    it:'Il tipo di indirizzo non è valido.',
    fr:'Le type d’adresse n’est pas valide.',
    de:'Der Adresstyp ist ungültig.'
  },
  'address not found': {
    'pt-BR':'Endereço não encontrado.',
    en:'Address not found.',
    es:'Dirección no encontrada.',
    it:'Indirizzo non trovato.',
    fr:'Adresse introuvable.',
    de:'Adresse nicht gefunden.'
  }
};
function translatedApiMessage(message) {
  if (!message) return null;
  const translations = apiMessageTranslations[String(message).trim().toLowerCase()];
  const locale = document.querySelector('#languageSelect')?.value || document.documentElement.lang || 'pt-BR';
  return translations?.[locale] || translations?.en || message;
}
function authError(body, status) {
  return currentAuthText().errors[body?.error] || translatedApiMessage(body?.error_description || body?.message) || `${currentAuthText().requestFailed} (${status})`;
}

function setLeadingText(element, text) {
  if (!element) return;
  const textNode = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
  if (textNode) textNode.nodeValue = `${text} `;
  else element.prepend(`${text} `);
}

function applyAuthLanguage() {
  const text = currentAuthText();
  const labels = {
    '#authLoginForm label:nth-of-type(1)': text.identifier,
    '#authLoginForm label:nth-of-type(2)': text.password,
    '#authRegisterForm label:has([name="email"])': text.email,
    '#authRegisterForm label:has([name="phone_number"])': text.phone,
    '#authRegisterForm label:has([name="document_alpha"])': text.document,
    '#developerNicknameField': 'NICK',
    '#authRegisterForm label:has([name="password"])': text.password,
    '#authForgotForm label': text.identifier,
    '#authResetForm label:nth-of-type(1)': text.newPassword,
    '#authResetForm label:nth-of-type(2)': text.confirmPassword,
    '#authProfileForm .auth-grid-two label:nth-child(1)': text.email,
    '#authProfileForm .auth-grid-two label:nth-child(2)': text.phone,
    '#authProfileForm > label:has([name="nickname"])': 'NICK',
    '#authProfileForm > label:has([name="document_alpha"])': text.document,
    '#authChangeForm label:nth-of-type(1)': text.currentPassword,
    '#authChangeForm label:nth-of-type(2)': text.newPassword
  };
  Object.entries(labels).forEach(([selector, value]) => setLeadingText(document.querySelector(selector), value));
  updateProfileAddressForm(document.querySelector('#authProfileForm'));
  const roleCopy = {
    'pt-BR': ['TIPO DE CONTA', 'Assinante — preciso de software', 'Desenvolvedor de software — entrego solicitações'],
    es: ['TIPO DE CUENTA', 'Suscriptor — necesito software', 'Desarrollador de software — entrego solicitudes'],
    it: ['TIPO DI ACCOUNT', 'Abbonato — ho bisogno di software', 'Sviluppatore software — realizzo richieste'],
    fr: ['TYPE DE COMPTE', 'Abonné — j’ai besoin de logiciels', 'Développeur — je réalise les demandes'],
    de: ['KONTOTYP', 'Abonnent — ich benötige Software', 'Softwareentwickler — ich bearbeite Anfragen'],
    en: ['ACCOUNT TYPE', 'Subscriber — I need software', 'Software developer — I deliver requests']
  }[document.querySelector('#languageSelect')?.value || 'pt-BR'];
  setLeadingText(document.querySelector('#authRegisterForm label:has([name="role"])'), roleCopy[0]);
  document.querySelector('#authRegisterForm [name="role"] option[value="subscriber"]').textContent = roleCopy[1];
  document.querySelector('#authRegisterForm [name="role"] option[value="developer"]').textContent = roleCopy[2];

  setLeadingText(document.querySelector('#authLoginForm .auth-primary'), text.signIn);
  setLeadingText(document.querySelector('#authRegisterForm .auth-primary'), text.createAccount);
  setLeadingText(document.querySelector('#authForgotForm .auth-primary'), text.sendRecovery);
  setLeadingText(document.querySelector('#authResetForm .auth-primary'), text.resetPassword);
  setLeadingText(document.querySelector('#authProfileForm .auth-primary'), text.saveProfile);
  setLeadingText(document.querySelector('#authChangeForm .auth-primary'), text.updatePassword);
  setLeadingText(document.querySelector('#authLoginForm .auth-switch'), text.newAccount);
  setLeadingText(document.querySelector('#authRegisterForm .auth-switch'), text.already);

  document.querySelector('[data-auth-go="forgot"]').textContent = text.forgot;
  document.querySelector('#authLoginForm [data-auth-go="register"]').textContent = text.createAccount;
  document.querySelector('#authRegisterForm [data-auth-go="login"]').textContent = text.signIn;
  document.querySelector('#authForgotForm [data-auth-go="login"]').textContent = text.back;
  document.querySelector('#authProfileForm h3').textContent = text.updateProfile;
  document.querySelector('#authProfileForm .auth-field-note').textContent = text.atLeastOneIdentifier;
  document.querySelector('#authChangeForm h3').textContent = text.changePassword;
  document.querySelector('#authIdentifierHint').textContent = text.atLeastOneIdentifier;
  document.querySelector('[data-auth-account-panel="profile"]').textContent = text.profileData;
  document.querySelector('[data-auth-account-panel="password"]').textContent = text.changePassword;
  document.querySelector('#authLogout').textContent = text.signOut;
  document.querySelector('.auth-account-menu').setAttribute('aria-label', text.accountMenu);
  document.querySelector('.auth-badge').textContent = text.active;
  document.querySelector('.auth-details div:nth-child(1) dt').textContent = text.documentDetail;
  document.querySelector('.auth-details div:nth-child(2) dt').textContent = text.phoneDetail;
  authClose.setAttribute('aria-label', text.close);
  document.querySelectorAll('.auth-password-toggle').forEach(toggle => {
    toggle.setAttribute('aria-label', toggle.classList.contains('is-visible') ? text.hidePassword : text.showPassword);
  });

  document.querySelector('#authLoginForm [name="username"]').placeholder = text.identifierPlaceholder;
  document.querySelector('#authLoginForm [name="password"]').placeholder = text.passwordPlaceholder;
  document.querySelector('#authRegisterForm [name="email"]').placeholder = text.identifierPlaceholder;
  document.querySelector('#authRegisterForm [name="document_alpha"]').placeholder = text.documentPlaceholder;
  document.querySelector('#authRegisterForm [name="nickname"]').placeholder = { 'pt-BR':'Seu nome público',es:'Tu nombre público',it:'Il tuo nome pubblico',fr:'Votre nom public',de:'Ihr öffentlicher Name',en:'Your public name' }[document.documentElement.lang] || 'Your public name';
  document.querySelector('#authRegisterForm [name="password"]').placeholder = text.passwordRange;
  document.querySelector('#authForgotForm [name="identifier"]').placeholder = text.accountIdentifierPlaceholder;
  document.querySelector('#authResetForm [name="new_password"]').placeholder = text.passwordRange;
  document.querySelector('#authResetForm [name="confirm_password"]').placeholder = text.repeatPassword;
  document.querySelector('#authProfileForm [name="email"]').placeholder = text.identifierPlaceholder;
  document.querySelector('#authProfileForm [name="document_alpha"]').placeholder = text.documentPlaceholder;

  const [kicker, title, copy] = text.titles[currentAuthView];
  document.querySelector('#authKicker').textContent = kicker;
  document.querySelector('#authTitle').textContent = title;
  document.querySelector('#authCopy').textContent = copy;
  updateAuthEntry();
}
function saveAuthTokens(value) {
  authTokens = value;
  sessionStorage.setItem('facilise.tokens', JSON.stringify(value));
  updateAuthEntry();
}
let authRefreshPromise = null;
async function refreshAuthTokens() {
  if (authRefreshPromise) return authRefreshPromise;
  const refreshToken = authTokens?.refresh_token;
  if (!refreshToken) return false;
  authRefreshPromise = (async () => {
    const body = new URLSearchParams({
      grant_type: 'refresh_token', client_id: OAUTH_CLIENT_ID, refresh_token: refreshToken
    });
    const response = await fetch(faciliseApiUrl('/api/oauth/token'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
    });
    if (!response.ok) return false;
    saveAuthTokens(await response.json());
    return true;
  })().finally(() => { authRefreshPromise = null; });
  return authRefreshPromise;
}

async function authRequest(path, options = {}, retry = true) {
  const { responseType, ...fetchOptions } = options;
  const headers = new Headers(options.headers || {});
  const requestAccessToken = authTokens?.access_token;
  if (requestAccessToken) headers.set('Authorization', `Bearer ${requestAccessToken}`);
  const response = await fetch(faciliseApiUrl(path), { credentials: 'include', ...fetchOptions, headers });
  if (response.status === 401 && retry && authTokens?.refresh_token) {
    if (authTokens?.access_token !== requestAccessToken || await refreshAuthTokens()) return authRequest(path, options, false);
    await signOutAuth();
  }
  const body = responseType === 'blob' && response.ok ? await response.blob() : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(authError(body, response.status));
  return body;
}

async function runAuth(button, operation) {
  button.disabled = true;
  try { await operation(); }
  catch (error) { authFlash(error.message, true); }
  finally { button.disabled = false; }
}

async function signOutAuth() {
  const refreshToken = authTokens?.refresh_token;
  authTokens = null;
  sessionStorage.removeItem('facilise.tokens');
  updateAuthEntry();
  sessionStorage.removeItem('facilise.oauth.pending');
  if (refreshToken) {
    await fetch(faciliseApiUrl('/api/oauth/revoke'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: refreshToken, token_type_hint: 'refresh_token', client_id: OAUTH_CLIENT_ID })
    }).catch(() => {});
  }
  await fetch(faciliseApiUrl('/api/oauth/session'), { method: 'DELETE', credentials: 'include' }).catch(() => {});
  showAuth('login');
}

authOpen.addEventListener('click', async () => {
  document.querySelector('.nav-panel')?.classList.remove('open');
  document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  if (authTokens) await loadAuthAccount();
  else showAuth('login');
});
authClose.addEventListener('click', closeAuth);
authModal.addEventListener('click', event => { if (event.target === authModal) closeAuth(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !authModal.hidden) closeAuth(); });
document.addEventListener('click', event => {
  const button = event.target.closest('[data-auth-go]');
  if (button) showAuth(button.dataset.authGo);
});

authModal.querySelectorAll('input[type="password"]').forEach(input => {
  const control = document.createElement('div');
  control.className = 'auth-password-control';
  input.before(control);
  control.append(input);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'auth-password-toggle';
  toggle.setAttribute('aria-label', currentAuthText().showPassword);
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = '<svg class="eye-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg><svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 3 18 18M10.6 6.1A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.2 2.9M6.3 6.4C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  toggle.addEventListener('click', () => {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    toggle.classList.toggle('is-visible', !visible);
    toggle.setAttribute('aria-label', visible ? currentAuthText().showPassword : currentAuthText().hidePassword);
    toggle.setAttribute('aria-pressed', String(!visible));
    input.focus({ preventScroll: true });
  });
  control.append(toggle);
});

document.querySelector('#authLoginForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = authPayload(event.currentTarget);
  runAuth(event.submitter, async () => {
    const response = await fetch(faciliseApiUrl('/api/oauth/session'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(authError(result, response.status));
    const authorizationRequest = authParams.get('authorization_request');
    if (authorizationRequest?.startsWith('/api/oauth/authorize?')) location.assign(faciliseApiUrl(authorizationRequest));
    else await beginAuthAuthorization();
  });
});

document.querySelector('#authRegisterForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = authPayload(form);
  if (![data.email, data.document_alpha, data.phone_number].some(value => value?.trim())) {
    return authFlash(currentAuthText().atLeastOneIdentifier, true);
  }
  runAuth(event.submitter, async () => {
    await authRequest('/api/oauth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    form.reset();
    toggleDeveloperNickname();
    showAuth('login');
    authFlash(currentAuthText().accountCreated);
  });
});

const registerRole = document.querySelector('#authRegisterForm [name="role"]');
function toggleDeveloperNickname() {
  const field = document.querySelector('#developerNicknameField');
  const input = field.querySelector('input');
  field.hidden = false;
  input.required = true;
}
registerRole.addEventListener('change', toggleDeveloperNickname);
toggleDeveloperNickname();

document.querySelector('#authForgotForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = authPayload(event.currentTarget);
  runAuth(event.submitter, async () => {
    await authRequest('/api/oauth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    authFlash(currentAuthText().recoverySent);
  });
});

document.querySelector('#authResetForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = authPayload(form);
  if (data.new_password !== data.confirm_password) return authFlash(currentAuthText().passwordsMismatch, true);
  runAuth(event.submitter, async () => {
    await authRequest('/api/oauth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: data.token, new_password: data.new_password })
    });
    history.replaceState({}, '', '/');
    form.reset();
    showAuth('login');
    authFlash(currentAuthText().resetComplete);
  });
});

document.querySelector('#authChangeForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = authPayload(form);
  runAuth(event.submitter, async () => {
    await authRequest('/api/oauth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    form.reset();
    await signOutAuth();
    authFlash(currentAuthText().passwordChanged);
  });
});
document.querySelector('#authProfileForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = authPayload(event.currentTarget);
  if (![data.email, data.document_alpha, data.phone_number].some(value => value?.trim())) {
    return authFlash(currentAuthText().atLeastOneIdentifier, true);
  }
  runAuth(event.submitter, async () => {
    const user = await authRequest('/api/oauth/me', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    renderAuthProfile(user);
    authFlash(currentAuthText().profileUpdated);
  });
});
document.querySelectorAll('[data-auth-account-panel]').forEach(button => {
  button.addEventListener('click', () => showAccountPanel(button.dataset.authAccountPanel));
});
document.querySelector('#authLogout').addEventListener('click', () => signOutAuth());

function randomAuthBase64Url(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function authSha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  let binary = '';
  new Uint8Array(digest).forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function beginAuthAuthorization() {
  const verifier = randomAuthBase64Url(64);
  const state = randomAuthBase64Url(32);
  const challenge = await authSha256Base64Url(verifier);
  sessionStorage.setItem('facilise.oauth.pending', JSON.stringify({ verifier, state }));
  const query = new URLSearchParams({
    response_type: 'code', client_id: OAUTH_CLIENT_ID, redirect_uri: OAUTH_REDIRECT_URI,
    scope: OAUTH_SCOPE, state, code_challenge: challenge, code_challenge_method: 'S256'
  });
  location.assign(faciliseApiUrl(`/api/oauth/authorize?${query}`));
}

async function finishAuthAuthorization(code, returnedState) {
  const pending = JSON.parse(sessionStorage.getItem('facilise.oauth.pending') || 'null');
  if (!pending || returnedState !== pending.state) throw new Error(currentAuthText().stateFailed);
  const body = new URLSearchParams({
    grant_type: 'authorization_code', client_id: OAUTH_CLIENT_ID, code,
    redirect_uri: OAUTH_REDIRECT_URI, code_verifier: pending.verifier
  });
  const response = await fetch(faciliseApiUrl('/api/oauth/token'), {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(authError(result, response.status));
  sessionStorage.removeItem('facilise.oauth.pending');
  saveAuthTokens(result);
  history.replaceState({}, '', '/');
  await loadAuthAccount();
}

function renderAuthProfile(user) {
  const primaryIdentifier = user.email || user.document_alpha || user.phone_number || 'User';
  document.querySelector('#authProfileEmail').textContent = primaryIdentifier;
  document.querySelector('#authProfileId').textContent = user.id;
  document.querySelector('#authProfileDocument').textContent = user.document_alpha || '—';
  document.querySelector('#authProfilePhone').textContent = user.phone_number || '—';
  document.querySelector('#authAvatar').textContent = primaryIdentifier.charAt(0).toUpperCase();
  document.querySelector('.auth-badge').textContent = user.role || currentAuthText().active;
  const form = document.querySelector('#authProfileForm');
  form.elements.email.value = user.email || '';
  form.elements.document_alpha.value = user.document_alpha || '';
  form.elements.phone_number.value = user.phone_number || '';
  form.elements.nickname.value = user.nickname || '';
  ['postal_code','street_address','address_number','address_complement','neighborhood','city','state']
    .forEach(field => { form.elements[field].value = user[field] || ''; });
  setCountryValue(form, user.country || '');
  form.querySelector('.profile-address-section').open = ['postal_code','street_address','address_number','address_complement','neighborhood','city','state','country'].some(field => user[field]);
  updateProfileAddressForm(form);
}

async function loadAuthAccount() {
  try {
    const user = await authRequest('/api/oauth/me');
    renderAuthProfile(user);
    if (typeof openWorkspace === 'function') await openWorkspace();
    else showAuth('account');
  } catch (error) {
    await signOutAuth();
    authFlash(error.message, true);
  }
}

async function initializeAuth() {
  if (authParams.get('token')) {
    document.querySelector('#authResetForm [name=token]').value = authParams.get('token');
    showAuth('reset');
  } else if (authParams.get('error')) {
    showAuth('login');
    authFlash(`${currentAuthText().authorizationFailed}: ${authParams.get('error')}`, true);
  } else if (authParams.get('code')) {
    showAuth('login');
    try { await finishAuthAuthorization(authParams.get('code'), authParams.get('state')); }
    catch (error) {
      history.replaceState({}, '', '/');
      showAuth('login');
      authFlash(error.message, true);
    }
  }
}

const authLanguageSelect = document.querySelector('#languageSelect');
authLanguageSelect?.addEventListener('change', applyAuthLanguage);
document.querySelectorAll('#authProfileForm, #workspaceProfileForm, #companyForm').forEach(attachProfileAddressForm);
applyAuthLanguage();
initializeAuth();
