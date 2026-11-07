const photoSurvey = document.querySelector('#photoSurvey');
let surveyBrowserReady = false;

const surveyTranslations = {
  'pt-BR': {
    meta:['Facilise | Uma novidade está surgindo','Conte como você guarda suas fotos e vídeos e ajude a construir uma forma mais simples de liberar espaço.'],
    heading:['Uma novidade está surgindo · pesquisa rápida','Conte como você cuida das suas fotos.','São 6 perguntas e leva menos de 2 minutos. Nas perguntas de múltipla escolha, marque todas as opções que se aplicam.'],
    questions:[
      ['Qual serviço você utiliza para guardar suas fotos e vídeos?','Selecione uma ou mais opções',['Google Fotos','iCloud','Outro / nenhum']],
      ['Você paga por armazenamento adicional?','Selecione uma opção',['Não','Sim, até R$ 15/mês','Sim, R$ 16–30/mês','Sim, acima de R$ 30/mês']],
      ['Qual problema mais incomodou você nos últimos 6 meses?','Selecione uma ou mais opções',['Falta de espaço','Mensalidade','Fotos duplicadas','Dificuldade para encontrar fotos','Medo de apagar/perder arquivos','Nenhum']],
      ['O que você fez para resolver o problema?','Selecione uma ou mais opções',['Apaguei arquivos','Contratei ou aumentei o plano','Usei um aplicativo de limpeza','Transferi para outro lugar','Não resolvi']],
      ['Se um aplicativo comprovasse que pode liberar espaço sem alterar a qualidade das fotos, você teria interesse?','Selecione uma opção',['Sim, gostaria de testar','Talvez, dependendo da economia','Não']],
      ['Quanto você consideraria pagar por uma solução que resolvesse seu problema?','Selecione uma opção',['Não pagaria','Até R$ 19,90','R$ 20–49,90','R$ 50–99,90','R$ 100 ou mais']]
    ],
    contact:['Contato opcional','Quer receber mais informações?','Deixe seu e-mail e/ou telefone. Você pode enviar a pesquisa sem preencher estes campos.','E-mail','Telefone','voce@exemplo.com','(00) 00000-0000'],
    submit:['Pronto para enviar?','O contato é opcional e será usado somente para enviar novidades.','Enviar respostas →'],
    messages:{already:'Este navegador já enviou uma resposta.',alreadyButton:'Pesquisa já respondida ✓',init:'Não foi possível iniciar a pesquisa.',required:'Responda todas as perguntas antes de enviar.',ip:'O limite de 3 respostas para este endereço IP foi atingido.',send:'Não foi possível enviar as respostas.',saved:'Obrigado! Suas respostas foram salvas com sucesso.',savedNote:'Resposta salva. Obrigado por participar.'}
  },
  en: {
    meta:['Facilise | Something new is coming','Tell us how you store photos and videos and help build a simpler way to free up space.'],
    heading:['Something new is coming · quick survey','Tell us how you take care of your photos.','6 questions, less than 2 minutes. For multiple-choice questions, select every option that applies.'],
    questions:[
      ['Which service do you use to store your photos and videos?','Select one or more options',['Google Photos','iCloud','Other / none']],
      ['Do you pay for additional storage?','Select one option',['No','Yes, up to US$ 3.75/month','Yes, US$ 4–7.50/month','Yes, above US$ 7.50/month']],
      ['Which problem bothered you most in the last 6 months?','Select one or more options',['Not enough space','Monthly fee','Duplicate photos','Difficulty finding photos','Fear of deleting/losing files','None']],
      ['What did you do to solve the problem?','Select one or more options',['Deleted files','Purchased or upgraded a plan','Used a cleanup app','Transferred files elsewhere','Did not solve it']],
      ['If an app proved it could free space without changing photo quality, would you be interested?','Select one option',['Yes, I would like to try it','Maybe, depending on the savings','No']],
      ['How much would you consider paying for a solution that solved your problem?','Select one option',['I would not pay','Up to US$ 4.98','US$ 5–12.48','US$ 12.50–24.98','US$ 25 or more']]
    ],
    contact:['Optional contact','Would you like more information?','Leave your email and/or phone number. You can submit the survey without filling these fields.','Email','Phone','you@example.com','Your phone number'],
    submit:['Ready to submit?','Contact details are optional and will only be used to send updates.','Submit answers →'],
    messages:{already:'This browser has already submitted a response.',alreadyButton:'Survey already answered ✓',init:'The survey could not be initialized.',required:'Answer every question before submitting.',ip:'The limit of 3 responses for this IP address has been reached.',send:'Your answers could not be submitted.',saved:'Thank you! Your answers were saved successfully.',savedNote:'Response saved. Thank you for participating.'}
  },
  es: {
    meta:['Facilise | Algo nuevo está surgiendo','Cuéntanos cómo guardas tus fotos y vídeos y ayuda a crear una forma más sencilla de liberar espacio.'],
    heading:['Algo nuevo está surgiendo · encuesta rápida','Cuéntanos cómo cuidas tus fotos.','6 preguntas, menos de 2 minutos. En las preguntas de opción múltiple, marca todas las opciones aplicables.'],
    questions:[
      ['¿Qué servicio utilizas para guardar tus fotos y vídeos?','Selecciona una o más opciones',['Google Fotos','iCloud','Otro / ninguno']],
      ['¿Pagas por almacenamiento adicional?','Selecciona una opción',['No','Sí, hasta US$ 3,75/mes','Sí, US$ 4–7,50/mes','Sí, más de US$ 7,50/mes']],
      ['¿Qué problema te molestó más en los últimos 6 meses?','Selecciona una o más opciones',['Falta de espacio','Mensualidad','Fotos duplicadas','Dificultad para encontrar fotos','Miedo a borrar/perder archivos','Ninguno']],
      ['¿Qué hiciste para resolver el problema?','Selecciona una o más opciones',['Borré archivos','Contraté o amplié el plan','Usé una aplicación de limpieza','Transferí los archivos a otro lugar','No lo resolví']],
      ['Si una aplicación demostrara que puede liberar espacio sin cambiar la calidad, ¿te interesaría?','Selecciona una opción',['Sí, me gustaría probarla','Tal vez, según el ahorro','No']],
      ['¿Cuánto pagarías por una solución que resolviera tu problema?','Selecciona una opción',['No pagaría','Hasta US$ 4,98','US$ 5–12,48','US$ 12,50–24,98','US$ 25 o más']]
    ],contact:['Contacto opcional','¿Quieres recibir más información?','Deja tu correo y/o teléfono. Puedes enviar la encuesta sin completar estos campos.','Correo','Teléfono','tu@ejemplo.com','Tu teléfono'],submit:['¿Listo para enviar?','El contacto es opcional y solo se utilizará para enviar novedades.','Enviar respuestas →'],messages:{already:'Este navegador ya envió una respuesta.',alreadyButton:'Encuesta ya respondida ✓',init:'No se pudo iniciar la encuesta.',required:'Responde todas las preguntas antes de enviar.',ip:'Se alcanzó el límite de 3 respuestas para esta dirección IP.',send:'No se pudieron enviar las respuestas.',saved:'¡Gracias! Tus respuestas se guardaron correctamente.',savedNote:'Respuesta guardada. Gracias por participar.'}
  },
  it: {
    meta:['Facilise | Sta nascendo qualcosa di nuovo','Raccontaci come conservi foto e video e aiutaci a creare un modo più semplice per liberare spazio.'],heading:['Sta nascendo qualcosa di nuovo · sondaggio rapido','Raccontaci come ti prendi cura delle tue foto.','6 domande, meno di 2 minuti. Nelle domande a scelta multipla seleziona tutte le opzioni pertinenti.'],questions:[['Quale servizio usi per conservare foto e video?','Seleziona una o più opzioni',['Google Foto','iCloud','Altro / nessuno']],['Paghi spazio di archiviazione aggiuntivo?','Seleziona un’opzione',['No','Sì, fino a US$ 3,75/mese','Sì, US$ 4–7,50/mese','Sì, oltre US$ 7,50/mese']],['Quale problema ti ha infastidito di più negli ultimi 6 mesi?','Seleziona una o più opzioni',['Spazio insufficiente','Costo mensile','Foto duplicate','Difficoltà nel trovare le foto','Paura di eliminare/perdere file','Nessuno']],['Cosa hai fatto per risolvere il problema?','Seleziona una o più opzioni',['Ho eliminato file','Ho acquistato o aumentato il piano','Ho usato un’app di pulizia','Ho trasferito i file altrove','Non ho risolto']],['Se un’app dimostrasse di liberare spazio senza modificare la qualità, ti interesserebbe?','Seleziona un’opzione',['Sì, vorrei provarla','Forse, dipende dal risparmio','No']],['Quanto pagheresti per una soluzione al tuo problema?','Seleziona un’opzione',['Non pagherei','Fino a US$ 4,98','US$ 5–12,48','US$ 12,50–24,98','US$ 25 o più']]],contact:['Contatto facoltativo','Vuoi ricevere maggiori informazioni?','Lascia e-mail e/o telefono. Puoi inviare il sondaggio senza compilarli.','E-mail','Telefono','tu@esempio.com','Il tuo telefono'],submit:['Pronto per l’invio?','Il contatto è facoltativo e sarà usato solo per inviare aggiornamenti.','Invia risposte →'],messages:{already:'Questo browser ha già inviato una risposta.',alreadyButton:'Sondaggio già compilato ✓',init:'Impossibile avviare il sondaggio.',required:'Rispondi a tutte le domande prima di inviare.',ip:'È stato raggiunto il limite di 3 risposte per questo indirizzo IP.',send:'Impossibile inviare le risposte.',saved:'Grazie! Le risposte sono state salvate.',savedNote:'Risposta salvata. Grazie per aver partecipato.'}
  },
  fr: {
    meta:['Facilise | Une nouveauté se prépare','Dites-nous comment vous stockez vos photos et vidéos et contribuez à simplifier la libération d’espace.'],heading:['Une nouveauté se prépare · sondage rapide','Dites-nous comment vous prenez soin de vos photos.','6 questions, moins de 2 minutes. Pour les questions à choix multiple, sélectionnez toutes les réponses pertinentes.'],questions:[['Quel service utilisez-vous pour stocker vos photos et vidéos ?','Sélectionnez une ou plusieurs réponses',['Google Photos','iCloud','Autre / aucun']],['Payez-vous du stockage supplémentaire ?','Sélectionnez une réponse',['Non','Oui, jusqu’à 3,75 US$/mois','Oui, 4–7,50 US$/mois','Oui, plus de 7,50 US$/mois']],['Quel problème vous a le plus gêné ces 6 derniers mois ?','Sélectionnez une ou plusieurs réponses',['Manque d’espace','Abonnement mensuel','Photos en double','Difficulté à retrouver des photos','Peur de supprimer/perdre des fichiers','Aucun']],['Qu’avez-vous fait pour résoudre le problème ?','Sélectionnez une ou plusieurs réponses',['J’ai supprimé des fichiers','J’ai souscrit ou augmenté le forfait','J’ai utilisé une application de nettoyage','J’ai transféré les fichiers ailleurs','Je ne l’ai pas résolu']],['Si une application prouvait qu’elle libère de l’espace sans modifier la qualité, seriez-vous intéressé ?','Sélectionnez une réponse',['Oui, je voudrais essayer','Peut-être, selon les économies','Non']],['Combien envisageriez-vous de payer pour résoudre ce problème ?','Sélectionnez une réponse',['Je ne paierais pas','Jusqu’à 4,98 US$','5–12,48 US$','12,50–24,98 US$','25 US$ ou plus']]],contact:['Contact facultatif','Souhaitez-vous recevoir plus d’informations ?','Laissez votre e-mail et/ou téléphone. Vous pouvez envoyer le sondage sans les renseigner.','E-mail','Téléphone','vous@exemple.com','Votre téléphone'],submit:['Prêt à envoyer ?','Les coordonnées sont facultatives et serviront uniquement à envoyer des nouvelles.','Envoyer les réponses →'],messages:{already:'Ce navigateur a déjà envoyé une réponse.',alreadyButton:'Sondage déjà rempli ✓',init:'Impossible de démarrer le sondage.',required:'Répondez à toutes les questions avant l’envoi.',ip:'La limite de 3 réponses pour cette adresse IP est atteinte.',send:'Impossible d’envoyer les réponses.',saved:'Merci ! Vos réponses ont bien été enregistrées.',savedNote:'Réponse enregistrée. Merci de votre participation.'}
  },
  de: {
    meta:['Facilise | Etwas Neues entsteht','Erzählen Sie uns, wie Sie Fotos und Videos speichern, und helfen Sie uns, Speicherplatz einfacher freizugeben.'],heading:['Etwas Neues entsteht · kurze Umfrage','Wie kümmern Sie sich um Ihre Fotos?','6 Fragen, weniger als 2 Minuten. Wählen Sie bei Mehrfachfragen alle zutreffenden Optionen.'],questions:[['Welchen Dienst nutzen Sie zum Speichern Ihrer Fotos und Videos?','Eine oder mehrere Optionen auswählen',['Google Fotos','iCloud','Andere / keine']],['Bezahlen Sie für zusätzlichen Speicher?','Eine Option auswählen',['Nein','Ja, bis zu 3,75 US$/Monat','Ja, 4–7,50 US$/Monat','Ja, über 7,50 US$/Monat']],['Welches Problem hat Sie in den letzten 6 Monaten am meisten gestört?','Eine oder mehrere Optionen auswählen',['Zu wenig Speicherplatz','Monatliche Kosten','Doppelte Fotos','Fotos schwer zu finden','Angst, Dateien zu löschen/verlieren','Keines']],['Was haben Sie getan, um das Problem zu lösen?','Eine oder mehrere Optionen auswählen',['Dateien gelöscht','Tarif gebucht oder erweitert','Bereinigungs-App verwendet','Dateien anderswohin übertragen','Nicht gelöst']],['Wären Sie an einer App interessiert, die nachweislich Speicher ohne Qualitätsverlust freigibt?','Eine Option auswählen',['Ja, ich würde sie testen','Vielleicht, je nach Ersparnis','Nein']],['Wie viel würden Sie für eine Lösung Ihres Problems bezahlen?','Eine Option auswählen',['Ich würde nichts bezahlen','Bis zu 4,98 US$','5–12,48 US$','12,50–24,98 US$','25 US$ oder mehr']]],contact:['Optionaler Kontakt','Möchten Sie weitere Informationen?','Hinterlassen Sie E-Mail und/oder Telefon. Die Umfrage kann auch ohne diese Angaben gesendet werden.','E-Mail','Telefon','sie@beispiel.de','Ihre Telefonnummer'],submit:['Bereit zum Senden?','Kontaktdaten sind optional und werden nur für Neuigkeiten verwendet.','Antworten senden →'],messages:{already:'Dieser Browser hat bereits eine Antwort gesendet.',alreadyButton:'Umfrage bereits beantwortet ✓',init:'Die Umfrage konnte nicht gestartet werden.',required:'Beantworten Sie vor dem Senden alle Fragen.',ip:'Das Limit von 3 Antworten für diese IP-Adresse ist erreicht.',send:'Die Antworten konnten nicht gesendet werden.',saved:'Vielen Dank! Ihre Antworten wurden gespeichert.',savedNote:'Antwort gespeichert. Vielen Dank für Ihre Teilnahme.'}
  }
};

const surveyLocale = () => surveyTranslations[document.documentElement.lang] ? document.documentElement.lang : 'pt-BR';
const surveyText = () => surveyTranslations[surveyLocale()];
function applySurveyLanguage() {
  if (!photoSurvey) return;
  const text=surveyText();document.title=text.meta[0];document.querySelector('meta[name="description"]').content=text.meta[1];
  const heading=photoSurvey.querySelector('.survey-heading');heading.querySelector('p').textContent=text.heading[0];heading.querySelector('h1').textContent=text.heading[1];heading.querySelector('span').textContent=text.heading[2];
  photoSurvey.querySelectorAll('.survey-question').forEach((question,index)=>{const content=text.questions[index];question.querySelector('legend strong').textContent=content[0];question.querySelector('legend small').textContent=content[1];question.querySelectorAll('.survey-options label > span').forEach((option,optionIndex)=>{option.textContent=content[2][optionIndex];});});
  const contact=photoSurvey.querySelector('.survey-contact');contact.querySelector(':scope > div > p').textContent=text.contact[0];contact.querySelector('h2').textContent=text.contact[1];contact.querySelector(':scope > div > span').textContent=text.contact[2];const contactLabels=contact.querySelectorAll('.survey-contact-fields label > span');contactLabels[0].textContent=text.contact[3];contactLabels[1].textContent=text.contact[4];contact.querySelector('[name="contact_email"]').placeholder=text.contact[5];contact.querySelector('[name="contact_phone"]').placeholder=text.contact[6];
  const submit=photoSurvey.querySelector('.survey-submit');submit.querySelector('strong').textContent=text.submit[0];if(!photoSurvey.dataset.submitted){submit.querySelector('div span').textContent=text.submit[1];submit.querySelector('button').textContent=text.submit[2];}
  else { submit.querySelector('div span').textContent=text.messages.already;submit.querySelector('button').textContent=text.messages.alreadyButton; }
}

function disableSurvey(message = surveyText().messages.already) {
  photoSurvey.dataset.submitted = 'true';
  photoSurvey.querySelectorAll('input,button').forEach(control => { control.disabled = true; });
  const button = photoSurvey.querySelector('[type="submit"]');
  button.textContent = surveyText().messages.alreadyButton;
  button.closest('.survey-submit').querySelector('div span').textContent = message;
}

async function initializeSurveyBrowser() {
  try {
    const response = await fetch('/api/public/photo-survey/browser', { credentials:'same-origin' });
    if (!response.ok) throw new Error(surveyText().messages.init);
    const status = await response.json();
    surveyBrowserReady = true;
    if (status.already_submitted) disableSurvey();
  } catch (error) {
    window.setTimeout(() => window.appFlash?.(error.message, true), 0);
  }
}

photoSurvey?.addEventListener('submit', async event => {
  event.preventDefault();
  const unanswered = [...photoSurvey.querySelectorAll('.survey-question')].filter(question => !question.querySelector('input:checked'));
  photoSurvey.querySelectorAll('.survey-question').forEach(question => question.classList.toggle('has-error', unanswered.includes(question)));
  if (unanswered.length) {
    window.appFlash?.(surveyText().messages.required, true);
    unanswered[0].scrollIntoView({ behavior:'smooth', block:'center' });
    unanswered[0].querySelector('input')?.focus({ preventScroll:true });
    return;
  }
  if (!photoSurvey.reportValidity()) return;

  if (!surveyBrowserReady) {
    await initializeSurveyBrowser();
    if (!surveyBrowserReady || photoSurvey.querySelector('[type="submit"]').disabled) return;
  }

  const answers = { storage_services:[], recent_problems:[], actions_taken:[] };
  new FormData(photoSurvey).forEach((value, key) => {
    const mapped = { storage_service:'storage_services', recent_problem:'recent_problems', action_taken:'actions_taken' }[key] || key;
    if (Array.isArray(answers[mapped])) answers[mapped].push(value);
    else answers[mapped] = value;
  });
  const button = photoSurvey.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const response = await fetch('/api/public/photo-survey/responses', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify(answers) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 409) { disableSurvey(); throw new Error(surveyText().messages.already); }
      if (response.status === 429) throw new Error(surveyText().messages.ip);
      throw new Error(body.error_description || surveyText().messages.send);
    }
    sessionStorage.removeItem('facilise.photoSurvey');
    window.appFlash?.(surveyText().messages.saved, false);
    disableSurvey(surveyText().messages.savedNote);
  } catch (error) {
    if (!photoSurvey.dataset.submitted) button.disabled = false;
    window.appFlash?.(error.message, true);
  }
});

photoSurvey?.addEventListener('change', event => {
  event.target.closest('.survey-question')?.classList.remove('has-error');
});

if (photoSurvey) initializeSurveyBrowser();
window.addEventListener('facilise:languagechange', applySurveyLanguage);
applySurveyLanguage();
