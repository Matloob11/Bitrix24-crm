<?
$MESS["CONTENT"] = "<div> Contenuti:
  <ul>
    <a href=\"#bizproc\" title=\"What is a business process?\">Processi aziendali</a></li>

    <a href=\"#tipical\" title=\"What are the most typical business processes?\">Tipici processi aziendali</a></li>

    <li><a href=\"#work\" title=\"How to create a business process\">Creazione di un processo aziendale</a></li>

    <a href=\"#perfomance\" title=\"How do I run a business process fulfilled?\">Esecuzione di un processo aziendale</a></li>
   </ul>
  <h1><a name=\"bizproc\"></a>Processi aziendali</h1>

  <p>La nozione di <b>processo aziendale</b> denota uno strumento per creare, mantenere e gestire flussi di informazioni.</p>

  <p><i>Un <b>processo aziendale</b> è un flusso di informazioni (o documenti) con percorso o schema definito. Uno schema di processo aziendale può specificare:</i></p>
  <ul>
    <li>uno o più <i>punti di ingresso e di uscita</i> (l'inizio e la fine del processo); </li>
    <li>una <i>sequenza di azioni (passaggi, fasi, funzioni)</i> che saranno eseguite dall'algoritmo del processo aziendale. </li>
   </ul>
  <p>Il mondo reale si caratterizza per una varietà estremamente diversificata di flussi di informazioni, con schemi che vanno da molto semplici a molto complessi. il semplice processo di pubblicazione di un documento può contenere numerose possibili azioni e fork condizionali, e potrebbe richiedere una varietà di dati di input e di notifiche utente.</p>

  <p><b>I processi aziendali</b> consentono a un utente comune di creare e modificare qualsiasi varietà di combinazioni immaginabili in termini di schemi di flusso di informazioni e azioni. L'editor di processi aziendali è stato sviluppato nel rispetto della massima semplicità possibile, il che significa che un utente aziendale standard, quindi non un programmatore, sarà in grado di accedere a un ampio spettro di funzioni e caratteristiche. Tuttavia, la nozione più vera di processo aziendale implica che un livello analitico superiore alla media e una conoscenza approfondita di ciò che accade di fatto all'interno dell'azienda si combinino insieme a totale beneficio del processo stesso. </p>
<p>Il designer di processi aziendali è, essenzialmente, un semplice creatore di blocchi visuali basato sulla funzione <b>drag and drop</b>. I modelli di processi aziendali sono creati in una versione avanzata dell'editor visuale. L'autore di un processo aziendale può specificare i passaggi del processo stesso e la loro sequenza, nonché evidenziare i dettagli specifici del processo utilizzando semplici schemi visuali.</p>
<p>Un flusso di informazioni specifico è definito dal modello di processo aziendale, comprensivo di azioni multiple. Un'azione può essere qualsiasi evento di tua scelta: creare un documento, inviare un messaggio e-mail, aggiungere un record di database e così via. </p>
<p>Il sistema contiene già decine di azioni integrate e alcuni processi aziendali tipici, che è possibile utilizzare per modellare le attività aziendali più comuni. </p>
<p>I processi aziendali più comuni sono di due tipi: </p>
 <ul>
    <li>un <b>processo aziendale sequenziale</b> per eseguire una serie di azioni consecutive su un documento, da un punto di inizio predefinito a un punto di fine parimenti predefinito; </li>
    <li>un <b>processo aziendale guidato dallo stato</b>, privo di un punto di inizio e fine: in questo caso, lo stato del processo è modificato al runtime dal flusso di lavoro. Un processo aziendale di questo tipo, teoricamente, può terminare in qualsiasi fase.</li>
   </ul>

  <h2>Processo aziendale sequenziale</h2>

  <p>La modalità sequenziale è generalmente utilizzata per processi con ciclo di vita limitato e predefinito. Un esempio tipico è la creazione e l'approvazione di un documento di testo. Qualsiasi processo sequenziale, di norma, include diverse azioni fra i punti di inizio e fine.</p>
  <img border=\"1\" alt=\"Example: simple linear process\" title=\"Example: simple linear process\" src=\"/images/bp/en/2.png\" />

  <h2>Processo aziendale guidato dallo stato</h2>

  <p>Un approccio guidato dallo stato è impiegato quando un processo non si caratterizza per un intervallo di tempo definito e può ripetere o tornare a un dato stato a causa della sua stessa natura (ad esempio: l'aggiornamento continuo della documentazione di un prodotto). Lo stato, in questo caso, non è solo un indicatore utile a denotare il grado di avanzamento del documento; piuttosto, descrive un ciclo processuale del mondo reale. </p>
  <p>La creazione di un modello di processo guidato dallo stato non è semplice come quella che interessa un processo sequenziale, tuttavia apre la strada a ampie possibilità di automazione nell'elaborazione delle informazioni. Un tipico schema di un processo di questo tipo si compone di più stati che, a turno, includono azioni e condizioni di cambio stato. </p>
 <img border=\"1\" alt=\"Example: process with statuses\" title=\"Example: process with statuses\" src=\"/images/bp/en/3.png\" />
  <p>Ogni azione in uno stato è generalmente un processo sequenziale finito.</p>

  <h1><a name=\"tipical\"></a>Tipici processi aziendali</h1>

<p>Il sistema è consegnato con più processi aziendali tipici pronti per l'uso. Puoi personalizzarli in base al flusso di informazioni della tua azienda utilizzando il designer apposito.</p>
  <h2>Processo sequenziale \"Semplice approvazione/votazione\" </h2>

  <p>Consigliato se una decisione deve essere presa semplicemente in base alla maggioranza dei voti. </p>

  <h2>Processo sequenziale \"Prima approvazione\" </h2>

  <p>Consigliato quando è sufficiente una singola approvazione o risposta (\"Si offre qualcuno come volontario?\").</p>

  <h2>Processo guidato dallo stato &quot;Approva documento con stati&quot; </h2>

  <p>Consigliato quando è necessario un mutuo accordo per approvare un documento. </p>

  <h2>Processo sequenziale &quot;Approvazione in due fasi&quot; </h2>

<p>Consigliato quando un documento richiede la valutazione preliminare di un esperto prima di poter essere approvato. </p>

  <h2>Processo sequenziale &quot;Opinione dell'esperto&quot; </h2>

  <p>Consigliato per le situazioni in cui chi deve approvare o rifiutare un documento necessita di commenti in merito da parte di un esperto.</p>

  <h2>Processo sequenziale &quot;Leggi documento&quot; </h2>

  <p>Consigliato quando i dipendenti stessi devono familiarizzare con un documento. </p>
  <p>Puoi visualizzare i processi aziendali (standard e definiti dall'utente) relativi a un determinato tipo di documenti cliccando sul pulsante <b>Altro</b> e selezionando <b>Processi aziendali</b> nel menu: </p>
  <p><img border=\"1\" src=\"/images/bp/en/4.png\" alt=\"View business processes\" title=\"View business processes\" /></p>
<p>In questo modo si aprirà la pagina <b>Modelli processi aziendali</b>, all'interno della quale puoi modificare i processi esistenti o crearne di nuovi.</p>
  <p><img border=\"1\" src=\"/images/bp/en/11.png\" alt=\"Business processes page\" title=\"Business processes page\" /></p>
  <h1><a name=\"work\"></a>Creazione di un processo aziendale</h1>

  <p>Per creare e modificare un processo aziendale, utilizzerai un apposito editor visuale.</p>

  <p>Prima di creare un processo aziendale, devi selezionare il tipo di processo, sequenziale o guidato dallo stato, così da definire il layout dell'editor visuale. Il tipo può essere selezionato utilizzando i controlli della barra degli strumenti contestuale nel modulo <b>Modelli processi aziendali</b>.</p>

  <p>Il primo passaggio durante la creazione di un processo aziendale è la definizione dei parametri. I parametri di processo sono dati ai quali è possibile accedere da qualsiasi comando, azione o condizione. Una volta definiti i parametri, è possibile procedere alla creazione.</p>
 <img border=\"1\" title=\"Setting process parameters\" alt=\"Setting process parameters\" src=\"/images/bp/en/6.png\" />

  <h2>Creazione di un processo guidato dallo stato</h2>

  <p>Prima di tutto, creare e configurare gli stati richiesti utilizzando il pulsante Aggiungi stato. Successivamente, creare i comandi per ciascuno stato. Ogni comando rappresenta un processo sequenziale separato.</p>
   <img border=\"1\" src=\"/images/bp/en/7.png\" alt=\"Assigning actions in statuses\" title=\"Assigning actions in statuses\" />

  <h2>Creazione di un processo sequenziale</h2>

  <p>Quando si crea un processo sequenziale, l'editor visuale mostra un set di azioni personalizzabile.</p>

  <p>L'editor visuale utilizza la popolare tecnica del drag-and-drop per aggiungere azioni. Una volta aggiunto il comando, configurare i relativi parametri. Ogni comando dispone di una finestra di dialogo univoca relativa ai parametri.</p>
 <img border=\"1\" title=\"Adding actions in the visual editor\" alt=\"Adding actions in the visual editor\" src=\"/images/bp/en/8.png\" /><br /><br />
  <h1><a name=\"perfomance\"></a>Esecuzione di un processo aziendale</h1>
<p>Un processo aziendale può essere eseguito manualmente o automaticamente, in base ai suoi parametri. La modalità di avvio non ha effetti sull'esecuzione. Un processo può avere istanze multiple, ciascuna eseguita in modo indipendente. </p>
  <p>Per eseguire un processo aziendale su un documento specifico, cliccare sul comando <b>Nuovo processo aziendale</b> nel menu di azione del documento e selezionare il processo aziendale richiesto dall'elenco.</p>
 <img border=\"1\" src=\"/images/bp/en/5.png\" alt=\"Launching a business process for a document\" title=\"Launching a business process for a document\" />
<p>Una volta aperta la finestra contenente i parametri del processo aziendale, specificare gli stessi e cliccare su <b>Start</b>.</p>
 <img border=\"1\" title=\"Setting up a business process\" alt=\"Setting up a business process\" src=\"/images/bp/en/9.png\" />
  <p>Se un processo aziendale ha opzioni di notifica, una notifica è inviata a un dipendente non appena il processo arriva al punto in cui il dipendente stesso deve eseguire una qualche azione. Per visualizzare ed eseguire gli incarichi assegnati dal processo aziendale in esecuzione, un utente può cliccare sul link <b>Processi aziendali</b> nel menu di sinistra, sotto al gruppo <b>Mia area di lavoro</b>.</p>
</div>";
$MESS["TITLE"] = "Processi aziendali";
?>