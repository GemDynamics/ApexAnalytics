---
title: '**Juristische Analyse des österreichische Vertragsrechts *'

---

# **Juristische Analyse des österreichische Vertragsrechts *

**II. Executive Summary**

Dieser Bericht legt die juristischen Fundamente für die Entwicklung eines automatisierten Systems zur Überprüfung von Allgemeinen Geschäftsbedingungen (AGB) und Bauverträgen nach österreichischem Recht. Im Fokus stehen das Allgemeine bürgerliche Gesetzbuch (ABGB), das Konsumentenschutzgesetz (KSchG), das Unternehmensgesetzbuch (UGB) sowie die ÖNORM B 2110\. Es werden kritische Vertragsklauseln identifiziert, deren Zulässigkeit im Lichte dieser Rechtsquellen analysiert und die Implikationen für eine technische Umsetzung erörtert. Eine zentrale Erkenntnis ist die Notwendigkeit der strikten Differenzierung zwischen Verbrauchergeschäften (B2C) und Geschäften zwischen Unternehmern (B2B), da unterschiedliche Schutzmechanismen und Zulässigkeitsgrenzen gelten. Die Analyse zeigt, dass eine vollständige Automatisierung der Rechtsprüfung an Grenzen stößt, insbesondere bei der Auslegung unbestimmter Rechtsbegriffe wie „Sittenwidrigkeit“ oder „gröbliche Benachteiligung“, die eine kontextsensitive, oft richterlich geprägte Einzelfallprüfung erfordern. Für die technische Lösung wird ein mehrstufiges Warnsystem empfohlen, das eindeutige Verstöße klar signalisiert, potenziell problematische Klauseln zur menschlichen Überprüfung markiert und die Notwendigkeit juristischer Expertise für komplexe Fälle hervorhebt.

**II. Einleitung**

A. Zweck des Berichts  
Ziel dieses Berichts ist die Schaffung einer umfassenden juristischen Grundlage für die Konzeption und Implementierung eines automatisierten Systems zur Prüfung von Allgemeinen Geschäftsbedingungen (AGB) und Bauverträgen in Österreich. Der Bericht soll die komplexen rechtlichen Anforderungen in handhabbare Informationen für das technische Entwicklungsteam übersetzen, um eine möglichst rechtssichere automatisierte Analyse zu ermöglichen.  
B. Überblick über die relevante österreichische Rechtslandschaft  
Das österreichische Vertragsrecht ist durch ein Zusammenspiel verschiedener Rechtsquellen gekennzeichnet. An der Spitze steht das ABGB als allgemeines Zivilgesetzbuch. Spezialgesetze wie das KSchG für Verbraucherverträge und das UGB für unternehmensbezogene Geschäfte modifizieren und ergänzen die allgemeinen Regeln. Im Baubereich spielt die ÖNORM B 2110 eine wesentliche Rolle; sie ist zwar keine Rechtsnorm im formellen Sinn, erlangt aber durch vertragliche Vereinbarung den Charakter von AGB und wird somit zum Vertragsinhalt.1 Die österreichische Rechtsordnung, insbesondere im Bereich der AGB-Kontrolle, stützt sich stark auf Generalklauseln wie den Verstoß gegen die „guten Sitten“ (§ 879 ABGB) oder die „gröbliche Benachteiligung“ (§ 879 Abs 3 ABGB, § 6 KSchG).3 Die Auslegung dieser Generalklauseln ist maßgeblich von der Rechtsprechung des Obersten Gerichtshofs (OGH) geprägt und unterliegt einer stetigen Entwicklung. Ein automatisiertes Prüfsystem kann daher primär als ein Filter erster Stufe dienen, der offensichtliche Unzulässigkeiten erkennt. Die definitive Beurteilung, insbesondere bei der Anwendung von Generalklauseln, erfordert jedoch oft eine menschliche Expertise, die den jeweiligen Sachverhalt und die aktuelle Judikatur berücksichtigt. Ein System, das allein auf Gesetzesbestimmungen trainiert ist, würde die dynamische und fallbezogene Natur der Rechtsanwendung durch den OGH vernachlässigen. Daher muss ein solches System Mechanismen zur Integration von OGH-Entscheidungen vorsehen und seine Grenzen bei der Anwendung unbestimmter Rechtsbegriffe klar kommunizieren.  
**III. Fundamentale österreichische Rechtsrahmen für vertragliche Vereinbarungen**

**A. Allgemeines Bürgerliches Gesetzbuch (ABGB)**

Das ABGB von 1811 bildet das Kernstück des österreichischen Privatrechts und ist somit die grundlegende Rechtsquelle für alle zivilrechtlichen Verträge, einschließlich AGB und Bauverträge, sofern nicht spezielle Gesetze wie das KSchG oder das UGB abweichende Regelungen treffen.5

**1\. Kernprinzipien für AGB (${\\text{\\S}}$864a, ${\\text{\\S}}879ABGB)∗∗Fu¨rAGBsindinsbesonderezweiParagraphendesABGBvonzentralerBedeutung:∗∗∗{\\text{\\S}}$ 864a ABGB (Geltungskontrolle):** Bestimmungen ungewöhnlichen Inhalts in AGB oder Vertragsformblättern werden nicht Vertragsbestandteil, wenn sie dem anderen Teil nachteilig sind und er mit ihnen nach den Umständen, vor allem nach dem äußeren Erscheinungsbild der Urkunde, nicht zu rechnen brauchte, es sei denn, der Verwender hat ihn besonders darauf hingewiesen.3 Die Beurteilung der „Ungewöhnlichkeit“ hängt von der Art des Geschäfts und dem typischen Inhalt solcher AGB ab. Die Erkennbarkeit und Verständlichkeit der Klausel sowie der Erwartungshorizont des Vertragspartners spielen eine wesentliche Rolle. Ein ausdrücklicher Hinweis kann eine ungewöhnliche Klausel heilen.

* **§ 879 ABGB (Inhaltskontrolle/Sittenwidrigkeit):** Ein Vertrag, der gegen ein gesetzliches Verbot oder die guten Sitten verstößt, ist nichtig.3 Besondere Relevanz für AGB hat § 879 Abs 3 ABGB: Eine in AGB enthaltene Vertragsbestimmung, die nicht eine der beiderseitigen Hauptleistungen festlegt, ist jedenfalls nichtig, wenn sie unter Berücksichtigung aller Umstände des Falles einen Teil gröblich benachteiligt. Diese Bestimmung dient als Auffangtatbestand zur Gewährleistung von Fairness auch in B2B-Verträgen, wenngleich der Maßstab für „gröbliche Benachteiligung“ hier höher angesetzt wird als im Verbrauchergeschäft. Die Gerichte interpretieren diese Generalklauseln im Lichte der aktuellen gesellschaftlichen und wirtschaftlichen Verhältnisse, wobei im B2C-Verkehr ein strengerer Maßstab zugunsten des Verbrauchers angelegt wird. Ein automatisiertes System muss daher seine Sensitivität und die Strenge der Prüfung an den jeweiligen Kontext (B2C/B2B) anpassen können. Eine Klausel, die im B2C-Verkehr als klar gröblich benachteiligend eingestuft würde, könnte im B2B-Verkehr noch zulässig sein, sofern sie keine extreme Unausgewogenheit darstellt.

2\. Der Werkvertrag (§${\\text{\\S}}$1165 ff. ABGB) als Basis für Bauverträge  
Bauverträge sind im österreichischen Recht typischerweise als Werkverträge im Sinne der §§ 1165 ff. ABGB zu qualifizieren.1

* **Grundlagen:** Der Werkunternehmer verpflichtet sich zur Herstellung eines bestimmten Erfolgs (des Werks), der Werkbesteller zur Zahlung des Entgelts (Werklohn, § 1170 ABGB).6 Das ABGB regelt die Pflichten beider Parteien, die Gefahrtragung (§ 1168, § 1168a ABGB) und die Beendigungsrechte (§ 1168 ABGB).1  
* **Sicherstellung bei Bauverträgen (§ 1170b ABGB):** Diese Bestimmung sieht einen Anspruch des Werkunternehmers auf Sicherstellung des Werklohns vor, ist jedoch nicht anwendbar, wenn der Werkbesteller eine juristische Person des öffentlichen Rechts oder ein Verbraucher ist.1 Die Werkvertragsbestimmungen des ABGB sind dispositiv, d.h., sie können durch Parteienvereinbarung abgeändert werden. Dies geschieht in der Baupraxis häufig durch die Vereinbarung der ÖNORM B 2110 oder durch individuell ausgehandelte Vertragsbedingungen.1 Die dispositiven Regelungen des ABGB, insbesondere zur Fälligkeit des Werklohns (grundsätzlich erst nach Vollendung und Prüfung des Werkes), können für Werkunternehmer bei großen Projekten nachteilig sein. Dies ist ein wesentlicher Grund für die häufige Vereinbarung der ÖNORM B 2110, die detailliertere Regelungen zu Abschlagszahlungen und Sicherheiten enthält. Ein automatisiertes System, das einen Bauvertrag ohne explizite Vereinbarung der ÖNORM B 2110 prüft, sollte das Fehlen klarer Regelungen zu Abschlagszahlungen als potenzielles Risiko für den Auftragnehmer (wenn der Auftraggeber Nutzer des Tools ist) oder für den Auftraggeber (wenn dieser gestaffelte Zahlungen ohne explizite Vereinbarung erwartet) kennzeichnen.

**B. Konsumentenschutzgesetz (KSchG)**

Das KSchG enthält zwingende Schutzbestimmungen für Verträge zwischen Unternehmern und Verbrauchern (B2C) und ist daher für die Prüfung von AGB in diesem Bereich von überragender Bedeutung.3

1\. Geltungsbereich und Signifikanz in B2C-Transaktionen  
Das KSchG definiert den Unternehmer- und Verbraucherbegriff und legt fest, wann seine Bestimmungen zur Anwendung gelangen.14 Viele Regelungen des KSchG sind zwingend und können nicht zum Nachteil des Verbrauchers abbedungen werden (§ 2 Abs 2 KSchG).14  
**2\. Wesentliche Verbote und Anforderungen für AGB (${\\text{\\S}}$6 KSchG, Transparenzgebot ${\\text{\\S}}6Abs3KSchG)∗∗∗∗∗{\\text{\\S}}$ 6 KSchG (Unzulässige Vertragsbestandteile):** Dieser Paragraph enthält einen Katalog von Klauseln, die in AGB gegenüber Verbrauchern entweder absolut nichtig sind (§ 6 Abs 1 KSchG) oder nur dann gültig sind, wenn sie im Einzelnen ausgehandelt wurden (§ 6 Abs 2 KSchG).3 Beispiele sind unzulässige Haftungsausschlüsse, unangemessen lange Fristen für den Unternehmer oder die Einschränkung von Gewährleistungsrechten. Die Ausnahme des „im Einzelnen Ausverhandelns“ wird von der österreichischen Rechtsprechung sehr eng interpretiert. Ein bloßes Besprechen oder die Möglichkeit zur Kenntnisnahme reicht nicht aus; es bedarf einer echten Verhandlungsmöglichkeit für den Verbraucher. Ein automatisiertes System wird dies kaum verifizieren können. Daher sollten Klauseln, die unter § 6 Abs 2 KSchG fallen und in Standard-AGB enthalten sind, als höchstwahrscheinlich nichtig gekennzeichnet werden.

* **Transparenzgebot (§ 6 Abs 3 KSchG):** Eine Vertragsbestimmung in AGB ist unwirksam, wenn sie unklar oder unverständlich abgefasst ist.4 Dies zielt darauf ab, dass der Verbraucher die rechtlichen und wirtschaftlichen Konsequenzen einer Klausel nachvollziehen kann.  
* **Informationspflichten (§ 5a KSchG):** Unternehmer haben vor Vertragsabschluss umfassende Informationspflichten gegenüber Verbrauchern zu erfüllen.14

**C. Unternehmensgesetzbuch (UGB)**

Das UGB regelt Rechtsgeschäfte zwischen Unternehmern (B2B) und enthält teilweise strengere oder spezifischere Regelungen als das ABGB, um den Bedürfnissen des Handelsverkehrs Rechnung zu tragen.7

1\. Anwendung auf B2B-Vereinbarungen  
Das UGB gilt für Unternehmer im Sinne des Gesetzes.25 Das ABGB bleibt subsidiär anwendbar.24  
**2\. Spezifische Bestimmungen für den Geschäftsverkehr (z.B. Mängelrüge, „Battle of Forms“)**

* **Mängelrüge (§ 377 UGB):** Bei beiderseitig unternehmensbezogenen Geschäften ist der Käufer/Werkbesteller verpflichtet, die Ware/das Werk unverzüglich nach Ablieferung zu untersuchen und festgestellte Mängel ebenso unverzüglich zu rügen. Unterlässt er dies, verliert er seine Ansprüche auf Gewährleistung, Schadenersatz wegen des Mangels selbst sowie aus Irrtum über die Mangelfreiheit.7 Die genauen Fristen für Untersuchung und Rüge sind nicht starr festgelegt, sondern hängen von den Umständen des Einzelfalls ab. Diese Obliegenheit ist ein signifikanter Unterschied zum Verbraucherrecht und kann für Unternehmer zu einem vollständigen Rechtsverlust führen. Ein automatisiertes System, das Verträge für einen Unternehmer prüft, der Leistungen empfängt, sollte auf das Fehlen einer Klausel hinweisen, die die Mängelrüge zu seinen Gunsten modifiziert oder zumindest die strenge gesetzliche Verpflichtung hervorheben. Umgekehrt, wenn der Nutzer der Anbieter ist, sollte das System sicherstellen, dass keine Klausel sein Recht auf eine rechtzeitige Mängelrüge unbeabsichtigt schwächt.  
* **„Battle of Forms“:** Verwenden beide Vertragspartner widersprechende AGB, kommt nach österreichischer Rechtsprechung häufig die „Knock-Out-Regel“ zur Anwendung: Übereinstimmende Teile der AGB gelten, widersprechende Klauseln heben sich gegenseitig auf, und die Lücke wird durch dispositives Gesetzesrecht gefüllt.3 Sogenannte „Abwehrklauseln“ (z.B. „Es gelten ausschließlich unsere AGB“) sind in der Regel wirkungslos, um die eigenen AGB vollständig durchzusetzen.  
* **Verzugszinsen (§ 456 UGB):** Im B2B-Bereich gelten bei Zahlungsverzug höhere gesetzliche Verzugszinsen (aktuell 9,2 Prozentpunkte über dem Basiszinssatz) als im allgemeinen Zivilrecht oder im Verbrauchergeschäft.28

**D. ÖNORM B 2110: Allgemeine Vertragsbestimmungen für Bauleistungen**

Die ÖNORM B 2110 ist ein von Austrian Standards International erarbeitetes Regelwerk, das als AGB für Bauleistungen konzipiert ist. Sie muss ausdrücklich zwischen den Vertragsparteien vereinbart werden, um Geltung zu erlangen.1

1\. Rechtsnatur und Erfordernis der Vereinbarung  
Die ÖNORM B 2110 ist kein Gesetz, sondern vorformulierte Vertragsbedingungen. Wird sie vereinbart, unterliegt sie als AGB der Inhaltskontrolle nach §§ 864a und 879 ABGB sowie, bei Beteiligung von Verbrauchern, den Bestimmungen des KSchG.1  
2\. Wesentliche Bestimmungen und Abweichungen vom ABGB (inkl. Aktualisierungen 2023\)  
Die ÖNORM B 2110 enthält detaillierte Regelungen zu zahlreichen Aspekten von Bauverträgen, die im ABGB nur allgemein oder gar nicht geregelt sind:

* **Schriftform:** Für viele Erklärungen, Änderungen und Mitteilungen sieht die ÖNORM B 2110 aus Beweisgründen die Schriftform vor.2  
* **Dokumentationspflicht:** Es bestehen detaillierte Vorgaben zur Führung von Bautagebüchern und Bautagesberichten.2  
* **Prüf- und Warnpflicht:** Der Auftragnehmer (AN) hat vom Auftraggeber (AG) beigestellte Unterlagen, Stoffe und Vorleistungen zu prüfen und bei Bedenken schriftlich zu warnen.2  
* **Übernahme:** Die ÖNORM B 2110 unterscheidet zwischen förmlicher und formloser Übernahme und regelt deren Voraussetzungen und Rechtsfolgen, insbesondere den Beginn der Gewährleistungsfrist.2  
* **Gewährleistung:** Es gelten spezifische Gewährleistungsfristen (z.B. 3 Jahre für Bauwerke, 2 Jahre für bewegliche Teile der Haustechnik).2  
* **Haftungsbeschränkungen:** Für leichte Fahrlässigkeit sind Haftungsobergrenzen vorgesehen.2  
* **Zahlungsfristen:** Die Norm enthält konkrete Fristen für Abschlags- und Schlussrechnungen.2  
* **Vertragsstrafen:** Oftmals wird eine Deckelung der Vertragsstrafe (z.B. mit 5 % der Auftragssumme) vorgesehen.34  
* **Sphärenzuordnung:** Die Risikoverteilung, insbesondere bei unvorhergesehenen Ereignissen, ist detaillierter geregelt als im ABGB.1  
* **Aktualisierungen 2023:** Die Fassung 2023 brachte einige Änderungen, u.a. die Streichung des Punktes 6.5.2 „Fixgeschäft“, die Verlegung der Vertragsstrafenregelung und Präzisierungen bei Leistungsabweichungen.13 Die ÖNORM B 2110 stellt einen Versuch dar, einen ausgewogenen und detaillierten Rahmen für Bauprojekte zu schaffen. Da sie jedoch den Status von AGB hat, können ihre einzelnen Klauseln, insbesondere wenn sie einseitig (oft durch den AG in Abänderung der Standard-ÖNORM) zum Nachteil der anderen Partei formuliert werden, der Inhaltskontrolle nach ABGB unterliegen. Ein automatisiertes System sollte daher besonders wachsam sein, wenn die ÖNORM B 2110 zwar als Grundlage vereinbart, ihre Standardklauseln aber signifikant modifiziert wurden. Es wäre ideal, wenn das System die vertraglichen Klauseln mit dem offiziellen Text der ÖNORM B 2110 vergleichen könnte, um solche Abweichungen zu identifizieren und als potenziell problematisch zu kennzeichnen, falls sie ein erhebliches Ungleichgewicht erzeugen.

**Tabelle 1: Schlüsselfunktionen österreichischer Gesetze und Normen für die automatisierte Vertragsprüfung**

| Rechtsakt | Primärer Anwendungsbereich | Kontext der Anwendbarkeit | Wesentliche Verbote/Anforderungen für Klauseln | Relevanz für Automatisierungslogik |
| :---- | :---- | :---- | :---- | :---- |
| **ABGB** (Allgemeines Bürgerliches Gesetzbuch) | Allgemeines Zivilrecht | AGB/Bauverträge, B2C/B2B | § 864a (Überraschende/nachteilige Klauseln), § 879 (Sittenwidrigkeit, gröbliche Benachteiligung), §§ 1165ff (Werkvertrag) | Basisregeln; Geltungs- & Inhaltskontrolle für alle AGB; kontextabhängige Flags (B2B vs. B2C) |
| **KSchG** (Konsumentenschutzgesetz) | Verbraucherschutz | AGB/Bauverträge, nur B2C | § 6 (Klauselverbote), § 6 Abs 3 (Transparenzgebot), § 9 (Gewährleistung), Informationspflichten | Zwingende Prüfung für B2C; viele Klauseln per se nichtig oder nur nach individueller Aushandlung gültig |
| **UGB** (Unternehmensgesetzbuch) | Handelsrecht | AGB/Bauverträge, nur B2B | § 377 (Mängelrüge), § 456 (Verzugszinsen), unternehmensbezogene Gebräuche | Spezifische B2B-Regeln; Prüfung auf Mängelrügeklauseln, Zinskonditionen |
| **ÖNORM B 2110** | Standardvertragsbedingungen Bau | Bauverträge, B2C/B2B (wenn vereinbart) | Detaillierte Regelungen zu Schriftform, Dokumentation, Übernahme, Gewährleistung, Haftung, Zahlung, Vertragsstrafen, Sphären etc. | Prüfung, ob vereinbart; Abgleich von Vertragsklauseln mit ÖNORM-Standard; Identifikation von Abweichungen |

Diese Tabelle dient als erste Orientierung für die Architektur des automatisierten Prüfsystems, insbesondere für die Priorisierung von Regeln und die Notwendigkeit, den Prüfungskontext (B2C vs. B2B, Vereinbarung der ÖNORM B 2110 ja/nein) zu berücksichtigen.

**IV. Analyse kritischer Klauseln in AGB und Bauverträgen**

Im Folgenden werden typische kritische Klauseln analysiert, wobei jeweils die anwendbaren Rechtsvorschriften, die Zulässigkeit in B2C- und B2B-Kontexten, relevante OGH-Judikatur und Implikationen für die automatisierte Prüfung dargestellt werden.

**A. Haftungsbeschränkungen und \-ausschlüsse (Haftungsausschluss)**

* **Rechtliche Grundlagen:** § 879 ABGB (Sittenwidrigkeit, insb. für grobe Fahrlässigkeit/Vorsatz), § 6 Abs 1 Z 9 KSchG (kein Ausschluss für Personenschäden, enge Grenzen für sonstige Schäden bei Verbrauchern), § 9 KSchG (Einschränkung von Gewährleistungsrechten), UGB (größere Freiheit, aber Grenzen bei krass grober Fahrlässigkeit), ÖNORM B 2110 Pkt. 11.3.1 (früher 5.46, Grenzen für leichte Fahrlässigkeit).2  
* **Zulässigkeit:**  
  * B2C: Stark eingeschränkt. Ausschluss für Personenschäden, Vorsatz und grobe Fahrlässigkeit generell nichtig. Andere Ausschlüsse oft nach § 6 KSchG oder § 879 Abs 3 ABGB unwirksam.  
  * B2B: Zulässiger, aber Ausschluss für Vorsatz immer nichtig. Ausschluss für grobe Fahrlässigkeit oft sittenwidrig, insbesondere bei "krass" grober Fahrlässigkeit. Haftung für leichte Fahrlässigkeit kann oft ausgeschlossen werden. Die ÖNORM B 2110 sieht spezifische Obergrenzen für leichte Fahrlässigkeit vor (z.B. 12.500 EUR bei Auftragssumme bis 250.000 EUR, darüber 5 % der Auftragssumme, max. 750.000 EUR).2  
* **OGH-Judikatur:** Der OGH ist streng bei pauschalen Ausschlüssen grober Fahrlässigkeit, auch im B2B-Bereich, und differenziert zwischen "schlichter" und "krasser" grober Fahrlässigkeit.49  
* **Mangelfolgeschäden:** Deren Ausschluss ist üblich, unterliegt aber denselben verschuldensabhängigen Beschränkungen. Im B2C-Bereich sehr schwer auszuschließen. Die Unterscheidung zwischen Mangelschaden (Schaden an der Leistung selbst) und Mangelfolgeschaden (daraus resultierender weiterer Schaden) ist hierbei wesentlich. Während die Gewährleistung den Mangelschaden abdeckt und schwer (besonders B2C) ausschließbar ist, zielen Haftungsklauseln oft auf die Begrenzung von Mangelfolgeschäden ab. Die Zulässigkeit solcher Ausschlüsse für Mangelfolgeschäden hängt stark vom Verschuldensgrad und dem B2C/B2B-Kontext ab.  
* **Automatisierte Prüfung:**  
  * Kennzeichnung jedes Haftungsausschlusses für Personenschäden oder Vorsatz.  
  * Kennzeichnung des Ausschlusses grober Fahrlässigkeit (hohes Risiko B2C, mittel-hohes Risiko B2B).  
  * Prüfung, ob bei Vereinbarung der ÖNORM B 2110 deren spezifische Haftungsobergrenzen korrekt wiedergegeben oder unzulässig verändert wurden.  
  * Differenzierung B2C (sehr streng) und B2B (nachsichtiger bei leichter Fahrlässigkeit).  
  * Identifizierung, ob der Ausschluss direkte Schäden, Folgeschäden oder beides betrifft.

**B. Gewährleistungsbestimmungen (Gewährleistung)**

* **Rechtliche Grundlagen:** §§ 922ff ABGB (allgemeine Regeln, primäre vs. sekundäre Behelfe), § 9 KSchG (Einschränkungen von Gewährleistungsrechten des Verbrauchers weitgehend nichtig), § 377 UGB (Mängelrüge für B2B), ÖNORM B 2110 Pkt. 10 und 12.2 (Gewährleistungsfristen, Prozess).2  
* **Fristen:** ABGB: 3 Jahre für unbewegliche Sachen (Bauwerke), 2 Jahre für bewegliche. KSchG macht diese für Verbraucher zwingend. ÖNORM B 2110: 3 Jahre für Bauwerke, 2 Jahre für bewegliche Haustechnik.2 Das UGB erlaubt im B2B-Bereich Verkürzungen, sofern nicht sittenwidrig. Das Gewährleistungsrichtlinien-Umsetzungsgesetz (GRUG) von 2022 und das damit verbundene Verbrauchergewährleistungsgesetz (VGG) haben das Zusammenspiel von Gewährleistungs- und Verjährungsfristen, insbesondere für Verbraucherverträge und digitale Elemente, modifiziert.27 Obwohl der Fokus hier auf ABGB/KSchG/UGB/ÖNORM liegt, sollte das System bei Klauseln zu Software oder smarten Komponenten in Bauverträgen eine Prüfung auf Anwendbarkeit des VGG vorsehen.  
* **Mängelrüge:** Im B2B-Verkehr nach § 377 UGB entscheidend.26 Versäumte rechtzeitige Rüge führt zum Rechtsverlust. Nicht anwendbar auf Verbraucher.  
* **Rechtsbehelfe:** ABGB/KSchG: Verbesserung/Austausch, dann Preisminderung/Wandlung. ÖNORM B 2110 folgt dem im Allgemeinen.  
* **Automatisierte Prüfung:**  
  * Prüfung der Gewährleistungsfristen anhand der gesetzlichen Mindestfristen (insb. für B2C).  
  * Im B2B-Bereich: Kennzeichnung des Fehlens einer Mängelrügeklausel (wenn der Kunde Verkäufer ist) oder einer übermäßig strengen Mängelrüge (wenn der Kunde Käufer ist).  
  * Verifizierung, ob bei Vereinbarung der ÖNORM B 2110 deren Gewährleistungsregeln korrekt wiedergegeben sind.  
  * Kennzeichnung jedes Versuchs, Gewährleistungsrechte von Verbrauchern im Voraus auszuschließen.

**C. Zahlungsbedingungen, Verzug und Zinsen (Zahlungsbedingungen, Verzug)**

* **Rechtliche Grundlagen:** § 1170 ABGB (Zahlung bei Vollendung fällig), ÖNORM B 2110 Pkt. 8.4 (detaillierte Regeln zu Abschlagszahlungen, Schlussrechnung, Zahlungsfristen wie 30/60/90 Tage).1 UGB § 456 (höhere Verzugszinsen B2B: 9,2 % über Basiszinssatz). ABGB § 1333 (Verzugszinsen 4 % oder vereinbart). Das Zahlungsverzugsgesetz (ZaVerzG) setzt Grenzen für Zahlungsfristen, insbesondere für öffentliche Auftraggeber, und regelt B2B-Verzugszinsen.30  
* **Zulässigkeit:** Zahlungsbedingungen, die erheblich von der ÖNORM B 2110 (falls vereinbart) oder den gesetzlichen Normen (falls ÖNORM nicht vereinbart) zum Nachteil einer Partei abweichen, können sittenwidrig sein (§ 879 ABGB). Das KSchG schützt Verbraucher vor übermäßig belastenden Zahlungsplänen. Das ZaVerzG sieht für B2B-Geschäfte eine maximale Zahlungsfrist von 60 Tagen vor, es sei denn, eine längere Frist ist für den Gläubiger nicht gröblich benachteiligend oder wurde ausdrücklich vereinbart und ist nicht gröblich benachteiligend. Für öffentliche Auftraggeber gelten noch strengere Fristen (grundsätzlich 30 Tage, max. 60 Tage bei sachlicher Rechtfertigung).30  
* **Automatisierte Prüfung:**  
  * Wenn ÖNORM B 2110 vereinbart: Prüfung, ob Zahlungsfristen (z.B. 30 Tage für Abschlagsrechnungen, 60/90 für Schlussrechnung je nach Höhe 2) eingehalten oder nachteilig verändert wurden.  
  * Prüfung der Verzugszinssätze gegen UGB/ABGB/ZaVerzG.  
  * Kennzeichnung des Fehlens eines klaren Zahlungsplans, wenn die ABGB-Standardregelung (Zahlung bei Fertigstellung) nicht gewünscht ist.  
  * Kennzeichnung von Zahlungsfristen, die die Grenzen des ZaVerzG überschreiten, unter Berücksichtigung der Art des Auftraggebers (öffentlich/privat).

**D. Vertragsstrafen (Pönalen)**

* **Rechtliche Grundlagen:** § 1336 ABGB (allgemeine Regeln, richterliches Mäßigungsrecht), ÖNORM B 2110 Pkt. 11.3 (früher 6.5.3, oft 5 % Obergrenze der Auftragssumme, Tagessätze).34  
* **Zulässigkeit:** Müssen angemessen sein. Unbegrenzte oder überhöhte Vertragsstrafen können nichtig sein (§ 879 ABGB) oder unterliegen dem richterlichen Mäßigungsrecht (§ 1336 Abs 2 ABGB), auch im B2B-Bereich. Im B2C-Bereich strengere Prüfung. Die 5 %-Obergrenze der ÖNORM B 2110 ist ein gängiger Anhaltspunkt für Angemessenheit im Baubereich.  
* **OGH-Judikatur:** Bestätigt, dass das richterliche Mäßigungsrecht zwingend ist und in AGB nicht ausgeschlossen werden kann.7 Vertragsstrafen, die den wirtschaftlichen Ruin herbeiführen, sind sittenwidrig.34  
* **Automatisierte Prüfung:**  
  * Kennzeichnung von Vertragsstrafen, die die 5 %-Obergrenze der ÖNORM B 2110 überschreiten, falls die Norm vereinbart ist, oder als allgemeiner Indikator für mögliche Unverhältnismäßigkeit.  
  * Kennzeichnung jeder Klausel, die versucht, das richterliche Mäßigungsrecht auszuschließen.  
  * Identifizierung, ob die Strafe für Verzug, Nichterfüllung oder andere Verstöße gilt.  
  * Prüfung, ob Tagessätze spezifiziert sind und wie sie sich kumulieren.  
  * Die ÖNORM B 2110 (Pkt. 11.3.2, ehemals 6.5.3.2) sieht vor, dass ein die Vertragsstrafe übersteigender Schaden nur bei Vorsatz oder grober Fahrlässigkeit des Auftragnehmers zu ersetzen ist. Dies ist ein wichtiges Detail, das oft übersehen wird, wenn Parteien nur einen Strafsatz festlegen, ohne den vollen ÖNORM-Kontext zu berücksichtigen. Das System sollte prüfen, ob das System der Vertragsstrafen bei Vereinbarung der ÖNORM B 2110 vollständig und korrekt wiedergegeben wird.

**E. Abnahme von Bauleistungen (Übernahme)**

* **Rechtliche Grundlagen:** ABGB (allgemeine Prinzipien der Lieferung und Annahme), ÖNORM B 2110 Pkt. 10 (detaillierte Verfahren für förmliche und formlose Übernahme, Wirkung der Übernahme, Übernahme trotz geringfügiger Mängel).2  
* **Wesentliche Unterschiede ABGB vs. ÖNORM B 2110:** Das ABGB ist weniger detailliert. Die ÖNORM B 2110 sieht spezifische Prozesse vor (z.B. Aufforderung zur Übernahme durch AN, Prüfpflicht des AG, Protokoll). Die ÖNORM erlaubt die Übernahme mit geringfügigen Mängeln, mit einem Zurückbehaltungsrecht für die Behebung (Dreifaches der Mängelbehebungskosten, Pkt. 10.4/10.5).2  
* **Rechtsfolgen:** Beginn der Gewährleistungsfrist, Gefahrübergang (teilweise, da ÖNORM B 2110 eigene Gefahrtragungsregeln hat), Fälligkeit der Schlusszahlung.  
* **Automatisierte Prüfung:**  
  * Wenn ÖNORM B 2110 vereinbart: Prüfung, ob die Übernahmeverfahren übereinstimmen (z.B. Erfordernis der förmlichen Übernahme, Protokoll).  
  * Kennzeichnung von Klauseln, die eine Abnahme durch bloße Nutzung ohne förmlichen Prozess vorsehen, wenn eine förmliche Abnahme Standard ist oder gewünscht wird. "Fiktive Abnahme"-Klauseln sind besonders kritisch zu sehen. Die ÖNORM B 2110 enthält in Pkt. 10.3.2 spezifische Regeln zur "Übernahme durch Nutzung" 36, die sorgfältig geprüft werden müssen.  
  * Identifizierung, ob Bestimmungen für die Übernahme mit geringfügigen Mängeln und Zurückbehaltungssummen enthalten/modifiziert sind.

**F. Urheberrechte und Lizenzierung (Urheberrecht, Nutzungsrechte)**

* **Rechtliche Grundlagen:** Urheberrechtsgesetz (UrhG) – das Urheberrecht selbst ist nicht übertragbar, nur Nutzungsrechte (Werknutzungsrechte/Werknutzungsbewilligungen) können eingeräumt werden (§§ 24 ff. UrhG).4 § 33 Abs 2 UrhG: Die Eigentumsübertragung an einem Werkstück (z.B. Plan) beinhaltet im Zweifel keine Einräumung von Nutzungsrechten.  
* **Zulässigkeit:** Klauseln, die eine vollständige „Übertragung von Schutzrechten“ fordern, sind bezüglich des Urheberrechts generell unwirksam, wenn die Firma (z.B. Architekt, Designer) nur ein Nutzungsrecht einräumen will.73 Der Umfang der eingeräumten Nutzungsrechte (zeitlich, örtlich, sachlich) muss klar definiert sein. Ein häufiges Problem ist der Wunsch des Auftraggebers nach uneingeschränkten Rechten zur Nutzung und Änderung von Plänen für zukünftige Projekte oder mit anderen Auftragnehmern. Das UrhG gewährt solche weitreichenden Nutzungen nur, wenn sie explizit vereinbart wurden. Die Urheberpersönlichkeitsrechte (z.B. Recht auf Namensnennung) verbleiben beim Urheber.  
* **Automatisierte Prüfung:**  
  * Kennzeichnung von Klauseln, die von „Übertragung“ oder „Abtretung“ des Urheberrechts an Plänen/Entwürfen sprechen, anstatt von „Einräumung von Nutzungsrechten“ oder „Lizenzierung“.  
  * Prüfung, ob der Umfang der Nutzungsrechte definiert ist. Fehlende Definition kann zu Streitigkeiten führen.  
  * Kennzeichnung von Klauseln, die dem Auftraggeber automatisch Rechte an *allen* während des Projekts entstandenen geistigen Eigentumsrechten einräumen, auch wenn diese nicht mit den spezifischen Leistungen zusammenhängen.

**G. „Pay-When-Paid“- und „Pay-If-Paid“-Klauseln**

* **Rechtliche Grundlagen:** Primär § 879 ABGB (Sittenwidrigkeit). Diese Klauseln machen die Zahlung an einen Subunternehmer davon abhängig, dass der Hauptauftragnehmer Zahlung vom Auftraggeber erhält.8  
* **Zulässigkeit:**  
  * „Pay-if-paid“ (Zahlung *nur wenn* Hauptauftragnehmer bezahlt wird – überträgt das Insolvenzrisiko des AG auf den Subunternehmer) wird in Österreich nahezu einhellig als sittenwidrig und nichtig nach § 879 ABGB angesehen.  
  * „Pay-when-paid“ (Zahlung an Subunternehmer fällig, *wenn* Hauptauftragnehmer bezahlt wird – primär ein Zeitplanungsmechanismus) wird kritisch gesehen. Wenn sie effektiv das Insolvenzrisiko des AG verschiebt oder es dem Hauptauftragnehmer ermöglicht, die Zahlung aufgrund eigener Streitigkeiten mit dem AG unbegrenzt zurückzuhalten, kann sie ebenfalls nach § 879 ABGB nichtig sein.77 Die österreichische Haltung ist tendenziell strenger gegen eine solche Risikoüberwälzung. Kernproblem ist die unfaire Verlagerung des unternehmerischen Risikos. Der Hauptauftragnehmer wählt den Auftraggeber; der Subunternehmer hat typischerweise keine Vertragsbeziehung oder Einfluss auf den Auftraggeber. Den Subunternehmer das Risiko der Insolvenz oder Nichtzahlung des Auftraggebers an den Hauptauftragnehmer tragen zu lassen, wird im Allgemeinen als grobes Ungleichgewicht der Vertragspositionen und damit als sittenwidrig angesehen.  
* **OGH-Judikatur:** Obwohl direkte OGH-Entscheidungen zu „pay-if-paid“ im Baubereich in den Snippets nicht detailliert sind, sind die allgemeinen Grundsätze des § 879 ABGB gegen unfaire Risikoverlagerung auf die schwächere Partei (Subunternehmer) etabliert.76  
* **Automatisierte Prüfung:**  
  * Hochrisiko-Kennzeichnung für jede „pay-if-paid“-Klausel.  
  * Mittel- bis Hochrisiko-Kennzeichnung für „pay-when-paid“-Klauseln. Das System sollte analysieren, ob die Klausel lediglich Zahlungsströme synchronisiert oder effektiv das Kreditrisiko des Auftraggebers auf den Subunternehmer überträgt.  
  * Schlüsselwörter: „Zahlung nach Zahlungseingang“, „Fälligkeit erst wenn Hauptauftraggeber zahlt“.

**H. „Back-to-Back“-Klauseln in Subunternehmerverträgen**

* **Rechtliche Grundlagen:** § 879 ABGB (Sittenwidrigkeit, Transparenz), § 864a ABGB (überraschende Klauseln). Diese Klauseln zielen darauf ab, alle oder die meisten Bedingungen (einschließlich Risiken und Pflichten) aus dem Hauptvertrag an den Subunternehmer weiterzugeben.8  
* **Zulässigkeit:** Nicht per se unwirksam, aber problematisch, wenn:  
  * Der Subunternehmer keinen vollständigen und ordnungsgemäßen Zugang zu den Hauptvertragsbedingungen hat.  
  * Die weitergegebenen Bedingungen unangemessen belastend oder für den spezifischen Leistungsumfang des Subunternehmers irrelevant sind.  
  * Sie zu einer unfairen Risikoverteilung führen (z.B. Haftung des Subunternehmers für Verzögerungen, die durch den Hauptauftragnehmer oder andere Subunternehmer verursacht wurden).  
  * Transparenz ist entscheidend: Der Subunternehmer muss klar verstehen, welche Verpflichtungen er übernimmt. Globale Verweise auf den Hauptvertrag ohne Spezifizierung der anwendbaren Teile können intransparent sein. Eine „Back-to-Back“-Klausel kann ein legitimes Mittel für einen Hauptauftragnehmer sein, um seine Projektrisiken zu managen. Sie wird jedoch missbräuchlich, wenn sie dazu dient, alle Verantwortlichkeiten blind auf einen Subunternehmer abzuwälzen, der möglicherweise nicht die Kapazität, Information oder Vertragsposition hat, diese Risiken zu managen.  
* **OGH-Judikatur:** Der OGH prüft Klauseln, die ein Ungleichgewicht schaffen. Spezifische OGH-Entscheidungen zu „Back-to-Back“ sind in den Snippets nicht detailliert, aber die Prinzipien von § 879 ABGB und § 864a ABGB würden Anwendung finden.51  
* **Automatisierte Prüfung:**  
  * Kennzeichnung von Klauseln mit globaler Einbeziehung von Hauptvertragsbedingungen („Der Subunternehmer ist an alle Bestimmungen des Hauptvertrages gebunden“).  
  * Prüfung, ob ein Mechanismus sicherstellt, dass der Subunternehmer den Hauptvertrag erhalten hat.  
  * Suche nach Klauseln, die den Subunternehmer für Koordination oder Verzögerungen außerhalb seiner Kontrolle aufgrund von Back-to-Back-Verpflichtungen verantwortlich machen.

**I. Definition von Fertigstellungsterminen (Bauende, ehem. Fixgeschäft)**

* **Rechtliche Grundlagen:** ABGB (allgemeine Leistungszeit), ÖNORM B 2110 (Regeln für Leistungsfristen, Verzug). Die Version 2023 der ÖNORM B 2110 hat Pkt. 6.5.2 „Fixgeschäft“ gestrichen.13  
* **Bedeutung eines fixen Fertigstellungstermins:** Wesentlich für Planung, Koordination und Feststellung von Verzug/Pönalen.45  
* **Folgen eines fehlenden Termins:** Unsicherheit, Schwierigkeiten beim Nachweis von Verzug, Unanwendbarkeit von Verzugspönalen.45 Ohne fixen Termin gilt eine „angemessene Frist“, was streitanfällig ist.  
* **„Fixgeschäft“ nach ABGB/KSchG:** Ein echtes Fixgeschäft (bei dem die Leistung zu einem bestimmten Zeitpunkt wesentlich ist) erlaubt den sofortigen Rücktritt bei Nichterfüllung (§ 919 ABGB; § 7c Abs 2 KSchG für Verbraucher 14). Die Streichung aus der ÖNORM B 2110 schafft das Rechtsinstitut nicht ab, sondern entfernt dessen spezifische ÖNORM-Regelung. Die Streichung bedeutet, dass Parteien, die sich auf die ÖNORM stützen, nun expliziter sein müssen, wenn sie die strengen Konsequenzen eines Fixgeschäfts nach ABGB/UGB beabsichtigen.  
* **Automatisierte Prüfung:**  
  * Prüfung auf klar definierte Start- und Endtermine oder Leistungszeiträume.  
  * Kennzeichnung des Fehlens eines klaren Fertigstellungstermins als Hochrisiko-Problem.  
  * Wenn Begriffe wie „Fixtermin“ oder „fixes Bauende“ verwendet werden, Verifizierung, ob die Konsequenzen eines Fixgeschäfts (z.B. automatisches Rücktrittsrecht bei Verzug) beabsichtigt und klar formuliert sind.

**J. Ausschluss von Ansprüchen bei gestörtem Bauablauf**

* **Rechtliche Grundlagen:** § 1168 Abs 1 ABGB (Anspruch des AN auf Entschädigung bei vom AG verursachten Behinderungen/Verzögerungen), ÖNORM B 2110 Pkt. 7.2, 7.3, 7.4 (Regeln für Leistungsabweichungen, Störungen, Anpassung der Leistungsfrist und des Entgelts).40  
* **Zulässigkeit:** Klauseln, die pauschal Ansprüche des AN auf Mehrkosten oder Fristverlängerung aufgrund von Störungen ausschließen, die vom AG oder seiner Sphäre verursacht wurden, sind höchst problematisch und wahrscheinlich nach § 879 ABGB oder als unfaire Abweichung von § 1168 ABGB oder der vereinbarten ÖNORM B 2110 nichtig. Bauprojekte sind komplex und störanfällig. Die Rechtsordnungen sehen Mechanismen zur Anpassung von Zeit und Kosten vor, wenn Störungen aus der Sphäre des AG auftreten. Versuche, dieses Risiko vollständig per AGB auf den AN abzuwälzen, werden oft als Missbrauch von Verhandlungsmacht angesehen.  
* **OGH-Judikatur:** Der OGH schützt tendenziell das Recht des AN auf Entschädigung für vom AG verursachte Störungen.  
* **Automatisierte Prüfung:**  
  * Hochrisiko-Kennzeichnung für Klauseln, die „keine Ansprüche bei Verzug/Störung“ oder „AN trägt jedes Risiko bezüglich Baustellenbedingungen/Koordination“ festlegen.  
  * Prüfung, ob Bestimmungen der ÖNORM B 2110 zu Störungsansprüchen aufgehoben oder unfair eingeschränkt werden.  
  * Suche nach Klauseln, die strenge, möglicherweise unangemessen kurze Meldefristen für Störungsansprüche vorsehen.

**K. Konzernhaftungsklauseln (Konzernhaftung)**

* **Rechtliche Grundlagen:** Allgemeine Grundsätze der Trennung juristischer Personen. Die Haftung ist grundsätzlich auf die Vertragspartei beschränkt. Klauseln, die die Haftung auf Mutter- oder Schwestergesellschaften ausdehnen, sind nicht Standard und bedürfen einer sorgfältigen Prüfung nach § 879 ABGB (Sittenwidrigkeit) und § 864a ABGB (überraschende Klausel).10  
* **Zulässigkeit:** In AGB höchst fragwürdig, insbesondere wenn nicht klar hervorgehoben und gerechtfertigt. Könnte überraschend (§ 864a ABGB) und/oder gröblich benachteiligend (§ 879 Abs 3 ABGB) sein, wenn sie einer nicht-vertragsschließenden Konzerngesellschaft ohne deren klare Zustimmung oder direkten Nutzen/Beteiligung eine Haftung auferlegt. Solche Klauseln versuchen, das Prinzip der beschränkten Haftung von Kapitalgesellschaften zu umgehen.  
* **OGH-Judikatur:** Der OGH schützt im Allgemeinen die Trennung juristischer Personen. Eine Durchgriffshaftung oder Haftungserweiterung erfordert besondere Umstände (z.B. Missbrauch, Vermögensvermischung, explizite Garantie).  
* **Automatisierte Prüfung:**  
  * Hochrisiko-Kennzeichnung für jede Klausel, die eine Muttergesellschaft oder andere Konzerngesellschaften für die Verpflichtungen der Vertragspartei haftbar macht oder umgekehrt.  
  * Schlüsselwörter: „Konzernhaftung“, „Mithaftung der Muttergesellschaft“, „gesamtschuldnerische Haftung mit verbundenen Unternehmen“.

**L. Rechtswahl- und Gerichtsstandsklauseln**

* **Rechtliche Grundlagen:** Rom-I-Verordnung (Rechtswahl für vertragliche Schuldverhältnisse), Brüssel-Ia-Verordnung (Gerichtsstand). Im B2C-Bereich sieht § 14 KSchG schützende Gerichtsstandsregeln für Verbraucher vor. UGB/ZPO für B2B.  
* **Zulässigkeit:**  
  * B2C: Rechtswahl darf dem Verbraucher nicht den Schutz zwingender Bestimmungen seines Heimatlandes entziehen, wenn diese günstiger sind. Gerichtsstandsklauseln zum Nachteil des Verbrauchers sind oft nach § 14 KSchG nichtig.  
  * B2B: Größere Freiheit. Wahl ausländischen Rechts (z.B. deutsches BGB/VOB 37) oder eines ausländischen Gerichtsstands ist generell möglich. Wird jedoch österreichisches Recht gewählt, sind ÖNORMEN nicht automatisch Vertragsbestandteil, außer sie werden explizit vereinbart. Ohne Rechtswahl bestimmen komplexe Regeln des internationalen Privatrechts das anwendbare Recht (bei Bauverträgen oft das Recht am Sitz des Werkunternehmers 110). Die Vereinbarung ausländischen Rechts (z.B. deutsches BGB/VOB) für ein österreichisches Bauprojekt kann erhebliche Komplexität und Unvertrautheit für eine oder beide Parteien mit sich bringen.  
* **Automatisierte Prüfung:**  
  * Identifizierung von Rechtswahl- und Gerichtsstandsklauseln.  
  * Im B2C-Bereich: Kennzeichnung, wenn nicht-österreichisches Recht/Gerichtsstand gewählt wird, und Warnung vor potenzieller Unwirksamkeit oder zwingenden Verbraucherschutzbestimmungen.  
  * Im B2B-Bereich: Vermerk der Wahl. Wenn ausländisches Recht (z.B. deutsches VOB/BGB) für einen in Österreich von österreichischen Parteien auszuführenden Vertrag gewählt wird, als ungewöhnlich kennzeichnen und auf mögliche Rechtskonflikte oder praktische Schwierigkeiten hinweisen.

**Tabelle 2: Analyse kritischer Vertragsklauseln für die automatisierte Prüfung**

| Kritische Klausel | Relevante österr. Gesetzes-/ÖNORM-Bestimmung | Zulässigkeitsindikator B2C | Zulässigkeitsindikator B2B | Kernaussage OGH/Rechtsprinzip | "Red Flag" Schlüsselwörter/Phrasen | Empfohlene Systemaktion |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Haftungsausschluss (grobe Fahrlässigkeit)** | § 879 ABGB, § 6 Abs 1 Z 9 KSchG | Rot (Nichtig) | Amber/Rot (oft sittenwidrig) | Ausschluss für grobe Fahrlässigkeit in AGB meist unzulässig, insb. "krasse". | "haften nicht für grobe Fahrlässigkeit", "Ausschluss jedweder Haftung" | Hochrisiko-Flag B2C; Prüf-Flag B2B |
| **Haftungsausschluss (leichte Fahrlässigkeit, Sachschäden)** | § 879 ABGB, ÖNORM B 2110 Pkt. 11.3.1 | Amber (Grenzen im KSchG) | Grün/Amber (oft zulässig, ÖNORM-Grenzen beachten) | Zulässig, wenn nicht sittenwidrig oder gegen KSchG verstoßend. ÖNORM B 2110 setzt Grenzen. | "Haftung für leichte Fahrlässigkeit ausgeschlossen" | Info-Flag B2B (prüfen auf ÖNORM-Konformität); Risiko-Flag B2C |
| **Verkürzte Gewährleistungsfrist (Bauwerk)** | § 922ff ABGB, § 9 KSchG, ÖNORM B 2110 Pkt. 12.2 | Rot (Unzulässig \< 3 J.) | Amber (Zulässig, wenn nicht sittenwidrig kurz) | 3 Jahre gesetzlich/ÖNORM. KSchG zwingend für Konsumenten. | "Gewährleistung beträgt 1 Jahr" | Hochrisiko-Flag B2C; Prüf-Flag B2B |
| **Fehlende Mängelrüge (B2B)** | § 377 UGB | N/A | Amber (Gesetzliche Pflicht) | Unterlassene Rüge führt zu Rechtsverlust. | (Fehlen einer Regelung oder sehr strenge Rügefrist) | Info-Flag (Hinweis auf § 377 UGB oder Prüfung der vereinbarten Frist) |
| **Überhöhte Verzugszinsen (B2B)** | § 456 UGB, ZaVerzG | N/A | Amber/Rot | Gesetzlich 9,2 %-Punkte über Basiszinssatz; höhere können sittenwidrig sein. | "Verzugszinsen 15 % p.a." | Prüf-Flag (Abgleich mit gesetzl. Höchstsatz) |
| **Unbegrenzte Vertragsstrafe** | § 1336 ABGB, ÖNORM B 2110 Pkt. 11.3 | Rot (Mäßigungsrecht) | Amber/Rot (Mäßigungsrecht, Sittenwidrigkeit) | Richterliches Mäßigungsrecht unverzichtbar. ÖNORM oft 5 % Cap. | "Pönale unbegrenzt", Ausschluss Mäßigungsrecht | Hochrisiko-Flag |
| **"Pay-if-Paid"** | § 879 ABGB | Rot (Sittenwidrig) | Rot (Sittenwidrig) | Unfaire Risikoüberwälzung auf Subunternehmer. | "Zahlung an Subunternehmer nur bei Zahlung durch Bauherrn" | Höchstrisiko-Flag |
| **"Pay-when-Paid" (mit Risikoüberwälzung)** | § 879 ABGB | Rot (Sittenwidrig) | Amber/Rot (pot. sittenwidrig) | Kritisch, wenn Insolvenzrisiko des AG überwälzt wird. | "Zahlung fällig nach Eingang der Zahlung vom Hauptauftraggeber" | Risiko-Flag, genaue Prüfung erforderlich |
| **Globale Back-to-Back Klausel (unklar)** | § 879 ABGB, § 864a ABGB | Amber/Rot | Amber | Intransparent, potenziell überraschend/gröblich benachteiligend. | "Alle Bestimmungen des Hauptvertrages gelten sinngemäß" | Prüf-Flag, Hinweis auf Transparenz |
| **Fehlender Fertigstellungstermin** | ABGB Werkvertrag, ÖNORM B 2110 | Amber | Amber | Führt zu Unsicherheit und Streit über "angemessene Frist". | (Fehlen eines Datums oder klaren Zeitraums) | Risiko-Flag, Hinweis auf Notwendigkeit |
| **Ausschluss Mehrkosten bei Störung durch AG** | § 1168 ABGB, § 879 ABGB, ÖNORM B 2110 Pkt. 7 | Rot | Amber/Rot | Gröblich benachteiligend, widerspricht Grundprinzipien. | "Keine Mehrkosten bei Bauablaufstörungen jeglicher Art" | Hochrisiko-Flag |
| **Konzernhaftungsklausel in AGB** | § 864a ABGB, § 879 ABGB | Rot | Amber/Rot | Überraschend, potenziell gröblich benachteiligend. | "Muttergesellschaft haftet", "verbundene Unternehmen haften mit" | Hochrisiko-Flag |
| **IP-Übertragung statt Lizenz (Urheberrecht)** | UrhG | Amber/Rot | Amber/Rot | Urheberrecht ist nicht übertragbar, nur Nutzungsrechte. | "Übertragung aller Schutzrechte/Urheberrechte" | Prüf-Flag, Umformulierung zu Nutzungsrecht empfohlen |

**V. Integration österreichischer Rechtsprinzipien in ein automatisiertes Prüfsystem**

A. Strategie zur Identifizierung rechtswidriger Klauseln („Red Flags“)  
Ein mehrstufiges Kennzeichnungssystem ist empfehlenswert:

* **Rote Flaggen (Hohe Priorität):** Klauseln, die mit hoher Wahrscheinlichkeit nichtig oder äußerst problematisch sind (z.B. Haftungsausschluss für Vorsatz, „Pay-if-paid“ im B2B, viele Verstöße gegen § 6 KSchG im B2C).  
* **Orange Flaggen (Mittlere Priorität):** Klauseln, die potenziell problematisch, kontextabhängig sind oder von Standards wie der ÖNORM B 2110 abweichen (z.B. ungewöhnliche Pönalregelungen, weitreichende IP-Übertragungsansprüche, unklare Fertigstellungstermine). Diese erfordern eine menschliche Überprüfung.  
* **Gelbe/Info-Flaggen (Niedrige Priorität/Information):** Klauseln, die generell zulässig sind, aber eine bemerkenswerte Wahl oder Abweichung darstellen, auf die der Nutzer hingewiesen werden sollte (z.B. Rechtswahl zugunsten ausländischen Rechts im B2B). Das System sollte Schlüsselwörter, Phrasen und Strukturmuster erkennen, die mit problematischen Klauseln assoziiert sind.

**B. Übersetzung rechtlicher Anforderungen in Parameter für die technische Lösung**

1\. Zuordnung von Gesetzesparagraphen zu Klausel-Archetypen  
Es muss eine Taxonomie gängiger Klauseltypen in AGB und Bauverträgen erstellt werden.

* Beispiel: § 6 Abs 1 Z 1 KSchG (unzulässiger Haftungsausschluss) wird dem Archetyp „Haftungsbeschränkung“ zugeordnet. ÖNORM B 2110 Pkt. 11.3 wird dem Archetyp „Vertragsstrafe“ zugeordnet.

2\. Definition Boolescher Logik für (Un-)Zulässigkeit  
Die Logik muss den Vertragstyp (B2C/B2B) und die Vereinbarung der ÖNORM B 2110 berücksichtigen.

* Beispielregel: WENN (Vertragstyp \= "B2C") UND (KlauselArchetyp \= "Haftungsbeschränkung") UND (KlauselText ENTHÄLT "Ausschluss für grobe Fahrlässigkeit") DANN Flagge \= "Rot".  
* Beispielregel: WENN (Vertragstyp \= "B2B") UND (KlauselArchetyp \= "Vertragsstrafe") UND (PönaleObergrenze \> 0.05 \* Vertragswert) UND (ÖNORM\_B2110\_Vereinbart \= WAHR) DANN Flagge \= "Orange" (da Abweichung von ÖNORM-Standardobergrenze).

C. Umgang mit Mehrdeutigkeit: Grenzen der Automatisierung und Notwendigkeit menschlicher Expertenprüfung  
Begriffe wie „gröblich benachteiligend“ (§ 879 Abs 3 ABGB), „unklar oder unverständlich“ (§ 6 Abs 3 KSchG) oder „sittenwidrig“ (§ 879 Abs 1 ABGB) erfordern eine nuancierte juristische Interpretation, die über eine reine Schlüsselworterkennung hinausgeht.3 Das System muss klar anzeigen, wann eine menschliche Expertenprüfung erforderlich ist. Die Unklarheitenregel (§ 915 ABGB) – Auslegung zu Lasten des Verfassers – ist ein richterliches Auslegungsprinzip und schwer automatisierbar, das System kann jedoch auf mehrdeutige Formulierungen hinweisen.3  
D. Empfehlungen für die Rule Engine und die Alarmmechanismen des Systems  
Die Rule Engine sollte aktualisierbar sein, um neue OGH-Judikatur und Gesetzesänderungen zu berücksichtigen. Alarme sollten den beanstandeten Klauseltext, die potenziell verletzte Rechtsvorschrift, eine kurze Risikoerklärung, die Dringlichkeitsstufe und eine Handlungsempfehlung enthalten. Die wahre Stärke eines solchen Systems liegt in seiner Lern- und Anpassungsfähigkeit. Während initiale Regeln auf aktuellen Gesetzen und etablierter Rechtsprechung basieren, ist ein Mechanismus zur Einbindung neuer OGH-Entscheidungen oder Gesetzesnovellen für die langfristige Genauigkeit unerlässlich. Dies könnte ein von Rechtsexperten verwaltetes „Regel-Update“-Modul umfassen.  
**Tabelle 3: Überführung rechtlicher Regeln in Parameter für ein automatisiertes System (Beispiele)**

| Rechtliche Regel/Prinzip | Zugehöriger Klausel-Archetyp(en) | "Look-for"-Indikatoren für Automatisierung | Anwendungskontext | System-Flag-Priorität | Beispiel System-Output/Alarm |
| :---- | :---- | :---- | :---- | :---- | :---- |
| § 6 Abs 3 KSchG \- Transparenzgebot | Jede Klausel, insb. Zahlung, Haftung, Laufzeitänderungen | Komplexe Satzstruktur, undefinierte Fachbegriffe, unklare Verweise, vom Konsumenten zu tätigende Berechnungen | B2C zwingend, B2B gute Praxis | Orange/Rot für B2C, Gelb/Orange für B2B | "Klausel X könnte aufgrund komplexer Formulierung gegen Transparenzanforderungen des § 6 Abs 3 KSchG verstoßen. Konsument versteht möglicherweise die Folgen nicht. Hohes Risiko im B2C." |
| § 864a ABGB \- Überraschende/Nachteilige Klauseln | Ungewöhnliche Pflichten, versteckte Kosten, unerwartete Haftungserweiterungen | Kleingedrucktes, ungewöhnliche Platzierung, Abweichung von Branchenüblichkeit, keine Hervorhebung | B2C/B2B | Orange/Rot | "Klausel Y ist an ungewöhnlicher Stelle platziert und könnte als überraschend und nachteilig iSd § 864a ABGB gelten. Risiko der Ungültigkeit." |
| § 377 UGB \- Mängelrüge | Gewährleistung, Mängelhaftung | Fehlen einer Rügefrist, unangemessen kurze Rügefrist, unklare Form der Rüge | Nur B2B | Orange (je nach Formulierung) | "Die Mängelrügefrist in Klausel Z erscheint sehr kurz und könnte den Käufer unangemessen benachteiligen. Prüfung empfohlen." oder "Keine explizite Mängelrügeregelung gefunden; es gilt die gesetzliche Pflicht nach § 377 UGB." |
| ÖNORM B 2110 Pkt. 11.3 \- Vertragsstrafe (Cap) | Vertragsstrafen, Pönalen | Pönale \> 5% der Auftragssumme, fehlende Deckelung | Wenn ÖNORM B 2110 vereinbart | Orange | "Die vereinbarte Vertragsstrafe übersteigt potenziell die in der ÖNORM B 2110 übliche Deckelung von 5%. Prüfung auf Angemessenheit empfohlen." |

**VI. Schlussfolgerung und strategische Empfehlungen**

Die automatisierte Prüfung von AGB und Bauverträgen nach österreichischem Recht ist ein komplexes Unterfangen, das ein tiefgreifendes Verständnis der Wechselwirkungen zwischen ABGB, KSchG, UGB und Standards wie der ÖNORM B 2110 erfordert. Die kritischsten Bereiche für die automatisierte Erkennung sind Verstöße gegen zwingende Verbraucherschutzbestimmungen des KSchG, die allgemeinen Fairnessgebote des § 879 ABGB und spezifische Abweichungen von der ÖNORM B 2110, sofern diese vereinbart wurde.

Für die Entwicklung des Systems wird strategisch empfohlen:

1. **Priorisierung von „Roten Flaggen“:** Eindeutige Gesetzesverstöße (z.B. unzulässige Haftungsausschlüsse im B2C-Bereich) müssen mit höchster Priorität erkannt werden.  
2. **Robuster Mechanismus für „Orange Flaggen“:** Kontextabhängige oder potenziell problematische Klauseln müssen zuverlässig für eine menschliche Expertenprüfung eskaliert werden. Die Grenzen der Automatisierung, insbesondere bei der Auslegung unbestimmter Rechtsbegriffe, müssen dem Nutzer transparent gemacht werden.  
3. **Kontinuierliche Wartung und Aktualisierung:** Die Rechtslage und insbesondere die OGH-Judikatur entwickeln sich ständig weiter. Das Regelsystem der Software muss daher regelmäßig von juristischen Experten gewartet und angepasst werden.

#### **Referenzen**

1. Bauvertrag – Wichtige Fakten im Überblick \- Weka.at, Zugriff am Mai 6, 2025, [https://www.weka.at/news/Bau-Immobilien/Bauvertrag-Wichtige-Fakten-im-Ueberblick-1177956](https://www.weka.at/news/Bau-Immobilien/Bauvertrag-Wichtige-Fakten-im-Ueberblick-1177956)  
2. ÖNORM B 2110 Online-Leitfaden | BauMaster, Zugriff am Mai 6, 2025, [https://bau-master.com/baublog/oenorm-b-2110/](https://bau-master.com/baublog/oenorm-b-2110/)  
3. Allgemeine Geschäftsbedingungen (Österreich) \- Wikipedia, Zugriff am Mai 6, 2025, [https://de.wikipedia.org/wiki/Allgemeine\_Gesch%C3%A4ftsbedingungen\_(%C3%96sterreich)](https://de.wikipedia.org/wiki/Allgemeine_Gesch%C3%A4ftsbedingungen_\(%C3%96sterreich\))  
4. Allgemeinen Geschäftsbedingungen von Erwachsenenbildungsorganisationen \- wien-cert, Zugriff am Mai 6, 2025, [https://wiencert.oeibf.at/wp-content/uploads/2023/10/EB-AGB-Analyse-2017.pdf](https://wiencert.oeibf.at/wp-content/uploads/2023/10/EB-AGB-Analyse-2017.pdf)  
5. Allgemeines bürgerliches Gesetzbuch (ABGB): die Rechtsgebiete \- trend.at, Zugriff am Mai 6, 2025, [https://www.trend.at/recht/allgemeines-buergerliches-gesetzbuch](https://www.trend.at/recht/allgemeines-buergerliches-gesetzbuch)  
6. Allgemeines bürgerliches Gesetzbuch (ABGB) \- JUSLINE Österreich, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/abgb](https://www.jusline.at/gesetz/abgb)  
7. Allgemeine Geschäftsbedingungen \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/praxistipps-allgemeine-geschaeftsbedingungen](https://www.wko.at/vertragsrecht/praxistipps-allgemeine-geschaeftsbedingungen)  
8. § 879 ABGB (Allgemeines bürgerliches Gesetzbuch) \- JUSLINE Österreich, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/abgb/paragraf/879](https://www.jusline.at/gesetz/abgb/paragraf/879)  
9. 879 | Allgemeines bürgerliches Gesetzbuch \- ABGB \- ÖGB Verlag Digital, Zugriff am Mai 6, 2025, [https://digital.oegbverlag.at/recht/g/10001622,NOR12018602/ABGB\_Allgemeines-buergerliches-Gesetzbuch/%C2%A7-879](https://digital.oegbverlag.at/recht/g/10001622,NOR12018602/ABGB_Allgemeines-buergerliches-Gesetzbuch/%C2%A7-879)  
10. § 879 ABGB \- Lexis 360, Zugriff am Mai 6, 2025, [https://360.lexisnexis.at/d/rechtsnorm-ris/879\_abgb/L-10001622-P879](https://360.lexisnexis.at/d/rechtsnorm-ris/879_abgb/L-10001622-P879)  
11. 1170b ABGB (Allgemeines bürgerliches Gesetzbuch), Sicherstellung bei Bauverträgen, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/abgb/paragraf/1170b](https://www.jusline.at/gesetz/abgb/paragraf/1170b)  
12. Sicherstellung bei Bauverträgen \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/sicherstellung-bei-bauvertraegen](https://www.wko.at/vertragsrecht/sicherstellung-bei-bauvertraegen)  
13. Neue ÖNORM B 2110: Änderungen auf einen Blick \- Weka.at, Zugriff am Mai 6, 2025, [https://www.weka.at/news/Bau-Immobilien/Neue-OeNORM-B-2110-Aenderungen-auf-einen-Blick](https://www.weka.at/news/Bau-Immobilien/Neue-OeNORM-B-2110-Aenderungen-auf-einen-Blick)  
14. Konsumentenschutzgesetz (KSchG) \- Gesamt \- JUSLINE Österreich, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/kschg/gesamt](https://www.jusline.at/gesetz/kschg/gesamt)  
15. Konsumentenschutzgesetz (KSchG) \- JUSLINE Österreich, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/kschg](https://www.jusline.at/gesetz/kschg)  
16. Allgemeine Geschäftsbedingungen \- derwalter.at, Zugriff am Mai 6, 2025, [https://www.derwalter.at/agb](https://www.derwalter.at/agb)  
17. Auslegung, Geltungskontrolle, Inhaltskontrolle und Transparenzgebot im Lichte der Rechtsprechung \- Schadenconsult, Zugriff am Mai 6, 2025, [https://www.schadenconsult.at/wp-content/uploads/2020/09/8-Dr.-Kath.pdf](https://www.schadenconsult.at/wp-content/uploads/2020/09/8-Dr.-Kath.pdf)  
18. Das Transparenzgebot im Sinne der Rechtfertigung beiderseitiger Interessen und dessen Verhältnis zu den Vertragsauslegungsregeln des ABGB \- unipub, Zugriff am Mai 6, 2025, [https://unipub.uni-graz.at/obvugrhs/content/titleinfo/224377/full.pdf](https://unipub.uni-graz.at/obvugrhs/content/titleinfo/224377/full.pdf)  
19. Rechtssätze und Entscheidungstext 10Ob67/06k \- Justiz \- RIS, Zugriff am Mai 6, 2025, [https://www.ris.bka.gv.at/JustizEntscheidung.wxe?Abfrage=Justiz\&Dokumentnummer=JJT\_20070605\_OGH0002\_0100OB00067\_06K0000\_000\&IncludeSelf=True](https://www.ris.bka.gv.at/JustizEntscheidung.wxe?Abfrage=Justiz&Dokumentnummer=JJT_20070605_OGH0002_0100OB00067_06K0000_000&IncludeSelf=True)  
20. Geltungs-, Inhalts- und Transparenzkontrolle \- GVFW, Zugriff am Mai 6, 2025, [https://www.gvfw.at/gvfw/gvfw.nsf/sysPages/DEC780E6F8AED6BCC1257D9E0034EAF7](https://www.gvfw.at/gvfw/gvfw.nsf/sysPages/DEC780E6F8AED6BCC1257D9E0034EAF7)  
21. Verbraucherrechte: Außergeschäftsraumverträge im Überblick \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/verbraucherrechte-richtlinie-aussergeschaeftsraum](https://www.wko.at/vertragsrecht/verbraucherrechte-richtlinie-aussergeschaeftsraum)  
22. 5a KSchG Allgemeine Informationspflichten des Unternehmers \- Jusline, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/kschg/paragraf/5a](https://www.jusline.at/gesetz/kschg/paragraf/5a)  
23. Verbraucherrechte: Allgemeine Informationspflichten im Überblick \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/verbraucherrechte-informationspflichten](https://www.wko.at/vertragsrecht/verbraucherrechte-informationspflichten)  
24. Unternehmensrecht: Die wichtigsten Regeln für jedes Business \- trend.at, Zugriff am Mai 6, 2025, [https://www.trend.at/recht/unternehmensrecht](https://www.trend.at/recht/unternehmensrecht)  
25. 1\. Buch §§ 1 bis 58 UGB \- Institut für Unternehmensrecht, Zugriff am Mai 6, 2025, [https://unternehmensrecht.univie.ac.at/fileadmin/user\_upload/i\_unternehmensrecht/Lehre/WS\_2019-20/Repetitorien/Told/Repetitorium\_1.\_Buch\_Feb2020.pdf](https://unternehmensrecht.univie.ac.at/fileadmin/user_upload/i_unternehmensrecht/Lehre/WS_2019-20/Repetitorien/Told/Repetitorium_1._Buch_Feb2020.pdf)  
26. Haftungsfreizeichnung im Vertragsrecht – im Detail \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/haftungsfreizeichnung-vertragsrecht-detail](https://www.wko.at/vertragsrecht/haftungsfreizeichnung-vertragsrecht-detail)  
27. Gewährleistung nach ABGB ab 1.1.2022 \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/gewerberecht/vgg-gewaehrleistung-abgb-ab-2022](https://www.wko.at/gewerberecht/vgg-gewaehrleistung-abgb-ab-2022)  
28. Von Verzugszinsen, Bauzinsen und Mehrkostenforderungen \- Universität Innsbruck, Zugriff am Mai 6, 2025, [https://www.uibk.ac.at/unternehmensrecht/unternehmensrecht/mitarbeiter/lebenslaufe/schopper/bauaktuell\_2020\_04\_schopper.pdf](https://www.uibk.ac.at/unternehmensrecht/unternehmensrecht/mitarbeiter/lebenslaufe/schopper/bauaktuell_2020_04_schopper.pdf)  
29. Baurecht: VerzugsZinsen – ein nicht zu unterschätzender Faktor \- SOLID Bau, Zugriff am Mai 6, 2025, [https://solidbau.at/wissen-service/verzugszinsen-ein-nicht-zu-unterschaetzender-faktor/](https://solidbau.at/wissen-service/verzugszinsen-ein-nicht-zu-unterschaetzender-faktor/)  
30. Zahlungsverzugsgesetz in Österreich: Regelung der Zahlungsziele, Fristen & Mahnspesen, Zugriff am Mai 6, 2025, [https://www.prosaldo.net/blog/fakturierung/das-zahlungsverzugsgesetz-in-oesterreich/](https://www.prosaldo.net/blog/fakturierung/das-zahlungsverzugsgesetz-in-oesterreich/)  
31. Skriptum Die ÖNORM B 2110 Fassung 15.03.2013, Zugriff am Mai 6, 2025, [https://zivilrecht.univie.ac.at/fileadmin/user\_upload/i\_zivilrecht/Zoechling-Jud/Karasek/Skriptum\_OENORM\_B2110\_WS\_2017.pdf](https://zivilrecht.univie.ac.at/fileadmin/user_upload/i_zivilrecht/Zoechling-Jud/Karasek/Skriptum_OENORM_B2110_WS_2017.pdf)  
32. Kommentar zur ÖNORM B 2110 \- Andreas Kropik, Zugriff am Mai 6, 2025, [http://www.bw-b.at/15\_Kommentar%20zur%20%C3%96NORM\_B\_2110%20(Ausgabe\_2023).htm](http://www.bw-b.at/15_Kommentar%20zur%20%C3%96NORM_B_2110%20\(Ausgabe_2023\).htm)  
33. ÖNORM B 2110: Dokumentation am Bau \- PlanRadar, Zugriff am Mai 6, 2025, [https://www.planradar.com/ch/oenorm-b-2110-dokumentation-auf-der-baustelle/](https://www.planradar.com/ch/oenorm-b-2110-dokumentation-auf-der-baustelle/)  
34. Die ÖNORM B 2110 als „Haftungsfalle“ im Bauvertrag (Teil I) \- Wissensdatenbank Gerichts-SV, Zugriff am Mai 6, 2025, [https://widab.gerichts-sv.at/website2016/wp-content/uploads/2016/08/Sach-2013-64-72-Seebacher.pdf](https://widab.gerichts-sv.at/website2016/wp-content/uploads/2016/08/Sach-2013-64-72-Seebacher.pdf)  
35. Anleitung: Bauabnahme Österreich \+ Abnahmeprotokoll Vorlage \- PlanRadar, Zugriff am Mai 6, 2025, [https://www.planradar.com/at/bauabnahme-vob/](https://www.planradar.com/at/bauabnahme-vob/)  
36. Know How am Bau \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vlbg/gewerbe-handwerk/bau/knowhowbau-4-uebernahme-2024.pdf](https://www.wko.at/vlbg/gewerbe-handwerk/bau/knowhowbau-4-uebernahme-2024.pdf)  
37. Gewährleistung am Bau: Das steht im BGB | BauMaster®, Zugriff am Mai 6, 2025, [https://bau-master.com/baublog/gewahrleistung-bau/](https://bau-master.com/baublog/gewahrleistung-bau/)  
38. 1\. PRÄAMBEL: 2\. VEREINBARUNG DER ÖNORM B 2110: 3\. VERGÜTUNG: \- bei INFRA BAU GmbH, Zugriff am Mai 6, 2025, [https://infrabau.at/images/agb.pdf](https://infrabau.at/images/agb.pdf)  
39. Pönale – gesetzliches und vertragliches Schadenersatzrecht \- Wissensdatenbank Gerichts-SV, Zugriff am Mai 6, 2025, [https://widab.gerichts-sv.at/website2016/wp-content/uploads/2016/11/sach-2016-153-156-mogel.pdf](https://widab.gerichts-sv.at/website2016/wp-content/uploads/2016/11/sach-2016-153-156-mogel.pdf)  
40. „Störung der Leistungserbringung“ bei ÖNORM B 2110-Vertrag \- Weka.at, Zugriff am Mai 6, 2025, [https://www.weka.at/news/Bau-Immobilien/Stoerung-der-Leistungserbringung-nach-OeNORM-B-2110-fuehrt-nicht-automatisch-zur-Vertragsanpassung](https://www.weka.at/news/Bau-Immobilien/Stoerung-der-Leistungserbringung-nach-OeNORM-B-2110-fuehrt-nicht-automatisch-zur-Vertragsanpassung)  
41. Land unter – Wer trägt das Risiko im Bauprojekt? | Müller Partner ..., Zugriff am Mai 6, 2025, [https://www.mplaw.at/publikationen/land-unter-wer-traegt-das-risiko-im-bauprojekt/](https://www.mplaw.at/publikationen/land-unter-wer-traegt-das-risiko-im-bauprojekt/)  
42. ÖNORM B 2110 – Fluch oder Segen? \- E+H Rechtsanwälte GmbH, Zugriff am Mai 6, 2025, [https://www.eh.at/wp-content/uploads/2022/09/EH-Legal-Update\_Unterschiede-ABGB-OeNORM-B-2110-EH-20220905.pdf](https://www.eh.at/wp-content/uploads/2022/09/EH-Legal-Update_Unterschiede-ABGB-OeNORM-B-2110-EH-20220905.pdf)  
43. Risikomanagement im Bauvertrag, Zugriff am Mai 6, 2025, [https://ifb.co.at/wp-content/uploads/2021/10/Symposium-2013-7.1.Mueller-Riskmanagement-in-der-Bauwirtschaft-IFB\_Endversion\_116283.pdf](https://ifb.co.at/wp-content/uploads/2021/10/Symposium-2013-7.1.Mueller-Riskmanagement-in-der-Bauwirtschaft-IFB_Endversion_116283.pdf)  
44. Eingriff in bestehende Bauwerkverträge unter Berücksichtigung der aktuellen Preisentwicklung \- Wissensdatenbank Gerichts-SV, Zugriff am Mai 6, 2025, [https://widab.gerichts-sv.at/website2016/wp-content/uploads/2023/10/sach-2023-1-7-mogel.pdf](https://widab.gerichts-sv.at/website2016/wp-content/uploads/2023/10/sach-2023-1-7-mogel.pdf)  
45. www.bwi-ziviltechniker.com, Zugriff am Mai 6, 2025, [https://www.bwi-ziviltechniker.com/wp-content/uploads/2024/02/2024.02.29\_Standpunkte\_OeNorm-B-2110-2023\_CGJS-1.pdf](https://www.bwi-ziviltechniker.com/wp-content/uploads/2024/02/2024.02.29_Standpunkte_OeNorm-B-2110-2023_CGJS-1.pdf)  
46. Update ÖNORM B 2110 \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/noe/gewerbe-handwerk/praesentation-kwr-haftungen-und-rechtliche-risiken-im-bauber.pdf](https://www.wko.at/noe/gewerbe-handwerk/praesentation-kwr-haftungen-und-rechtliche-risiken-im-bauber.pdf)  
47. BASISWISSEN BAUVERTRAG \- Nomos eLibrary, Zugriff am Mai 6, 2025, [https://www.nomos-elibrary.de/10.5771/9783214165000.pdf?download\_full\_pdf=1\&page=3](https://www.nomos-elibrary.de/10.5771/9783214165000.pdf?download_full_pdf=1&page=3)  
48. Haftungsfreizeichnung im Vertragsrecht – allgemeiner Überblick \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/vertragsrecht/haftungsfreizeichnung-vertragsrecht-ueberblick](https://www.wko.at/vertragsrecht/haftungsfreizeichnung-vertragsrecht-ueberblick)  
49. Haftungsausschluss in Österreich \- Anwaltfinden.at, Zugriff am Mai 6, 2025, [https://www.anwaltfinden.at/ratgeber/gewaehrleistungsrecht/haftungsausschluss-in-oesterreich/](https://www.anwaltfinden.at/ratgeber/gewaehrleistungsrecht/haftungsausschluss-in-oesterreich/)  
50. Ausschluss und Einschränkung von Schadenersatz- pflichten zwischen Unternehmern \- Diplomarbeit, Zugriff am Mai 6, 2025, [https://unipub.uni-graz.at/obvugrhs/download/pdf/3393519](https://unipub.uni-graz.at/obvugrhs/download/pdf/3393519)  
51. BASISWISSEN BAUVERTRAG \- Nomos eLibrary, Zugriff am Mai 6, 2025, [https://www.nomos-elibrary.de/de/10.5771/9783214165000.pdf?download\_full\_pdf=1\&page=3](https://www.nomos-elibrary.de/de/10.5771/9783214165000.pdf?download_full_pdf=1&page=3)  
52. Aus- und Einbaukosten im neuen Gewährleistungsrecht (VGG)/ Costs of removal and installation under the new consumer warranty law Katharina Huber\*, Wien, Zugriff am Mai 6, 2025, [https://alj.uni-graz.at/index.php/alj/article/download/317/269/](https://alj.uni-graz.at/index.php/alj/article/download/317/269/)  
53. Zugriff am Januar 1, 1970, [https://www.wko.at/vertragsrecht/haftungsausschluss-agb-unwirksam](https://www.wko.at/vertragsrecht/haftungsausschluss-agb-unwirksam)  
54. ÖNORM B 2110: Dokumentation am Bau \- PlanRadar, Zugriff am Mai 6, 2025, [https://www.planradar.com/de/oenorm-b-2110-dokumentation-auf-der-baustelle/](https://www.planradar.com/de/oenorm-b-2110-dokumentation-auf-der-baustelle/)  
55. ALLGEMEINE VERTRAGSBESTIMMUNGEN (AVB) FÜR BAULEISTUNGEN ABWEICHUNGEN ZUR ÖNORM B 2110 \- Kuratorium Wiener Pensionisten-Wohnhäuser, Zugriff am Mai 6, 2025, [https://kwp.at/wp-content/uploads/2023/10/Allgemeine-Vertragsbestimmungen-AVB-fuer-Bauleistungen.pdf](https://kwp.at/wp-content/uploads/2023/10/Allgemeine-Vertragsbestimmungen-AVB-fuer-Bauleistungen.pdf)  
56. Baumängel, Gewährleistung, Gewährleistungsansprüche, Schadenersatz \- Law Experts, Zugriff am Mai 6, 2025, [https://www.law-experts.at/baumaengel-einklagen-gewaehrleistung-schadenersatz](https://www.law-experts.at/baumaengel-einklagen-gewaehrleistung-schadenersatz)  
57. Unterschiede zwischen ABGB und ÖNORM B 2110 \- E+H Rechtsanwälte GmbH, Zugriff am Mai 6, 2025, [https://www.eh.at/wp-content/uploads/2022/08/EH-Legal-Update\_Unterschiede-ABGB-OeNORM-B-2110.pdf](https://www.eh.at/wp-content/uploads/2022/08/EH-Legal-Update_Unterschiede-ABGB-OeNORM-B-2110.pdf)  
58. WEBINAR Gewährleistung NEU \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/stmk/unternehmen/gewaehrleistung-neu-webinar-09032022.pdf](https://www.wko.at/stmk/unternehmen/gewaehrleistung-neu-webinar-09032022.pdf)  
59. Das neue österreichische Gewährleistungsrecht \- TU Wien's reposiTUm, Zugriff am Mai 6, 2025, [https://repositum.tuwien.at/bitstream/20.500.12708/12791/2/Weihsinger%20Natascha%20-%202005%20-%20Das%20neue%20oesterreichische%20Gewaehrleistungsrecht%20-...pdf](https://repositum.tuwien.at/bitstream/20.500.12708/12791/2/Weihsinger%20Natascha%20-%202005%20-%20Das%20neue%20oesterreichische%20Gewaehrleistungsrecht%20-...pdf)  
60. Baumängel-Verjährung: Fristen für die Gewährleistung im Baurecht \- Bau-Master, Zugriff am Mai 6, 2025, [https://bau-master.com/baublog/baumaengel-verjaehrung/](https://bau-master.com/baublog/baumaengel-verjaehrung/)  
61. Zugriff am Januar 1, 1970, [https://www.wko.at/branchen/gewerbe-handwerk/bau/gewaehrleistung-bauleistungen.html](https://www.wko.at/branchen/gewerbe-handwerk/bau/gewaehrleistung-bauleistungen.html)  
62. Zugriff am Januar 1, 1970, [https://www.wko.at/finance/zahlungsverzug-gesetzliche-zahlungsfristen-oesterreich](https://www.wko.at/finance/zahlungsverzug-gesetzliche-zahlungsfristen-oesterreich)  
63. ArchitektInnen und IngenieurInnen Oberösterreich und Salzburg: Das neue Zahlungsverzugsgesetz \- arching-zt.at, Zugriff am Mai 6, 2025, [https://www.arching-zt.at/mitgliederservice/recht/sonstige\_rechtsgebiete/das\_neue\_zahlungsverzugsgesetz.html](https://www.arching-zt.at/mitgliederservice/recht/sonstige_rechtsgebiete/das_neue_zahlungsverzugsgesetz.html)  
64. Fälligkeit \- Wikipedia, Zugriff am Mai 6, 2025, [https://de.wikipedia.org/wiki/F%C3%A4lligkeit](https://de.wikipedia.org/wiki/F%C3%A4lligkeit)  
65. Die Vertragsstrafe im Bauvertrag laut § 1336 ABGB | a3BAU, Zugriff am Mai 6, 2025, [https://a3bau.at/die-vertragsstrafe-im-bauvertrag-laut-ss-1336-abgb](https://a3bau.at/die-vertragsstrafe-im-bauvertrag-laut-ss-1336-abgb)  
66. Vertragsstrafe | AustriaWiki im Austria-Forum, Zugriff am Mai 6, 2025, [https://austria-forum.org/af/AustriaWiki/Vertragsstrafe](https://austria-forum.org/af/AustriaWiki/Vertragsstrafe)  
67. AVB | MY GARAGE, Zugriff am Mai 6, 2025, [https://www.my-garage.at/agb/](https://www.my-garage.at/agb/)  
68. ALLGEMEINE VERTRAGS- BEDINGUNGEN (AVB) \- BEYOND ENGINEERING ZT GMBH, Zugriff am Mai 6, 2025, [https://be-zt.com/wp-content/uploads/2024/06/20240119\_BEZT\_AVB.pdf](https://be-zt.com/wp-content/uploads/2024/06/20240119_BEZT_AVB.pdf)  
69. DIPLOMARBEIT Master Thesis Das Leistungsänderungsrecht der ÖNORM B 2110 (Vergleich der Kommentare und Vorschläge zur Vertrag \- reposiTUm, Zugriff am Mai 6, 2025, [https://repositum.tuwien.at/retrieve/5757](https://repositum.tuwien.at/retrieve/5757)  
70. Zugriff am Januar 1, 1970, [https://www.overtec.net/blog/oenorm-b2110-abnahme/](https://www.overtec.net/blog/oenorm-b2110-abnahme/)  
71. Urheberrecht und Nutzungsrecht für Filme in Österreich erklärt \- Wiedermayer & Friends, Zugriff am Mai 6, 2025, [https://wf-creative.com/blog/urheberrecht-und-nutzungsrecht-fuer-filme-in-oesterreich-erklaert/](https://wf-creative.com/blog/urheberrecht-und-nutzungsrecht-fuer-filme-in-oesterreich-erklaert/)  
72. Neue Serie der IT-Recht-Kanzlei: Das deutsche Urheberrecht nach seiner Novellierung aus IT-rechtlicher Sicht (Teil 7: Nutzungsrechte an Software), Zugriff am Mai 6, 2025, [https://www.it-recht-kanzlei.de/nutzungsrechte-software.html](https://www.it-recht-kanzlei.de/nutzungsrechte-software.html)  
73. Urheberrecht \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/oe/information-consulting/werbung-marktkommunikation/urheberrecht-werknutzung-fotorechte](https://www.wko.at/oe/information-consulting/werbung-marktkommunikation/urheberrecht-werknutzung-fotorechte)  
74. FAQ | ArchitektURheber.at \- Rechtsanwälte Wien, Zugriff am Mai 6, 2025, [https://www.architekturheber.at/faq/](https://www.architekturheber.at/faq/)  
75. Urheberrechtsgesetz (UrhG) \- Gesamt \- JUSLINE Österreich, Zugriff am Mai 6, 2025, [https://www.jusline.at/gesetz/urhg/gesamt](https://www.jusline.at/gesetz/urhg/gesamt)  
76. “Pay when paid” in Subunternehmerverträgen \- Handwerk und Bau, Zugriff am Mai 6, 2025, [https://www.handwerkundbau.at/betrieb/pay-when-paid-subunternehmervertraegen-49754/](https://www.handwerkundbau.at/betrieb/pay-when-paid-subunternehmervertraegen-49754/)  
77. "Pay-when-paid"-Abrede: wirksam? \- Baurecht für Architekten: Urteile, Rechtsprechung im Bauwesen | BauNetz.de, Zugriff am Mai 6, 2025, [https://www.baunetz.de/recht/\_Pay-when-paid\_-Abrede\_wirksam\_\_2391079.html](https://www.baunetz.de/recht/_Pay-when-paid_-Abrede_wirksam__2391079.html)  
78. „Pay-when-paid-Klausel“ im Bauvertrag \- Heinicke Burghardt Rechtsanwälte, Zugriff am Mai 6, 2025, [https://heinicke.com/pay-when-paid-klausel-im-bauvertrag/](https://heinicke.com/pay-when-paid-klausel-im-bauvertrag/)  
79. Verträge mit Subunternehmen in der Praxis – Wer trägt das wirtschaftliche Risiko? — Huber Berchtold Rechtsanwälte | Recht & Technik, Zugriff am Mai 6, 2025, [https://www.rechtundtechnik.at/publikationen/vertraege-mit-subunternehmen-in-der-praxis](https://www.rechtundtechnik.at/publikationen/vertraege-mit-subunternehmen-in-der-praxis)  
80. Skriptum Die ÖNORM B 2110 Fassung 15.03.2013, Zugriff am Mai 6, 2025, [https://zivilrecht.univie.ac.at/fileadmin/user\_upload/i\_zivilrecht/Zoechling-Jud/Karasek/Skriptum\_OENORM\_B2110\_WS\_2019.pdf](https://zivilrecht.univie.ac.at/fileadmin/user_upload/i_zivilrecht/Zoechling-Jud/Karasek/Skriptum_OENORM_B2110_WS_2019.pdf)  
81. Unwirksamkeit einer Abschlagszahlungsregelung führt zu einem Schadensersatzanspruch des Verbrauchers \- GvW Graf von Westphalen, Zugriff am Mai 6, 2025, [https://www.gvw.com/aktuelles/blog/detail/unwirksamkeit-einer-abschlagszahlungsregelung-fuehrt-zu-einem-schadensersatzanspruch-des-verbrauchers](https://www.gvw.com/aktuelles/blog/detail/unwirksamkeit-einer-abschlagszahlungsregelung-fuehrt-zu-einem-schadensersatzanspruch-des-verbrauchers)  
82. Auftraggeberhaftung \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/sozialversicherung/auftraggeberhaftung](https://www.wko.at/sozialversicherung/auftraggeberhaftung)  
83. Zugriff am Januar 1, 1970, [https://www.bau-portal.at/rechtsfragen/pay-when-paid-klausel.html](https://www.bau-portal.at/rechtsfragen/pay-when-paid-klausel.html)  
84. Subunternehmer gegen Bauherren \- Handwerk und Bau, Zugriff am Mai 6, 2025, [https://www.handwerkundbau.at/allgemein/subunternehmer-gegen-bauherren-14572/](https://www.handwerkundbau.at/allgemein/subunternehmer-gegen-bauherren-14572/)  
85. 1\. Kapitel Einführung \- I. Der Bau-„Werk“-Vertrag \- LexisNexis, Zugriff am Mai 6, 2025, [https://shop.lexisnexis.at/media/vlb/assets/51de0b3ee2fd462280c94812b4f3c3f9\_TEXT\_SAMPLE\_CONTENT.pdf](https://shop.lexisnexis.at/media/vlb/assets/51de0b3ee2fd462280c94812b4f3c3f9_TEXT_SAMPLE_CONTENT.pdf)  
86. Reform des Bauvertragsrechts in Deutschland und Vergleich mit der nationalen Rechtsordnung \- Eine Analyse zur möglichen Überarbeitung der Rechtslage in Österreich nach deutschem Modell \- unipub, Zugriff am Mai 6, 2025, [https://unipub.uni-graz.at/obvugrhs/download/pdf/8586609](https://unipub.uni-graz.at/obvugrhs/download/pdf/8586609)  
87. Gesetzliche und vertragliche Eskalationsmodelle im privatrechtlichen Bauwesen (Bauvertrag) \- EconStor, Zugriff am Mai 6, 2025, [https://www.econstor.eu/bitstream/10419/280794/1/EIKV-Schriftenreihe-Bd51.pdf](https://www.econstor.eu/bitstream/10419/280794/1/EIKV-Schriftenreihe-Bd51.pdf)  
88. MASTERARBEIT, Zugriff am Mai 6, 2025, [https://diglib.tugraz.at/download.php?id=6110fd9479fec\&location=browse](https://diglib.tugraz.at/download.php?id=6110fd9479fec&location=browse)  
89. Vertragsgestaltung als Teil des Risikomanagements | Bergmann Rechtsanwälte, Zugriff am Mai 6, 2025, [https://www.bergmann.fi/d/article/vertrag\_risikomanagement](https://www.bergmann.fi/d/article/vertrag_risikomanagement)  
90. Subunternehmer: Was müssen Sie bei Geschäften mit ihnen beachten? \- comp/lex, Zugriff am Mai 6, 2025, [https://comp-lex.de/geschaefte-vertraege-mit-subunternehmern/](https://comp-lex.de/geschaefte-vertraege-mit-subunternehmern/)  
91. Europäische Kommission – Überarbeitung der Zahlungsverzugsrichtlinie (RL 2011/7/EG) \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/ktn/gewerbe-handwerk/wkoe-stn-ueberarbeitung-zahlungsverzugsrl-060223-signiert.pdf](https://www.wko.at/ktn/gewerbe-handwerk/wkoe-stn-ueberarbeitung-zahlungsverzugsrl-060223-signiert.pdf)  
92. Aktuelle Entwicklungen in Baubetrieb, Bauwirtschaft und Bauvertragsrecht: 50 Jahre Institut für Baubetrieb und Bauwirtschaft der TU Graz \[1. Aufl. 2019\] 978-3-658-27430-6, 978-3-658-27431-3 \- DOKUMEN.PUB, Zugriff am Mai 6, 2025, [https://dokumen.pub/aktuelle-entwicklungen-in-baubetrieb-bauwirtschaft-und-bauvertragsrecht-50-jahre-institut-fr-baubetrieb-und-bauwirtschaft-der-tu-graz-1-aufl-2019-978-3-658-27430-6-978-3-658-27431-3.html](https://dokumen.pub/aktuelle-entwicklungen-in-baubetrieb-bauwirtschaft-und-bauvertragsrecht-50-jahre-institut-fr-baubetrieb-und-bauwirtschaft-der-tu-graz-1-aufl-2019-978-3-658-27430-6-978-3-658-27431-3.html)  
93. Zugriff am Januar 1, 1970, [https://www.bauzeitung.at/praxis-recht/die-weitergabe-von-vertragsbedingungen-an-subunternehmer-22691/](https://www.bauzeitung.at/praxis-recht/die-weitergabe-von-vertragsbedingungen-an-subunternehmer-22691/)  
94. Zugriff am Januar 1, 1970, [https://www.dorda.at/news/construction-law-newsletter-back-back-klauseln-im-bauvertrag-eine-analyse-der-aktuellen-judikatur](https://www.dorda.at/news/construction-law-newsletter-back-back-klauseln-im-bauvertrag-eine-analyse-der-aktuellen-judikatur)  
95. Bauzeitverlängerung in Österreich \- Anwaltfinden.at, Zugriff am Mai 6, 2025, [https://www.anwaltfinden.at/ratgeber/baurecht/bauzeitverlaengerung/](https://www.anwaltfinden.at/ratgeber/baurecht/bauzeitverlaengerung/)  
96. Vergütungsanspruch bei Bauzeitverlängerung \- Lexikon... \- Bauprofessor.de, Zugriff am Mai 6, 2025, [https://www.bauprofessor.de/verguetungsanspruch-bauzeitverlaengerung/](https://www.bauprofessor.de/verguetungsanspruch-bauzeitverlaengerung/)  
97. www.wko.at, Zugriff am Mai 6, 2025, [https://www.wko.at/oe/gewerbe-handwerk/bau/know-how-2020-l11.pdf](https://www.wko.at/oe/gewerbe-handwerk/bau/know-how-2020-l11.pdf)  
98. Differenzierung zwischen Kosten aus gestörtem Bauablauf und Beschleunigungskosten \- MCE-Consult, Zugriff am Mai 6, 2025, [https://www.mce-consult.com/wp-content/uploads/2016/08/Differenzierung-Kosten\_WEB2014\_final.pdf](https://www.mce-consult.com/wp-content/uploads/2016/08/Differenzierung-Kosten_WEB2014_final.pdf)  
99. (Keine) Mehrkostenforderungen beim Bauvertrag \- Andreas Kropik, Zugriff am Mai 6, 2025, [http://www.bw-b.at/Unterlagen/Mehrkostenforderungen/Buch\_Mehrkostenforderungen\_Inhalt.pdf](http://www.bw-b.at/Unterlagen/Mehrkostenforderungen/Buch_Mehrkostenforderungen_Inhalt.pdf)  
100. Die Verfristung im Bauvertrag \- unipub \- Uni Graz, Zugriff am Mai 6, 2025, [https://unipub.uni-graz.at/obvugrhs/content/titleinfo/213238/full.pdf](https://unipub.uni-graz.at/obvugrhs/content/titleinfo/213238/full.pdf)  
101. ÖSTERREICHISCHES, Zugriff am Mai 6, 2025, [https://www.rechtsanwaelte.at/fileadmin/user\_upload/Anwaltsblatt/19\_anwbl07-08.pdf](https://www.rechtsanwaelte.at/fileadmin/user_upload/Anwaltsblatt/19_anwbl07-08.pdf)  
102. Neue Zeitschrift für Insolvenz \- Beck Shop, Zugriff am Mai 6, 2025, [https://cdn-assetservice.ecom-api.beck-shop.de/productattachment/register/15660912/1946\_nzi\_-\_registerheft\_2024.pdf](https://cdn-assetservice.ecom-api.beck-shop.de/productattachment/register/15660912/1946_nzi_-_registerheft_2024.pdf)  
103. OGH: Nichtig iSd§ 879 Abs 3 ABGB – zur Individualabrede \- Jusguide, Zugriff am Mai 6, 2025, [https://www.jusguide.at/index.php?id=88\&tx\_ttnews%5Btt\_news%5D=25029](https://www.jusguide.at/index.php?id=88&tx_ttnews%5Btt_news%5D=25029)  
104. Inhaltsverzeichnis \- WU Wien, Zugriff am Mai 6, 2025, [https://library.wu.ac.at/bib/django/en/tableofcontents/download/2017-09-28/inhaltsverzeichnisse-2017\_kw-39\_teil1/uploads/2017/09/29/KW39\_\_Teil\_1\_1.pdf](https://library.wu.ac.at/bib/django/en/tableofcontents/download/2017-09-28/inhaltsverzeichnisse-2017_kw-39_teil1/uploads/2017/09/29/KW39__Teil_1_1.pdf)  
105. Unlauterkeit wegen Verstoßes gegen AGB: Beklagter kann sich auf Nichtigkeit der AGB berufen \- OGH, Zugriff am Mai 6, 2025, [https://www.ogh.gv.at/entscheidungen/entscheidungen-ogh/unlauterkeit-wegen-verstosses-gegen-agb-beklagter-kann-sich-auf-nichtigkeit-der-agb-berufen/](https://www.ogh.gv.at/entscheidungen/entscheidungen-ogh/unlauterkeit-wegen-verstosses-gegen-agb-beklagter-kann-sich-auf-nichtigkeit-der-agb-berufen/)  
106. Der Bauvertrag in Österreich \- Vertragsrechtsinfo.at, Zugriff am Mai 6, 2025, [https://www.vertragsrechtsinfo.at/bauvertrag-oesterreich/](https://www.vertragsrechtsinfo.at/bauvertrag-oesterreich/)  
107. Zugriff am Januar 1, 1970, [https://www.anwaltfinden.at/rechtsanwalt/gesellschaftsrecht/konzernrecht-anwalt/](https://www.anwaltfinden.at/rechtsanwalt/gesellschaftsrecht/konzernrecht-anwalt/)  
108. Zugriff am Januar 1, 1970, [https://www.bpv-huegel.com/de/news/update-vertragsrecht-agb-kontrolle-im-b2b-bereich/](https://www.bpv-huegel.com/de/news/update-vertragsrecht-agb-kontrolle-im-b2b-bereich/)  
109. Anwendbares Recht bei internationalen Verträgen (B2B) \- WKO, Zugriff am Mai 6, 2025, [https://www.wko.at/internetrecht/anwendbares-recht-internationale-vertraege-b2b](https://www.wko.at/internetrecht/anwendbares-recht-internationale-vertraege-b2b)  
110. Internationaler Bauvertrag: Welches Recht gilt hier? \- Weka.de, Zugriff am Mai 6, 2025, [https://www.weka.de/einkauf-logistik/internationaler-bauvertrag-welches-recht-gilt-hier/](https://www.weka.de/einkauf-logistik/internationaler-bauvertrag-welches-recht-gilt-hier/)  
111. Bauvertrag: nach BGB oder VOB \[inkl. Muster\] \- Bau-Master, Zugriff am Mai 6, 2025, [https://bau-master.com/baublog/bauvertrag/](https://bau-master.com/baublog/bauvertrag/)  
112. Zugriff am Januar 1, 1970, [https://www.wko.at/wirtschaftsrecht/einkauf-verkauf/unterschiede-vob-abgb-oenorm-b-2110](https://www.wko.at/wirtschaftsrecht/einkauf-verkauf/unterschiede-vob-abgb-oenorm-b-2110)